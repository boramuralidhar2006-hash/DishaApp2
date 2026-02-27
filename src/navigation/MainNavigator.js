import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens
import SplashScreen from '../screens/SplashScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import TrackTravelScreen from '../screens/TrackTravelScreen';
import NearbyServicesScreen from '../screens/NearbyServicesScreen';
import ComplaintScreen from '../screens/ComplaintScreen';
import SOSAlertScreen from '../screens/SOSAlertScreen';
import HelplineScreen from '../screens/HelplineScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon helper
const TabIcon = ({ label, focused }) => (
  <Text style={{ fontSize: 20 }}>
    {label === 'Home' ? '🏠' :
     label === 'Contacts' ? '👥' :
     label === 'Track' ? '📍' :
     label === 'Nearby' ? '🏥' : '📋'}
  </Text>
);

// Bottom Tab Navigator (Main App Tabs)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#8B0000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
          height: 65,
          paddingBottom: 8,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contacts" component={EmergencyContactsScreen} />
      <Tab.Screen name="Track" component={TrackTravelScreen} />
      <Tab.Screen name="Nearby" component={NearbyServicesScreen} />
      <Tab.Screen name="Complaint" component={ComplaintScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainApp" component={TabNavigator} />
      <Stack.Screen
        name="SOSAlert"
        component={SOSAlertScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="Helpline" component={HelplineScreen} />
    
    </Stack.Navigator>
  );
};

export default MainNavigator;
