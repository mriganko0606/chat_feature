"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket-context';
import { Message } from '@/lib/models';

interface UseChatProps {
  chatId: string | null;
  currentUserId: string;
}

export const useChat = ({ chatId, currentUserId }: UseChatProps) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Join/leave chat room when chatId changes
  useEffect(() => {
    if (socket && chatId) {
      socket.emit('join-chat', chatId);
      
      return () => {
        socket.emit('leave-chat', chatId);
      };
    }
  }, [socket, chatId]);

  const [isAITyping, setIsAITyping] = useState(false);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id?.toString() === message._id?.toString())) {
            return prev;
          }
          return [...prev, message];
        });
      };

      const handleTyping = (data: { userId: string }) => {
        if (data.userId !== currentUserId) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        }
      };

      const handleStopTyping = (data: { userId: string }) => {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      };

      const handleAITyping = () => {
        setIsAITyping(true);
      };

      const handleAIStopTyping = () => {
        setIsAITyping(false);
      };

      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleTyping);
      socket.on('user-stopped-typing', handleStopTyping);
      socket.on('ai-typing', handleAITyping);
      socket.on('ai-stop-typing', handleAIStopTyping);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('user-typing', handleTyping);
        socket.off('user-stopped-typing', handleStopTyping);
        socket.off('ai-typing', handleAITyping);
        socket.off('ai-stop-typing', handleAIStopTyping);
      };
    }
  }, [socket, currentUserId]);

  // Fetch initial messages
  const fetchMessages = async () => {
    if (!chatId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  // Send message
  const sendMessage = async (content: string, imageUrl?: string, messageType: 'text' | 'image' | 'mixed' = 'text', replyTo?: string) => {
    if (!socket || !chatId) {
      console.log('Cannot send message - missing socket or chatId:', { socket: !!socket, chatId });
      return;
    }

    // For text messages, content is required
    if (messageType === 'text' && !content.trim()) return;
    
    // For image messages, imageUrl is required
    if (messageType === 'image' && !imageUrl) {
      console.log('Cannot send image message - missing imageUrl');
      return;
    }

    console.log('Sending message via socket:', {
      chatId,
      sender: currentUserId,
      content: messageType === 'image' ? '' : content.trim(),
      imageUrl,
      messageType,
      replyTo
    });

    try {
      socket.emit('send-message', {
        chatId,
        sender: currentUserId,
        content: messageType === 'image' ? '' : content.trim(),
        imageUrl,
        messageType,
        replyTo,
        readBy: [currentUserId]
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Typing indicators
  const startTyping = () => {
    if (socket && chatId) {
      socket.emit('typing-start', { chatId, userId: currentUserId });
    }
  };

  const stopTyping = () => {
    if (socket && chatId) {
      socket.emit('typing-stop', { chatId, userId: currentUserId });
    }
  };

  return {
    messages,
    loading,
    typingUsers,
    isAITyping,
    isConnected,
    fetchMessages,
    sendMessage,
    startTyping,
    stopTyping,
  };
};
