import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfos, setUserInfos] = useState({}); // Cache for userId -> {displayName, photoURL}

  // Load notifications for current user, newest first
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Query notifications ordered by timestamp descending
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('to', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
      const notificationsList = [];
      const userUids = new Set();
      const now = dayjs();
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only show notifications from the last 30 days
        if (data.timestamp && now.diff(dayjs(data.timestamp.toDate()), 'day') <= 30) {
          notificationsList.push({
            id: doc.id,
            ...data
          });
          if (data.from) userUids.add(data.from);
          if (data.to) userUids.add(data.to);
        }
      });
      // Fetch display names and photoURLs for all unique UIDs
      const infoMap = { ...userInfos };
      await Promise.all(Array.from(userUids).map(async (uid) => {
        if (!infoMap[uid]) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          infoMap[uid] = userDoc.exists() ? {
            displayName: userDoc.data().displayName || 'User',
            photoURL: userDoc.data().photoURL || null
          } : { displayName: 'User', photoURL: null };
        }
      }));
      setUserInfos(infoMap);
      setNotifications(notificationsList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to handle tapping a username in a notification
  const handleUserTap = (uid) => {
    navigation.navigate('UserProfile', { userId: uid });
  };

  // Function to handle accepting a follow request (if you keep private accounts)
  const handleAcceptFollow = async (notification) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get references to both users' documents
      const requestingUserRef = doc(db, 'users', notification.from);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      // Update both users' follower/following arrays
      await updateDoc(requestingUserRef, {
        following: arrayUnion(currentUser.uid)
      });

      await updateDoc(currentUserRef, {
        followers: arrayUnion(notification.from),
        pendingFollowers: arrayRemove(notification.from)
      });

      // Delete the notification
      await deleteDoc(doc(db, 'notifications', notification.id));

      Alert.alert('Success', 'Follow request accepted!');
    } catch (error) {
      console.error('Error accepting follow request:', error);
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  // Function to handle denying a follow request (if you keep private accounts)
  const handleDenyFollow = async (notification) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Remove from pending followers
      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        pendingFollowers: arrayRemove(notification.from)
      });

      // Delete the notification
      await deleteDoc(doc(db, 'notifications', notification.id));

      Alert.alert('Success', 'Follow request denied');
    } catch (error) {
      console.error('Error denying follow request:', error);
      Alert.alert('Error', 'Failed to deny follow request');
    }
  };

  // Render each notification item
  const renderNotification = ({ item }) => {
    // Show follow notifications with avatar and tappable username (no underline)
    if (item.type === 'follow') {
      // Determine who is the other user
      const isMe = item.from === auth.currentUser.uid;
      const otherUid = isMe ? item.to : item.from;
      const otherUser = userInfos[otherUid] || {};
      // Format time ago
      const timeAgo = item.timestamp ? dayjs(item.timestamp.toDate()).fromNow() : '';
      return (
        <View style={[styles.notificationItem, { backgroundColor: theme.surface }]}> 
          {/* Avatar on the left */}
          {otherUser.photoURL ? (
            <Image source={{ uri: otherUser.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }]}> 
              <MaterialCommunityIcons name="account" size={24} color={theme.background} />
            </View>
          )}
          {/* Message with tappable username (purple, no underline) */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[theme.typography.body, { color: theme.text }]}> 
              {isMe ? (
                <>
                  You have started following{' '}
                  <TouchableOpacity onPress={() => handleUserTap(item.to)} activeOpacity={0.7}>
                    <Text style={{ color: theme.primary }}>{otherUser.displayName || 'User'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => handleUserTap(item.from)} activeOpacity={0.7}>
                    <Text style={{ color: theme.primary }}>{otherUser.displayName || 'User'}</Text>
                  </TouchableOpacity> has started following you
                </>
              )}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>{timeAgo}</Text>
          </View>
        </View>
      );
    }
    // Default notification rendering
    return (
      <View style={[styles.notificationItem, { backgroundColor: theme.surface }]}>
        <Text style={[theme.typography.body, { color: theme.text }]}>
          {item.message || 'Unknown notification'}
        </Text>
      </View>
    );
  };

  return (
    // SafeAreaView for notch/status bar safety
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Custom header with purple back arrow */}
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: Platform.OS === 'ios' ? 30 : 10, paddingHorizontal: 20 }]}> 
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={28} 
            color="#5A4AE3" // App's purple
          />
        </TouchableOpacity>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>
      {/* Notifications list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[theme.typography.body, { color: theme.textDim }]}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-off" size={48} color={theme.textDim} />
          <Text style={[theme.typography.subheadline, { color: theme.textDim, marginTop: 16 }]}>No notifications yet</Text>
          <Text style={[theme.typography.body, { color: theme.textDim, textAlign: 'center', marginTop: 8 }]}>You'll see follow notifications here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
}); 