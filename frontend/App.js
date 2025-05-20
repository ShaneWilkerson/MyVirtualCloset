import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen.js';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native core',
  'Unsupported top level event type "topInsetsChange"',
  'Unsupported top level event type "topHeaderHeightChange"',
]);

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return unsub;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}