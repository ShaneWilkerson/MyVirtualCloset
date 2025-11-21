import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

// Fixed size for the avatar container
const AVATAR_SIZE = 300;

/**
 * OutfitPreview Component
 * 
 * Displays layered clothing items on a transparent background.
 * Features:
 * - Gesture-based controls: drag to move, pinch to scale
 * - Proper layer ordering: pants → shirt → jacket → hat
 * - Visual feedback for selected items (outline/bounding box)
 * 
 * Each clothing item can be individually positioned and scaled using gestures.
 * Only the currently selected item has active gesture controls.
 * 
 * Optimized to prevent flickering by memoizing components and minimizing re-renders.
 */
export default function OutfitPreview({ 
  selectedItems, 
  onItemTransform, 
  activeLayer,
  onLayerSelect 
}) {
  const { theme } = useTheme();
  
  // Helper function to categorize clothing type into layer category
  // This determines the z-index order for proper stacking
  const getCategory = (type) => {
    if (!type) return 'other';
    const lower = type.toLowerCase();
    
    // Shirt/top category - appears above pants
    if (lower.includes('shirt') || lower.includes('top') || lower.includes('t-shirt') || 
        lower.includes('polo') || lower.includes('blouse') || lower.includes('sweater') ||
        lower.includes('hoodie') || lower.includes('dress')) {
      return 'shirt';
    }
    
    // Pants/bottom category - appears below shirt
    if (lower.includes('pants') || lower.includes('jeans') || lower.includes('shorts') ||
        lower.includes('skirt') || lower.includes('trousers')) {
      return 'pants';
    }
    
    // Shoes category - appears above pants
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot') ||
        lower.includes('sandal') || lower.includes('heel')) {
      return 'shoes';
    }
    
    // Hat category - appears on top of everything
    if (lower.includes('hat') || lower.includes('cap') || lower.includes('beanie')) {
      return 'hat';
    }
    
    // Jacket/coat category - appears above shirt, below hat
    if (lower.includes('jacket') || lower.includes('coat') || lower.includes('vest')) {
      return 'jacket';
    }
    
    return 'other';
  };

  // Define layer order for rendering (bottom to top)
  // This ensures proper stacking: pants → shirt → jacket → hat
  const layerOrder = ['pants', 'shoes', 'shirt', 'jacket', 'hat', 'other'];
  
  // Group items by category for proper rendering order
  // Memoize this to prevent unnecessary re-renders that cause flickering
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    selectedItems.forEach(item => {
      const category = getCategory(item.type);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }, [selectedItems]);

  /**
   * ClothingLayer Component
   * 
   * Individual draggable and pinchable clothing item layer.
   * Uses gesture handlers for pan (drag) and pinch (scale) interactions.
   * Only the active layer responds to gestures.
   * 
   * Memoized to prevent flickering when parent component re-renders.
   */
  const ClothingLayer = React.memo(({ item, category, activeLayer, onLayerSelect, onItemTransform }) => {
    const isActive = activeLayer === item.id;
    
    // Get initial transform values or defaults
    const initialTransform = item.transform || { x: 0, y: 0, scale: 1 };
    
    // Shared values for animation - initialize with stored transform
    const translateX = useSharedValue(initialTransform.x);
    const translateY = useSharedValue(initialTransform.y);
    const scale = useSharedValue(initialTransform.scale);
    
    // Shared value to track if this layer is active (for use in worklets)
    const isActiveShared = useSharedValue(isActive);
    
    // Update shared values when transform changes externally (e.g., from saved outfit)
    // Note: Shared values are stable, so we only depend on item.transform
    useEffect(() => {
      const transform = item.transform || { x: 0, y: 0, scale: 1 };
      translateX.value = transform.x;
      translateY.value = transform.y;
      scale.value = transform.scale;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.transform]);
    
    // Update active state in shared value when it changes
    useEffect(() => {
      isActiveShared.value = isActive;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);
    
    // Wrapper function to update transform - must be called from JS thread
    // Using useCallback to ensure stable reference for runOnJS
    const updateTransform = useCallback((itemId, newTransform) => {
      // Only update if this is still the active layer
      if (activeLayer === itemId) {
        onItemTransform(itemId, newTransform);
      }
    }, [activeLayer, onItemTransform, item.id]);
    
    // Pan gesture handler for dragging items
    // CRITICAL: All state updates must use runOnJS to bridge from UI thread to JS thread
    const panGestureHandler = useAnimatedGestureHandler({
      onStart: (_, context) => {
        // Store initial position when gesture starts
        context.startX = translateX.value;
        context.startY = translateY.value;
      },
      onActive: (event, context) => {
        // Only allow dragging if this is the active layer
        // Use shared value instead of React state in worklet
        if (isActiveShared.value) {
          translateX.value = context.startX + event.translationX;
          translateY.value = context.startY + event.translationY;
        }
      },
      onEnd: () => {
        // Save transform when gesture ends
        // MUST use runOnJS to call React state update from UI thread
        if (isActiveShared.value) {
          runOnJS(updateTransform)(item.id, {
            x: translateX.value,
            y: translateY.value,
            scale: scale.value
          });
        }
      },
    });

    // Pinch gesture handler for scaling items
    // CRITICAL: All state updates must use runOnJS to bridge from UI thread to JS thread
    const pinchGestureHandler = useAnimatedGestureHandler({
      onStart: (_, context) => {
        // Store initial scale when gesture starts
        context.startScale = scale.value;
      },
      onActive: (event, context) => {
        // Only allow scaling if this is the active layer
        // Use shared value instead of React state in worklet
        if (isActiveShared.value) {
          // Allow very small scale values (minimum 0.05) for fine control
          // No lower clamp - allow items to shrink as much as needed
          const newScale = Math.max(0.05, Math.min(2.0, context.startScale * event.scale));
          scale.value = withSpring(newScale);
        }
      },
      onEnd: () => {
        // Save transform when gesture ends
        // MUST use runOnJS to call React state update from UI thread
        if (isActiveShared.value) {
          runOnJS(updateTransform)(item.id, {
            x: translateX.value,
            y: translateY.value,
            scale: scale.value
          });
        }
      },
    });

    // Animated style for the clothing item
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      };
    });

    // Render the clothing item image and visual feedback
    const renderClothingContent = () => (
      <>
        <Image
          source={{ uri: item.url }}
          style={styles.clothingImage}
          resizeMode="contain"
        />
        {/* Visual feedback: bounding box for active item */}
        {isActive && (
          <View style={[styles.boundingBox, { borderColor: theme.primary }]}>
            <View style={[styles.cornerMarker, styles.topLeft, { borderColor: theme.primary }]} />
            <View style={[styles.cornerMarker, styles.topRight, { borderColor: theme.primary }]} />
            <View style={[styles.cornerMarker, styles.bottomLeft, { borderColor: theme.primary }]} />
            <View style={[styles.cornerMarker, styles.bottomRight, { borderColor: theme.primary }]} />
          </View>
        )}
      </>
    );

    // If this item is NOT selected, render with simple TouchableOpacity for selection
    // This ensures taps work immediately without gesture handler interference
    // CRITICAL: Non-selected items have NO gesture handlers, so they don't block taps
    if (!isActive) {
      return (
        <Animated.View
          style={[
            styles.clothingLayer,
            animatedStyle,
          ]}
          pointerEvents="auto" // Allow taps on non-selected items
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              // Immediate selection on tap - happens before any gesture activation
              onLayerSelect(item.id);
            }}
            style={styles.clothingImageContainer}
          >
            {renderClothingContent()}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // If this item IS selected, wrap it in gesture handlers for drag and pinch
    // Only the selected item has active gesture handlers
    // CRITICAL: Gesture handlers are ONLY on the selected item
    return (
      <Animated.View
        style={[
          styles.clothingLayer,
          animatedStyle,
          styles.activeLayer,
        ]}
        pointerEvents="auto" // Allow gestures on selected item
      >
        <PinchGestureHandler 
          onGestureEvent={pinchGestureHandler} 
          enabled={true}
          minPointers={2}
          simultaneousHandlers={[]}
        >
          <Animated.View style={styles.gestureContainer}>
            <PanGestureHandler 
              onGestureEvent={panGestureHandler} 
              enabled={true}
              minPointers={1}
              simultaneousHandlers={[]}
            >
              <Animated.View style={styles.clothingImageContainer}>
                {renderClothingContent()}
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders that cause flickering
    // Only re-render if the item data or active state actually changed
    const prevTransform = prevProps.item.transform || { x: 0, y: 0, scale: 1 };
    const nextTransform = nextProps.item.transform || { x: 0, y: 0, scale: 1 };
    
    return (
      prevProps.item.id === nextProps.item.id &&
      prevTransform.x === nextTransform.x &&
      prevTransform.y === nextTransform.y &&
      prevTransform.scale === nextTransform.scale &&
      prevProps.item.url === nextProps.item.url &&
      (prevProps.activeLayer === prevProps.item.id) === (nextProps.activeLayer === nextProps.item.id)
    );
  });

  // Memoize the layer rendering to prevent flickering
  // Only re-render when selectedItems or activeLayer actually changes
  // Use stable references for callbacks to prevent unnecessary re-renders
  const stableOnLayerSelect = useCallback((itemId) => {
    onLayerSelect(itemId);
  }, [onLayerSelect]);

  const stableOnItemTransform = useCallback((itemId, transform) => {
    onItemTransform(itemId, transform);
  }, [onItemTransform]);

  const renderedLayers = useMemo(() => {
    return layerOrder.map(category => {
      if (itemsByCategory[category]) {
        return itemsByCategory[category].map(item => (
          <ClothingLayer 
            key={item.id} 
            item={item} 
            category={category}
            activeLayer={activeLayer}
            onLayerSelect={stableOnLayerSelect}
            onItemTransform={stableOnItemTransform}
          />
        ));
      }
      return null;
    });
  }, [itemsByCategory, activeLayer, stableOnLayerSelect, stableOnItemTransform]);

  return (
    <GestureHandlerRootView>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {/* Preview container with clothing layers only (no silhouette) */}
        <View style={styles.previewContainer}>
          {/* Render clothing layers in proper order: pants → shirt → jacket → hat */}
          {/* This ensures correct z-index stacking without changing layer order */}
          {renderedLayers}
        </View>
        
        {/* Instructions */}
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 12, textAlign: 'center' }]}>
          {activeLayer 
            ? 'Drag to move • Pinch to scale'
            : 'Tap a clothing item to adjust it'
          }
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: AVATAR_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 16,
  },
  previewContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'absolute',
    pointerEvents: 'auto', // Allow gestures on selected item
  },
  clothingLayer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // pointerEvents handled dynamically in component
  },
  clothingImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    pointerEvents: 'auto', // Always allow interaction
  },
  clothingImage: {
    width: AVATAR_SIZE * 0.8,
    height: AVATAR_SIZE * 0.8,
  },
  activeLayer: {
    // Subtle outline for active item
  },
  boundingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  cornerMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 2,
  },
  topLeft: {
    top: -6,
    left: -6,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -6,
    right: -6,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -6,
    left: -6,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -6,
    right: -6,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
