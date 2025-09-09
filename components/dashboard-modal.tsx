"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { X, Send, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Message, Chat, Product } from "@/lib/models";
import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  productToShare?: Product | null;
  onUserChange?: (user: User) => void;
}

export function DashboardModal({ isOpen, onClose, selectedUser, productToShare, onUserChange }: DashboardModalProps) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const productSharedRef = useRef<string | null>(null);

  // Use the chat hook for real-time functionality
  const {
    messages,
    loading: messagesLoading,
    typingUsers,
    isConnected,
    fetchMessages,
    sendMessage: sendMessageSocket,
    startTyping,
    stopTyping,
  } = useChat({
    chatId: selectedChat?._id?.toString() || null,
    currentUserId: selectedUser?._id?.toString() || "",
  });

  // Fetch users and chats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setUsers(usersData.users);
        }

        // Fetch chats with unread counts
        if (selectedUser) {
          const chatsResponse = await fetch(`/api/chats/unread?userId=${selectedUser._id}`);
          const chatsData = await chatsResponse.json();
          if (chatsData.success) {
            setChats(chatsData.chats);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedUser) {
      fetchData();
    }
  }, [selectedUser]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat && selectedUser) {
      const markAsRead = async () => {
        try {
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: selectedChat._id?.toString(),
              userId: selectedUser._id?.toString(),
            }),
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markAsRead();
    }
  }, [selectedChat, selectedUser]);

  // Handle product sharing - create chat with owner and send product info
  useEffect(() => {
    if (productToShare && selectedUser && isOpen) {
      const productKey = `${productToShare._id}-${selectedUser._id}`;
      
      // Only share if not already shared
      if (productSharedRef.current !== productKey) {
        const handleProductShare = async () => {
          try {
            // Find or create a chat with the product owner
            const existingChat = chats.find(chat => 
              chat.users.length === 2 && 
              chat.users.some(userId => userId.toString() === selectedUser._id?.toString()) &&
              chat.users.some(userId => userId.toString() === productToShare.owner.toString())
            );

            let targetChat = existingChat;
            
            if (existingChat) {
              // Use existing chat
              setSelectedChat(existingChat);
            } else {
              // Create new chat with product owner
              const chatResponse = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chatName: `Chat with ${productToShare.owner.toString().slice(-6)}`,
                  isGroupChat: false,
                  users: [selectedUser._id, productToShare.owner],
                }),
              });

              if (chatResponse.ok) {
                const chatData = await chatResponse.json();
                targetChat = chatData.chat;
                if (targetChat) {
                  setSelectedChat(targetChat);
                }
              }
            }

            // Mark as shared
            productSharedRef.current = productKey;

            // Wait for chat to be set and then send messages
            if (targetChat) {
              // Wait a bit for the chat to be properly set in the useChat hook
              setTimeout(async () => {
                console.log('Sending product image:', productToShare.imgUrl);
                
                // Use a test image URL if the product image is a placeholder
                const imageUrl = productToShare.imgUrl.includes('via.placeholder.com') 
                  ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'
                  : productToShare.imgUrl;
                
                // Send the product image first
                console.log('About to send image message:', {
                  imageUrl: imageUrl,
                  messageType: 'image',
                  chatId: targetChat._id?.toString()
                });
                await sendMessageSocket('', imageUrl, 'image');
                
                // Then send the description
                setTimeout(async () => {
                  await sendMessageSocket(`Hi! I'm interested in this product: ${productToShare.description}`);
                }, 500);
              }, 1500); // Increased delay to ensure chat is properly set
            }

          } catch (error) {
            console.error('Error sharing product:', error);
          }
        };

        handleProductShare();
      }
    }
  }, [productToShare, selectedUser, isOpen, chats, sendMessageSocket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    
    // Stop typing indicator
    stopTyping();
    
    // Send message via socket
    await sendMessageSocket(messageContent);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to cloud storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        // Send image message via socket with URL
        await sendMessageSocket('', uploadData.imageUrl, 'image');
      } else {
        alert('Failed to upload image: ' + uploadData.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Start typing indicator
    startTyping();
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      stopTyping();
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id?.toString() === userId);
    if(user){
      const words = user.name.split(" ");
      return (words[0][0]).toUpperCase();
    }
    return "User";
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u._id?.toString() === userId);
    return user?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
  };

  // Reset product sharing ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      productSharedRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={onClose}
      />
      
      {/* Chat Modal - Similar to Shopee */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[800px] h-[700px] max-w-[110vw] max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Chat</h2>
            {/* User Selection Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Switch User:</span>
              <select
                value={selectedUser?._id?.toString() || ''}
                onChange={(e) => {
                  const user = users.find(u => u._id?.toString() === e.target.value);
                  if (user && onUserChange) {
                    onUserChange(user);
                  }
                }}
                className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id?.toString()} value={user._id?.toString()}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Conversations */}
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-700 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-2">
                <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading conversations...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs text-gray-400 mt-1">Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {chats.map((chat) => {
                    const unreadCount = chat.unreadCount?.[selectedUser?._id?.toString() || ''] || 0;
                    return (
                      <button
                        key={chat._id?.toString()}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                          selectedChat?._id === chat._id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center relative">
                            <span className="text-sm font-medium">
                              {chat.chatName.charAt(0).toUpperCase()}
                            </span>
                            {unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-gray-300">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium truncate">{chat.chatName}</h3>
                              <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                                <span className="text-xs text-gray-500">
                                  {chat.isGroupChat ? "Group" : "Direct"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {chat.users.length} participant{chat.users.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Messages */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {selectedChat.chatName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedChat.chatName}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedChat.isGroupChat ? "Group Chat" : "Direct Message"}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-gray-500">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isCurrentUser = message.sender.toString() === selectedUser?._id?.toString();
                        
                        // Debug logging
                        if (message.messageType === 'image') {
                          console.log('Image message received:', {
                            messageType: message.messageType,
                            imageUrl: message.imageUrl,
                            content: message.content
                          });
                        }
                        
                        return (
                          <div
                            key={message._id?.toString()}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isCurrentUser && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                  <img
                                    src={getUserAvatar(message.sender.toString())}
                                    alt={getUserName((message.sender.toString()))}
                                    className="w-8 h-8 rounded-full"
                                  />
                                </div>
                              )}
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isCurrentUser
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                              >
                                {/* Image message */}
                                {message.messageType === 'image' && (
                                  <div className="mb-2">
                                    <div className="text-xs text-gray-500 mb-1">📷 Product Image:</div>
                                    {message.imageUrl ? (
                                      <img
                                        src={message.imageUrl}
                                        alt="Product image"
                                        className="max-w-[200px] max-h-[200px] rounded-lg object-cover border"
                                        onLoad={() => console.log('Image loaded successfully:', message.imageUrl)}
                                        onError={(e) => {
                                          console.log('Image failed to load:', message.imageUrl);
                                          e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                                        }}
                                      />
                                    ) : (
                                      <div className="max-w-[200px] max-h-[200px] rounded-lg border bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                                        No image URL
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Text content */}
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                
                                {/* Timestamp */}
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(message.createdAt || '').toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing Indicators */}
                      {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="flex gap-2 max-w-[70%]">
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-gray-400 animate-pulse" />
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-700">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-800">
                  <div className="flex gap-2">
                    {/* Image Upload Button */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={!isConnected || isUploading}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={!isConnected || isUploading}
                        className="h-10 w-10"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Input
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                      disabled={!isConnected}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon"
                      disabled={!isConnected || !newMessage.trim()}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-2">
                      Connecting to server...
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">Welcome to Chat</h3>
                  <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
                  {selectedUser && (
                    <p className="text-xs text-blue-500 mt-2">
                      Logged in as: {selectedUser.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
