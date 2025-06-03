'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { campaigns, segments } from '@/lib/api';
import { Segment, Campaign } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  segment: yup.string().required('Segment is required'),
  message: yup.string().required('Message is required'),
  scheduledFor: yup.date().nullable(),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [segmentsList, setSegmentsList] = useState<Segment[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    Promise.all([fetchCampaign(), fetchSegments()]);
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await campaigns.getById(params.id);
      const campaignData = response.data;
      setCampaign(campaignData);
      
      // Format the scheduledFor date for the datetime-local input
      const scheduledFor = campaignData.scheduledFor 
        ? new Date(campaignData.scheduledFor).toISOString().slice(0, 16)
        : null;

      reset({
        ...campaignData,
        segment: typeof campaignData.segment === 'string' 
          ? campaignData.segment 
          : campaignData.segment._id,
        scheduledFor,
      });
    } catch (error) {
      toast.error('Failed to fetch campaign');
      router.push('/dashboard/campaigns');
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await segments.getAll();
      setSegmentsList(response.data);
    } catch (error) {
      toast.error('Failed to fetch segments');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await campaigns.update(params.id, data);
      toast.success('Campaign updated successfully');
      router.push('/dashboard/campaigns');
    } catch (error) {
      toast.error('Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

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

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Campaign</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update your marketing campaign details and segment.
          </p>
        </div>

        <div className="mt-5 md:col-span-2 md:mt-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="mt-1 input-field"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 input-field"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="segment" className="block text-sm font-medium text-gray-700">
                    Segment
                  </label>
                  <select
                    {...register('segment')}
                    className="mt-1 input-field"
                    disabled={campaign.status !== 'draft'}
                  >
                    <option value="">Select a segment</option>
                    {segmentsList.map((segment) => (
                      <option key={segment._id} value={segment._id}>
                        {segment.name}
                      </option>
                    ))}
                  </select>
                  {errors.segment && (
                    <p className="mt-1 text-sm text-red-600">{errors.segment.message}</p>
                  )}
                  {campaign.status !== 'draft' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Segment cannot be changed after campaign is created
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    {...register('message')}
                    rows={5}
                    className="mt-1 input-field"
                    placeholder="Enter the message to send to customers in this segment"
                    disabled={campaign.status !== 'draft'}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                  {campaign.status !== 'draft' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Message cannot be changed after campaign is created
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    {...register('scheduledFor')}
                    className="mt-1 input-field"
                    disabled={campaign.status !== 'draft'}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {campaign.status === 'draft' 
                      ? 'Leave empty to start the campaign immediately'
                      : 'Schedule cannot be changed after campaign is created'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Status
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'running' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting || campaign.status !== 'draft'}
                  className="btn-primary inline-flex justify-center"
                >
                  {isSubmitting ? 'Updating...' : 'Update Campaign'}
                </button>
                {campaign.status !== 'draft' && (
                  <p className="mt-2 text-sm text-gray-500">
                    Only draft campaigns can be edited
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 