'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { campaigns, segments } from '@/lib/api';
import { Segment } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MessageSuggestions from '@/components/MessageSuggestions';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  segment: yup.string().required('Segment is required'),
  message: yup.string().required('Message is required'),
  scheduledFor: yup.string().nullable().transform((value) => {
    return value === '' ? null : value;
  }),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [segmentsList, setSegmentsList] = useState<Segment[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Watch the scheduledFor field
  const scheduledFor = watch('scheduledFor');

  useEffect(() => {
    fetchSegments();
  }, []);

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

  const createCampaign = async (data: FormData, isDraft: boolean) => {
    try {
      setIsSubmitting(true);
      const campaignData = {
        ...data,
        scheduledFor: isScheduled ? data.scheduledFor : null,
        status: isDraft ? 'draft' : undefined // Let backend decide status if not draft
      };
      await campaigns.create(campaignData);
      toast.success(isDraft ? 'Campaign saved as draft' : 'Campaign created successfully');
      router.push('/dashboard/campaigns');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit: SubmitHandler<FormData> = (data) => createCampaign(data, false);
  const onSaveDraft: SubmitHandler<FormData> = (data) => createCampaign(data, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
          <h3 className="text-lg font-medium leading-6 text-gray-900">Create Campaign</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new marketing campaign by selecting a segment and providing campaign details.
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
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}

                  <MessageSuggestions
                    onSelect={(message) => setValue('message', message)}
                    campaignObjective={watch('description')}
                    audienceDescription={watch('segment') ? 
                      segmentsList.find(s => s._id === watch('segment'))?.description || '' 
                      : ''}
                  />
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="schedule"
                      checked={isScheduled}
                      onChange={(e) => {
                        setIsScheduled(e.target.checked);
                        if (!e.target.checked) {
                          setValue('scheduledFor', '');
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="schedule" className="ml-2 block text-sm text-gray-900">
                      Schedule Campaign
                    </label>
                  </div>
                  
                  {isScheduled && (
                    <div className="mt-4">
                      <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
                        Schedule Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        {...register('scheduledFor')}
                        className="mt-1 input-field"
                        min={new Date().toISOString().slice(0, 16)} // Prevent scheduling in the past
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Select when you want this campaign to start
                      </p>
                      {errors.scheduledFor && (
                        <p className="mt-1 text-sm text-red-600">{errors.scheduledFor.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit(onSaveDraft)}
                    disabled={isSubmitting}
                    className="btn-secondary inline-flex justify-center"
                  >
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="btn-primary inline-flex justify-center"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 