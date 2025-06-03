'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { segments } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  rules: yup.array().of(
    yup.object({
      field: yup.string().required('Field is required'),
      operator: yup.string().required('Operator is required'),
      value: yup.string().required('Value is required'),
    })
  ).min(1, 'At least one rule is required'),
  ruleLogic: yup.string().required('Rule logic is required'),
}).required();

type Rule = {
  field: string;
  operator: string;
  value: string;
};

type FormData = yup.InferType<typeof schema>;

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
];

const FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'totalSpent', label: 'Total Spent' },
  { value: 'visitCount', label: 'Visit Count' },
  { value: 'tags', label: 'Tags' },
];

export default function EditSegmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{ matchingCustomers: number } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const currentRules = watch('rules') as Rule[];
  const currentRuleLogic = watch('ruleLogic');

  useEffect(() => {
    fetchSegment();
  }, [params.id]);

  const fetchSegment = async () => {
    try {
      const response = await segments.getById(params.id);
      const segment = response.data;
      reset(segment);
    } catch (error) {
      toast.error('Failed to fetch segment');
      router.push('/dashboard/segments');
    } finally {
      setIsLoading(false);
    }
  };

  const addRule = () => {
    setValue('rules', [...currentRules, { field: '', operator: '', value: '' }]);
  };

  const removeRule = (index: number) => {
    setValue('rules', currentRules.filter((_, i) => i !== index));
  };

  const convertNaturalLanguage = async () => {
    if (!naturalLanguage.trim()) {
      toast.error('Please enter a description of your segment');
      return;
    }

    try {
      setIsConverting(true);
      const response = await segments.convertToRules(naturalLanguage);
      setValue('rules', response.data.rules);
      setValue('ruleLogic', response.data.ruleLogic);
      toast.success('Rules converted successfully');
    } catch (error) {
      toast.error('Failed to convert rules');
    } finally {
      setIsConverting(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const response = await segments.preview({
        rules: currentRules,
        ruleLogic: currentRuleLogic
      });
      setPreviewData(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      toast.error('Failed to preview segment');
    } finally {
      setIsPreviewing(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await segments.update(params.id, data);
      toast.success('Segment updated successfully');
      router.push('/dashboard/segments');
    } catch (error) {
      toast.error('Failed to update segment');
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
          href="/dashboard/segments"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Segments
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Segment</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update your customer segment using rules or natural language.
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
                  <label className="block text-sm font-medium text-gray-700">
                    Natural Language Description
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <textarea
                      value={naturalLanguage}
                      onChange={(e) => setNaturalLanguage(e.target.value)}
                      placeholder="e.g., Customers who have spent more than $1000 and visited at least 5 times"
                      className="input-field flex-1"
                      rows={3}
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={convertNaturalLanguage}
                      disabled={isConverting}
                      className="btn-secondary inline-flex items-center"
                    >
                      {isConverting ? 'Converting...' : 'Convert to Rules'}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Rules
                    </label>
                    <button
                      type="button"
                      onClick={addRule}
                      className="btn-secondary inline-flex items-center text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Rule
                    </button>
                  </div>

                  <div className="mt-2 space-y-4">
                    {currentRules.map((_, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-1">
                          <select
                            {...register(`rules.${index}.field`)}
                            className="input-field"
                          >
                            <option value="">Select Field</option>
                            {FIELDS.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select
                            {...register(`rules.${index}.operator`)}
                            className="input-field"
                          >
                            <option value="">Select Operator</option>
                            {OPERATORS.map((operator) => (
                              <option key={operator.value} value={operator.value}>
                                {operator.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            {...register(`rules.${index}.value`)}
                            className="input-field"
                            placeholder="Value"
                          />
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeRule(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.rules && (
                    <p className="mt-1 text-sm text-red-600">{errors.rules.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ruleLogic" className="block text-sm font-medium text-gray-700">
                    Rule Logic
                  </label>
                  <select
                    {...register('ruleLogic')}
                    className="mt-1 input-field"
                  >
                    <option value="AND">All rules must match (AND)</option>
                    <option value="OR">Any rule can match (OR)</option>
                  </select>
                  {errors.ruleLogic && (
                    <p className="mt-1 text-sm text-red-600">{errors.ruleLogic.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={isPreviewing || !currentRules.length}
                    className="btn-secondary inline-flex justify-center"
                  >
                    {isPreviewing ? 'Previewing...' : 'Preview Audience Size'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary inline-flex justify-center"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Segment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audience Size Preview</h3>
            <p className="text-sm text-gray-500 mb-4">
              This segment will target {previewData.matchingCustomers} customers.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 