# Next.js App Deployment on Render

## Prerequisites
- Socket.IO server already deployed on Render
- MongoDB database (MongoDB Atlas recommended)
- GitHub repository for the Next.js app

## Step 1: Prepare for Deployment

### Files Created:
- `render.yaml` - Render configuration
- `env.example` - Environment variables template

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
NODE_ENV=production
PORT=10000
```

## Step 2: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Prepare for Render deployment"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub.com
   - Create new repository: `messageapp-nextjs`
   - Make it **Public** (required for free Render plan)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/mriganko0606/messageapp-nextjs.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy on Render

1. **Go to [render.com](https://render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository**: `mriganko0606/messageapp-nextjs`
4. **Configure service**:
   - **Name**: `messageapp-nextjs`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

## Step 4: Set Environment Variables

In Render dashboard, add these environment variables:

### Required Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
NODE_ENV=production
```

### MongoDB Setup:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Get connection string
4. Replace `<username>`, `<password>`, and `<database_name>` in the URI

## Step 5: Update Socket.IO Server

After deploying Next.js app, update your Socket.IO server environment variables:

1. Go to your Socket.IO server on Render
2. Update environment variables:
   ```
   NEXTJS_APP_URL=https://your-nextjs-app.onrender.com
   CORS_ORIGIN=https://your-nextjs-app.onrender.com
   ```

## Step 6: Test Your Application

1. Visit your Next.js app URL
2. Test chat functionality
3. Check browser console for any errors
4. Verify Socket.IO connection

## Troubleshooting

### Common Issues:
1. **Socket connection fails**: Check `NEXT_PUBLIC_SOCKET_URL` is correct
2. **Database connection fails**: Verify `MONGODB_URI` is correct
3. **CORS errors**: Ensure Socket.IO server has correct `CORS_ORIGIN`
4. **Build fails**: Check all dependencies are in `package.json`

### Checking Logs:
- Next.js app logs: Render dashboard → Your service → Logs
- Socket.IO server logs: Render dashboard → Socket server → Logs

## Cost
- Both services can run on Render's free plan
- Free plan limitations: Services sleep after 15 minutes of inactivity
- Consider paid plans for production use
