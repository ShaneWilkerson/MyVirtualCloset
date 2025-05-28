import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';

export default function LogoutScreen({ navigation }) {
  const { theme, toggleTheme, mode } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
    });
  }, [navigation, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[theme.typography.headline, { color: theme.text, marginBottom: 30 }]}>
        Account Settings
      </Text>

      <View style={styles.buttonContainer}>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginBottom: 8 }]}>
          Current Theme
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={[theme.typography.body, { color: theme.surface }]}>
            Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Text style={[theme.typography.caption, { color: theme.textDim, marginBottom: 8 }]}>
          Sign out of your account
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.button, { backgroundColor: theme.error }]}
        >
          <Text style={[theme.typography.body, { color: theme.surface }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
