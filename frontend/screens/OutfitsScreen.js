import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * OutfitsScreen Component
 * 
 * Main landing page for the Outfits tab.
 * Provides two main actions:
 * - Create Outfit: Navigate to the outfit builder screen
 * - View Outfits: Navigate to the screen showing all saved outfits
 * 
 * This is the entry point when users tap the "Outfits" tab in the bottom navigation.
 */
export default function OutfitsScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header with "Outfits" title - matches the style of other screens */}
        {/* Add proper top padding to account for status bar and notch */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 10 : 20 }]}>
        <Text style={[theme.typography.headline, { color: theme.text }]}>
          Outfits
        </Text>
      </View>

      {/* Main content area with two action buttons */}
      <View style={styles.content}>
        {/* Create Outfit Button - navigates to the outfit builder */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('CreateOutfit')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus-circle" size={32} color={theme.surface} />
          <Text style={[theme.typography.subheadline, { color: theme.surface, marginTop: 12 }]}>
            Create Outfit
          </Text>
          <Text style={[theme.typography.caption, { color: theme.surface, marginTop: 4, opacity: 0.9 }]}>
            Build a new outfit from your closet
          </Text>
        </TouchableOpacity>

        {/* View Outfits Button - navigates to the saved outfits list */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary }]}
          onPress={() => navigation.navigate('ViewOutfits')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="tshirt-crew" size={32} color={theme.primary} />
          <Text style={[theme.typography.subheadline, { color: theme.text, marginTop: 12 }]}>
            View Outfits
          </Text>
          <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>
            See all your saved outfits
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
