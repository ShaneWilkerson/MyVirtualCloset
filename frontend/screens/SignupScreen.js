import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen({ navigation }) {
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName });

      await setDoc(doc(db, 'users', userCred.user.uid), {
        email,
        displayName,
        joined: serverTimestamp(),
        isPublic: true, // Default to public profile for new users
        followers: [], // Array of user IDs who follow this user
        following: [], // Array of user IDs this user is following
        pendingFollowers: [], // Array of user IDs who requested to follow (for private profiles)
        outfits: 0, // Count of user's outfits
      });

      navigation.goBack();
    } catch (err) {
      setError('Signup failed. Try a different email.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[theme.typography.headline, { color: theme.text, textAlign: 'center', marginBottom: 20 }]}>
        Sign Up
      </Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Display Name"
        placeholderTextColor={theme.textDim}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Email"
        placeholderTextColor={theme.textDim}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Password"
        placeholderTextColor={theme.textDim}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
      <Button title="Sign Up" onPress={handleSignup} color={theme.primary} />
      <View style={{ marginTop: 10 }}>
        <Button title="Back to Login" onPress={() => navigation.goBack()} color={theme.secondaryAccent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  error: {
    textAlign: 'center',
    marginBottom: 10,
  },
});
