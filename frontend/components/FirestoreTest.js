import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { updateExistingUsers } from '../utils/updateExistingUsers';

export default function FirestoreTest() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setUsers(list);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchData();
  }, []);

  // Function to handle the migration of existing users
  const handleMigration = async () => {
    try {
      Alert.alert(
        'Update Users',
        'This will update all existing users to include the isPublic field. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            onPress: async () => {
              await updateExistingUsers();
              Alert.alert('Success', 'All existing users have been updated with isPublic field');
              // Refresh the user list
              const snapshot = await getDocs(collection(db, 'users'));
              const list = [];
              snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
              setUsers(list);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update users');
    }
  };

  return (
    <ScrollView>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Users from Firestore:</Text>
      
      {/* Migration button */}
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#5C6BC0', 
          padding: 10, 
          borderRadius: 5, 
          marginBottom: 10 
        }}
        onPress={handleMigration}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Update Existing Users (Add isPublic field)
        </Text>
      </TouchableOpacity>
      
              {users.map(user => (
          <View key={user.id} style={{ marginBottom: 10, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>{user.displayName || user.email || 'Unnamed user'}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              isPublic: {user.isPublic !== undefined ? user.isPublic.toString() : 'undefined'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Followers: {user.followers?.length || 0} | Following: {user.following?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Pending: {user.pendingFollowers?.length || 0} | Outfits: {user.outfits || 0}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}
