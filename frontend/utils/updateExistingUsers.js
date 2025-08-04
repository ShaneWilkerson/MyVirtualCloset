// Utility script to update existing users in Firebase to include isPublic field
// This script should be run once to migrate existing user data

import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

/**
 * Updates all existing users in the Firestore database to include the isPublic field
 * This function should be called once to migrate existing user data
 * 
 * @returns {Promise<void>}
 */
export const updateExistingUsers = async () => {
  try {
    console.log('Starting user migration...');
    
    // Get all users from the users collection
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Iterate through each user document
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if the user needs to be updated with new fields
      const needsUpdate = {
        isPublic: userData.isPublic === undefined,
        bio: userData.bio === undefined,
        followers: userData.followers === undefined,
        following: userData.following === undefined,
        pendingFollowers: userData.pendingFollowers === undefined,
        outfits: userData.outfits === undefined
      };

      if (needsUpdate.isPublic || needsUpdate.bio || needsUpdate.followers || needsUpdate.following || needsUpdate.pendingFollowers || needsUpdate.outfits) {
        // Update the user document with missing fields
        const updateData = {};
        if (needsUpdate.isPublic) updateData.isPublic = true;
        if (needsUpdate.bio) updateData.bio = ''; // Add bio field if missing
        if (needsUpdate.followers) updateData.followers = [];
        if (needsUpdate.following) updateData.following = [];
        if (needsUpdate.pendingFollowers) updateData.pendingFollowers = [];
        if (needsUpdate.outfits) updateData.outfits = 0;

        await updateDoc(doc(db, 'users', userDoc.id), updateData);
        updatedCount++;
        console.log(`Updated user: ${userDoc.id} with fields:`, Object.keys(updateData));
      } else {
        skippedCount++;
        console.log(`Skipped user (already has all fields): ${userDoc.id}`);
      }
    }
    
    console.log(`Migration complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error during user migration:', error);
    throw error;
  }
};

/**
 * Function to check if a specific user has the isPublic field
 * Useful for debugging and verification
 * 
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} - True if user has isPublic field, false otherwise
 */
export const checkUserHasIsPublic = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isPublic !== undefined;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user:', error);
    return false;
  }
};

// Example usage (uncomment to run):
// updateExistingUsers().then(() => console.log('Migration completed successfully')); 