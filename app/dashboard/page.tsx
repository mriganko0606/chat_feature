// "use client"

// import { AppSidebar } from "@/components/app-sidebar"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
// import { Separator } from "@/components/ui/separator"
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar"
// import { useState, useEffect } from "react"
// import { Message, User } from "@/lib/models"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send } from "lucide-react"
// import { useChat } from "@/hooks/use-chat"
// import { useSearchParams } from "next/navigation"

// export default function Page() {
//   const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
//   const [newMessage, setNewMessage] = useState("")
//   const [users, setUsers] = useState<User[]>([])
//   const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
//   const [currentUser, setCurrentUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)
  
//   const searchParams = useSearchParams()
//   const userId = searchParams.get('userId')

//   // Fetch current user based on URL parameter
//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       if (!userId) return;
      
//       try {
//         const response = await fetch('/api/users');
//         const data = await response.json();
//         if (data.success) {
//           const user = data.users.find((u: User) => u._id?.toString() === userId);
//           setCurrentUser(user || null);
//         }
//       } catch (error) {
//         console.error('Error fetching current user:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCurrentUser();
//   }, [userId]);

//   // Use the chat hook for real-time functionality
//   const {
//     messages,
//     loading: messagesLoading,
//     typingUsers,
//     isConnected,
//     fetchMessages,
//     sendMessage: sendMessageSocket,
//     startTyping,
//     stopTyping,
//   } = useChat({
//     chatId: selectedChat?._id || null,
//     currentUserId: currentUser?._id?.toString() || "",
//   })

//   // Fetch users for display names
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await fetch('/api/users')
//         const data = await response.json()
//         if (data.success) {
//           setUsers(data.users)
//         }
//       } catch (error) {
//         console.error('Error fetching users:', error)
//       }
//     }
//     fetchUsers()
//   }, [])

//   // Show loading if user is not loaded yet
//   if (loading || !currentUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Loading user...</p>
//         </div>
//       </div>
//     );
//   }

//   // Messages are now fetched automatically by the useChat hook when chatId changes

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !selectedChat) return

//     const messageContent = newMessage.trim()
//     setNewMessage("")
    
//     // Stop typing indicator
//     stopTyping()
    
//     // Send message via socket
//     await sendMessageSocket(messageContent)
//   }

//   const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setNewMessage(e.target.value)
    
//     // Start typing indicator
//     startTyping()
    
//     // Clear existing timeout
//     if (typingTimeout) {
//       clearTimeout(typingTimeout)
//     }
    
//     // Set new timeout to stop typing indicator
//     const timeout = setTimeout(() => {
//       stopTyping()
//     }, 1000)
    
//     setTypingTimeout(timeout)
//   }

//   const getUserName = (userId: string) => {
//     const user = users.find(u => u._id?.toString() === userId)
//     return user?.name || "Unknown User"
//   }

//   const getUserAvatar = (userId: string) => {
//     const user = users.find(u => u._id?.toString() === userId)
//     return user?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
//   }

//   return (
//     <SidebarProvider
//       style={
//         {
//           "--sidebar-width": "350px",
//         } as React.CSSProperties
//       }
//     >
//       <AppSidebar onChatSelect={setSelectedChat} currentUser={currentUser} />
//       <SidebarInset>
//         <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
//           <SidebarTrigger className="-ml-1" />
//           <Separator
//             orientation="vertical"
//             className="mr-2 data-[orientation=vertical]:h-4"
//           />
//           <Breadcrumb>
//             <BreadcrumbList>
//               <BreadcrumbItem className="hidden md:block">
//                 <BreadcrumbLink href="#">All Chats</BreadcrumbLink>
//               </BreadcrumbItem>
//               <BreadcrumbSeparator className="hidden md:block" />
//               <BreadcrumbItem>
//                 <BreadcrumbPage>{selectedChat?.chatName || "Select a Chat"}</BreadcrumbPage>
//               </BreadcrumbItem>
//             </BreadcrumbList>
//           </Breadcrumb>
//           <div className="ml-auto flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <img
//                 src={currentUser.pic}
//                 alt={currentUser.name}
//                 className="w-6 h-6 rounded-full"
//               />
//               <span className="text-sm font-medium">{currentUser.name}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
//               <span className="text-xs text-muted-foreground">
//                 {isConnected ? 'Connected' : 'Disconnected'}
//               </span>
//             </div>
//           </div>
//         </header>
        
//         {selectedChat ? (
//           <div className="flex flex-1 flex-col h-[calc(100vh-80px)]">
//             {/* Chat Header */}
//             <div className="border-b p-4 bg-muted/30">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                   <span className="text-sm font-medium">
//                     {selectedChat.chatName.charAt(0).toUpperCase()}
//                   </span>
//                 </div>
//                 <div>
//                   <h3 className="font-medium">{selectedChat.chatName}</h3>
//                   <p className="text-sm text-muted-foreground">
//                     {selectedChat.isGroupChat ? "Group Chat" : "Direct Message"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {messagesLoading ? (
//                 <div className="text-center text-muted-foreground">Loading messages...</div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-muted-foreground">No messages yet. Start the conversation!</div>
//               ) : (
//                 <>
//                   {messages.map((message) => {
//                     const isCurrentUser = message.sender.toString() === currentUser._id?.toString()
//                     return (
//                       <div
//                         key={message._id?.toString()}
//                         className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
//                       >
//                         <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
//                           {!isCurrentUser && (
//                             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
//                               <img
//                                 src={getUserAvatar(message.sender.toString())}
//                                 alt={getUserName(message.sender.toString())}
//                                 className="w-8 h-8 rounded-full"
//                               />
//                             </div>
//                           )}
//                           <div
//                             className={`px-4 py-2 rounded-2xl ${
//                               isCurrentUser
//                                 ? 'bg-primary text-primary-foreground'
//                                 : 'bg-muted'
//                             }`}
//                           >
//                             <p className="text-sm">{message.content}</p>
//                             <p className="text-xs opacity-70 mt-1">
//                               {new Date(message.createdAt || '').toLocaleTimeString([], {
//                                 hour: '2-digit',
//                                 minute: '2-digit'
//                               })}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })}
                  
//                   {/* Typing Indicators */}
//                   {typingUsers.length > 0 && (
//                     <div className="flex justify-start">
//                       <div className="flex gap-2 max-w-[70%]">
//                         <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
//                           <div className="w-6 h-6 rounded-full bg-muted-foreground/20 animate-pulse" />
//                         </div>
//                         <div className="px-4 py-2 rounded-2xl bg-muted">
//                           <div className="flex space-x-1">
//                             <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
//                             <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
//                             <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             {/* Message Input */}
//             <div className="border-t p-4">
//               <div className="flex gap-2">
//                 <Input
//                   value={newMessage}
//                   onChange={handleTyping}
//                   placeholder="Type a message..."
//                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                   className="flex-1"
//                   disabled={!isConnected}
//                 />
//                 <Button 
//                   onClick={handleSendMessage} 
//                   size="icon"
//                   disabled={!isConnected || !newMessage.trim()}
//                 >
//                   <Send className="h-4 w-4" />
//                 </Button>
//               </div>
//               {!isConnected && (
//                 <p className="text-xs text-muted-foreground mt-2">
//                   Connecting to server...
//                 </p>
//               )}
//             </div>
//           </div>
//         ) : (
//           <div className="flex flex-1 items-center justify-center">
//             <div className="text-center">
//               <h3 className="text-lg font-medium text-muted-foreground">Select a chat to start messaging</h3>
//               <p className="text-sm text-muted-foreground mt-2">
//                 Choose a conversation from the sidebar to view messages
//               </p>
//             </div>
//         </div>
//         )}
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }
