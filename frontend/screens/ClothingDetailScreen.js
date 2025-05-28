import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ClothingDetailScreen({ route }) {
  const { theme } = useTheme();
  const { item } = route.params;

  const uploadedAt = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleString()
    : 'Unknown';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={{ uri: item.url }} style={styles.image} />
      
      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Uploaded:</Text>
      <Text style={[theme.typography.body, { color: theme.text }]}>{uploadedAt}</Text>

      {item.type && (
        <>
          <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Type:</Text>
          <Text style={[theme.typography.body, { color: theme.text }]}>{item.type}</Text>
        </>
      )}

      {item.color && (
        <>
          <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Color:</Text>
          <Text style={[theme.typography.body, { color: theme.text }]}>{item.color}</Text>
        </>
      )}

      {item.tags && Array.isArray(item.tags) && (
        <>
          <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Tags:</Text>
          <Text style={[theme.typography.body, { color: theme.text }]}>{item.tags.join(', ')}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  image: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
  },
});
