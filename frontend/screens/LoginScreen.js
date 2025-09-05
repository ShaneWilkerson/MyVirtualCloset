// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('[Login] success');
    } catch (e) {
      const code = e?.code ?? 'unknown';
      const msg = e?.message ?? String(e);
      console.warn('[Login] failed', { code, msg });
      // Common helpful remaps
      const friendly =
        code === 'auth/invalid-api-key' ? 'Invalid Firebase API key (check app config).' :
        code === 'auth/network-request-failed' ? 'Network error. Check your connection or VPN.' :
        code === 'auth/invalid-credential' ? 'Email or password is incorrect.' :
        code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' :
        msg;
      setError(friendly);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!!error && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { borderColor: theme.outline, color: theme.text }]}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={[styles.input, { borderColor: theme.outline, color: theme.text }]}
      />
      <Button title="Log In" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { textAlign: 'center', marginBottom: 10 },
});
