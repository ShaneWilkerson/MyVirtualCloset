import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, getDoc, collection, query, where, orderBy } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SocialScreen({ navigation }) {
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedPosts, setFeedPosts] = useState([]);

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

  // Real-time feed of posts from followed users (not including self)
  useEffect(() => {
    if (!userProfile || !userProfile.following.length) {
      setFeedPosts([]);
      return;
    }
    // Query images where uid is in following array, but not the current user
    const q = query(
      collection(db, 'images'),
      where('uid', 'in', userProfile.following.filter(uid => uid !== userProfile.uid).slice(0, 10)), // Firestore 'in' supports max 10
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      // Fetch user info for each post
      const posts = await Promise.all(snapshot.docs.map(async docSnap => {
        const post = { id: docSnap.id, ...docSnap.data() };
        // Fetch user info for the post's owner
        const userDoc = await onSnapshot(doc(db, 'users', post.uid), () => {});
        let userInfo = {};
        try {
          const userDocSnap = await getDoc(doc(db, 'users', post.uid));
          userInfo = userDocSnap.exists() ? userDocSnap.data() : {};
        } catch {}
        return {
          ...post,
          user: {
            displayName: userInfo.displayName || 'User',
            photoURL: userInfo.photoURL || null,
            uid: post.uid,
          },
        };
      }));
      setFeedPosts(posts);
    });
    return () => unsub();
  }, [userProfile]);

  // Render a single post in the feed
  const renderPost = ({ item }) => (
    <View style={[styles.feedCard, { backgroundColor: theme.surface }]}> 
      {/* User info row */}
      <View style={styles.feedUserRow}>
        {item.user.photoURL ? (
          <Image source={{ uri: item.user.photoURL }} style={styles.feedAvatar} />
        ) : (
          <View style={[styles.feedAvatar, { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }]}> 
            <MaterialCommunityIcons name="account" size={24} color={theme.background} />
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.user.uid, from: 'Social' })} activeOpacity={0.7}>
          <Text style={[theme.typography.body, { color: theme.primary, marginLeft: 8, fontWeight: 'bold' }]}>{item.user.displayName}</Text>
        </TouchableOpacity>
      </View>
      {/* Outfit image placeholder */}
      <View style={styles.feedImageContainer}>
        <MaterialCommunityIcons name="tshirt-crew" size={64} color={theme.textDim} />
        {/* <Image source={{ uri: item.url }} style={styles.feedImage} /> */}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      {/* Profile Header Section */}
      <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
        {/* Profile Picture - Circular Image (Tappable) */}
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={() => navigation.navigate('ProfilePicture')}
          activeOpacity={0.7}
        >
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
        </TouchableOpacity>

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

      {/* Feed of posts from followed users */}
      <FlatList
        data={feedPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feedList}
        ListEmptyComponent={<Text style={[theme.typography.caption, { color: theme.textDim, textAlign: 'center', marginTop: 32 }]}>No posts from users you follow yet.</Text>}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
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
  feedList: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  feedCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  feedImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 8,
  },
  feedImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
});