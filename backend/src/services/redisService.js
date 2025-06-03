const Redis = require('ioredis');

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Publish message to a channel
const publishToChannel = async (channel, message) => {
  try {
    await redis.publish(channel, JSON.stringify(message));
    console.log(`Published to ${channel}:`, message);
  } catch (error) {
    console.error('Error publishing to Redis:', error);
    throw error;
  }
};

// Subscribe to a channel
const subscribeToChannel = (channel, callback) => {
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
      return;
    }
    console.log(`Subscribed to ${channel}`);
  });

  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  });

  return subscriber;
};

module.exports = {
  redis,
  publishToChannel,
  subscribeToChannel
}; 