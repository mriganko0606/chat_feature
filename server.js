const { createServer } = require('http');
const { Server } = require('socket.io');

const port = 3003;

// Create HTTP server for Socket.io only
const httpServer = createServer();

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
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
        content: data.content
      });

      // Save message to database via Next.js API (running on port 3002)
      const response = await fetch(`http://localhost:3002/api/messages`, {
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
          messageType: data.messageType || 'text'
        })
      });

      if (response.ok) {
        const messageData = await response.json();
        
        // Broadcast message to all users in the chat room
        io.to(data.chatId).emit('new-message', messageData.message);
        console.log(`Message sent to chat ${data.chatId}:`, data.content);
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
  console.log(`> Next.js app should be running on port 3002`);
});
