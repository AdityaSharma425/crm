const Redis = require('redis');

// Create Redis client with proper configuration
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection lost. Max retries reached.');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    },
    tls: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false // Required for Redis Cloud
    } : undefined
  }
});

// Connect to Redis
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error; // Throw error to handle it in the server initialization
  }
};

// Publish message to a channel
const publishToChannel = async (channel, message) => {
  try {
    if (!redisClient.isOpen) {
      console.log('Redis client not connected, attempting to reconnect...');
      await connectRedis();
    }
    await redisClient.publish(channel, JSON.stringify(message));
    console.log(`Published message to channel ${channel}:`, message);
  } catch (error) {
    console.error(`Error publishing to channel ${channel}:`, error);
    throw error;
  }
};

// Handle Redis errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Create Redis subscriber
const subscriber = redisClient.duplicate();
subscriber.connect().catch(console.error);

// Create Redis publisher
const publisher = redisClient.duplicate();
publisher.connect().catch(console.error);

// Subscribe to channels
const subscribeToChannel = async (channel, callback) => {
  try {
    await subscriber.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
  } catch (error) {
    console.error('Redis subscribe error:', error);
  }
};

module.exports = {
  redisClient,
  subscriber,
  publisher,
  connectRedis,
  publishToChannel,
  subscribeToChannel
}; 