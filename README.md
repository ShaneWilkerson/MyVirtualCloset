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
- Horizontal scroll for **week/month planner**
- “Suggest Outfit” button (AI-powered)
- Outfit preview updates avatar
- Tap on date to create/edit outfit

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

---

## 🌍 4. Social Screen
- Public feed of shared outfits
- User profiles (posts, follow, bio)
- Like, save, and comment on outfits
- Share to calendar or favorites
- Follow/unfollow system

---

## ☰ 5. Menu Screen
Grouped UI with sub-pages:

### 🔹 Profile
- Avatar, display name, stats
- Edit name/picture

### 🔹 Closet Stats
- Total items
- Most worn
- Outfit reuse rates

### 🔹 Settings
- Dark/light mode toggle
- Notification settings (future)
- Email/password update
- Sign out

### 🔹 Wishlist & Inspiration
- Saved items from Social
- Inspiration outfits
- “Try this look” option

### 🔹 Feedback
- Submit app suggestions or bug reports

---


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
| Field       | Type      | Description                                        |
|-------------|-----------|----------------------------------------------------|
| `uid`       | string    | UID of the uploading user                          |
| `url`       | string    | Firebase Storage download URL                      |
| `createdAt` | timestamp | Upload date                                        |
| `color`     | string    | Detected or user-assigned color (e.g., "blue")     |
| `pattern`   | string    | Detected or user-assigned pattern (e.g., "plaid")  |
| `type`      | string    | Clothing type (e.g., "shirt", "pants", "jacket")   |

---
