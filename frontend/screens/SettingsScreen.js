import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function SettingsScreen({ navigation }) {
  const { theme, mode, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[theme.typography.headline, { color: theme.text, marginBottom: 24 }]}>Settings</Text>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Profile</Text>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>User Name (placeholder)</Text>
        <Text style={[theme.typography.caption, { color: theme.textDim }]}>user@example.com</Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Settings</Text>
        <TouchableOpacity style={styles.row} onPress={toggleTheme}>
          <MaterialCommunityIcons
            name={mode === 'light' ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={theme.text}
          />
          <Text style={[theme.typography.body, { color: theme.text, marginLeft: 12 }]}>
            Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Wardrobe Stats */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Wardrobe Stats</Text>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>🧥 42 Items</Text>
        <Text style={[theme.typography.caption, { color: theme.textDim }]}>🎨 Favorite: Blue</Text>
      </View>

      {/* Saved Outfits */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Saved Outfits</Text>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>Outfit from @user123</Text>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={theme.error} />
          <Text style={[theme.typography.body, { color: theme.error, marginLeft: 12 }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
