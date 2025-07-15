import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import ClosetScreen from '../screens/ClosetScreen';
import OutfitsScreen from '../screens/OutfitsScreen';
import SocialScreen from '../screens/SocialScreen';
import { useTheme } from '../context/ThemeContext';
import PlannerScreen from '../screens/PlannerScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SearchScreen from '../screens/SearchScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import FollowersScreen from '../screens/FollowersScreen';
import FollowingScreen from '../screens/FollowingScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Planner"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTitleStyle: theme.typography.headline,
        headerTintColor: theme.primary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textDim,
      }}
    >
      <Tab.Screen
  name="Planner"
  component={PlannerScreen}
  options={{
    headerShown: false, //hides the header 
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="calendar-month" color={color} size={size} />
    ),
  }}
/>
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hanger" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Outfits"
        component={OutfitsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tshirt-crew" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
          // Add header icons for notifications and settings
          headerLeft: () => (
            <TouchableOpacity 
              style={{ marginLeft: 16 }}
              onPress={() => {
                // Navigate to NotificationsScreen to view follow requests and notifications
                navigation.navigate('Notifications');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="bell-outline" 
                size={24} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('SocialSettings')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="cog" 
                size={24} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerShown: false, tabBarButton: () => null }} />
      <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false, tabBarButton: () => null }} />
      <Tab.Screen name="Followers" component={FollowersScreen} options={{ headerShown: false, tabBarButton: () => null }} />
      <Tab.Screen name="Following" component={FollowingScreen} options={{ headerShown: false, tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
