import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SocialScreen({ navigation }) {
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current user's profile data when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Set up real-time listener for user profile data
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUserProfile({
          uid: doc.id,
          displayName: userData.displayName || 'User',
          photoURL: userData.photoURL || null,
          followers: userData.followers || [],
          following: userData.following || [],
          outfits: userData.outfits || 0, // Placeholder for outfit count
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading user profile:', error);
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Header Section */}
      <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
        {/* Profile Picture - Circular Image */}
        <View style={styles.profileImageContainer}>
          {userProfile?.photoURL ? (
            <Image 
              source={{ uri: userProfile.photoURL }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons 
                name="account" 
                size={40} 
                color={theme.background} 
              />
            </View>
          )}
        </View>

        {/* Username */}
        <Text style={[theme.typography.headline, { color: theme.text, marginTop: 12 }]}>
          {userProfile?.displayName || 'Loading...'}
        </Text>

        {/* Stats Row: Outfits, Followers, Following */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[theme.typography.subheadline, { color: theme.text }]}>
              {userProfile?.outfits || 0}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Outfits</Text>
          </View>
          {/* Followers: number is tappable, but style does not change */}
          <View style={styles.statItem}>
            <TouchableOpacity onPress={() => navigation.navigate('Followers')} activeOpacity={0.7}>
              <Text style={[theme.typography.subheadline, { color: theme.text }]}>
                {userProfile?.followers?.length || 0}
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Followers</Text>
          </View>
          {/* Following: number is tappable, but style does not change */}
          <View style={styles.statItem}>
            <TouchableOpacity onPress={() => navigation.navigate('Following')} activeOpacity={0.7}>
              <Text style={[theme.typography.subheadline, { color: theme.text }]}>
                {userProfile?.following?.length || 0}
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.textDim }]}>Following</Text>
          </View>
        </View>
      </View>

      {/* Add margin for breathing room below the profile header divider */}
      <View style={{ marginTop: 20 }} />

      {/* Search Button - placed below the profile header and border line for correct visual separation */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: theme.primary }
        ]}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="magnify" size={24} color="white" />
        <Text style={[theme.typography.subheadline, { color: "white", marginLeft: 8 }]}>Search</Text>
      </TouchableOpacity>

      {/* Post Outfit Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: theme.primary }
        ]}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="hanger" size={24} color="white" />
        <Text style={[theme.typography.subheadline, { color: "white", marginLeft: 8 }]}>Post Outfit</Text>
      </TouchableOpacity>

      {/* Future content will go here */}
      <View style={styles.contentPlaceholder}>
        <Text style={[theme.typography.body, { color: theme.textDim, textAlign: 'center' }]}>Social feed content will appear here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImageContainer: {
    marginBottom: 8,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes it circular
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  contentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginTop: 0,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});