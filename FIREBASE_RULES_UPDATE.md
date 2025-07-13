# Updated Firebase Rules for Follower System

## Firestore Rules

Update your Firestore rules to include the new collections and fields:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading public user profiles
      allow read: if request.auth != null && 
        (request.auth.uid == userId || resource.data.isPublic == true);
    }

    match /images/{imageId} {
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;

      // For create (write), check that they're writing their own UID
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;

      // For update/delete, check that the resource already belongs to them
      allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }

    // New notifications collection
    match /notifications/{notificationId} {
      // Users can read notifications sent to them
      allow read: if request.auth != null && resource.data.to == request.auth.uid;
      
      // Users can create notifications (for follow requests)
      allow create: if request.auth != null && 
        request.resource.data.from == request.auth.uid;
      
      // Users can delete notifications sent to them
      allow delete: if request.auth != null && resource.data.to == request.auth.uid;
    }
  }
}
```

## Storage Rules

The existing storage rules should work fine, but here they are for reference:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Authenticated users can read, write, and delete in "clothing"
    match /clothing/{allPaths=**} {
      allow read, write, delete: if request.auth != null;
    }

    // Block all other paths
    match /{allOtherPaths=**} {
      allow read, write, delete: if false;
    }
  }
}
```

## Key Changes Explained

### 1. User Profile Access
- **Public profiles**: Any authenticated user can read public user profiles
- **Private profiles**: Only the profile owner can read their own private profile
- **Profile updates**: Only the profile owner can update their profile

### 2. Notifications Collection
- **Reading**: Users can only read notifications sent to them
- **Creating**: Users can create notifications (for sending follow requests)
- **Deleting**: Users can delete notifications sent to them (when accepting/denying requests)

### 3. Security Features
- All operations require authentication
- Users can only access their own data
- Follow requests are properly secured
- Real-time updates work with these rules

## Implementation Notes

1. **Deploy these rules** in your Firebase Console under Firestore > Rules
2. **Test the rules** with the Firebase Emulator if needed
3. **Monitor usage** to ensure the rules work as expected
4. **Update rules** as you add more social features

## Testing the Rules

You can test these rules by:
1. Creating a follow request between two users
2. Checking that private profiles are not accessible to others
3. Verifying that notifications are only visible to the recipient
4. Testing real-time updates work properly 