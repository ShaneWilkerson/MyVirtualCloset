import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OutfitPreview from '../components/OutfitPreview';

/**
 * PostedOutfitsScreen Component
 * 
 * Displays all posted outfits for the current user.
 * Features:
 * - Shows a list of all posted outfits with their names and captions
 * - Displays a preview of each outfit using the OutfitPreview component
 * - Real-time updates when outfits are posted or removed
 * - Custom header with back button
 * 
 * This screen is accessed from the SocialScreen when clicking on the "Outfits" stat.
 */
export default function PostedOutfitsScreen({ navigation }) {
  const { theme } = useTheme();
  const [postedOutfits, setPostedOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch posted outfits for the current user
  // Shows all outfits that the user has posted publicly
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Query posted outfits for the current user, ordered by creation date (newest first)
    const postedQuery = query(
      collection(db, 'postedOutfits'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postedQuery, (snapshot) => {
      const outfitsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPostedOutfits(outfitsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posted outfits:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Render a single posted outfit item
  const renderOutfitItem = ({ item }) => (
    <View style={[styles.outfitCard, { backgroundColor: theme.surface }]}>
      {/* Outfit preview */}
      <View style={styles.outfitPreviewContainer}>
        <OutfitPreview
          selectedItems={item.outfitItems || []}
          onItemTransform={() => {}}
          activeLayer={null}
          onLayerSelect={() => {}}
        />
      </View>
      {/* Outfit name and caption */}
      <View style={styles.outfitInfo}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>
          {item.outfitName || 'Untitled Outfit'}
        </Text>
        {item.caption && (
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 8 }]}>
            {item.caption}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Custom header with back button */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center', marginRight: 28 }]}>
          My Posted Outfits
        </Text>
      </View>

      {/* Outfits list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[theme.typography.body, { color: theme.textDim }]}>Loading outfits...</Text>
        </View>
      ) : postedOutfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="tshirt-crew-outline" size={48} color={theme.textDim} />
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 12, textAlign: 'center' }]}>
            No posted outfits yet
          </Text>
          <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 8, textAlign: 'center' }]}>
            Post an outfit from the Social tab to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={postedOutfits}
          keyExtractor={(item) => item.id}
          renderItem={renderOutfitItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
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
    padding: 24,
  },
  listContent: {
    padding: 20,
  },
  outfitCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  outfitPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  outfitInfo: {
    paddingHorizontal: 8,
  },
});

