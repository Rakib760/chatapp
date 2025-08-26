// mobile/src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSocket, getSocket } from '../services/socket';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

type User = {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Initialize socket with error handling
    initializeSocket().then(socket => {
      // Listen for user status updates
      socket.on('user:online', (data: { userId: string }) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId ? { ...user, isOnline: true } : user
        ));
      });

      socket.on('user:offline', (data: { userId: string }) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId ? { ...user, isOnline: false, lastSeen: new Date().toISOString() } : user
        ));
      });
    }).catch(error => {
      console.log('Socket connection failed, using mock data');
      loadMockData();
    });

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('user:online');
        socket.off('user:offline');
      }
    };
  }, []);

  const loadMockData = () => {
    // Mock users data for demonstration
    const mockUsers: User[] = [
      {
        _id: '1',
        username: 'Alice',
        email: 'alice@example.com',
        isOnline: true,
        lastSeen: new Date().toISOString()
      },
      {
        _id: '2',
        username: 'Bob',
        email: 'bob@example.com',
        isOnline: false,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        _id: '3',
        username: 'Charlie',
        email: 'charlie@example.com',
        isOnline: true,
        lastSeen: new Date().toISOString()
      }
    ];
    setUsers(mockUsers);
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }

      // Try to get real users from API
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error: any) {
      console.log('API failed, using mock data:', error.message);
      // If API fails, use mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('Chat', {
      recipientId: user._id,
      recipientName: user.username
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item)}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.status}>
        <View style={[styles.statusIndicator, { backgroundColor: item.isOnline ? '#4CAF50' : '#9E9E9E' }]} />
        <Text style={styles.statusText}>
          {item.isOnline ? 'Online' : `Last seen ${new Date(item.lastSeen).toLocaleTimeString()}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      
      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No users found. Start the server to see real users.</Text>
          <Text style={styles.demoText}>Currently showing demo users</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          refreshing={false}
          onRefresh={loadData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoText: {
    marginTop: 10,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default HomeScreen;