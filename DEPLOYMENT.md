# XENO Project Deployment Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Redis Cloud account
- Vercel account (for frontend)
- Render account (for backend)

## Backend Deployment (Render)

1. **Prepare Environment Variables**
   Create a `.env` file in the backend directory with the following variables:
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=your_mongodb_atlas_uri
   REDIS_URL=your_redis_cloud_url
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   FRONTEND_URL=your_frontend_url
   ```

2. **Deploy to Render**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set the following:
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Environment Variables: Add all variables from your `.env` file

3. **Verify Deployment**
   - Check the deployment logs
   - Test the API endpoints
   - Monitor the application logs

## Frontend Deployment (Vercel)

1. **Prepare Environment Variables**
   Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=your_backend_url
   ```

2. **Deploy to Vercel**
   - Push your code to GitHub
   - Import your repository in Vercel
   - Configure the following:
     - Framework Preset: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Environment Variables: Add all variables from your `.env` file

3. **Verify Deployment**
   - Check the deployment logs
   - Test the application
   - Monitor performance

## Post-Deployment Checklist

1. **Backend**
   - [ ] All environment variables are set
   - [ ] MongoDB connection is working
   - [ ] Redis connection is working
   - [ ] API endpoints are accessible
   - [ ] CORS is properly configured
   - [ ] Rate limiting is working
   - [ ] Error handling is working

2. **Frontend**
   - [ ] Environment variables are set
   - [ ] API calls are working
   - [ ] Authentication is working
   - [ ] All features are functional
   - [ ] Performance is optimal

## Monitoring and Maintenance

1. **Backend Monitoring**
   - Use Render's built-in monitoring
   - Set up error tracking
   - Monitor API performance
   - Check Redis and MongoDB connections

2. **Frontend Monitoring**
   - Use Vercel Analytics
   - Monitor page load times
   - Track user interactions
   - Check for console errors

## Troubleshooting

1. **Common Issues**
   - CORS errors: Check CORS configuration
   - Database connection issues: Verify connection strings
   - Authentication problems: Check JWT configuration
   - Performance issues: Monitor resource usage

2. **Support Resources**
   - Render Documentation
   - Vercel Documentation
   - MongoDB Atlas Documentation
   - Redis Cloud Documentation 