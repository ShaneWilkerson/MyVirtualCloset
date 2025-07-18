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
import SocialSettingsScreen from './screens/SocialSettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { ThemeProvider } from './context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SearchScreen from './screens/SearchScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import FollowersScreen from './screens/FollowersScreen';
import FollowingScreen from './screens/FollowingScreen';
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
    <SafeAreaProvider>
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
                          <Stack.Screen 
              name="SocialSettings" 
              component={SocialSettingsScreen}
              options={{ headerShown: false }} // Hide default header to use custom one
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ headerShown: false }} // Hide default header to use custom one
            />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Followers" component={FollowersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Following" component={FollowingScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}