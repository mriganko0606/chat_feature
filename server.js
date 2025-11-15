const { createServer } = require('http');
const { Server } = require('socket.io');

// Get port from environment variable or default to 3003
const port = process.env.PORT || 3003;
const nextjsAppUrl = process.env.NEXTJS_APP_URL || 'http://localhost:3002';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3002';

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

        // Check if this is an AI bot chat and trigger AI response
        if (data.messageType === 'text' && data.content && data.content.trim()) {
          // Get chat details to check if it's an AI bot chat
          const chatResponse = await fetch(`${nextjsAppUrl}/api/chats/${data.chatId}`);
          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            const chat = chatData.chat;
            
            // Check if chat name contains "AI Bot" or "AI" to identify AI bot chats
            const isAIBotChat = chat && (
              chat.chatName.toLowerCase().includes('ai bot') || 
              chat.chatName.toLowerCase().includes('ai')
            );

            if (isAIBotChat && chat.users && chat.users.length === 2) {
              // Find the AI bot user ID (the one that's not the sender)
              const aiBotUserId = chat.users.find((userId) => {
                const userIdStr = typeof userId === 'string' ? userId : userId.toString();
                return userIdStr !== data.sender;
              });

              if (aiBotUserId) {
                // Emit typing indicator for AI
                io.to(data.chatId).emit('ai-typing');

                // Get conversation history
                const historyResponse = await fetch(`${nextjsAppUrl}/api/chats/${data.chatId}/messages`);
                let conversationHistory = [];
                
                if (historyResponse.ok) {
                  const historyData = await historyResponse.json();
                  if (historyData.success && historyData.messages) {
                    const aiBotIdStr = typeof aiBotUserId === 'string' ? aiBotUserId : aiBotUserId.toString();
                    conversationHistory = historyData.messages
                      .slice(-10) // Last 10 messages for context
                      .map(msg => {
                        const msgSenderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?.toString() || '';
                        return {
                          sender: msgSenderId === data.sender ? 'user' : 'ai',
                          content: msg.content || '',
                        };
                      });
                  }
                }

                // Call AI API to get response
                const aiResponse = await fetch(`${nextjsAppUrl}/api/ai/chat`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: data.content.trim(),
                    conversationHistory,
                  })
                });

                // Stop typing indicator
                io.to(data.chatId).emit('ai-stop-typing');

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  
                  if (aiData.success && aiData.response) {
                    // Save AI response to database
                    const aiMessageResponse = await fetch(`${nextjsAppUrl}/api/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        sender: typeof aiBotUserId === 'string' ? aiBotUserId : aiBotUserId.toString(),
                        content: aiData.response,
                        chat: data.chatId,
                        readBy: [data.sender],
                        messageType: 'text',
                      })
                    });

                    if (aiMessageResponse.ok) {
                      const aiMessageData = await aiMessageResponse.json();
                      // Broadcast AI response to chat room
                      io.to(data.chatId).emit('new-message', aiMessageData.message);
                      console.log(`AI response sent to chat ${data.chatId}`);
                    }
                  }
                } else {
                  console.error('Failed to get AI response:', aiResponse.status);
                }
              }
            }
          }
        }
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