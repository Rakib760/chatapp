// mobile/src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';


export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Chat: { 
    conversationId?: string; 
    recipientId: string; 
    recipientName: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ 
            headerShown: false,
            animationEnabled: true 
          }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ 
            headerShown: false,
            animationEnabled: true,
            title: 'Create Account'
          }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerLeft: () => null, // Disable back button
            title: 'Chats',
            headerRight: () => null,
            gestureEnabled: false // Prevent swipe back to login
          }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={({ route }) => ({ 
            title: route.params.recipientName || 'Chat',
            headerBackTitle: 'Back',
            animationEnabled: true
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;