import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CreateOutfitScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}
                contentContainerStyle={styles.content}>

      <Text style={[theme.typography.headline, styles.title]}>Create Outfit</Text>

      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Select Clothing</Text>
        <View style={styles.gridPlaceholder}>
          <MaterialCommunityIcons name="tshirt-crew" size={48} color={theme.textDim} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Preview on Avatar</Text>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={100} color={theme.textDim} />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]}
                        onPress={() => {}}>
        <Text style={[theme.typography.body, { color: theme.surface }]}>Save Outfit</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    color: 'black',
  },
  section: {
    marginBottom: 30,
  },
  gridPlaceholder: {
    height: 150,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  avatarPlaceholder: {
    height: 250,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  saveButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
});
