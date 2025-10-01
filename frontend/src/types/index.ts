export interface User {
  _id?: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  customFields: Record<string, string>;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  listIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  preheader?: string;
  htmlContent: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt?: string;
  sentAt?: string;
  listIds: string[];
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
  thumbnailUrl?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface EmailJob {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'retrying';
  attemptCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface EmailEvent {
  id: string;
  jobId: string;
  type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained';
  details?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SuppressionEntry {
  email: string;
  reason: 'bounced' | 'unsubscribed' | 'complained' | 'manual';
  addedAt: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}