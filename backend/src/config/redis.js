const Redis = require('ioredis');

// Comment out Redis client initialization
// const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
//   retryStrategy: (times) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
//   maxRetriesPerRequest: 3
// });

// Comment out event listeners
// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redisClient.on('error', (err) => {
//   console.error('Redis connection error:', err);
// });

// Comment out Redis publishing function
// const publishToChannel = async (channel, message) => {
//   try {
//     await redisClient.publish(channel, JSON.stringify(message));
//     console.log(`Published message to channel ${channel}:`, message);
//   } catch (error) {
//     console.error(`Error publishing to channel ${channel}:`, error);
//     throw error;
//   }
// };

// Comment out Redis subscriber and publisher creation
// const subscriber = redisClient.duplicate();
// const publisher = redisClient.duplicate();

// Comment out subscribe function
// const subscribeToChannel = async (channel, callback) => {
//   try {
//     await subscriber.subscribe(channel, (message) => {
//       callback(JSON.parse(message));
//     });
//   } catch (error) {
//     console.error('Redis subscribe error:', error);
//   }
// };

// Export an empty object or null if no Redis functionality is needed
module.exports = {}; // Export an empty object 