import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SearchScreen({ navigation }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Real-time listener for all public users only
  useEffect(() => {
    // Only fetch users where isPublic == true to avoid Firestore permission errors
    const q = query(collection(db, 'users'), where('isPublic', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      const userList = [];
      snapshot.forEach(doc => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    });
    return () => unsub();
  }, []);

  // Filter users as search changes
  useEffect(() => {
    if (!search) {
      setFiltered([]);
      return;
    }
    const lower = search.toLowerCase();
    setFiltered(users.filter(u => (u.displayName || '').toLowerCase().includes(lower)));
  }, [search, users]);

  // Render each user result
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id, from: 'Search' })} // Pass 'from' param
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
    // SafeAreaView ensures content is not under the notch/status bar
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 20,
        backgroundColor: theme.background
      }]}
      >
        {/* Custom header with back button - matches other screens */}
        <View style={styles.headerContainer}>
          <Pressable
            onPress={() => navigation.navigate('Social')}
            style={styles.backButton}
          >
            <Text style={[styles.backArrow, { color: theme.primary }]}>←</Text>
          </Pressable>
          <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
            Search Users
          </Text>
          {/* Empty view for spacing to center the title */}
          <View style={styles.backButton} />
        </View>

        {/* Search bar below the header */}
        <TextInput
          style={[styles.searchBar, { borderColor: theme.primary, color: theme.text }]}
          placeholder="Search users by name..."
          placeholderTextColor={theme.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {/* Add margin below search bar for spacing */}
        <View style={{ marginTop: 10 }} />
        {/* Results list */}
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={[theme.typography.caption, { color: theme.textDim, textAlign: 'center', marginTop: 32 }]}>No users found.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 44, // Ensures consistent touch target size
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
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
}); 