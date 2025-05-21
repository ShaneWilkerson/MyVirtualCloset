# Firestore Schema – Virtual Closet

## `users` Collection

Each document is a user profile.

**Document ID:** `uid` (from Firebase Auth)

### Fields:
| Field           | Type     | Description                      |
|-----------------|----------|----------------------------------|
| `email`         | string   | User's email from Firebase Auth  |
| `joined`        | timestamp| Time the account was created     |
| `displayName`   | string   | Display name                     |

---

## `images` Collection

Flat collection of all clothing images.

**Document ID:** Auto-generated

### Fields:
| Field         | Type     | Description                         |
|---------------|----------|-------------------------------------|
| `uid`         | string   | UID of the uploading user           |
| `url`         | string   | Firebase Storage download URL       |
| `createdAt`   | timestamp| Upload date                         |

---

