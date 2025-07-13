import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { followUser, unfollowUser, isFollowing, hasPendingFollowRequest } from '../utils/followSystem';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function UserProfileCard({ userId, showFollowButton = true }) {
  const { theme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [followStatus, setFollowStatus] = useState('not_following'); // 'not_following', 'following', 'pending'
  const [loading, setLoading] = useState(true);

  // Load user data and follow status when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userId) return;

    // Set up real-time listener for user data
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData({
          uid: doc.id,
          displayName: data.displayName || 'User',
          photoURL: data.photoURL || null,
          followers: data.followers || [],
          following: data.following || [],
          outfits: data.outfits || 0,
          isPublic: data.isPublic !== false
        });
      }
      setLoading(false);
    });

    // Check follow status
    const checkFollowStatus = async () => {
      const following = await isFollowing(userId);
      const pending = await hasPendingFollowRequest(userId);
      
      if (following) {
        setFollowStatus('following');
      } else if (pending) {
        setFollowStatus('pending');
      } else {
        setFollowStatus('not_following');
      }
    };

    checkFollowStatus();

    return () => unsubscribe();
  }, [userId]);

  // Handle follow/unfollow button press
  const handleFollowPress = async () => {
    if (!showFollowButton || !userId) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to follow users');
      return;
    }

    if (currentUser.uid === userId) {
      Alert.alert('Error', 'You cannot follow yourself');
      return;
    }

    try {
      if (followStatus === 'following') {
        // Unfollow user
        const result = await unfollowUser(userId);
        if (result.success) {
          setFollowStatus('not_following');
          Alert.alert('Success', result.message);
        } else {
          Alert.alert('Error', result.message);
        }
      } else {
        // Follow user or send request
        const result = await followUser(userId);
        if (result.success) {
          if (userData?.isPublic) {
            setFollowStatus('following');
          } else {
            setFollowStatus('pending');
          }
          Alert.alert('Success', result.message);
        } else {
          Alert.alert('Error', result.message);
        }
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      Alert.alert('Error', 'Failed to process follow action');
    }
  };

  // Get button text and style based on follow status
  const getFollowButtonProps = () => {
    switch (followStatus) {
      case 'following':
        return {
          text: 'Following',
          backgroundColor: theme.textDim,
          textColor: theme.background
        };
      case 'pending':
        return {
          text: 'Requested',
          backgroundColor: theme.secondaryAccent,
          textColor: theme.background
        };
      default:
        return {
          text: 'Follow',
          backgroundColor: theme.primary,
          textColor: theme.background
        };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[theme.typography.body, { color: theme.textDim }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[theme.typography.body, { color: theme.textDim }]}>
          User not found
        </Text>
      </View>
    );
  }

  const buttonProps = getFollowButtonProps();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Profile Picture */}
      <View style={styles.profileImageContainer}>
        {userData.photoURL ? (
          <Image 
            source={{ uri: userData.photoURL }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons 
              name="account" 
              size={32} 
              color={theme.background} 
            />
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={[theme.typography.subheadline, { color: theme.text, fontWeight: '600' }]}>
          {userData.displayName}
        </Text>
        
        {/* Privacy indicator */}
        <View style={styles.privacyIndicator}>
          <MaterialCommunityIcons 
            name={userData.isPublic ? "earth" : "lock"} 
            size={16} 
            color={theme.textDim} 
          />
          <Text style={[theme.typography.caption, { color: theme.textDim, marginLeft: 4 }]}>
            {userData.isPublic ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[theme.typography.body, { color: theme.text, fontWeight: '600' }]}>
            {userData.outfits}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.textDim }]}>
            Outfits
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[theme.typography.body, { color: theme.text, fontWeight: '600' }]}>
            {userData.followers.length}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.textDim }]}>
            Followers
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[theme.typography.body, { color: theme.text, fontWeight: '600' }]}>
            {userData.following.length}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.textDim }]}>
            Following
          </Text>
        </View>
      </View>

      {/* Follow Button */}
      {showFollowButton && (
        <TouchableOpacity 
          style={[
            styles.followButton, 
            { backgroundColor: buttonProps.backgroundColor }
          ]}
          onPress={handleFollowPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.followButtonText, 
            { color: buttonProps.textColor }
          ]}>
            {buttonProps.text}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 