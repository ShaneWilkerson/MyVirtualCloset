import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function ClosetScreen() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchClothing = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'images'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setImages(data);
      } catch (err) {
        console.error('Error fetching clothing:', err);
      }
    };

    fetchClothing();
  }, []);

  return (
    <View style={styles.container}>
      {images.length === 0 ? (
        <Text style={styles.message}>No clothing uploaded yet.</Text>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={styles.image}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  message: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  image: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
});
