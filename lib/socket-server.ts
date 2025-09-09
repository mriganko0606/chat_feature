// import { Server as NetServer } from "http";
// import { Server as ServerIO } from "socket.io";

// let io: ServerIO | null = null;

// export const initializeSocket = (httpServer: NetServer) => {
//   if (!io) {
//     io = new ServerIO(httpServer, {
//       path: "/api/socketio",
//       addTrailingSlash: false,
//       cors: {
//         origin: "*",
//         methods: ["GET", "POST"],
//       },
//     });

//     io.on("connection", (socket) => {
//       console.log("New client connected:", socket.id);

//       // Join a chat room
//       socket.on("join-chat", (chatId: string) => {
//         socket.join(chatId);
//         console.log(`User ${socket.id} joined chat ${chatId}`);
//       });

//       // Leave a chat room
//       socket.on("leave-chat", (chatId: string) => {
//         socket.leave(chatId);
//         console.log(`User ${socket.id} left chat ${chatId}`);
//       });

//       // Send message to a chat
//       socket.on("send-message", async (data: {
//         chatId: string;
//         sender: string;
//         content: string;
//         readBy: string[];
//       }) => {
//         try {
//           // Save message to database
//           const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               sender: data.sender,
//               content: data.content,
//               chat: data.chatId,
//               readBy: data.readBy
//             })
//           });

//           if (response.ok) {
//             const messageData = await response.json();
            
//             // Broadcast message to all users in the chat room
//             io?.to(data.chatId).emit("new-message", messageData.message);
//             console.log(`Message sent to chat ${data.chatId}:`, data.content);
//           }
//         } catch (error) {
//           console.error("Error sending message:", error);
//           socket.emit("message-error", { error: "Failed to send message" });
//         }
//       });

//       // Handle typing indicators
//       socket.on("typing-start", (data: { chatId: string; userId: string }) => {
//         socket.to(data.chatId).emit("user-typing", { userId: data.userId });
//       });

//       socket.on("typing-stop", (data: { chatId: string; userId: string }) => {
//         socket.to(data.chatId).emit("user-stopped-typing", { userId: data.userId });
//       });

//       // Handle disconnect
//       socket.on("disconnect", () => {
//         console.log("Client disconnected:", socket.id);
//       });
//     });
//   }
//   return io;
// };

// export const getSocket = () => io;
