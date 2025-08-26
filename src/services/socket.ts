// mobile/src/services/socket.ts
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem('token');
  
  socket = io('http://localhost:5000', {
    auth: {
      token
    }
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};