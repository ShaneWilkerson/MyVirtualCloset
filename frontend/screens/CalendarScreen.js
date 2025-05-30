import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CalendarScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MaterialCommunityIcons
        name="calendar-month-outline"
        size={48}
        color={theme.text}
        style={{ marginBottom: 16 }}
      />
      <Text style={[theme.typography.headline, { color: theme.text }]}>
        Calendar Page
      </Text>
      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 8 }]}>
        (Coming soon)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
