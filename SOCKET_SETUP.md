# Socket.io Real-time Messaging Setup

## 🚀 How to Run with Socket.io

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Socket.io Server
```bash
npm run dev:socket
```

This will start both the Next.js app and Socket.io server on port 3002.

### 3. Open the App
Visit `http://localhost:3002` in your browser.

## 🔧 Features

### Real-time Messaging
- ✅ **Instant message delivery** - Messages appear immediately for all users
- ✅ **Typing indicators** - See when someone is typing
- ✅ **Auto-reconnection** - Automatically reconnects if connection is lost
- ✅ **Connection status** - Shows if you're connected to the server

### How It Works

1. **User sends message** → Socket emits `send-message` event
2. **Server receives message** → Saves to MongoDB database
3. **Server broadcasts** → Sends `new-message` event to all users in chat room
4. **All users receive** → Message appears instantly in their chat

### Socket Events

#### Client → Server
- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room
- `send-message` - Send a message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

#### Server → Client
- `new-message` - New message received
- `user-typing` - Someone is typing
- `user-stopped-typing` - Someone stopped typing
- `message-error` - Error sending message

## 🐛 Troubleshooting

### Connection Issues
- Make sure the Socket.io server is running (`npm run dev:socket`)
- Check browser console for connection errors
- Verify port 3002 is not blocked by firewall

### Messages Not Appearing
- Check if MongoDB is connected
- Verify the message was saved to database
- Check server console for errors

## 📱 Testing Real-time Features

1. Open the app in two different browser tabs/windows
2. Select the same chat in both tabs
3. Send a message from one tab
4. Watch it appear instantly in the other tab
5. Type in one tab to see typing indicators in the other

## 🔄 Fallback to HTTP

If Socket.io is not working, the app will fall back to HTTP-based messaging:
- Messages are sent via API calls
- No real-time updates
- Manual refresh required to see new messages

## 🚀 Production Deployment

For production, you'll need to:
1. Set up a proper Socket.io server
2. Configure environment variables
3. Set up load balancing for multiple server instances
4. Use Redis for Socket.io scaling
