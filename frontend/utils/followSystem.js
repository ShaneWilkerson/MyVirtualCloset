// Utility functions for the follower system
// This file contains all the logic for following/unfollowing users and handling follow requests

import { auth, db } from '../services/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  collection,
  serverTimestamp,
  getDoc // <-- import getDoc
} from 'firebase/firestore';

/**
 * Follow a user - handles both public and private profiles
 * @param {string} targetUserId - The user ID to follow
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const followUser = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    if (currentUser.uid === targetUserId) {
      return { success: false, message: 'You cannot follow yourself' };
    }

    // Use getDoc instead of .get() for modular Firestore
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);

    if (!targetUserDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    const targetUserData = targetUserDoc.data();
    const isPublic = targetUserData.isPublic !== false; // Default to true if not set

    if (isPublic) {
      // Public profile - follow immediately
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid)
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        following: arrayUnion(targetUserId)
      });

      return { success: true, message: 'Successfully followed user' };
    } else {
      // Private profile - send follow request
      await updateDoc(targetUserRef, {
        pendingFollowers: arrayUnion(currentUser.uid)
      });

      // Create notification for the target user
      await addDoc(collection(db, 'notifications'), {
        to: targetUserId,
        from: currentUser.uid,
        type: 'follow_request',
        timestamp: serverTimestamp(),
        message: `${currentUser.displayName || 'Someone'} wants to follow you`
      });

      return { success: true, message: 'Follow request sent' };
    }
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, message: 'Failed to follow user' };
  }
};

/**
 * Unfollow a user
 * @param {string} targetUserId - The user ID to unfollow
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const unfollowUser = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    // Remove from target user's followers
    await updateDoc(doc(db, 'users', targetUserId), {
      followers: arrayRemove(currentUser.uid)
    });

    // Remove from current user's following
    await updateDoc(doc(db, 'users', currentUser.uid), {
      following: arrayRemove(targetUserId)
    });

    return { success: true, message: 'Successfully unfollowed user' };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, message: 'Failed to unfollow user' };
  }
};

/**
 * Check if current user is following a target user
 * @param {string} targetUserId - The user ID to check
 * @returns {Promise<boolean>}
 */
export const isFollowing = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    // Use getDoc instead of .get()
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);

    if (!currentUserDoc.exists()) return false;

    const currentUserData = currentUserDoc.data();
    return currentUserData.following?.includes(targetUserId) || false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Check if current user has a pending follow request for a target user
 * (No longer needed for public-only search, but kept for completeness)
 * @param {string} targetUserId - The user ID to check
 * @returns {Promise<boolean>}
 */
export const hasPendingFollowRequest = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    // Use getDoc instead of .get()
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);

    if (!targetUserDoc.exists()) return false;

    const targetUserData = targetUserDoc.data();
    return targetUserData.pendingFollowers?.includes(currentUser.uid) || false;
  } catch (error) {
    console.error('Error checking pending follow request:', error);
    return false;
  }
};

/**
 * Get user's follower and following counts
 * @param {string} userId - The user ID to get counts for
 * @returns {Promise<{followers: number, following: number}>}
 */
export const getUserFollowCounts = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists()) {
      return { followers: 0, following: 0 };
    }

    const userData = userDoc.data();
    return {
      followers: userData.followers?.length || 0,
      following: userData.following?.length || 0
    };
  } catch (error) {
    console.error('Error getting follow counts:', error);
    return { followers: 0, following: 0 };
  }
}; 