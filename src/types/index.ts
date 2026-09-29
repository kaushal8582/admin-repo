export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'finance';

export type Permission =
  | 'dashboard:view'
  | 'users:view'
  | 'users:suspend'
  | 'users:unsuspend'
  | 'users:manage'
  | 'videos:view'
  | 'videos:disable'
  | 'videos:restore'
  | 'videos:delete'
  | 'reports:view'
  | 'reports:manage'
  | 'earnings:view'
  | 'earnings:adjust'
  | 'withdrawals:view'
  | 'withdrawals:manage'
  | 'telegram:view'
  | 'telegram:manage'
  | 'storage:view'
  | 'storage:manage'
  | 'system:view'
  | 'admins:view'
  | 'admins:manage'
  | 'audit:view'
  | 'settings:view'
  | 'settings:manage'
  | (string & {});

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: AdminRole | string;
  status: string;
  permissions: Permission[];
  adminTotpEnabled?: boolean;
  lastAdminLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthSession {
  requires2fa: boolean;
  pendingToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AdminUser;
  message?: string;
}

export interface OwnerRef {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface PlatformUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  [key: string]: unknown;
}

export interface UserDetail extends PlatformUser {
  stats?: {
    videoCount?: number;
    storageBytes?: number;
    totalViews?: number;
    ogLinkCount?: number;
    ogEarnEvents?: number;
    ogEarnGrossUsd?: number;
    reportCount?: number;
  };
  wallet?: Record<string, unknown>;
  telegram?: {
    connected?: boolean;
    telegramUserId?: string;
    telegramUsername?: string;
    connectedAt?: string;
  } | null;
}

export interface VideoItem {
  id: string;
  title?: string;
  shareToken?: string;
  shareUrl?: string;
  status?: string;
  moderationStatus?: string;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  mimeType?: string;
  size?: number;
  duration?: number;
  viewCount?: number;
  payableViewCount?: number;
  reportCount?: number;
  owner?: OwnerRef | null;
  createdAt?: string;
  updatedAt?: string;
  ogLinkCount?: number;
  reports?: Array<{ id: string; reason?: string; status?: string; createdAt?: string }>;
  [key: string]: unknown;
}

export interface ReportItem {
  id: string;
  reportedUrl?: string | null;
  video?: { id: string; title?: string; shareToken?: string; moderationStatus?: string } | null;
  shareToken?: string | null;
  owner?: OwnerRef | null;
  reporterEmail?: string | null;
  reporterName?: string | null;
  reason?: string;
  description?: string;
  status?: string;
  adminNotes?: string | null;
  actionTaken?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  range: string;
  rangeStart?: string;
  generatedAt?: string;
  totals: {
    users: number;
    newUsersToday: number;
    newUsersMonth: number;
    videos: number;
    uploadsToday: number;
    storageBytes: number;
    totalViews: number;
    ogLinks: number;
    ogEvents: number;
    telegramConnected: number;
    telegramGroups: number;
    telegramChannels: number;
    pendingReports: number;
    pendingPayouts: number;
  };
  series: {
    users: Array<{ date: string; count: number }>;
    videos: Array<{ date: string; count: number }>;
    ogEarnEvents: Array<{ date: string; count: number }>;
  };
}

export interface LedgerItem {
  id: string;
  userId: string;
  user?: OwnerRef | null;
  type?: string;
  amount?: number;
  balanceField?: string;
  description?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface WithdrawalItem {
  id: string;
  user?: OwnerRef | null;
  amountUsd?: number;
  method?: string;
  status?: string;
  paymentSnapshot?: {
    upiId?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    ifsc?: string | null;
  };
  adminNote?: string | null;
  rejectionReason?: string | null;
  transactionId?: string | null;
  hasPaymentProof?: boolean;
  reviewedAt?: string | null;
  paidAt?: string | null;
  processedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface WithdrawalEvent {
  id: string;
  type: 'created' | 'status_changed' | 'note' | 'proof_uploaded';
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  internal?: boolean;
  actorType: 'user' | 'admin' | 'system';
  actorName?: string | null;
  transactionId?: string | null;
  createdAt: string;
}

export interface WithdrawalDetail extends WithdrawalItem {
  paymentProofUrl?: string | null;
  timeline: WithdrawalEvent[];
}

export interface OgLinkItem {
  id: string;
  shareToken?: string;
  status?: string;
  viewCount?: number;
  payableViewCount?: number;
  video?: { id: string; title?: string; shareToken?: string } | null;
  owner?: OwnerRef | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface AuditLogItem {
  id: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  adminId?: string | OwnerRef;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SettingEntry {
  key: string;
  value: unknown;
  updatedAt?: string | null;
  updatedBy?: string | null;
}
