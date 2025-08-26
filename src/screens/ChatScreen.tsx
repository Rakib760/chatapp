// mobile/src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { getSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Props = {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
};

type Message = {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  text: string;
  createdAt: string;
  readBy: string[];
};

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipientId, recipientName, conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const socket = getSocket();

  useEffect(() => {
    navigation.setOptions({ title: recipientName });
    loadCurrentUser();
    loadMessages();

    if (socket) {
      // Listen for new messages
      socket.on('message:new', (message: Message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      // Listen for typing indicators
      socket.on('typing:start', (data: { userId: string }) => {
        if (data.userId === recipientId) {
          setIsTyping(true);
        }
      });

      socket.on('typing:stop', (data: { userId: string }) => {
        if (data.userId === recipientId) {
          setIsTyping(false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('typing:start');
        socket.off('typing:stop');
      }
    };
  }, [recipientId]);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading current user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // For demo purposes, load mock messages if server is not available
      if (!api.defaults.baseURL || api.defaults.baseURL.includes('localhost')) {
        loadMockMessages();
        return;
      }

      let url = '/messages';
      if (conversationId) {
        url += `/${conversationId}`;
      }

      const response = await api.get(url);
      setMessages(response.data);
      scrollToBottom();
    } catch (error: any) {
      console.log('Failed to load messages, using mock data:', error.message);
      loadMockMessages();
    }
  };

  const loadMockMessages = () => {
    // Mock messages for demonstration
    const mockMessages: Message[] = [
      {
        _id: '1',
        sender: { _id: currentUser?._id || '1', username: currentUser?.username || 'You' },
        text: 'Hello there!',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        readBy: []
      },
      {
        _id: '2',
        sender: { _id: recipientId, username: recipientName },
        text: 'Hi! How are you?',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        readBy: [currentUser?._id || '1']
      },
      {
        _id: '3',
        sender: { _id: currentUser?._id || '1', username: currentUser?.username || 'You' },
        text: "I'm good, thanks! This is a demo chat.",
        createdAt: new Date().toISOString(),
        readBy: []
      }
    ];
    setMessages(mockMessages);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;

    // Create mock message for immediate UI update
    const mockMessage: Message = {
      _id: Date.now().toString(),
      sender: { 
        _id: currentUser?._id || '1', 
        username: currentUser?.username || 'You' 
      },
      text: messageText,
      createdAt: new Date().toISOString(),
      readBy: []
    };

    setMessages(prev => [...prev, mockMessage]);
    scrollToBottom();

    // Try to send via socket if available
    if (socket) {
      socket.emit('message:send', {
        text: messageText,
        receiverId: recipientId,
        conversationId: conversationId || null
      });
    } else {
      console.log('Socket not available, message sent locally');
    }

    setMessageText('');
  };

  const handleTypingStart = () => {
    if (socket) {
      socket.emit('typing:start', {
        receiverId: recipientId,
        conversationId: conversationId || null
      });
    }
  };

  const handleTypingStop = () => {
    if (socket) {
      socket.emit('typing:stop', {
        receiverId: recipientId,
        conversationId: conversationId || null
      });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender._id === currentUser?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {isMyMessage && item.readBy.length > 0 && (
          <Text style={styles.readReceipt}>✓ Read</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{recipientName} is typing...</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          onFocus={handleTypingStart}
          onBlur={handleTypingStop}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  myMessageText: {
    color: '#FFF',
    fontSize: 16,
  },
  theirMessageText: {
    color: '#000',
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  readReceipt: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  typingIndicator: {
    padding: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen;