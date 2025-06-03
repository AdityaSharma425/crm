# Complete Deployment Guide for XENO Project

## 1. Environment Variables Setup

### Backend (.env)
```
# Server Configuration
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=your_mongodb_atlas_uri

# Redis
REDIS_URL=your_redis_cloud_url

# Authentication
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url/api/auth/google/callback

# Frontend URL (Vercel)
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email (if using)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Twilio (if using)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Set up OAuth consent screen:
   - User Type: External
   - App name: XENO
   - User support email: your-email
   - Developer contact email: your-email
6. Add authorized domains:
   - your-frontend-url.vercel.app
   - your-backend-url
7. Add authorized redirect URIs:
   - https://your-backend-url/api/auth/google/callback
   - https://your-frontend-url.vercel.app/auth/google/callback

## 3. Redis Cloud Setup

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account
3. Create a new subscription
4. Create a new database:
   - Name: xeno-redis
   - Region: Choose closest to your users
   - Memory: 30MB (free tier)
5. Get connection details:
   - Host
   - Port
   - Password
6. Format Redis URL:
   ```
   redis://default:your_password@your_host:your_port
   ```

## 4. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Set up database access:
   - Create a database user
   - Set password
5. Set up network access:
   - Add IP: 0.0.0.0/0 (allow all)
6. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/xeno?retryWrites=true&w=majority
   ```

## 5. Backend Deployment (Render)

1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: xeno-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add all environment variables from backend .env

## 6. Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Add all environment variables from frontend .env

## 7. CORS Configuration

Update your backend CORS settings in `server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 8. Testing the Deployment

1. Test Google Auth:
   - Try logging in with Google
   - Check if callback URL is working
   - Verify session creation

2. Test Redis:
   - Check if session storage works
   - Verify cache operations
   - Monitor Redis connection

3. Test API Endpoints:
   - Use Postman or similar tool
   - Test all routes
   - Verify authentication

## 9. Common Issues and Solutions

1. CORS Issues:
   - Check if FRONTEND_URL is correct
   - Verify CORS configuration
   - Check if credentials are enabled

2. Google Auth Issues:
   - Verify callback URLs
   - Check if client ID and secret are correct
   - Ensure OAuth consent screen is configured

3. Redis Connection Issues:
   - Verify Redis URL format
   - Check if Redis Cloud is accessible
   - Monitor Redis logs

4. Session Issues:
   - Check session configuration
   - Verify cookie settings
   - Test session storage

## 10. Monitoring

1. Backend (Render):
   - Monitor logs
   - Check resource usage
   - Set up alerts

2. Frontend (Vercel):
   - Use Vercel Analytics
   - Monitor performance
   - Check error logs

3. Database:
   - Monitor MongoDB Atlas
   - Check Redis Cloud metrics
   - Set up alerts

## 11. Security Checklist

- [ ] All environment variables are set
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Session security is set up
- [ ] Rate limiting is working
- [ ] Error handling is in place
- [ ] Logging is configured
- [ ] Security headers are set 