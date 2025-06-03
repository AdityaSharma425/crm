'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  TagIcon,
  MegaphoneIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { dashboard } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalSegments: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching dashboard stats...');
      const response = await dashboard.getStats();
      console.log('Dashboard stats response:', response);
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load dashboard stats';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await dashboard.getRecentActivity();
      setActivities(response.data);
    } catch (error: any) {
      console.error('Failed to fetch recent activities:', error);
      toast.error('Failed to load recent activities');
    }
  };

  // Fetch stats and activities on initial load
  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  // Refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh stats and activities when returning to dashboard
  useEffect(() => {
    if (pathname === '/dashboard') {
      fetchStats();
      fetchActivities();
    }
  }, [pathname]);

  const stats_cards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Customer Segments',
      value: stats.totalSegments,
      icon: TagIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: MegaphoneIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
  ];

  // Process activities for the chart
  const processActivitiesForChart = () => {
    // Get the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString();
    }).reverse();

    // Initialize counts for each day
    const activityCounts = last7Days.reduce((acc: any, date) => {
      acc[date] = {
        date,
        campaigns: 0,
        customers: 0,
        segments: 0,
      };
      return acc;
    }, {});

    // Count activities for each day
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (activityCounts[date]) {
        activityCounts[date][activity.type + 's']++;
      }
    });

    return Object.values(activityCounts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_cards.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {item.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            {activities.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processActivitiesForChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="campaigns" name="Campaigns" fill="#8884d8" />
                    <Bar dataKey="customers" name="Customers" fill="#82ca9d" />
                    <Bar dataKey="segments" name="Segments" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500">No recent activity to display.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 