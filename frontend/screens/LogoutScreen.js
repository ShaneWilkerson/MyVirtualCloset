import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function LogoutScreen() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>sign out?</Text>
      <Button title="Sign Out" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
});