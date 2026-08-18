export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  isAdmin?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface KpiItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  iconName: string;
}

export interface QueryRecord {
  id: string;
  question: string;
  country: string;
  carrier: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface DocumentRecord {
  id: string;
  title: string;
  status: 'indexed' | 'processing' | 'error';
  type: string;
  country: string;
  carrier: string;
  uploadedAt: string;
}
