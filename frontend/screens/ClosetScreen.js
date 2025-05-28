import React, { useLayoutEffect } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 30) / 2;

export default function ClosetScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

useLayoutEffect(() => {
  navigation.setOptions({
    headerStyle: { backgroundColor: theme.surface },
    headerTitleStyle: theme.typography.headline,
    headerTintColor: theme.primary,
    headerRight: () => (
      <TouchableOpacity onPress={() => navigation.navigate('Upload')}>
        <MaterialCommunityIcons name="plus" size={24} color={theme.primary} style={{ marginRight: 16 }} />
      </TouchableOpacity>
    ),
  });
}, [navigation, theme]);

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
        ...doc.data(),
      }));

      setImages(data);
    } catch (err) {
      console.error('Error fetching clothing:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClothing();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchClothing();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[theme.typography.body, { color: theme.textDim, textAlign: 'center', marginTop: 40 }]}>
            No clothing uploaded yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ClothingDetail', { item })}>
            <Image
              source={{ uri: item.url }}
              style={[
                styles.image,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  image: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
});
