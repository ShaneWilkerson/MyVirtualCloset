## 🧭 Tab Navigation Layout

| Tab Name     | Purpose                                         |
|--------------|------------------------------------------------|
| Planner      | Homepage with avatar, today's outfit, planning |
| Closet       | Wardrobe with filters, stats, and item access  |
| Outfits      | Build, save, and view outfits; AI suggestions  |
| Social       | Explore, follow, and post/shared outfits       |
| Menu         | Profile, stats, settings, wishlist, feedback   |

---

## 🏠 1. Planner Screen (Home)
- Avatar display with **today’s outfit**
- Horizontal scroll for **week outfits**
- “Suggest Outfit” button (AI-powered)
- Outfit preview updates avatar
- Tap on day to open outfit screen for that day (edit/create)
- Tap on Calandar Icon to open Calandar

---

## 👚 2. Closet Screen
- Grid of uploaded clothing items
- Filter by: **type, color, tags, favorites**
- Tap any item → **ClothingDetail** view
- Floating action button to **add new clothing**
- Bottom bar with:
  - Closet count
  - Total items by category
  - Favorite breakdown

---

## 👗 3. Outfits Screen
- **Manual Outfit Builder** (drag/drop pieces)
- **Saved Outfits List** with edit/delete/share
- **AI Assistant**:
  - “Surprise Me”
  - “Improve This Outfit”
- Option to apply outfit to calendar day
- Option to Save outfit to collection

---

## 🌍 4. Social Screen
- Public feed of shared outfits
- User profiles (posts, follow, bio)
- Like, save, and comment on outfits
- Share to calendar or favorites
- Follow/unfollow system

---

## 👤 5. Profile Screen

Central hub for user account details and settings.

### 🔹 Overview
- User avatar and display name
- Closet statistics summary (e.g., total items, favorite color)
- Tap avatar or name to enter edit mode (future)

### 🔹 Settings (nested within Profile)
- Toggle dark/light mode
- Update email/password (future)
- Sign out
- (Future) Enable/disable notifications

### 🔹 Wishlist & Inspiration (planned)
- Saved clothing items from Social feed
- Inspiration outfits
- “Try this look” feature

### 🔹 Feedback (planned)
- Submit app suggestions or bug reports

---


# Firestore Schema – Virtual Closet

## `users` Collection

Each document is a user profile.

**Document ID:** `uid` (from Firebase Auth)

### Fields:
| Field         | Type      | Description                             |
|---------------|-----------|-----------------------------------------|
| `email`       | string    | User's email from Firebase Auth         |
| `joined`      | timestamp | Time the account was created            |
| `displayName` | string    | Display name                            |

---

## `images` Collection

Flat collection of all clothing images.

**Document ID:** Auto-generated

### Fields:
| Field       | Type      | Description                                         |
|-------------|-----------|-----------------------------------------------------|
| `uid`       | string    | UID of the uploading user                           |
| `url`       | string    | Firebase Storage download URL                       |
| `path`      | string    | Firebase Storage path (e.g., `clothing/xyz.png`)    |
| `createdAt` | timestamp | Upload date                                         |
| `color`     | string    | Detected or user-assigned color (e.g., "blue")      |
| `pattern`   | string    | Detected or user-assigned pattern (e.g., "plaid")   |
| `type`      | string    | Clothing type (e.g., "shirt", "pants", "jacket")    |

---

## `outfits` Collection

User-created saved outfits. These are reusable and can be applied to any date.

**Document ID:** Auto-generated

### Fields:
| Field       | Type      | Description                                         |
|-------------|-----------|-----------------------------------------------------|
| `uid`       | string    | UID of the user who created the outfit              |
| `name`      | string    | Optional name for the outfit (e.g., "Date Night")   |
| `topId`     | string    | ID of the top image item                            |
| `bottomId`  | string    | ID of the bottom image item                         |
| `extrasIds` | array     | Array of additional item IDs (e.g., shoes, hats)    |
| `tags`      | array     | Optional tags or labels (e.g., ["casual", "fall"])  |
| `createdAt` | timestamp | Date the outfit was saved                           |

---

## `outfitPlans` Collection

Daily outfit plans linked to a specific calendar day. Can reference a saved outfit or define one directly.

**Document ID:** `YYYY-MM-DD` (ISO date format)

### Fields:
| Field       | Type      | Description                                                  |
|-------------|-----------|--------------------------------------------------------------|
| `uid`       | string    | UID of the user                                              |
| `date`      | string    | Date in `YYYY-MM-DD` format                                  |
| `outfitRef` | string    | (Optional) ID of a saved outfit from the `outfits` collection |
| `topId`     | string    | (Optional) ID of top item                                    |
| `bottomId`  | string    | (Optional) ID of bottom item                                 |
| `extrasIds` | array     | (Optional) Array of extra item IDs                           |
| `notes`     | string    | (Optional) User-added notes for the day’s outfit             |
| `createdAt` | timestamp | Timestamp when this day plan was created or last edited      |

---
