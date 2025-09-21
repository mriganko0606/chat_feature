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
import { X, Send, Image as ImageIcon, Paperclip, Reply, X as XIcon } from "lucide-react";
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
  onProductShared?: () => void; // Callback when product is shared
}

export function DashboardModal({ isOpen, onClose, selectedUser, productToShare, onProductShared }: DashboardModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(selectedUser);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const productSharedRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    currentUserId: currentUser?._id?.toString() || "",
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
        if (currentUser) {
          const chatsResponse = await fetch(`/api/chats/unread?userId=${currentUser._id}`);
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

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Sync with selectedUser prop when modal opens
  useEffect(() => {
    if (isOpen && selectedUser) {
      setCurrentUser(selectedUser);
    }
  }, [isOpen, selectedUser]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat && currentUser) {
      const markAsRead = async () => {
        try {
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: selectedChat._id?.toString(),
              userId: currentUser._id?.toString(),
            }),
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markAsRead();
    }
  }, [selectedChat, currentUser]);

  // Handle product sharing - create chat with owner and send product info
  useEffect(() => {
    if (productToShare && currentUser && isOpen) {
      shareProduct(productToShare);
    }
  }, [productToShare, currentUser, isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    
    // Stop typing indicator
    stopTyping();
    
    // Debug logging
    console.log('Sending message with reply:', {
      content: messageContent,
      replyingTo: replyingTo?._id?.toString(),
      replyingToContent: replyingTo?.content
    });
    
    // Send message via socket with reply info
    await sendMessageSocket(messageContent, '', 'text', replyingTo?._id?.toString());
    
    // Clear reply after sending
    setReplyingTo(null);
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
        await sendMessageSocket('', uploadData.imageUrl, 'image', replyingTo?._id?.toString());
        // Clear reply after sending
        setReplyingTo(null);
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

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
    
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

  const getOtherUserName = (chat: Chat) => {
    if (!currentUser || chat.isGroupChat) {
      return chat.chatName;
    }
    
    // For direct messages, find the other user
    const otherUserId = chat.users.find(userId => userId.toString() !== currentUser._id?.toString());
    if (otherUserId) {
      const otherUser = users.find(u => u._id?.toString() === otherUserId.toString());
      return otherUser?.name || chat.chatName;
    }
    
    return chat.chatName;
  };

  const getOtherUserAvatar = (chat: Chat) => {
    if (!currentUser || chat.isGroupChat) {
      return "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
    }
    
    // For direct messages, find the other user
    const otherUserId = chat.users.find(userId => userId.toString() !== currentUser._id?.toString());
    if (otherUserId) {
      const otherUser = users.find(u => u._id?.toString() === otherUserId.toString());
      return otherUser?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
    }
    
    return "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getRepliedMessage = (message: Message) => {
    if (!message.replyTo) return null;
    return messages.find(m => m._id?.toString() === message.replyTo?.toString());
  };

  // Filter and search chats
  const getFilteredChats = () => {
    let filteredChats = chats;

    // Apply search filter
    if (searchQuery.trim()) {
      filteredChats = filteredChats.filter(chat => {
        const chatName = getOtherUserName(chat).toLowerCase();
        return chatName.includes(searchQuery.toLowerCase());
      });
    }

    // Apply filter type
    if (filterType !== "all" && currentUser) {
      const currentUserId = currentUser._id?.toString() || '';
      filteredChats = filteredChats.filter(chat => {
        const unreadCount = chat.unreadCount?.[currentUserId] || 0;
        if (filterType === "unread") {
          return unreadCount > 0;
        } else if (filterType === "read") {
          return unreadCount === 0;
        }
        return true;
      });
    }

    return filteredChats;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  // Function to share a product and create/switch to chat
  const shareProduct = async (product: Product) => {
    if (!currentUser) return;

    try {
      // Find existing chat with the product owner
      const existingChat = chats.find(chat => 
        chat.users.length === 2 && 
        chat.users.some(userId => userId.toString() === currentUser._id?.toString()) &&
        chat.users.some(userId => userId.toString() === product.owner.toString())
      );

      let targetChat = existingChat;
      
      if (existingChat) {
        // Use existing chat - just select it
        setSelectedChat(existingChat);
        console.log('Switching to existing chat with product owner');
      } else {
        // Create new chat with product owner
        console.log('Creating new chat with product owner');
        
        // Get owner name for better chat naming
        const ownerUser = users.find(u => u._id?.toString() === product.owner.toString());
        const ownerName = ownerUser?.name || 'Product Owner';
        
        const chatResponse = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatName: `Chat with ${ownerName}`,
            isGroupChat: false,
            users: [currentUser._id, product.owner],
          }),
        });

            if (chatResponse.ok) {
              const chatData = await chatResponse.json();
              targetChat = chatData.chat;
              if (targetChat) {
                // Add the new chat to the chats list immediately
                setChats(prevChats => [...prevChats, targetChat!]);
                setSelectedChat(targetChat);
                console.log('New chat created and added to sidebar');
              }
            }
      }

      // Send product info
      if (targetChat) {
        // Wait for chat to be set and then send messages
        setTimeout(async () => {
          console.log('Sending product image:', product.imgUrl);
          
          // Use a test image URL if the product image is a placeholder
          const imageUrl = product.imgUrl.includes('via.placeholder.com') 
            ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'
            : product.imgUrl;
          
          // Send the product image first
          await sendMessageSocket('', imageUrl, 'image');
          
          // Then send the description
          setTimeout(async () => {
            await sendMessageSocket(`Hi! I'm interested in this product: ${product.description}`);
            // Call the callback when product is successfully shared
            if (onProductShared) {
              onProductShared();
            }
          }, 500);
        }, 1000);
      }

    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || filterType !== "all";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset product sharing ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      productSharedRef.current = null;
    }
  }, [isOpen]);

  // Check screen size and adjust layout
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      const tablet = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Auto-hide sidebar on mobile
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={onClose}
      />
      
      {/* Chat Modal - Responsive */}
      <div className={`relative bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-800 dark:via-slate-800 dark:to-blue-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 ${
        isMobile 
          ? 'w-full h-full max-w-none max-h-none rounded-none' 
          : 'w-[400px] h-[600px] sm:w-[500px] sm:h-[700px] md:w-[700px] md:h-[700px] lg:w-[800px] lg:h-[700px] xl:w-[900px] xl:h-[750px] max-w-[95vw] max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-gray-700">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Mobile sidebar toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-8 w-8 flex-shrink-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">Chat</h2>
            {/* User Selection Dropdown - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Switch User:</span>
                <select
                  value={currentUser?._id?.toString() || ''}
                  onChange={(e) => {
                    const user = users.find(u => u._id?.toString() === e.target.value);
                    if (user) {
                      setCurrentUser(user);
                      setSelectedChat(null); // Clear selected chat when switching users
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
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile sidebar overlay */}
          {isMobile && isSidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/50 z-5"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Left Sidebar - Conversations */}
          <div className={`${
            isMobile 
              ? `absolute inset-y-0 left-0 z-10 w-64 transform transition-transform duration-300 ease-in-out ${
                  isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'w-64 md:w-60 lg:w-64'
          } border-r border-gray-200 dark:border-gray-600 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-gray-700 flex flex-col`}>
            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600 h-16 sm:h-20 flex items-center">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm sm:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "all" | "unread" | "read")}
                    className="px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[80px] sm:min-w-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 text-xs sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-2 sm:px-3 py-2 sm:py-2.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      title="Clear filters"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Status */}
            {hasActiveFilters && (
              <div className="px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">
                      {searchQuery.trim() && `Search: "${searchQuery}"`}
                      {searchQuery.trim() && filterType !== "all" && " • "}
                      {filterType !== "all" && `Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                    {getFilteredChats().length} result{getFilteredChats().length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">Loading conversations...</div>
              ) : getFilteredChats().length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm">
                    {searchQuery.trim() || filterType !== "all" 
                      ? "No conversations match your search" 
                      : "No conversations found"
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchQuery.trim() || filterType !== "all" 
                      ? "Try adjusting your search or filter" 
                      : "Start a conversation!"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-1 sm:p-2">
                  {getFilteredChats().map((chat) => {
                    const unreadCount = chat.unreadCount?.[currentUser?._id?.toString() || ''] || 0;
                    return (
                      <button
                        key={chat._id?.toString()}
                        onClick={() => {
                          setSelectedChat(chat);
                          if (isMobile) {
                            setIsSidebarOpen(false); // Close sidebar on mobile when chat is selected
                          }
                        }}
                        className={`w-full p-2 sm:p-3 text-left rounded-xl transition-all duration-200 ${
                          selectedChat?._id === chat._id
                            ? 'bg-gray-100 dark:bg-gray-600 text-black dark:text-white shadow-sm border border-gray-200 dark:border-gray-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-600/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center relative overflow-hidden shadow-sm flex-shrink-0">
                            {chat.isGroupChat ? (
                              <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {chat.chatName.charAt(0).toUpperCase()}
                              </span>
                            ) : (
                              <img
                                src={getOtherUserAvatar(chat)}
                                alt={getOtherUserName(chat)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            )}
                            <span className={`text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 ${chat.isGroupChat ? '' : 'hidden'}`}>
                              {chat.chatName.charAt(0).toUpperCase()}
                            </span>
                            {unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-lg border-2 border-white dark:border-gray-800 bg-white dark:bg-purple-500"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`text-xs sm:text-sm font-semibold truncate ${
                                selectedChat?._id === chat._id 
                                  ? 'text-black dark:text-white' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>{getOtherUserName(chat)}</h3>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {unreadCount > 0 && (
                                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                    selectedChat?._id === chat._id 
                                      ? 'bg-white' 
                                      : 'bg-white dark:bg-purple-500'
                                  }`}></div>
                                )}
                                <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                                  selectedChat?._id === chat._id 
                                    ? 'bg-gray-200 dark:bg-gray-500 text-gray-700 dark:text-gray-200' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                  {chat.isGroupChat ? "Group" : "Direct"}
                                </span>
                              </div>
                            </div>
                            <p className={`text-xs truncate ${
                              selectedChat?._id === chat._id 
                                ? 'text-gray-600 dark:text-gray-300' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
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
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 h-16 sm:h-20 flex items-center">
                  <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                    {/* Mobile back button */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="h-8 w-8 flex-shrink-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                    )}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 border-2 border-gray-200 dark:border-gray-600">
                      {selectedChat.isGroupChat ? (
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {selectedChat.chatName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <img
                          src={getOtherUserAvatar(selectedChat)}
                          alt={getOtherUserName(selectedChat)}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      )}
                      <span className={`text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 ${selectedChat.isGroupChat ? '' : 'hidden'}`}>
                        {selectedChat.chatName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{getOtherUserName(selectedChat)}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {selectedChat.isGroupChat ? "Group Chat" : "Direct Message"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} shadow-sm`} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium hidden sm:inline">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-gray-900">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500 text-sm sm:text-base">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm sm:text-base">No messages yet. Start the conversation!</div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isCurrentUser = message.sender.toString() === currentUser?._id?.toString();
                        const repliedMessage = getRepliedMessage(message);
                        
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
                            <div className={`flex gap-2 sm:gap-3 max-w-[280px] sm:max-w-[350px] min-w-[150px] sm:min-w-[200px] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isCurrentUser && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <img
                                    src={getUserAvatar(message.sender.toString())}
                                    alt={getUserName((message.sender.toString()))}
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hidden">
                                    {getUserName(message.sender.toString()).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm border relative group break-words overflow-wrap-anywhere ${
                                  isCurrentUser
                                    ? 'bg-[#FFDDF4] text-gray-800 border-pink-300'
                                    : 'bg-gray-100 dark:bg-gray-200 text-gray-900 dark:text-gray-800 border-gray-200 dark:border-gray-300'
                                }`}
                                style={{ 
                                  maxWidth: '100%',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {/* Reply to message preview */}
                                {repliedMessage && (
                                  <div className={`mb-2 p-2 sm:p-3 rounded-lg border-l-4 min-w-[150px] sm:min-w-[210px] ${
                                    isCurrentUser 
                                      ? 'bg-pink-200/50 border-pink-400' 
                                      : 'bg-gray-200 dark:bg-gray-300 border-gray-400 dark:border-gray-500'
                                  }`}>
                                    <div className="flex items-center gap-1 mb-1 sm:mb-2">
                                      <span className={`text-xs font-medium ${
                                        isCurrentUser ? 'text-gray-700' : 'text-gray-600 dark:text-gray-300'
                                      }`}>
                                        {getUserName(repliedMessage.sender.toString())}
                                      </span>
                                    </div>
                                    
                                    {repliedMessage.messageType === 'image' ? (
                                      <div className="space-y-1 sm:space-y-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs">📷</span>
                                          <span className={`text-xs font-medium ${
                                            isCurrentUser ? 'text-gray-700' : 'text-gray-700 dark:text-gray-200'
                                          }`}>
                                            Photo
                                          </span>
                                        </div>
                                        {repliedMessage.imageUrl && (
                                          <div className="relative">
                                            <img
                                              src={repliedMessage.imageUrl}
                                              alt="Replied image"
                                              className="w-12 h-9 sm:w-16 sm:h-12 rounded object-cover border border-white/20"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className={`text-xs break-words overflow-wrap-anywhere ${
                                        isCurrentUser ? 'text-gray-700' : 'text-gray-700 dark:text-gray-200'
                                      }`} style={{ 
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word'
                                      }}>
                                        {repliedMessage.content}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Image message */}
                                {message.messageType === 'image' && (
                                  <div className="mb-2">
                                    <div className={`text-xs mb-1 sm:mb-2 px-2 py-1 rounded-full inline-block ${
                                      isCurrentUser 
                                        ? 'bg-pink-300/30 text-gray-700' 
                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}>
                                      📷 Product Image
                                    </div>
                                    {message.imageUrl ? (
                                      <div className="relative group">
                                        <img
                                          src={message.imageUrl}
                                          alt="Product image"
                                          className="max-w-[180px] sm:max-w-[220px] max-h-[180px] sm:max-h-[220px] rounded-xl object-cover border-2 border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-200"
                                          onLoad={() => console.log('Image loaded successfully:', message.imageUrl)}
                                          onError={(e) => {
                                            console.log('Image failed to load:', message.imageUrl);
                                            e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-200" />
                                      </div>
                                    ) : (
                                      <div className="max-w-[180px] sm:max-w-[220px] max-h-[180px] sm:max-h-[220px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                        No image URL
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Text content */}
                                {message.content && (
                                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere" style={{ 
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word'
                                  }}>{message.content}</p>
                                )}
                                
                                {/* Timestamp */}
                                <p className={`text-xs mt-1 sm:mt-2 ${
                                  isCurrentUser 
                                    ? 'text-gray-600' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {new Date(message.createdAt || '').toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>

                                {/* Reply button */}
                                <button
                                  onClick={() => handleReplyToMessage(message)}
                                  className={`absolute -right-1 sm:-right-2 -top-1 sm:-top-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                                    isCurrentUser 
                                      ? 'bg-purple-400 hover:bg-purple-300' 
                                      : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                                  }`}
                                >
                                  <Reply className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing Indicators */}
                      {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="flex gap-2 sm:gap-3 max-w-[280px] sm:max-w-[350px] min-w-[150px] sm:min-w-[200px]">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gray-400 animate-pulse" />
                            </div>
                            <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white dark:bg-gray-700 break-words overflow-wrap-anywhere" style={{ 
                              maxWidth: '100%',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}>
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-600 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-slate-800">
                  {/* Reply Preview */}
                  {replyingTo && (
                    <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-200 dark:bg-gray-600 rounded-lg border-l-4 border-gray-400 dark:border-gray-500 min-w-[150px] sm:min-w-[210px]">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Reply className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Replying to {getUserName(replyingTo.sender.toString())}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelReply}
                          className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 hover:text-gray-700"
                        >
                          <XIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      {replyingTo.messageType === 'image' ? (
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm">📷</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                              Photo
                            </span>
                          </div>
                          {replyingTo.imageUrl && (
                            <div className="relative">
                              <img
                                src={replyingTo.imageUrl}
                                alt="Replied image"
                                className="w-12 h-9 sm:w-16 sm:h-12 rounded object-cover border border-gray-300 dark:border-gray-500"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
                          {replyingTo.content}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    {/* Image Upload Button */}
                    <div className="relative flex-shrink-0">
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
                        className="h-12 w-12 rounded-xl border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder={replyingTo ? `Reply to ${getUserName(replyingTo.sender.toString())}...` : "Type a message..."}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[48px] max-h-[120px] px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none overflow-hidden text-base"
                      disabled={!isConnected}
                      rows={1}
                      style={{
                        height: '48px',
                        minHeight: '48px',
                        maxHeight: '120px'
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon"
                      disabled={!isConnected || !newMessage.trim()}
                      className="h-12 w-12 bg-[#FFDDF4] hover:bg-[#FFD1F0] text-gray-800 border border-pink-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-1 sm:mt-2">
                      Connecting to server...
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-gray-900">
                <div className="text-center p-4">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">Welcome to Chat</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Select a conversation to start messaging</p>
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