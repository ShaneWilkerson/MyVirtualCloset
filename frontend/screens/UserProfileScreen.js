import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { followUser, unfollowUser, isFollowing } from '../utils/followSystem';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [followStatus, setFollowStatus] = useState('not_following');
  const [loading, setLoading] = useState(true);

  // Get the 'from' param to determine where the user navigated from
  const fromScreen = route.params?.from;

  // Listen to user profile data in real-time
  useEffect(() => {
    const userDocRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Listen to follow status in real-time
  useEffect(() => {
    if (!currentUser || !userId) return;
    let unsub;
    const check = async () => {
      const following = await isFollowing(userId);
      if (following) setFollowStatus('following');
      else setFollowStatus('not_following');
    };
    check();
    return () => unsub && unsub();
  }, [userId, currentUser]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (followStatus === 'following') {
      await unfollowUser(userId);
      setFollowStatus('not_following');
    } else {
      const result = await followUser(userId);
      setFollowStatus('following');
    }
  };

  // Render follow button (no 'Requested' state since only public accounts are shown)
  const renderFollowButton = () => {
    if (!currentUser || currentUser.uid === userId) return null;
    let text = 'Follow', color = theme.primary;
    if (followStatus === 'following') { text = 'Following'; color = theme.textDim; }
    return (
      <TouchableOpacity
        style={[styles.followButton, { backgroundColor: color }]}
        onPress={handleFollow}
        activeOpacity={0.8}
      >
        <Text style={[theme.typography.body, { color: theme.background }]}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // Render outfits (placeholder)
  const renderOutfits = () => (
    <View style={styles.outfitsContainer}>
      <Text style={[theme.typography.caption, { color: theme.textDim }]}>User's outfits would be shown here.</Text>
    </View>
  );

  if (loading || !user) {
    return <View style={[styles.container, { backgroundColor: theme.background }]}><Text style={[theme.typography.body, { color: theme.textDim }]}>Loading...</Text></View>;
  }

  // Check privacy
  const isPrivate = user.isPublic === false;
  const isFollowingUser = followStatus === 'following';

  return (
    // SafeAreaView ensures content is not under the notch/status bar
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Profile Card: includes back arrow, profile pic, name, stats, follow button */}
      <View style={[
        styles.profileCard,
        {
          backgroundColor: theme.surface,
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
          paddingHorizontal: 20,
        },
      ]}>
        {/* Back arrow in the top-left of the card */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Context-aware back navigation
            // If from Social or Search, goBack preserves scroll position and context
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color="#5A4AE3" // App's purple
          />
        </TouchableOpacity>
        {/* Profile picture, name, stats, follow button all in one container */}
        <View style={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.profileImageContainer}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary }]}> 
                <MaterialCommunityIcons name="account" size={40} color={theme.background} />
              </View>
            )}
          </View>
          <Text style={[theme.typography.headline, { color: theme.text, marginTop: 12 }]}>{user.displayName}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}><Text style={[theme.typography.subheadline, { color: theme.text }]}>{user.outfits || 0}</Text><Text style={[theme.typography.caption, { color: theme.textDim }]}>Outfits</Text></View>
            <View style={styles.statItem}><Text style={[theme.typography.subheadline, { color: theme.text }]}>{user.followers?.length || 0}</Text><Text style={[theme.typography.caption, { color: theme.textDim }]}>Followers</Text></View>
            <View style={styles.statItem}><Text style={[theme.typography.subheadline, { color: theme.text }]}>{user.following?.length || 0}</Text><Text style={[theme.typography.caption, { color: theme.textDim }]}>Following</Text></View>
          </View>
          {renderFollowButton()}
        </View>
      </View>
      {/* Outfits or privacy message */}
      {(!isPrivate || isFollowingUser) ? renderOutfits() : (
        <View style={styles.privateContainer}>
          <MaterialCommunityIcons name="lock" size={40} color={theme.textDim} />
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 16, textAlign: 'center' }]}>This user is private.{"\n"}Follow them to see their outfits.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 16,
    // shadow for card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    // position: 'relative' for back arrow
    position: 'relative',
    minHeight: 320,
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 10,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  profileImageContainer: { marginTop: 24, marginBottom: 8 },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  profileImagePlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16, paddingHorizontal: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  followButton: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 32, borderRadius: 24, alignItems: 'center' },
  outfitsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  privateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
}); 