import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { auth, db, storage } from '../services/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ✅ your existing helper (you said it lives here)
import { removeBackgroundAndPredict as processImageOnBackend } from '../services/imageUtils';

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

export default function UploadScreen({ navigation }) {
  const { theme } = useTheme();

  const [mode, setMode] = useState('process'); // 'process' | 'manual'
  const [pickedImage, setPickedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // file:// or data:
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(false);

  const [typeField, setTypeField] = useState('');
  const [colorField, setColorField] = useState('');
  const [tagsField, setTagsField] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Upload',
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
    });
  }, [navigation, theme]);

  const canSave = useMemo(() => !!previewImage && !saving && !working, [previewImage, saving, working]);

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to pick images.');
        return;
      }
      // Use the same options your original used (warning is fine)
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
      setPreviewImage(asset.uri); // file://
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

      // show processed PNG as data URL
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

      // --- EXACT UPLOAD METHOD AS ORIGINALS ---
      // Ensure we have a *file uri* to upload (convert data URL -> temp file first)
      let fileUri = previewImage;
      let mime = 'image/jpeg';

      if (typeof previewImage === 'string' && previewImage.startsWith('data:')) {
        const out = await dataUrlToTempFile(previewImage);
        fileUri = out.fileUri;
        mime = out.mime || 'image/png';
      } else {
        mime = guessMimeFromPath(previewImage) || 'image/jpeg';
      }

      // Now upload via fetch(uri)->blob->uploadBytes (no ArrayBuffer construction on our side)
      const resp = await fetch(fileUri);
      const blob = await resp.blob();

      const ts = Date.now();
      const ext =
        mime === 'image/png' ? 'png' :
        mime === 'image/webp' ? 'webp' : 'jpg';
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

  const switchTo = (nextMode) => {
    setMode(nextMode);
    if (pickedImage && nextMode === 'manual') setPreviewImage(pickedImage.uri);
  };

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
});
