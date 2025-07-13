import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load notifications for current user when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Set up real-time listener for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('to', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = [];
      snapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
      setNotifications(notificationsList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to handle accepting a follow request
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

  // Function to handle denying a follow request
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

  // Function to render each notification item
  const renderNotification = ({ item }) => {
    if (item.type === 'follow_request') {
      return (
        <View style={[styles.notificationItem, { backgroundColor: theme.surface }]}>
          {/* User avatar placeholder */}
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons 
              name="account" 
              size={24} 
              color={theme.background} 
            />
          </View>

          {/* Notification content */}
          <View style={styles.notificationContent}>
            <Text style={[theme.typography.body, { color: theme.text }]}>
              <Text style={{ fontWeight: '600' }}>@{item.from}</Text> wants to follow you
            </Text>
            <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 4 }]}>
              {item.timestamp?.toDate().toLocaleDateString()}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.primary }]}
              onPress={() => handleAcceptFollow(item)}
            >
              <Text style={[styles.actionButtonText, { color: theme.background }]}>
                Accept
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.denyButton, { backgroundColor: theme.error }]}
              onPress={() => handleDenyFollow(item)}
            >
              <Text style={[styles.actionButtonText, { color: theme.background }]}>
                Deny
              </Text>
            </TouchableOpacity>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom header with back arrow and centered title */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.primary} 
          />
        </TouchableOpacity>
        
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          Notifications
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Notifications list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[theme.typography.body, { color: theme.textDim }]}>
            Loading notifications...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="bell-off" 
            size={48} 
            color={theme.textDim} 
          />
          <Text style={[theme.typography.subheadline, { color: theme.textDim, marginTop: 16 }]}>
            No notifications yet
          </Text>
          <Text style={[theme.typography.body, { color: theme.textDim, textAlign: 'center', marginTop: 8 }]}>
            You'll see follow requests and other notifications here
          </Text>
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    // Styled with theme.primary
  },
  denyButton: {
    // Styled with theme.error
  },
}); 