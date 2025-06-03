export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  visitCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  _id: string;
  name: string;
  description: string;
  rules: Rule[];
  ruleLogic: 'AND' | 'OR';
  customerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface Campaign {
  _id: string;
  name: string;
  description: string;
  segment: string | Segment;
  message: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalAudience: number;
    sent: number;
    failed: number;
    delivered: number;
  };
}

export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalSegments: number;
  activeCampaigns: number;
  totalRevenue: number;
}

export interface Activity {
  _id: string;
  type: 'customer_created' | 'segment_created' | 'campaign_created' | 'campaign_updated';
  description: string;
  createdAt: string;
} 