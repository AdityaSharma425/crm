const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Publish message to a channel
const publishToChannel = async (channel, message) => {
  try {
    await redisClient.publish(channel, JSON.stringify(message));
    console.log(`Published message to channel ${channel}:`, message);
  } catch (error) {
    console.error(`Error publishing to channel ${channel}:`, error);
    throw error;
  }
};

// Create Redis subscriber
const subscriber = redisClient.duplicate();

// Create Redis publisher
const publisher = redisClient.duplicate();

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
  publishToChannel,
  subscribeToChannel
}; 