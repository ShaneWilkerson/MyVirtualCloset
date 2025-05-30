import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://placehold.co/100x100.png' }} // Replace with real user image
          style={styles.avatar}
        />
        <View>
          <Text style={[theme.typography.headline, { color: theme.text }]}>User Name</Text>
          <Text style={[theme.typography.caption, { color: theme.textDim }]}>user@example.com</Text>
        </View>
      </View>

      {/* Navigation Options */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate('Settings')}
      >
        <MaterialCommunityIcons name="cog" size={24} color={theme.text} />
        <Text style={[theme.typography.body, { color: theme.text, marginLeft: 12 }]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
