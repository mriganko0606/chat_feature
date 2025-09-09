# Socket.IO Server Deployment on Render

## Files Created for Server Deployment

1. **`server-package.json`** - Separate package.json for the Socket.IO server
2. **`server.js`** - Updated server file with environment variables
3. **`render.yaml`** - Render configuration file
4. **`server.env.example`** - Environment variables template

## Deployment Steps

### Step 1: Deploy Socket.IO Server

1. **Create a new repository** for just the server files:
   ```bash
   # Create a new directory for server
   mkdir chat-socket-server
   cd chat-socket-server
   
   # Copy server files
   cp ../server-package.json ./package.json
   cp ../server.js ./
   cp ../render.yaml ./
   ```

2. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial Socket.IO server setup"
   git branch -M main
   git remote add origin https://github.com/yourusername/chat-socket-server.git
   git push -u origin main
   ```

3. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `chat-socket-server` repository
   - Use these settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

### Step 2: Set Environment Variables

In your Render dashboard, go to your Socket.IO service and add these environment variables:

```
NODE_ENV=production
NEXTJS_APP_URL=https://your-nextjs-app.onrender.com
CORS_ORIGIN=https://your-nextjs-app.onrender.com
```

**Important**: Replace `your-nextjs-app.onrender.com` with your actual Next.js app URL after you deploy it.

### Step 3: Update Your Next.js App

After deploying the Socket.IO server, you'll need to update your Next.js app to connect to the deployed server instead of localhost.

In your Next.js app, update the socket connection URL:

```typescript
// In your socket context or wherever you initialize the socket
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003');
```

Add this environment variable to your Next.js app on Render:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

## Environment Variables Explained

### For Socket.IO Server:
- **`PORT`**: Render sets this automatically (usually 10000)
- **`NEXTJS_APP_URL`**: URL of your deployed Next.js app
- **`CORS_ORIGIN`**: Allowed origin for CORS (should match your Next.js app URL)
- **`NODE_ENV`**: Set to 'production'

### For Next.js App:
- **`NEXT_PUBLIC_SOCKET_URL`**: URL of your deployed Socket.IO server

## Cost Considerations

- **Free Plan**: Both services can run on Render's free plan
- **Limitations**: Free plan has sleep mode (services wake up when accessed)
- **Upgrade**: Consider paid plans for production use

## Testing

1. Deploy Socket.IO server first
2. Note the server URL from Render dashboard
3. Deploy Next.js app with the Socket.IO server URL
4. Test real-time chat functionality

## Troubleshooting

- Check Render logs for both services
- Ensure CORS settings match your app URLs
- Verify environment variables are set correctly
- Test socket connection in browser dev tools
