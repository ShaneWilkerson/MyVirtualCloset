import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * TransformControls Component
 * 
 * Provides controls for adjusting the position and scale of a selected clothing item.
 * Allows moving items up/down/left/right and scaling them to fit the avatar properly.
 */
export default function TransformControls({ 
  selectedItem, 
  onTransformChange 
}) {
  const { theme } = useTheme();

  if (!selectedItem) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[theme.typography.caption, { color: theme.textDim, textAlign: 'center' }]}>
          Select a clothing item to adjust its position
        </Text>
      </View>
    );
  }

  const transform = selectedItem.transform || { x: 0, y: 0, scale: 1 };

  // Handle position adjustments
  const adjustPosition = (axis, delta) => {
    const newTransform = {
      ...transform,
      [axis]: transform[axis] + delta,
    };
    onTransformChange(selectedItem.id, newTransform);
  };

  // Handle scale adjustment
  const adjustScale = (value) => {
    const newTransform = {
      ...transform,
      scale: value,
    };
    onTransformChange(selectedItem.id, newTransform);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 16 }]}>
        Adjust: {selectedItem.type || 'Item'}
      </Text>

      {/* Position Controls */}
      <View style={styles.controlSection}>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginBottom: 8 }]}>
          Position
        </Text>
        
        {/* Vertical movement */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustPosition('y', -10)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-up" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.directionSpacer} />
          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustPosition('y', 10)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-down" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Horizontal movement */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustPosition('x', -10)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.directionSpacer} />
          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustPosition('x', 10)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scale Control */}
      <View style={styles.controlSection}>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginBottom: 8 }]}>
          Scale: {transform.scale.toFixed(2)}x
        </Text>
        <View style={styles.scaleControls}>
          <TouchableOpacity
            style={[styles.scaleButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustScale(Math.max(0.5, transform.scale - 0.1))}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="minus" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.scaleValue}>
            <Text style={[theme.typography.body, { color: theme.text }]}>
              {transform.scale.toFixed(1)}x
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scaleButton, { backgroundColor: theme.primary }]}
            onPress={() => adjustScale(Math.min(2.0, transform.scale + 0.1))}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset button */}
      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: theme.border }]}
        onPress={() => onTransformChange(selectedItem.id, { x: 0, y: 0, scale: 1 })}
        activeOpacity={0.7}
      >
        <Text style={[theme.typography.body, { color: theme.text }]}>Reset Position</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  controlSection: {
    marginBottom: 20,
  },
  directionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  directionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionSpacer: {
    width: 20,
  },
  scaleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scaleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleValue: {
    minWidth: 60,
    alignItems: 'center',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});

