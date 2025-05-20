import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

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

  return (
    <ScrollView>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Users from Firestore:</Text>
      {users.map(user => (
        <View key={user.id} style={{ marginBottom: 10 }}>
          <Text>{user.name || 'Unnamed user'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
