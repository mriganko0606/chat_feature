const { createServer } = require('http');
const { Server } = require('socket.io');

// Get port from environment variable or default to 3003
const port = process.env.PORT || 3003;
const nextjsAppUrl = process.env.NEXTJS_APP_URL || 'http://localhost:3000';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create HTTP server for Socket.io only
const httpServer = createServer();

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Send message to a chat
  socket.on('send-message', async (data) => {
    try {
      console.log('Received message data:', {
        messageType: data.messageType,
        hasImageUrl: !!data.imageUrl,
        imageUrl: data.imageUrl,
        content: data.content,
        replyTo: data.replyTo,
        fullData: data
      });

      // Save message to database via Next.js API
      const response = await fetch(`${nextjsAppUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: data.sender,
          content: data.content,
          chat: data.chatId,
          readBy: data.readBy,
          imageUrl: data.imageUrl,
          messageType: data.messageType || 'text',
          replyTo: data.replyTo
        })
      });

      if (response.ok) {
        const messageData = await response.json();
        
        // Broadcast message to all users in the chat room
        io.to(data.chatId).emit('new-message', messageData.message);
        console.log(`Message sent to chat ${data.chatId}:`, data.content);
      } else {
        console.error('Failed to save message:', response.status, response.statusText);
        socket.emit('message-error', { error: 'Failed to save message' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.chatId).emit('user-typing', { userId: data.userId });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.chatId).emit('user-stopped-typing', { userId: data.userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start Socket.io server
httpServer.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Socket.io server running on port ${port}`);
  console.log(`> Next.js app URL: ${nextjsAppUrl}`);
  console.log(`> CORS origin: ${corsOrigin}`);
});