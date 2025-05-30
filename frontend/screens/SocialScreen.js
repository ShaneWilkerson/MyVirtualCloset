import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SocialScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[theme.typography.headline, { color: theme.text, marginBottom: 16 }]}>
        Social Feed
      </Text>

      <Text style={[theme.typography.body, { color: theme.textDim }]}>
        This will show shared outfits, friends activity, and community features.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});