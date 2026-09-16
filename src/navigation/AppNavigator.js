import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchScreen from '../screens/MatchScreen';
import ChatScreen from '../screens/ChatScreen';
import CallScreen from '../screens/CallScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ title: 'Your Profile' }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'YapNow', headerBackVisible: false }} />
        <Stack.Screen name="Match" component={MatchScreen} options={{ title: 'New Connection' }} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen
          name="Call"
          component={CallScreen}
          options={{ title: 'Voice Call', headerStyle: { backgroundColor: '#191932' }, headerTintColor: '#fff' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
