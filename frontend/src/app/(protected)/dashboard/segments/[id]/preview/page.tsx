'use client';

import { useState, useEffect } from 'react';
import { segments } from '@/lib/api';
import { Segment, Customer } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PreviewSegmentPage({ params }: { params: { id: string } }) {
  const [segment, setSegment] = useState<Segment | null>(null);
  const [matchingCustomers, setMatchingCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSegmentAndCustomers();
  }, [params.id]);

  const fetchSegmentAndCustomers = async () => {
    try {
      setIsLoading(true);
      
      // First get the segment data
      const segmentResponse = await segments.getById(params.id);
      const segmentData = segmentResponse.data;
      
      if (!segmentData) {
        throw new Error('Segment not found');
      }
      
      setSegment(segmentData);
      
      // Then get the preview data using the segment data
      const previewResponse = await segments.preview(segmentData);
      setMatchingCustomers(previewResponse.data.preview || []);
    } catch (error: any) {
      console.error('Error fetching segment preview:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch segment preview');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Segment not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The segment you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/segments"
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Segments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/segments"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Segments
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {segment.name}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>{segment.description}</p>
          </div>
          <div className="mt-5">
            <h4 className="text-sm font-medium text-gray-900">Segment Rules</h4>
            <div className="mt-2 space-y-2">
              {segment.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm text-gray-500"
                >
                  <span className="font-medium">{rule.field}</span>
                  <span className="mx-2">{rule.operator}</span>
                  <span>{rule.value}</span>
                  {index < segment.rules.length - 1 && (
                    <span className="mx-2 font-medium text-gray-900">
                      {segment.ruleLogic}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Matching Customers</h2>
            <p className="mt-2 text-sm text-gray-700">
              A list of customers that match your segment criteria.
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
                    {matchingCustomers.map((customer) => (
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
                    {matchingCustomers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-sm text-gray-500 text-center"
                        >
                          No customers match this segment's criteria.
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