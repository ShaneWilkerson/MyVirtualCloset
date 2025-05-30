import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TabNavigator from './navigation/TabNavigator';
import ClothingDetailScreen from './screens/ClothingDetailScreen';
import { LogBox } from 'react-native';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import UploadScreen from './screens/UploadScreen';
import CalendarScreen from './screens/CalendarScreen';
import { ThemeProvider } from './context/ThemeContext';
LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native core',
  'Unsupported top level event type "topInsetsChange"',
  'Unsupported top level event type "topHeaderHeightChange"',
]);

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        {user ? (
          <Stack.Navigator screenOptions={{ headerShown: true }}>
            <Stack.Screen
              name="Tabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="ClothingDetail" component={ClothingDetailScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}