import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ClosetScreen from '../screens/ClosetScreen';
import OutfitsScreen from '../screens/OutfitsScreen';
import SocialScreen from '../screens/SocialScreen';
import { useTheme } from '../context/ThemeContext';
import PlannerScreen from '../screens/PlannerScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
