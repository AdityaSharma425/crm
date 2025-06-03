const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test Redis connection
    await redisClient.set('test', 'Redis is working!');
    const testValue = await redisClient.get('test');
    
    // Check required environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'REDIS_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'FRONTEND_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    res.json({
      status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
      redis: {
        connected: true,
        test: testValue
      },
      environment: {
        node_env: process.env.NODE_ENV,
        missing_variables: missingEnvVars,
        frontend_url: process.env.FRONTEND_URL,
        cookie_domain: process.env.COOKIE_DOMAIN
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      redis: {
        connected: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 