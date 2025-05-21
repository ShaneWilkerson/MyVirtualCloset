import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './navigation/TabNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}