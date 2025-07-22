import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function OutfitsScreen({ navigation }) {
  const { theme } = useTheme();
  const [avatar, setAvatar] = useState(null);

  // Listen for avatar data in the user's Firestore doc
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAvatar(docSnap.data().avatar || null);
      }
    });
    return () => unsub();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[theme.typography.headline, styles.title]}>Create Outfit</Text>

      <View style={styles.section}>
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Select Clothing</Text>
        <View style={styles.gridPlaceholder}>
          <MaterialCommunityIcons name="tshirt-crew" size={48} color={theme.textDim} />
        </View>
      </View>

      <View style={styles.section}>
        {/* Avatar Preview Section */}
        {/* If user has no avatar, show Create Avatar button. If they do, show Customize Avatar button. */}
        <Text style={[theme.typography.subheadline, { color: theme.text }]}>Preview on Avatar</Text>
        <View style={styles.avatarPlaceholder}>
          {/* Placeholder avatar icon for now */}
          <MaterialCommunityIcons name="account" size={100} color={theme.textDim} />
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AvatarCustomization')}
            activeOpacity={0.8}
          >
            <Text style={[theme.typography.body, { color: theme.surface }]}> 
              {avatar ? 'Customize Avatar' : 'Create Avatar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={() => {}}>
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
    position: 'relative',
  },
  avatarButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
  },
  saveButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
});
