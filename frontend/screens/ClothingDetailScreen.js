import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

export default function ClothingDetailScreen({ route }) {
  const { item } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Text style={styles.label}>Uploaded:</Text>
      <Text>{new Date(item.createdAt?.seconds * 1000).toLocaleString()}</Text>
    
      {item.type && (
        <>
          <Text style={styles.label}>Type:</Text>
          <Text>{item.type}</Text>
        </>
      )}
      {item.color && (
        <>
          <Text style={styles.label}>Color:</Text>
          <Text>{item.color}</Text>
        </>
      )}
      {item.tags && Array.isArray(item.tags) && (
        <>
          <Text style={styles.label}>Tags:</Text>
          <Text>{item.tags.join(', ')}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  image: { width: '100%', height: 300, marginBottom: 20, borderRadius: 10 },
  label: { fontWeight: 'bold', marginTop: 10 },
});
