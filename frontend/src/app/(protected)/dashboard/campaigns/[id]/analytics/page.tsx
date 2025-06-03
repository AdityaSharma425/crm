'use client';

import { useState, useEffect } from 'react';
import { campaigns } from '@/lib/api';
import { Campaign } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';
import {
  ChartBarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATS = [
  {
    name: 'Total Customers',
    value: '0',
    icon: UserGroupIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Messages Sent',
    value: '0',
    icon: EnvelopeIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Delivered',
    value: '0',
    icon: CheckCircleIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'Failed',
    value: '0',
    icon: XCircleIcon,
    color: 'bg-red-500',
  },
  {
    name: 'Pending',
    value: '0',
    icon: ClockIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'Response Rate',
    value: '0%',
    icon: ChartBarIcon,
    color: 'bg-indigo-500',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const mockEngagementData = [
  { name: 'Opened', value: 400 },
  { name: 'Clicked', value: 300 },
  { name: 'Replied', value: 200 },
  { name: 'Converted', value: 100 },
  { name: 'Unsubscribed', value: 50 },
];

const mockTimelineData = [
  { date: '2024-03-01', sent: 100, delivered: 95, failed: 5 },
  { date: '2024-03-02', sent: 150, delivered: 140, failed: 10 },
  { date: '2024-03-03', sent: 200, delivered: 190, failed: 10 },
  { date: '2024-03-04', sent: 180, delivered: 175, failed: 5 },
  { date: '2024-03-05', sent: 220, delivered: 210, failed: 10 },
];

export default function CampaignAnalyticsPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [eventType, setEventType] = useState('all');

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await campaigns.getById(params.id);
      setCampaign(response.data);
    } catch (error) {
      toast.error('Failed to fetch campaign analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Event', 'Status', 'Details'];
    const rows = [
      ['2024-03-01', 'Campaign Created', 'Completed', 'Campaign was created'],
      ['2024-03-02', 'Messages Sent', 'Completed', '100 messages sent'],
      ['2024-03-03', 'Delivery Update', 'In Progress', '95% delivered'],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign-analytics-${campaign?._id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campaign not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The campaign you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/campaigns"
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <Link
          href={`/dashboard/campaigns/${campaign._id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Campaign Details
        </Link>
        <button
          onClick={handleExport}
          className="btn-secondary inline-flex items-center"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Export Data
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {campaign.name} - Analytics
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>{campaign.description}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {STATS.map((stat) => (
                <div
                  key={stat.name}
                  className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
                >
                  <dt>
                    <div className={`absolute rounded-md ${stat.color} p-3`}>
                      <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">
                      {stat.name}
                    </p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </dd>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-900">Delivery Trends</h4>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#8884d8" />
                  <Line type="monotone" dataKey="delivered" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="failed" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-900">Customer Engagement</h4>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockEngagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockEngagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-semibold text-gray-900">Campaign Timeline</h4>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary inline-flex items-center"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Range</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="input-field"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="mt-1 input-field"
                    >
                      <option value="all">All Events</option>
                      <option value="created">Creation</option>
                      <option value="scheduled">Scheduling</option>
                      <option value="delivery">Delivery</option>
                      <option value="response">Response</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Event
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Time
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            Campaign Created
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Completed
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(campaign.createdAt).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            Campaign was created
                          </td>
                        </tr>
                        {campaign.scheduledFor && (
                          <tr>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              Campaign Scheduled
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Scheduled
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(campaign.scheduledFor).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              Campaign scheduled for delivery
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-900">Delivery Status</h4>
            <div className="mt-4">
              <div className="overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-primary-600" style={{ width: '0%' }} />
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>0% delivered</span>
                <span>0 of 0 messages</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-900">Response Analysis</h4>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 