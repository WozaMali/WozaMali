# External API Integration Guide for WozaMali

This guide explains how to integrate external repositories and services with the WozaMali rewards and metrics system.

## Overview

The system is designed to communicate with external services through:
- **Sync Queue**: Asynchronous updates queued for external services
- **Webhooks**: Real-time notifications to external services
- **API Endpoints**: RESTful endpoints for external service communication
- **Authentication**: Secure API key management

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WozaMali      │    │   Sync Queue     │    │  External       │
│   Application   │───▶│   & Webhooks     │───▶│  Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 1. External Service Registration

### Register a New Service

```sql
INSERT INTO external_services (
    service_name,
    service_type,
    base_url,
    webhook_url,
    is_active
) VALUES (
    'my-wallet-service',
    'wallet',
    'https://api.myservice.com',
    'https://api.myservice.com/webhooks/wozamali',
    true
);
```

### Service Types Supported

- `wallet` - Wallet balance and points management
- `rewards` - Rewards and loyalty programs
- `analytics` - Metrics and reporting
- `payment` - Payment processing
- `notification` - Push notifications

## 2. API Key Management

### Generate API Key

```sql
INSERT INTO service_api_keys (
    service_id,
    key_name,
    key_hash,
    permissions
) VALUES (
    'service-uuid',
    'primary-key',
    crypt('your-api-key', gen_salt('bf')),
    '{"wallet": ["read", "write"], "metrics": ["read"]}'
);
```

### Permissions Structure

```json
{
  "wallet": ["read", "write", "delete"],
  "rewards": ["read", "write"],
  "metrics": ["read"],
  "donations": ["read", "write"],
  "withdrawals": ["read", "write"]
}
```

## 3. Sync Queue Operations

### Adding Items to Sync Queue

```sql
-- Update wallet balance and queue sync
SELECT update_wallet_with_sync(
    'user-uuid',
    10.50,  -- balance change
    100,    -- points change
    'Recycling reward'
);
```

### Processing Sync Queue

```sql
-- Process pending sync items
SELECT process_sync_queue();
```

### Sync Queue Statuses

- `pending` - Waiting to be processed
- `processing` - Currently being processed
- `completed` - Successfully processed
- `failed` - Processing failed
- `retry` - Scheduled for retry

## 4. Webhook Integration

### Webhook Endpoint Registration

```sql
INSERT INTO webhook_endpoints (
    service_id,
    endpoint_url,
    events,
    secret_key_hash
) VALUES (
    'service-uuid',
    'https://api.myservice.com/webhooks/wozamali',
    ARRAY['wallet_update', 'points_update', 'reward_issue'],
    crypt('webhook-secret', gen_salt('bf'))
);
```

### Supported Events

- `wallet_update` - Wallet balance or points changed
- `points_update` - Points earned or spent
- `reward_issue` - New reward issued
- `donation_create` - New donation made
- `withdrawal_request` - Withdrawal requested
- `metrics_update` - Metrics updated

### Webhook Payload Example

```json
{
  "event": "wallet_update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": "user-uuid",
    "wallet_id": "wallet-uuid",
    "balance_change": 10.50,
    "points_change": 100,
    "description": "Recycling reward",
    "new_balance": 25.75,
    "new_points": 450
  },
  "signature": "sha256=..."
}
```

## 5. REST API Endpoints

### Base URL Structure

```
https://your-domain.com/api/v1/external/{service_id}/{resource}
```

### Authentication

```http
Authorization: Bearer {api_key}
X-Service-ID: {service_id}
```

### Available Endpoints

#### Wallet Operations

```http
GET    /api/v1/external/{service_id}/wallets/{user_id}
POST   /api/v1/external/{service_id}/wallets/{user_id}/update
GET    /api/v1/external/{service_id}/wallets/{user_id}/transactions
```

#### Points Operations

```http
GET    /api/v1/external/{service_id}/users/{user_id}/points
POST   /api/v1/external/{service_id}/users/{user_id}/points/earn
POST   /api/v1/external/{service_id}/users/{user_id}/points/spend
```

#### Rewards Operations

```http
GET    /api/v1/external/{service_id}/rewards
POST   /api/v1/external/{service_id}/rewards/{reward_id}/issue
GET    /api/v1/external/{service_id}/users/{user_id}/rewards
```

#### Metrics Operations

```http
GET    /api/v1/external/{service_id}/metrics/users/{user_id}
GET    /api/v1/external/{service_id}/metrics/system
POST   /api/v1/external/{service_id}/metrics/aggregate
```

## 6. TypeScript Integration Examples

### Service Client Interface

```typescript
interface WozaMaliServiceClient {
  // Wallet operations
  getWallet(userId: string): Promise<Wallet>;
  updateWallet(userId: string, update: WalletUpdate): Promise<Wallet>;
  getTransactions(userId: string): Promise<Transaction[]>;
  
  // Points operations
  getPoints(userId: string): Promise<PointsSummary>;
  earnPoints(userId: string, points: number, reason: string): Promise<PointsUpdate>;
  spendPoints(userId: string, points: number, reason: string): Promise<PointsUpdate>;
  
  // Rewards operations
  getRewards(): Promise<RewardDefinition[]>;
  issueReward(userId: string, rewardId: string): Promise<UserReward>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  
  // Metrics operations
  getUserMetrics(userId: string, dateRange: DateRange): Promise<UserMetrics[]>;
  getSystemMetrics(dateRange: DateRange): Promise<SystemMetrics[]>;
}

interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastSyncAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

interface WalletUpdate {
  balanceChange?: number;
  pointsChange?: number;
  description?: string;
}

interface PointsSummary {
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  tier: string;
}

interface PointsUpdate {
  success: boolean;
  newBalance: number;
  newPoints: number;
  transactionId: string;
}
```

### Implementation Example

```typescript
class WozaMaliWalletService implements WozaMaliServiceClient {
  private baseUrl: string;
  private apiKey: string;
  private serviceId: string;

  constructor(config: ServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.serviceId = config.serviceId;
  }

  async getWallet(userId: string): Promise<Wallet> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/external/${this.serviceId}/wallets/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Service-ID': this.serviceId,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get wallet: ${response.statusText}`);
    }

    return response.json();
  }

  async updateWallet(userId: string, update: WalletUpdate): Promise<Wallet> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/external/${this.serviceId}/wallets/${userId}/update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Service-ID': this.serviceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update wallet: ${response.statusText}`);
    }

    return response.json();
  }

  // ... implement other methods
}
```

## 7. Webhook Handler Implementation

### Express.js Webhook Handler

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

app.post('/webhooks/wozamali', (req, res) => {
  const signature = req.headers['x-wozamali-signature'] as string;
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'wallet_update':
      handleWalletUpdate(data);
      break;
    case 'points_update':
      handlePointsUpdate(data);
      break;
    case 'reward_issue':
      handleRewardIssue(data);
      break;
    default:
      console.log(`Unknown event: ${event}`);
  }

  res.json({ received: true });
});

function handleWalletUpdate(data: any) {
  console.log('Wallet updated:', data);
  // Implement your wallet update logic
}

function handlePointsUpdate(data: any) {
  console.log('Points updated:', data);
  // Implement your points update logic
}

function handleRewardIssue(data: any) {
  console.log('Reward issued:', data);
  // Implement your reward issue logic
}
```

## 8. Error Handling and Retry Logic

### Sync Queue Retry Strategy

```sql
-- Failed items are automatically retried
UPDATE sync_queue 
SET 
    status = 'retry',
    retry_count = retry_count + 1,
    updated_at = NOW()
WHERE status = 'failed' 
  AND retry_count < 3;
```

### Exponential Backoff

```typescript
async function processWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

## 9. Monitoring and Health Checks

### Service Health Check

```sql
-- Check service health
SELECT 
    service_name,
    service_type,
    is_active,
    last_heartbeat,
    CASE 
        WHEN last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'healthy'
        WHEN last_heartbeat > NOW() - INTERVAL '1 hour' THEN 'warning'
        ELSE 'unhealthy'
    END as health_status
FROM external_services;
```

### Sync Queue Monitoring

```sql
-- Monitor sync queue health
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM sync_queue 
GROUP BY status;
```

## 10. Security Best Practices

### API Key Rotation

- Rotate API keys regularly (every 90 days)
- Use different keys for different environments
- Implement key expiration and automatic rotation

### Webhook Security

- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting on webhook endpoints
- Validate webhook payloads

### Data Encryption

- Encrypt sensitive data at rest
- Use TLS 1.3 for data in transit
- Implement field-level encryption for PII

## 11. Testing and Development

### Local Development Setup

```bash
# Start local Supabase
supabase start

# Apply schema
psql -h localhost -U postgres -d postgres -f schemas/rewards-metrics-system.sql

# Test external service registration
psql -h localhost -U postgres -d postgres -c "
INSERT INTO external_services (service_name, service_type, base_url) 
VALUES ('test-service', 'wallet', 'http://localhost:3001');
"
```

### Integration Testing

```typescript
describe('WozaMali Integration', () => {
  it('should sync wallet updates', async () => {
    const client = new WozaMaliWalletService(testConfig);
    
    const wallet = await client.getWallet('test-user-id');
    expect(wallet.balance).toBe(0);
    
    const updatedWallet = await client.updateWallet('test-user-id', {
      balanceChange: 10.50,
      pointsChange: 100,
      description: 'Test reward'
    });
    
    expect(updatedWallet.balance).toBe(10.50);
    expect(updatedWallet.totalPoints).toBe(100);
  });
});
```

## 12. Deployment Checklist

- [ ] Register external services in production database
- [ ] Generate and secure API keys
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and alerting
- [ ] Test all integration points
- [ ] Implement error handling and retry logic
- [ ] Set up logging and audit trails
- [ ] Configure rate limiting and security measures
- [ ] Document API endpoints and webhook formats
- [ ] Set up backup and disaster recovery procedures

## Support and Troubleshooting

For issues with external service integration:

1. Check the sync queue status
2. Verify service health and connectivity
3. Review webhook delivery logs
4. Check API key permissions and expiration
5. Monitor error logs and retry attempts

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Webhook Security Best Practices](https://webhooks.fyi/)
- [API Design Guidelines](https://github.com/microsoft/api-guidelines)
