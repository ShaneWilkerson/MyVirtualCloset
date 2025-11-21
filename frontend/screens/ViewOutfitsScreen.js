import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import OutfitPreview from '../components/OutfitPreview';

/**
 * ViewOutfitsScreen Component
 * 
 * Displays all saved outfits for the current user.
 * Features:
 * - Shows a list of all saved outfits with their names
 * - Displays a preview of each outfit using the OutfitPreview component
 * - Allows deleting outfits
 * - Real-time updates when outfits are added or removed
 * 
 * This screen is accessed from the main OutfitsScreen via the "View Outfits" button.
 */
export default function ViewOutfitsScreen({ navigation }) {
  const { theme } = useTheme();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's saved outfits from Firestore with real-time updates
  // Uses onSnapshot to automatically update the list when outfits are added or deleted
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Query outfits for the current user, ordered by creation date (newest first)
    const q = query(
      collection(db, 'outfits'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener for outfits
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const outfitsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOutfits(outfitsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching outfits:', error);
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  // Handle deleting an outfit
  // Shows a confirmation alert before deleting
  const handleDeleteOutfit = (outfitId, outfitName) => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfitName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'outfits', outfitId));
              // The real-time listener will automatically update the list
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Format the creation date for display
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Render each outfit item in the list
  const renderOutfitItem = ({ item }) => {
    return (
      <View style={[styles.outfitCard, { backgroundColor: theme.surface }]}>
        {/* Outfit name and date */}
        <View style={styles.outfitHeader}>
          <View style={styles.outfitInfo}>
            <Text style={[theme.typography.subheadline, { color: theme.text }]}>
              {item.name || 'Untitled Outfit'}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>
              Created {formatDate(item.createdAt)}
            </Text>
          </View>
          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteOutfit(item.id, item.name || 'Untitled Outfit')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>

        {/* Outfit preview - shows the layered clothing items on the silhouette */}
        <View style={styles.previewContainer}>
          <OutfitPreview
            selectedItems={item.items || []}
            onItemTransform={() => {}} // Read-only in this view
            activeLayer={null} // No active layer in view mode
            onLayerSelect={() => {}} // No selection in view mode
          />
        </View>

        {/* Item count */}
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 8 }]}>
          {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Back button header - allows user to go back to OutfitsScreen */}
        {/* Add proper top padding to account for status bar and notch */}
        <View style={[styles.header, { 
          backgroundColor: theme.surface,
          paddingTop: Platform.OS === 'ios' ? 10 : 20 
        }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          My Outfits
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Outfits list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[theme.typography.body, { color: theme.textDim }]}>
            Loading outfits...
          </Text>
        </View>
      ) : outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="tshirt-crew-outline" size={64} color={theme.textDim} />
          <Text style={[theme.typography.subheadline, { color: theme.textDim, marginTop: 16 }]}>
            No saved outfits yet
          </Text>
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 8, textAlign: 'center' }]}>
            Create your first outfit to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          renderItem={renderOutfitItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  outfitCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  outfitInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
});

