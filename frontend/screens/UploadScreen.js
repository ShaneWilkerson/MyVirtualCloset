import React, { useLayoutEffect, useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { auth, db, storage } from '../services/firebase';
import { addDoc, collection, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ✅ your existing helper (you said it lives here)
import { removeBackgroundAndPredict as processImageOnBackend } from '../services/imageUtils';
import OutfitPreview from '../components/OutfitPreview';

/* ---------------- helpers (same behavior as your original flow) ---------------- */

// turn data URL -> temp file uri so we can fetch(...).blob() like the original did
async function dataUrlToTempFile(dataUrl) {
  // data:[mime];base64,xxxx
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1] || 'image/png';
  const base64 = match[2];

  const ext =
    mime === 'image/png' ? 'png' :
    mime === 'image/webp' ? 'webp' :
    mime === 'image/jpeg' ? 'jpg' : 'png';

  const fileUri = `${FileSystem.cacheDirectory}proc_${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return { fileUri, mime };
}

function guessMimeFromPath(path, fallback = 'image/jpeg') {
  const p = String(path || '').toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  return fallback;
}

const pickString = (...candidates) =>
  candidates.map(v => (typeof v === 'string' ? v.trim() : v))
    .find(v => typeof v === 'string' && v.length > 0) || undefined;

function normalizeTags(input) {
  if (!input) return [];
  if (Array.isArray(input) && input.every(t => typeof t === 'string')) {
    return input.map(t => t.trim()).filter(Boolean);
  }
  if (Array.isArray(input) && input.length && typeof input[0] === 'object') {
    return input.map(o => o?.name || o?.label || o?.tag || '')
      .map(t => String(t).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function extractAttributes(result) {
  const attrs =
    result.attributes ||
    result.metadata ||
    result.prediction ||
    result.predictions ||
    result.meta ||
    {};

  const type = pickString(
    result.type, result.category, result.label, result.item_type, result.class, result.type_name, attrs.type
  );
  const color = pickString(
    result.color, result.colour, result.dominant_color, attrs.color
  );
  const tags = normalizeTags(
    result.tags || result.keywords || result.labels || result.tag_list || attrs.tags
  );
  return { type, color, tags };
}
/* ----------------------------------------------------------------------------- */

/**
 * UploadScreen Component
 * 
 * Handles two modes:
 * 1. Regular mode: Upload clothing items to closet (image picker + processing)
 * 2. Post Outfit mode: Select from saved outfits and post with caption
 * 
 * When accessed from SocialScreen "Post Outfit" button, mode='postOutfit' is passed
 * which switches the UI to show outfit selection instead of image picker.
 */
export default function UploadScreen({ route, navigation }) {
  const { theme } = useTheme();
  
  // Check if we're in "post outfit" mode from route params
  const isPostOutfitMode = route?.params?.mode === 'postOutfit';

  // Regular upload mode state
  const [mode, setMode] = useState('process'); // 'process' | 'manual'
  const [pickedImage, setPickedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(false);
  const [typeField, setTypeField] = useState('');
  const [colorField, setColorField] = useState('');
  const [tagsField, setTagsField] = useState('');

  // Post outfit mode state
  const [outfits, setOutfits] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [caption, setCaption] = useState('');
  const [postedOutfitIds, setPostedOutfitIds] = useState([]); // Track which outfits are already posted
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [posting, setPosting] = useState(false);

  // Update header title based on mode
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isPostOutfitMode ? 'Post Outfit' : 'Upload',
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
    });
  }, [navigation, theme, isPostOutfitMode]);

  // Fetch user's outfits and check which ones are already posted
  // Only show outfits that haven't been posted yet
  useEffect(() => {
    if (!isPostOutfitMode) return;

    const fetchOutfitsAndPosted = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch all user's outfits
        // Try with orderBy first, fallback to without orderBy if index is missing
        let outfitsSnapshot;
        try {
          const outfitsQuery = query(
            collection(db, 'outfits'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          outfitsSnapshot = await getDocs(outfitsQuery);
        } catch (orderByError) {
          // If orderBy fails (missing index), try without orderBy
          // This can happen if the composite index hasn't been created yet
          console.warn('orderBy failed, trying without orderBy:', orderByError);
          const outfitsQuery = query(
            collection(db, 'outfits'),
            where('uid', '==', user.uid)
          );
          outfitsSnapshot = await getDocs(outfitsQuery);
        }

        const allOutfits = outfitsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort client-side if orderBy failed (newest first)
        allOutfits.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });

        // Fetch all posted outfits by this user to see which ones are already posted
        const postedQuery = query(
          collection(db, 'postedOutfits'),
          where('uid', '==', user.uid)
        );
        const postedSnapshot = await getDocs(postedQuery);
        const postedIds = postedSnapshot.docs.map(doc => doc.data().outfitId);

        setPostedOutfitIds(postedIds);
        
        // Filter out already-posted outfits
        const availableOutfits = allOutfits.filter(outfit => !postedIds.includes(outfit.id));
        setOutfits(availableOutfits);
      } catch (err) {
        console.error('Error fetching outfits:', err);
        Alert.alert(
          'Error',
          'Failed to load outfits. Please check your Firestore rules and ensure you have the proper indexes set up.'
        );
      } finally {
        setLoadingOutfits(false);
      }
    };

    fetchOutfitsAndPosted();
  }, [isPostOutfitMode]);

  // Regular upload mode functions (existing functionality)
  const canSave = useMemo(() => !!previewImage && !saving && !working, [previewImage, saving, working]);

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to pick images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
        exif: false,
        selectionLimit: 1,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('No image returned');
        return;
      }

      setPickedImage(asset);
      setPreviewImage(asset.uri);
      setTypeField('');
      setColorField('');
      setTagsField('');
    } catch (e) {
      console.error('[Upload] pick error:', e);
      Alert.alert('Picker error', String(e?.message || e));
    }
  };

  const runProcessing = async () => {
    if (!pickedImage) {
      Alert.alert('No image', 'Choose an image first.');
      return;
    }
    try {
      setWorking(true);
      const result = await processImageOnBackend(pickedImage.uri);
      if (!result?.base64_image) throw new Error('Backend did not return base64_image');
      const dataUrl = `data:image/png;base64,${result.base64_image}`;
      setPreviewImage(dataUrl);
      const { type, color, tags } = extractAttributes(result);
      if (type) setTypeField(String(type));
      if (color) setColorField(String(color));
      if (tags?.length) setTagsField(tags.join(', '));
    } catch (err) {
      console.error('[Upload] processing error:', err);
      Alert.alert('Processing failed', String(err?.message || err));
    } finally {
      setWorking(false);
    }
  };

  const save = async () => {
    try {
      if (!previewImage || !pickedImage) {
        Alert.alert('Nothing to save', 'Pick (and optionally process) an image first.');
        return;
      }
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in', 'You must be signed in to upload.');
        return;
      }

      setSaving(true);
      let fileUri = previewImage;
      let mime = 'image/jpeg';

      if (typeof previewImage === 'string' && previewImage.startsWith('data:')) {
        const out = await dataUrlToTempFile(previewImage);
        fileUri = out.fileUri;
        mime = out.mime || 'image/png';
      } else {
        mime = guessMimeFromPath(previewImage) || 'image/jpeg';
      }

      const resp = await fetch(fileUri);
      const blob = await resp.blob();

      const ts = Date.now();
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `img_${ts}.${ext}`;
      const storagePath = `clothing/${user.uid}/images/${fileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob, { contentType: mime });
      const downloadURL = await getDownloadURL(storageRef);

      const tags = tagsField.split(',').map(t => t.trim()).filter(Boolean);

      await addDoc(collection(db, 'images'), {
        uid: user.uid,
        url: downloadURL,
        path: storagePath,
        type: typeField || null,
        color: colorField || null,
        tags: tags.length ? tags : [],
        createdAt: serverTimestamp(),
      });

      Alert.alert('Uploaded', 'Your item has been saved.');
      navigation.goBack();
    } catch (err) {
      console.error('[Upload] save error:', err);
      Alert.alert('Save failed', String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Post outfit mode functions
  // Handle posting a selected outfit with caption to the postedOutfits collection
  const handlePostOutfit = async () => {
    if (!selectedOutfit) {
      Alert.alert('No Outfit Selected', 'Please select an outfit to post.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to post outfits.');
        return;
      }

      setPosting(true);

      // Create a post in the postedOutfits collection
      // This links to the original outfit and includes the caption
      await addDoc(collection(db, 'postedOutfits'), {
        uid: user.uid,
        outfitId: selectedOutfit.id,
        outfitName: selectedOutfit.name || 'Untitled Outfit',
        outfitItems: selectedOutfit.items || [],
        caption: caption.trim() || '',
        createdAt: serverTimestamp(),
      });

      // Update the user's outfit count in their profile
      // This ensures the "(number) outfits" stat at the top updates immediately
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        outfits: increment(1)
      });

      Alert.alert('Success', 'Outfit posted!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error posting outfit:', error);
      Alert.alert('Error', 'Failed to post outfit. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const switchTo = (nextMode) => {
    setMode(nextMode);
    if (pickedImage && nextMode === 'manual') setPreviewImage(pickedImage.uri);
  };

  // Render outfit selection item
  const renderOutfitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.outfitItem,
        {
          backgroundColor: selectedOutfit?.id === item.id ? theme.primary : theme.surface,
          borderColor: selectedOutfit?.id === item.id ? theme.primary : theme.border,
          borderWidth: selectedOutfit?.id === item.id ? 2 : 1,
        }
      ]}
      onPress={() => setSelectedOutfit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.outfitItemContent}>
        <Text style={[
          theme.typography.subheadline,
          { color: selectedOutfit?.id === item.id ? theme.surface : theme.text }
        ]}>
          {item.name || 'Untitled Outfit'}
        </Text>
        <Text style={[
          theme.typography.caption,
          { color: selectedOutfit?.id === item.id ? theme.surface : theme.textDim }
        ]}>
          {item.items?.length || 0} items
        </Text>
      </View>
      {selectedOutfit?.id === item.id && (
        <MaterialCommunityIcons name="check-circle" size={24} color={theme.surface} />
      )}
    </TouchableOpacity>
  );

  // If in post outfit mode, show outfit selection UI
  if (isPostOutfitMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Select Outfit Section */}
          <View style={styles.section}>
            <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 12 }]}>
              Select Outfit to Post
            </Text>
            
            {loadingOutfits ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 12 }]}>
                  Loading outfits...
                </Text>
              </View>
            ) : outfits.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={48} color={theme.textDim} />
                <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 12, textAlign: 'center' }]}>
                  {postedOutfitIds.length > 0 
                    ? 'All your outfits have been posted already.'
                    : 'No saved outfits yet. Create an outfit first!'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={outfits}
                renderItem={renderOutfitItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Preview Selected Outfit */}
          {selectedOutfit && (
            <View style={styles.section}>
              <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 12 }]}>
                Preview
              </Text>
              <View style={styles.previewContainer}>
                <OutfitPreview
                  selectedItems={selectedOutfit.items || []}
                  onItemTransform={() => {}}
                  activeLayer={null}
                  onLayerSelect={() => {}}
                />
              </View>
            </View>
          )}

          {/* Caption Input */}
          <View style={styles.section}>
            <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 12 }]}>
              Caption (Optional)
            </Text>
            <TextInput
              style={[
                styles.captionInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Write a caption for your outfit..."
              placeholderTextColor={theme.textDim}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4, textAlign: 'right' }]}>
              {caption.length}/500
            </Text>
          </View>

          {/* Post Button */}
          <TouchableOpacity
            disabled={!selectedOutfit || posting}
            onPress={handlePostOutfit}
            style={[
              styles.postButton,
              {
                backgroundColor: selectedOutfit && !posting ? theme.primary : theme.border,
                opacity: selectedOutfit && !posting ? 1 : 0.5
              }
            ]}
          >
            {posting ? (
              <ActivityIndicator color={theme.surface} />
            ) : (
              <>
                <MaterialCommunityIcons name="share" size={20} color={selectedOutfit ? theme.surface : theme.textDim} />
                <Text style={[
                  theme.typography.body,
                  { color: selectedOutfit ? theme.surface : theme.textDim, marginLeft: 8 }
                ]}>
                  Post Outfit
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Regular upload mode (existing functionality)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'process' && { backgroundColor: theme.primary }]}
            onPress={() => switchTo('process')}
          >
            <Text style={[theme.typography.subheadline, { color: mode === 'process' ? theme.onPrimary : theme.text }]}>
              Process image
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && { backgroundColor: theme.primary }]}
            onPress={() => switchTo('manual')}
          >
            <Text style={[theme.typography.subheadline, { color: mode === 'manual' ? theme.onPrimary : theme.text }]}>
              Upload as-is
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pick image */}
        <TouchableOpacity style={[styles.pickBtn, { borderColor: theme.textDim }]} onPress={pick}>
          <MaterialCommunityIcons name="image-plus" size={22} color={theme.primary} />
          <Text style={[theme.typography.body, { color: theme.text, marginLeft: 8 }]}>
            {pickedImage ? 'Choose a different image' : 'Pick an image'}
          </Text>
        </TouchableOpacity>

        {/* Preview */}
        {previewImage ? (
          <Image source={{ uri: previewImage }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={[styles.placeholder, { borderColor: theme.textDim }]}>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>No image selected</Text>
          </View>
        )}

        {/* Process action */}
        {mode === 'process' && (
          <TouchableOpacity
            disabled={!pickedImage || working}
            onPress={runProcessing}
            style={[styles.actionBtn, { backgroundColor: pickedImage && !working ? theme.primary : theme.surface }]}
          >
            {working ? <ActivityIndicator /> : (
              <Text style={[theme.typography.body, { color: pickedImage ? theme.onPrimary : theme.textDim }]}>
                Run background removal / tagging
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Attributes */}
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={[theme.typography.subheadline, { color: theme.text }]}>Attributes</Text>

          <View>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Type</Text>
            <TextInput
              value={typeField}
              onChangeText={setTypeField}
              placeholder="e.g., T-shirt, Jeans, Jacket"
              placeholderTextColor={theme.textDim}
              style={[styles.input, { color: theme.text, borderColor: theme.textDim }, theme.typography.body]}
            />
          </View>

          <View>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Color</Text>
            <TextInput
              value={colorField}
              onChangeText={setColorField}
              placeholder="e.g., Black"
              placeholderTextColor={theme.textDim}
              style={[styles.input, { color: theme.text, borderColor: theme.textDim }, theme.typography.body]}
            />
          </View>

          <View>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Tags</Text>
            <TextInput
              value={tagsField}
              onChangeText={setTagsField}
              placeholder="comma separated (e.g., casual, summer)"
              placeholderTextColor={theme.textDim}
              style={[styles.input, { color: theme.text, borderColor: theme.textDim }, theme.typography.body]}
            />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          disabled={!canSave}
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: canSave ? theme.primary : theme.surface }]}
        >
          {saving ? <ActivityIndicator /> : (
            <Text style={[theme.typography.body, { color: canSave ? theme.onPrimary : theme.textDim }]}>
              Save to closet
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  modeToggle: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 },
  placeholder: { marginTop: 14, height: 260, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  preview: { marginTop: 14, width: '100%', height: 320, borderRadius: 10, backgroundColor: '#00000008' },
  actionBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  input: { marginTop: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  saveBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
  // Post outfit mode styles
  section: { marginBottom: 24 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12 },
  outfitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  outfitItemContent: { flex: 1 },
  previewContainer: { alignItems: 'center' },
  captionInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
});
