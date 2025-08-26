// mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // For testing without backend, use mock login
      if (!api.defaults.baseURL || api.defaults.baseURL.includes('localhost')) {
        // Mock login for testing
        await AsyncStorage.setItem('token', 'mock-token-for-testing');
        await AsyncStorage.setItem('user', JSON.stringify({
          id: '1',
          username: 'TestUser',
          email: email
        }));
        navigation.replace('Home');
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      navigation.replace('Home');
    } catch (error: any) {
      // Show mock success for testing if server is not running
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        Alert.alert('Info', 'Server not running. Using mock login for demonstration.');
        await AsyncStorage.setItem('token', 'mock-token-for-testing');
        await AsyncStorage.setItem('user', JSON.stringify({
          id: '1',
          username: 'TestUser',
          email: email
        }));
        navigation.replace('Home');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Temporary mock register navigation
  const handleMockRegister = () => {
    Alert.alert('Info', 'Registration screen not implemented yet. Use any email/password to login.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleMockRegister}>
        <Text style={styles.link}>Don't have an account? Register here</Text>
      </TouchableOpacity>

      {/* Demo hint */}
      <Text style={styles.demoText}>
        Demo: Use any email/password. Server connection will be mocked.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 10,
  },
  demoText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default LoginScreen;