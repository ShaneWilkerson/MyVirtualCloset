import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function FollowingScreen({ navigation }) {
  const { theme } = useTheme();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for following
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, async (docSnap) => {
      const data = docSnap.data();
      const followingUIDs = data.following || [];
      // Fetch user info for each following
      const followingDocs = await Promise.all(
        followingUIDs.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      setFollowing(
        followingDocs
          .filter((d) => d.exists())
          .map((d) => ({ id: d.id, ...d.data() }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Render each following row
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id, from: 'Following' })}
      activeOpacity={0.7}
    >
      {item.photoURL ? (
        <Image source={{ uri: item.photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }]}> 
          <MaterialCommunityIcons name="account" size={28} color={theme.background} />
        </View>
      )}
      <Text style={[theme.typography.body, { color: theme.text, marginLeft: 12 }]}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  return (
    // SafeAreaView for notch/status bar safety
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Custom header with purple back arrow */}
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20 }]}> 
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('Social')} // Always go to Social tab
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={28} 
            color="#5A4AE3" // App's purple
          />
        </TouchableOpacity>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>Following</Text>
        <View style={styles.placeholder} />
      </View>
      {/* Following list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[theme.typography.body, { color: theme.textDim }]}>Loading following...</Text>
        </View>
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-multiple-outline" size={48} color={theme.textDim} />
          <Text style={[theme.typography.subheadline, { color: theme.textDim, marginTop: 16 }]}>Not following anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
}); 