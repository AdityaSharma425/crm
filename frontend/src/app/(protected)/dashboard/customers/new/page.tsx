'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { customers } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  totalSpent: yup.number().min(0, 'Total spent must be positive').required('Total spent is required'),
  visitCount: yup.number().min(0, 'Visit count must be positive').required('Visit count is required'),
  tags: yup.array().of(yup.string()).transform((value) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    return value;
  }),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      totalSpent: 0,
      visitCount: 0,
      tags: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await customers.create(data);
      toast.success('Customer created successfully');
      router.push('/dashboard/customers');
    } catch (error) {
      toast.error('Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h3 className="text-lg font-medium leading-6 text-gray-900">New Customer</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a new customer to your CRM system.
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
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 