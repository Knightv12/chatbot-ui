import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatAPI } from '../lib/api';
import { useAuth } from './AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  _id: string;
  userId: string;
  topic: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  sendMessage: (message: string, topic: string) => Promise<void>;
  getHistory: () => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getHistory();
    }
  }, [isAuthenticated]);

  const getHistory = async () => {
    try {
      const response = await chatAPI.getHistory();
      setChats(response);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async (message: string, topic: string) => {
    try {
      const response = await chatAPI.sendMessage({ message, topic });
      
      // Update current chat
      if (currentChat) {
        const updatedChat: Chat = {
          ...currentChat,
          messages: [
            ...currentChat.messages,
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response.response, timestamp: new Date() }
          ]
        };
        setCurrentChat(updatedChat);
      }

      // Update chat list
      await getHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        sendMessage,
        getHistory,
        setCurrentChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 