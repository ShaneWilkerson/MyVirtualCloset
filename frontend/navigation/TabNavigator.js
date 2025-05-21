import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Screen1 from '../screens/Screen1';
import Screen2 from '../screens/Screen2';
import UploadScreen from '../screens/UploadScreen';
import ClosetScreen from '../screens/ClosetScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Tab1" component={Screen1} />
      <Tab.Screen name="Tab2" component={Screen2} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Closet" component={ClosetScreen} />
      <Tab.Screen name="Logout" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
