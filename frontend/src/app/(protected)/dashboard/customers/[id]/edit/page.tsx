'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { customers } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Customer } from '@/lib/types';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  totalSpent: yup.number().min(0, 'Total spent must be positive').required('Total spent is required'),
  visitCount: yup.number().min(0, 'Visit count must be positive').required('Visit count is required'),
  tags: yup.string().transform((value) => value.split(',').map((tag: string) => tag.trim())),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await customers.getById(params.id);
      const customer = response.data;
      
      // Transform tags array to comma-separated string
      const customerData = {
        ...customer,
        tags: customer.tags?.join(', ') || '',
      };
      
      reset(customerData);
    } catch (error) {
      toast.error('Failed to fetch customer');
      router.push('/dashboard/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await customers.update(params.id, data);
      toast.success('Customer updated successfully');
      router.push('/dashboard/customers');
    } catch (error) {
      toast.error('Failed to update customer');
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Customer</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update customer information in your CRM system.
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 input-field"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="mt-1 input-field"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="totalSpent" className="block text-sm font-medium text-gray-700">
                    Total Spent
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('totalSpent')}
                    className="mt-1 input-field"
                  />
                  {errors.totalSpent && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalSpent.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="visitCount" className="block text-sm font-medium text-gray-700">
                    Visit Count
                  </label>
                  <input
                    type="number"
                    {...register('visitCount')}
                    className="mt-1 input-field"
                  />
                  {errors.visitCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.visitCount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    {...register('tags')}
                    className="mt-1 input-field"
                    placeholder="e.g., vip, regular, new"
                  />
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary inline-flex justify-center"
                >
                  {isSubmitting ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 