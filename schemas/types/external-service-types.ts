// TypeScript types for WozaMali External Service Integration
// This file contains all the type definitions needed for external repository communication

// ============================================================================
// CORE TYPES
// ============================================================================

export interface ExternalService {
  id: string;
  serviceName: string;
  serviceType: ServiceType;
  baseUrl: string;
  apiKeyHash?: string;
  webhookUrl?: string;
  isActive: boolean;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = 'wallet' | 'rewards' | 'analytics' | 'payment' | 'notification';

export interface ServiceApiKey {
  id: string;
  serviceId: string;
  keyName: string;
  keyHash: string;
  permissions: ServicePermissions;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ServicePermissions {
  wallet?: Permission[];
  rewards?: Permission[];
  analytics?: Permission[];
  payment?: Permission[];
  notification?: Permission[];
  donations?: Permission[];
  withdrawals?: Permission[];
}

export type Permission = 'read' | 'write' | 'delete' | 'admin';

// ============================================================================
// SYNC QUEUE TYPES
// ============================================================================

export interface SyncQueueItem {
  id: string;
  targetServiceId: string;
  operationType: OperationType;
  entityType: EntityType;
  entityId: string;
  payload: Record<string, any>;
  priority: number;
  retryCount: number;
  status: SyncStatus;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OperationType = 
  | 'wallet_update' 
  | 'points_update' 
  | 'reward_issue' 
  | 'donation_create' 
  | 'withdrawal_request' 
  | 'metrics_update';

export type EntityType = 
  | 'wallet' 
  | 'user' 
  | 'transaction' 
  | 'reward' 
  | 'donation' 
  | 'withdrawal' 
  | 'metric';

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface EnhancedWallet {
  id: string;
  userId: string;
  balance: number;
  totalPoints: number;
  tier: WalletTier;
  externalWalletId?: string;
  lastSyncAt?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type WalletTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface WalletSyncHistory {
  id: string;
  walletId: string;
  syncType: 'push' | 'pull' | 'full_sync';
  externalServiceId: string;
  oldBalance?: number;
  newBalance?: number;
  oldPoints?: number;
  newPoints?: number;
  syncResult: 'success' | 'partial' | 'failed';
  errorDetails?: string;
  createdAt: string;
}

export interface WalletUpdate {
  balanceChange?: number;
  pointsChange?: number;
  description?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  transactionType: TransactionType;
  amount: number;
  pointsEarned?: number;
  pointsSpent?: number;
  description?: string;
  referenceId?: string;
  status: TransactionStatus;
  createdAt: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'reward' | 'penalty';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// REWARDS TYPES
// ============================================================================

export interface RewardDefinition {
  id: string;
  rewardCode: string;
  name: string;
  description?: string;
  pointsCost: number;
  monetaryValue: number;
  rewardType: RewardType;
  isActive: boolean;
  externalRewardId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RewardType = 'discount' | 'cashback' | 'product' | 'service' | 'badge';

export interface UserReward {
  id: string;
  userId: string;
  rewardDefinitionId: string;
  status: RewardStatus;
  pointsSpent: number;
  monetaryValue: number;
  redeemedAt?: string;
  expiresAt?: string;
  externalRewardId?: string;
  createdAt: string;
}

export type RewardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

// ============================================================================
// DONATIONS TYPES
// ============================================================================

export interface DonationCampaign {
  id: string;
  name: string;
  description?: string;
  targetAmount?: number;
  currentAmount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  externalCampaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDonation {
  id: string;
  userId: string;
  campaignId: string;
  amount: number;
  pointsEarned: number;
  donationType: DonationType;
  status: DonationStatus;
  externalDonationId?: string;
  createdAt: string;
}

export type DonationType = 'monetary' | 'points' | 'mixed';
export type DonationStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

// ============================================================================
// WITHDRAWALS TYPES
// ============================================================================

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  withdrawalMethod: WithdrawalMethod;
  accountDetails: Record<string, any>;
  status: WithdrawalStatus;
  adminNotes?: string;
  processedAt?: string;
  externalWithdrawalId?: string;
  createdAt: string;
  updatedAt: string;
}

export type WithdrawalMethod = 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto';
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface UserMetrics {
  id: string;
  userId: string;
  metricDate: string;
  totalRecyclingKg: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  totalDonations: number;
  totalWithdrawals: number;
  loginCount: number;
  lastActivity?: string;
  externalMetricsId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetrics {
  id: string;
  metricDate: string;
  metricType: MetricType;
  totalUsers: number;
  activeUsers: number;
  totalRecyclingKg: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalDonations: number;
  totalWithdrawals: number;
  externalMetricsId?: string;
  createdAt: string;
}

export type MetricType = 'daily' | 'weekly' | 'monthly';

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEndpoint {
  id: string;
  serviceId: string;
  endpointUrl: string;
  events: string[];
  isActive: boolean;
  secretKeyHash?: string;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, any>;
  responseStatus?: number;
  responseBody?: string;
  deliveryTimeMs?: number;
  success: boolean;
  retryCount: number;
  createdAt: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncResponse {
  success: boolean;
  syncId: string;
  status: SyncStatus;
  message?: string;
}

// ============================================================================
// SERVICE CLIENT INTERFACES
// ============================================================================

export interface WozaMaliServiceClient {
  // Wallet operations
  getWallet(userId: string): Promise<EnhancedWallet>;
  updateWallet(userId: string, update: WalletUpdate): Promise<EnhancedWallet>;
  getTransactions(userId: string): Promise<WalletTransaction[]>;
  
  // Points operations
  getPoints(userId: string): Promise<PointsSummary>;
  earnPoints(userId: string, points: number, reason: string): Promise<PointsUpdate>;
  spendPoints(userId: string, points: number, reason: string): Promise<PointsUpdate>;
  
  // Rewards operations
  getRewards(): Promise<RewardDefinition[]>;
  issueReward(userId: string, rewardId: string): Promise<UserReward>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  
  // Donations operations
  getDonationCampaigns(): Promise<DonationCampaign[]>;
  createDonation(donation: CreateDonationRequest): Promise<UserDonation>;
  getUserDonations(userId: string): Promise<UserDonation[]>;
  
  // Withdrawals operations
  createWithdrawalRequest(withdrawal: CreateWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
  
  // Metrics operations
  getUserMetrics(userId: string, dateRange: DateRange): Promise<UserMetrics[]>;
  getSystemMetrics(dateRange: DateRange): Promise<SystemMetrics[]>;
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
}

export interface PointsSummary {
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  tier: WalletTier;
}

export interface PointsUpdate {
  success: boolean;
  newBalance: number;
  newPoints: number;
  transactionId: string;
}

export interface CreateDonationRequest {
  userId: string;
  campaignId: string;
  amount: number;
  donationType: DonationType;
}

export interface CreateWithdrawalRequest {
  userId: string;
  amount: number;
  withdrawalMethod: WithdrawalMethod;
  accountDetails: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'unhealthy';
  message?: string;
  lastHeartbeat?: string;
  services: {
    [key: string]: 'healthy' | 'warning' | 'unhealthy';
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ServiceConfig {
  baseUrl: string;
  apiKey: string;
  serviceId: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface WebhookConfig {
  secretKey: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface WalletUpdateEvent {
  event: 'wallet_update';
  timestamp: string;
  data: {
    userId: string;
    walletId: string;
    balanceChange: number;
    pointsChange: number;
    description?: string;
    newBalance: number;
    newPoints: number;
  };
}

export interface PointsUpdateEvent {
  event: 'points_update';
  timestamp: string;
  data: {
    userId: string;
    pointsChange: number;
    reason: string;
    newTotalPoints: number;
  };
}

export interface RewardIssueEvent {
  event: 'reward_issue';
  timestamp: string;
  data: {
    userId: string;
    rewardId: string;
    rewardCode: string;
    pointsSpent: number;
    monetaryValue: number;
  };
}

export interface DonationCreateEvent {
  event: 'donation_create';
  timestamp: string;
  data: {
    userId: string;
    campaignId: string;
    amount: number;
    donationType: DonationType;
    pointsEarned: number;
  };
}

export interface WithdrawalRequestEvent {
  event: 'withdrawal_request';
  timestamp: string;
  data: {
    userId: string;
    withdrawalId: string;
    amount: number;
    withdrawalMethod: WithdrawalMethod;
    status: WithdrawalStatus;
  };
}

export interface MetricsUpdateEvent {
  event: 'metrics_update';
  timestamp: string;
  data: {
    entityType: 'user' | 'system';
    entityId?: string;
    metricType: MetricType;
    metrics: Record<string, any>;
  };
}

export type WebhookEvent = 
  | WalletUpdateEvent 
  | PointsUpdateEvent 
  | RewardIssueEvent 
  | DonationCreateEvent 
  | WithdrawalRequestEvent 
  | MetricsUpdateEvent;
