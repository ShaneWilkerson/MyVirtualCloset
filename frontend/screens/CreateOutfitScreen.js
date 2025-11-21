import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import OutfitPreview from '../components/OutfitPreview';
import ClothingSelector from '../components/ClothingSelector';

/**
 * CreateOutfitScreen Component
 * 
 * Outfit builder screen that allows users to:
 * - Select clothing items from their closet
 * - Preview items layered on a simple gray silhouette avatar
 * - Adjust position and scale of each clothing item using gestures
 * - Save outfits with transform data for consistent display
 * 
 * This screen is accessed from the main OutfitsScreen via the "Create Outfit" button.
 */
export default function CreateOutfitScreen({ navigation }) {
  const { theme } = useTheme();
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Items selected for the outfit
  const [activeLayer, setActiveLayer] = useState(null); // Currently selected item for transform
  const [outfitName, setOutfitName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user's clothing items from Firestore
  // This loads all the clothing items from the user's closet so they can select items for the outfit
  useEffect(() => {
    const fetchClothing = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'images'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClothingItems(data);
      } catch (err) {
        console.error('Error fetching clothing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClothing();
  }, []);

  // Handle selecting/deselecting a clothing item for the outfit
  // When an item is tapped, it's either added to or removed from the selectedItems array
  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        // Deselect item - remove it from the array
        const filtered = prev.filter(selected => selected.id !== item.id);
        // Clear active layer if it was the deselected item
        if (activeLayer === item.id) {
          setActiveLayer(null);
        }
        return filtered;
      } else {
        // Select item - add with default transform (centered, scale 1)
        return [...prev, {
          ...item,
          transform: { x: 0, y: 0, scale: 1 }
        }];
      }
    });
  };

  // Handle transform changes for a clothing item
  // This is called when the user drags or pinches an item to adjust its position/scale
  const handleTransformChange = (itemId, newTransform) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, transform: newTransform }
          : item
      )
    );
  };

  // Handle saving the outfit to Firestore
  // Saves the outfit with all selected items and their transform data
  const handleSaveOutfit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items', 'Please select at least one clothing item for your outfit.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save outfits.');
        return;
      }

      // Prepare outfit data with clothing items and their transforms
      // The transform data ensures items appear in the same position when the outfit is loaded later
      const outfitData = {
        uid: user.uid,
        name: outfitName.trim() || 'Untitled Outfit',
        items: selectedItems.map(item => ({
          id: item.id,
          url: item.url,
          type: item.type,
          color: item.color,
          transform: item.transform || { x: 0, y: 0, scale: 1 }
        })),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'outfits'), outfitData);

      Alert.alert('Success', 'Outfit saved!', [
        { text: 'OK', onPress: () => {
          // Reset form and navigate back to OutfitsScreen
          setSelectedItems([]);
          setActiveLayer(null);
          setOutfitName('');
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        contentContainerStyle={styles.content}
      >
        {/* Back button header - allows user to go back to OutfitsScreen */}
        {/* Add proper top padding to account for status bar and notch */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 10 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          Create Outfit
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Outfit Name Input - optional name for the outfit */}
      <View style={styles.section}>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginBottom: 8 }]}>
          Outfit Name (Optional)
        </Text>
        <TextInput
          style={[
            styles.nameInput,
            { 
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text 
            }
          ]}
          placeholder="e.g., Casual Friday, Date Night"
          placeholderTextColor={theme.textDim}
          value={outfitName}
          onChangeText={setOutfitName}
        />
      </View>

      {/* Outfit Preview Section - shows selected items layered on silhouette */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 12 }]}>
          Preview on Avatar
        </Text>
        <OutfitPreview
          selectedItems={selectedItems}
          onItemTransform={handleTransformChange}
          activeLayer={activeLayer}
          onLayerSelect={setActiveLayer}
        />
      </View>

      {/* Clothing Selection Section - grid of clothing items from closet */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 12 }]}>
          Select Clothing Items
        </Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>
              Loading your closet...
            </Text>
          </View>
        ) : clothingItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="hanger" size={48} color={theme.textDim} />
            <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 12 }]}>
              No clothing items in your closet yet.
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={[theme.typography.body, { color: theme.surface }]}>
                Add Clothing Items
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ClothingSelector
            clothingItems={clothingItems}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
          />
        )}
      </View>

      {/* Save Button - saves the outfit to Firestore */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          { 
            backgroundColor: selectedItems.length > 0 ? theme.primary : theme.border,
            opacity: selectedItems.length > 0 ? 1 : 0.5
          }
        ]} 
        onPress={handleSaveOutfit}
        disabled={selectedItems.length === 0}
      >
        <MaterialCommunityIcons 
          name="content-save" 
          size={20} 
          color={selectedItems.length > 0 ? theme.surface : theme.textDim} 
        />
        <Text style={[
          theme.typography.body, 
          { 
            color: selectedItems.length > 0 ? theme.surface : theme.textDim,
            marginLeft: 8
          }
        ]}>
          Save Outfit
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
  },
});

