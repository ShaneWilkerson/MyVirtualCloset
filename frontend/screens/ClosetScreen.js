import React, { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 30) / 2;

export default function ClosetScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const { theme } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
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

  let currentOffset = 0;
  const handleScroll = (event) => {
    const newOffset = event.nativeEvent.contentOffset.y;
    const goingDown = newOffset > currentOffset;
    if (goingDown !== !showFab) {
      setShowFab(!goingDown);
    }
    currentOffset = newOffset;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

      {showFab && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Upload')}
        >
          <MaterialCommunityIcons name="plus" size={28} color={theme.surface} />
        </TouchableOpacity>
      )}
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
