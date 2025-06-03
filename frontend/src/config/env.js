const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      google: '/api/auth/google',
      googleCallback: '/api/auth/google/callback',
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
const requiredEnvVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables (check Vercel settings):', missingEnvVars.join(', '));
}

// Log the API URL in development
// Note: In Next.js, NODE_ENV is typically determined at build time
if (process.env.NODE_ENV === 'development') {
  console.log('API URL:', config.apiUrl);
}

export default config; 