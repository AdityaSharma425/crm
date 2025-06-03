'use client';

import { useState, useEffect } from 'react';
import { campaigns } from '@/lib/api';
import { Campaign, Customer, Segment } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
  stopped: 'bg-orange-100 text-orange-800',
} as const;

type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'stopped';

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [targetCustomers, setTargetCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCampaignAndCustomers();
  }, [params.id]);

  const fetchCampaignAndCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching campaign with ID:', params.id);
      
      // First fetch campaign details
      const campaignResponse = await campaigns.getById(params.id);
      console.log('Campaign response:', campaignResponse);
      
      if (!campaignResponse?.data) {
        console.error('No campaign data in response:', campaignResponse);
        throw new Error('No campaign data received');
      }
      
      const campaignData = campaignResponse.data;
      console.log('Campaign data:', campaignData);
      
      if (!campaignData._id) {
        console.error('Invalid campaign data:', campaignData);
        throw new Error('Invalid campaign data received');
      }
      
      setCampaign(campaignData);
      
      // Then fetch target customers
      try {
        const customersResponse = await campaigns.getCustomers(params.id);
        console.log('Customers response:', customersResponse);
        if (customersResponse?.data) {
          setTargetCustomers(customersResponse.data);
        } else {
          console.warn('No customers data in response');
          setTargetCustomers([]);
        }
      } catch (customerError) {
        console.error('Error fetching customers:', customerError);
        toast.error('Failed to fetch target customers');
        setTargetCustomers([]);
      }
    } catch (error: any) {
      console.error('Error fetching campaign details:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to fetch campaign details';
      if (error.response?.status === 404) {
        errorMessage = 'Campaign not found';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this campaign';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm('Are you sure you want to activate this campaign? This will start sending messages to all customers in the segment.')) {
      return;
    }

    try {
      setIsActivating(true);
      await campaigns.activate(params.id);
      toast.success('Campaign activated successfully');
      // Refresh campaign data
      const response = await campaigns.getById(params.id);
      setCampaign(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate campaign');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      console.log('Attempting to delete campaign:', params.id);
      const response = await campaigns.delete(params.id);
      console.log('Delete response:', response);
      toast.success('Campaign deleted successfully');
      router.push('/dashboard/campaigns');
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this running campaign? This will halt sending messages.')) {
      return;
    }

    try {
      setIsStopping(true);
      await campaigns.stop(params.id);
      toast.success('Campaign stopped successfully');
      // Refresh campaign data
      const response = await campaigns.getById(params.id);
      setCampaign(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to stop campaign');
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campaign not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          {error || "The campaign you're looking for doesn't exist or has been deleted."}
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

  const getSegmentName = (segment: Segment | string | null): string => {
    if (!segment) return 'Unknown Segment';
    if (typeof segment === 'string') return segment;
    return segment.name;
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Campaigns
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {campaign.name}
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>{campaign.description}</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-0 flex gap-3">
              {campaign.status === 'draft' && (
                <>
                  <button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="btn-primary"
                  >
                    {isActivating ? 'Activating...' : 'Activate Campaign'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="btn-danger"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                  </button>
                </>
              )}
              {campaign.status === 'running' && (
                <button
                  onClick={handleStop}
                  disabled={isStopping}
                  className="btn-danger"
                >
                  {isStopping ? 'Stopping...' : 'Stop Campaign'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status as CampaignStatus]}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Segment</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getSegmentName(campaign.segment)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.createdAt).toLocaleString()}
                </dd>
              </div>

              {campaign.scheduledFor && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled For</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(campaign.scheduledFor).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900">Campaign Message</h4>
            <div className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">
              {campaign.message}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Target Customers</h2>
            <p className="mt-2 text-sm text-gray-700">
              A list of customers who will receive this campaign message.
            </p>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Phone
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Spent
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Visit Count
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {targetCustomers.map((customer) => (
                      <tr key={customer._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {customer.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.phone || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${customer.totalSpent.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.visitCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.tags?.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                    {targetCustomers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-sm text-gray-500 text-center"
                        >
                          No customers found in this segment.
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
    </div>
  );
} 