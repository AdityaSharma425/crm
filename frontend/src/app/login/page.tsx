'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { authAPI } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          router.push('/dashboard');
        } else {
          // Handle cases where /api/auth/me returns not ok (e.g., 401)
          // Depending on backend, might need to clear local storage/cookies
        }
      } catch (error) {
        // User is not logged in, stay on login page
        // console.error('Auth check failed:', error);
      }
    };

    // Basic check on mount - consider more robust methods for production
    checkAuth();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // Use the authAPI function to redirect to the backend's Google auth URL
      authAPI.googleLogin();
      // Note: The line below will not be reached as window.location.href changes the page
      // setIsLoading(false);
    } catch (error) {
      toast.error('Failed to initiate Google login');
      console.error('Google login initiation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 