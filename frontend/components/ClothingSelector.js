import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const itemSize = (screenWidth - 60) / 3; // 3 columns with padding

/**
 * ClothingSelector Component
 * 
 * Displays a grid of clothing items from the user's closet.
 * Allows selecting items to add to the outfit.
 * Shows selected state with a checkmark overlay.
 */
export default function ClothingSelector({ 
  clothingItems, 
  selectedItems, 
  onItemSelect,
  category 
}) {
  const { theme } = useTheme();

  // Filter items by category if provided
  const getCategory = (type) => {
    if (!type) return 'other';
    const lower = type.toLowerCase();
    if (lower.includes('shirt') || lower.includes('top') || lower.includes('t-shirt') || 
        lower.includes('polo') || lower.includes('blouse') || lower.includes('sweater') ||
        lower.includes('hoodie') || lower.includes('dress')) {
      return 'shirt';
    }
    if (lower.includes('pants') || lower.includes('jeans') || lower.includes('shorts') ||
        lower.includes('skirt') || lower.includes('trousers')) {
      return 'pants';
    }
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot') ||
        lower.includes('sandal') || lower.includes('heel')) {
      return 'shoes';
    }
    if (lower.includes('hat') || lower.includes('cap') || lower.includes('beanie')) {
      return 'hat';
    }
    if (lower.includes('jacket') || lower.includes('coat') || lower.includes('vest')) {
      return 'accessories';
    }
    return 'other';
  };

  const filteredItems = category 
    ? clothingItems.filter(item => getCategory(item.type) === category)
    : clothingItems;

  const isSelected = (itemId) => {
    return selectedItems.some(item => item.id === itemId);
  };

  const renderItem = ({ item }) => {
    const selected = isSelected(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { 
            backgroundColor: theme.surface,
            borderColor: selected ? theme.primary : theme.border,
            borderWidth: selected ? 2 : 1,
          }
        ]}
        onPress={() => onItemSelect(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {selected && (
          <View style={[styles.selectedOverlay, { backgroundColor: theme.primary + '40' }]}>
            <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (filteredItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[theme.typography.caption, { color: theme.textDim }]}>
          No {category || 'clothing'} items in your closet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 10,
  },
  itemContainer: {
    width: itemSize,
    height: itemSize,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

