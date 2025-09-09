# Next.js App Deployment on Vercel

## Why Vercel for Next.js?
- **Optimized for Next.js**: Built by the creators of Next.js
- **Automatic deployments**: Deploys on every push to main branch
- **Edge functions**: Better performance globally
- **Free tier**: Generous free plan with no sleep mode
- **Easy setup**: One-click deployment from GitHub

## Prerequisites
- Socket.IO server already deployed on Render
- MongoDB database (MongoDB Atlas recommended)
- GitHub repository with your code

## Step 1: Prepare Your Code

### Files Created:
- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to ignore during deployment

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

## Step 2: Deploy on Vercel

### Method 1: Vercel CLI (Recommended)
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   cd messageapp
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? **No**
   - Project name: `messageapp-nextjs`
   - Directory: `./` (current directory)
   - Override settings? **No**

### Method 2: Vercel Dashboard (Alternative)
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your repository**: `mriganko0606/chat_feature`
5. **Configure project**:
   - Framework Preset: **Next.js**
   - Root Directory: `messageapp` (if your code is in a subfolder)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. **Click "Deploy"**

## Step 3: Set Environment Variables

In Vercel dashboard:
1. Go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

### Required Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

### MongoDB Setup:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Get connection string
4. Replace `<username>`, `<password>`, and `<database_name>` in the URI

## Step 4: Update Socket.IO Server

After deploying on Vercel, update your Socket.IO server:

1. **Get your Vercel URL**: `https://your-app-name.vercel.app`
2. **Go to your Socket.IO server on Render**
3. **Update environment variables**:
   ```
   NEXTJS_APP_URL=https://your-app-name.vercel.app
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```
4. **Redeploy the Socket.IO server**

## Step 5: Test Your Application

1. **Visit your Vercel URL**
2. **Test chat functionality**
3. **Check browser console for errors**
4. **Verify Socket.IO connection**

## Advantages of Vercel

### Performance:
- **Edge Network**: Global CDN for faster loading
- **Automatic Optimization**: Images, fonts, and code splitting
- **Serverless Functions**: API routes run as serverless functions

### Developer Experience:
- **Preview Deployments**: Every PR gets a preview URL
- **Automatic HTTPS**: SSL certificates included
- **Custom Domains**: Easy to add your own domain
- **Analytics**: Built-in performance monitoring

### Free Tier Limits:
- **100GB bandwidth/month**
- **100 serverless function executions/day**
- **Unlimited static deployments**
- **No sleep mode** (unlike Render)

## Troubleshooting

### Common Issues:
1. **Socket connection fails**: Check `NEXT_PUBLIC_SOCKET_URL` is correct
2. **Database connection fails**: Verify `MONGODB_URI` is correct
3. **CORS errors**: Ensure Socket.IO server has correct `CORS_ORIGIN`
4. **Build fails**: Check all dependencies are in `package.json`

### Checking Logs:
- **Vercel logs**: Dashboard → Functions → View Function Logs
- **Socket.IO logs**: Render dashboard → Socket server → Logs

## Cost Comparison

| Feature | Vercel Free | Render Free |
|---------|-------------|-------------|
| Sleep Mode | ❌ No | ✅ Yes (15 min) |
| Bandwidth | 100GB/month | Unlimited |
| Build Time | 45 min/month | 750 hours/month |
| Functions | 100/day | Unlimited |
| Custom Domain | ✅ Yes | ✅ Yes |

## Next Steps After Deployment

1. **Set up custom domain** (optional)
2. **Configure analytics** in Vercel dashboard
3. **Set up monitoring** for production use
4. **Configure automatic deployments** from GitHub
