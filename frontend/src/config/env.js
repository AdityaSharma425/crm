const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  environment: process.env.REACT_APP_ENV || 'development',
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      google: '/api/auth/google',
      logout: '/api/auth/logout'
    },
    customers: '/api/customers',
    campaigns: '/api/campaigns',
    segments: '/api/segments',
    dashboard: '/api/dashboard'
  },

  // Feature flags
  features: {
    enableGoogleAuth: true,
    enableEmailNotifications: true,
    enableSMSNotifications: true
  }
};

// Validate required environment variables
const requiredEnvVars = ['REACT_APP_API_URL', 'REACT_APP_GOOGLE_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

export default config; 