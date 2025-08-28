# WozaMali Rewards and Metrics System Overview

## System Purpose

The WozaMali Rewards and Metrics System is designed to provide a robust, scalable foundation for managing user wallets, points, rewards, donations, withdrawals, and analytics while enabling seamless communication with external repositories and services.

## Key Features

### 🏦 **Enhanced Wallet Management**
- **Multi-tier system**: Bronze, Silver, Gold, Platinum levels
- **Dual currency**: Monetary balance + points system
- **External sync**: Real-time synchronization with external wallet services
- **Audit trail**: Complete transaction and sync history

### 🎯 **Comprehensive Rewards System**
- **Flexible rewards**: Discounts, cashback, products, services, badges
- **Points-based**: Configurable points costs and monetary values
- **External integration**: Links to external rewards platforms
- **Expiration management**: Time-based reward validity

### 💝 **Donation Management**
- **Campaign support**: Multiple donation campaigns with targets
- **Flexible types**: Monetary, points, or mixed donations
- **Points rewards**: Earn points for charitable contributions
- **External tracking**: Integration with external donation services

### 💰 **Withdrawal Processing**
- **Multiple methods**: Bank transfer, mobile money, PayPal, crypto
- **Status tracking**: Complete workflow from request to completion
- **Admin controls**: Approval workflow with notes and processing
- **External integration**: Links to payment processing services

### 📊 **Advanced Analytics & Metrics**
- **User metrics**: Daily activity tracking and aggregation
- **System metrics**: Platform-wide statistics and reporting
- **Real-time updates**: Live data synchronization
- **External reporting**: Integration with analytics platforms

### 🔄 **Cross-Repository Communication**
- **Sync queue**: Asynchronous update processing
- **Webhooks**: Real-time event notifications
- **API endpoints**: RESTful service communication
- **Authentication**: Secure API key management

## Architecture Components

### 1. **Core Database Schema**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Core Tables   │    │   Sync System    │    │  External APIs  │
│                 │    │                  │    │                 │
│ • wallets      │    │ • sync_queue     │    │ • REST endpoints│
│ • rewards      │    │ • webhooks       │    │ • Webhook URLs  │
│ • donations    │    │ • auth keys      │    │ • Service mgmt  │
│ • withdrawals  │    │ • sync history   │    │ • Health checks │
│ • metrics      │    │ • retry logic    │    │ • Rate limiting │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. **Data Flow**
```
User Action → Database Update → Sync Queue → External Service → Confirmation
     ↓              ↓              ↓              ↓              ↓
  Profile     Wallet Update   Queue Item    API Call      Sync Complete
  Update      Points Earned   Priority      Webhook      Status Update
```

### 3. **Security Layers**
- **Row Level Security (RLS)**: User data isolation
- **API Key Management**: Secure service authentication
- **Webhook Signatures**: Tamper-proof notifications
- **Permission-based Access**: Granular service permissions

## Database Tables Overview

### **Core Tables**
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `enhanced_wallets` | User wallet management | Balance, points, tier, external sync |
| `reward_definitions` | Reward configuration | Types, costs, external integration |
| `user_rewards` | User reward instances | Status, expiration, external tracking |
| `donation_campaigns` | Donation initiatives | Targets, dates, external campaigns |
| `user_donations` | Individual donations | Amounts, types, external tracking |
| `withdrawal_requests` | Money withdrawal | Methods, status, external processing |
| `user_metrics` | Daily user statistics | Activity, points, donations |
| `system_metrics` | Platform statistics | Users, totals, external reporting |

### **Integration Tables**
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `external_services` | Service registry | URLs, types, health status |
| `service_api_keys` | Authentication | Permissions, expiration |
| `sync_queue` | Update queue | Priority, retry, status |
| `webhook_endpoints` | Notification URLs | Events, secrets, delivery |
| `wallet_sync_history` | Sync audit trail | Results, errors, timestamps |

## API Endpoints Structure

### **Base URL Pattern**
```
https://api.wozamali.com/v1/external/{service_id}/{resource}
```

### **Available Resources**
- **Wallets**: `/wallets/{user_id}` - Balance, points, transactions
- **Points**: `/users/{user_id}/points` - Earn, spend, history
- **Rewards**: `/rewards` - Definitions, issuance, user rewards
- **Donations**: `/donations` - Campaigns, user donations
- **Withdrawals**: `/withdrawals` - Requests, status, processing
- **Metrics**: `/metrics` - User stats, system analytics

### **Authentication Methods**
- **Bearer Token**: `Authorization: Bearer {api_key}`
- **Service ID**: `X-Service-ID: {service_id}`
- **Permissions**: JSON-based access control

## Webhook System

### **Supported Events**
- `wallet_update` - Balance or points changed
- `points_update` - Points earned or spent
- `reward_issue` - New reward issued
- `donation_create` - New donation made
- `withdrawal_request` - Withdrawal requested
- `metrics_update` - Analytics updated

### **Webhook Payload Example**
```json
{
  "event": "wallet_update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": "uuid",
    "wallet_id": "uuid",
    "balance_change": 10.50,
    "points_change": 100,
    "description": "Recycling reward",
    "new_balance": 25.75,
    "new_points": 450
  },
  "signature": "sha256=..."
}
```

## Integration Patterns

### **1. Real-time Updates (Webhooks)**
- **Use case**: Immediate notifications for critical events
- **Benefits**: Instant synchronization, real-time user experience
- **Best for**: Wallet updates, reward issuances, urgent notifications

### **2. Batch Processing (Sync Queue)**
- **Use case**: Bulk updates, offline processing, retry logic
- **Benefits**: Reliable delivery, error handling, performance
- **Best for**: Metrics aggregation, bulk operations, background tasks

### **3. On-demand API Calls**
- **Use case**: User-initiated actions, real-time queries
- **Benefits**: Immediate response, user control, flexibility
- **Best for**: Balance checks, reward redemptions, user actions

## Performance Optimizations

### **Database Indexes**
- **User lookups**: `user_id` on all user-related tables
- **Sync operations**: `status`, `priority`, `created_at` on sync queue
- **Metrics queries**: `user_id + date` composite indexes
- **External IDs**: `external_*_id` for cross-service lookups

### **Caching Strategies**
- **Wallet balances**: Redis caching for frequent reads
- **Reward definitions**: Application-level caching
- **User metrics**: Daily aggregation caching
- **Service health**: Heartbeat monitoring

### **Batch Operations**
- **Sync processing**: Process multiple items in single transaction
- **Metrics aggregation**: Daily batch updates
- **Webhook delivery**: Bulk notification processing
- **Data cleanup**: Scheduled maintenance operations

## Security Features

### **Data Protection**
- **Encryption at rest**: Sensitive data encryption
- **TLS 1.3**: Secure data transmission
- **Field-level encryption**: PII data protection
- **Audit logging**: Complete operation tracking

### **Access Control**
- **Row-level security**: User data isolation
- **API key permissions**: Granular service access
- **Webhook verification**: Signature validation
- **Rate limiting**: Abuse prevention

### **Compliance**
- **GDPR ready**: Data privacy controls
- **Audit trails**: Complete operation history
- **Data retention**: Configurable cleanup policies
- **Consent management**: User permission tracking

## Monitoring and Health

### **Service Health Checks**
```sql
-- Monitor external service health
SELECT 
    service_name,
    service_type,
    CASE 
        WHEN last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'healthy'
        WHEN last_heartbeat > NOW() - INTERVAL '1 hour' THEN 'warning'
        ELSE 'unhealthy'
    END as health_status
FROM external_services;
```

### **Sync Queue Monitoring**
```sql
-- Track sync queue performance
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM sync_queue 
GROUP BY status;
```

### **Error Tracking**
- **Failed syncs**: Automatic retry with exponential backoff
- **Webhook failures**: Delivery status monitoring
- **API errors**: Response code tracking
- **Performance metrics**: Response time monitoring

## Development Workflow

### **Local Setup**
```bash
# Start local environment
supabase start

# Apply schema
psql -h localhost -U postgres -d postgres -f schemas/rewards-metrics-system.sql

# Test integration
npm run test:integration
```

### **Testing Strategy**
- **Unit tests**: Individual function testing
- **Integration tests**: Cross-service communication
- **Load tests**: Performance under stress
- **Security tests**: Authentication and authorization

### **Deployment Process**
1. **Schema migration**: Apply database changes
2. **Service registration**: Register external services
3. **API key generation**: Create service authentication
4. **Webhook configuration**: Set up notification endpoints
5. **Health monitoring**: Verify service connectivity
6. **Load testing**: Validate performance
7. **Go-live**: Enable production traffic

## Use Cases and Examples

### **Recycling Reward Flow**
```
1. User recycles 5kg of plastic
2. System calculates reward: 50 points + $2.50
3. Wallet updated via update_wallet_with_sync()
4. Sync queue populated for external services
5. Webhooks sent to notification services
6. External services confirm receipt
7. Sync status updated to 'completed'
```

### **Donation Campaign**
```
1. Admin creates donation campaign
2. Users contribute money or points
3. System tracks progress toward goal
4. Metrics updated in real-time
5. External services notified via webhooks
6. Analytics platforms receive updates
7. Campaign completion triggers rewards
```

### **Withdrawal Processing**
```
1. User requests $50 withdrawal
2. System validates balance and limits
3. Withdrawal request created
4. Admin reviews and approves
5. External payment service notified
6. Payment processed and confirmed
7. User wallet updated and notified
```

## Future Enhancements

### **Planned Features**
- **Multi-currency support**: Different fiat and crypto currencies
- **Advanced analytics**: Machine learning insights
- **Gamification**: Challenges, leaderboards, achievements
- **Social features**: Sharing, referrals, community
- **Mobile SDK**: Native app integration
- **Third-party plugins**: Marketplace for extensions

### **Scalability Improvements**
- **Microservices**: Service decomposition
- **Event streaming**: Kafka/RabbitMQ integration
- **Global distribution**: Multi-region deployment
- **Auto-scaling**: Dynamic resource allocation
- **Performance optimization**: Query optimization, caching

## Support and Documentation

### **Resources Available**
- **API documentation**: Complete endpoint reference
- **Integration guides**: Step-by-step setup instructions
- **TypeScript types**: Complete type definitions
- **Example code**: Working integration examples
- **Troubleshooting**: Common issues and solutions

### **Getting Help**
- **Documentation**: Comprehensive guides and examples
- **Community**: Developer forums and discussions
- **Support**: Technical assistance and troubleshooting
- **Training**: Workshops and certification programs

## Conclusion

The WozaMali Rewards and Metrics System provides a comprehensive, secure, and scalable foundation for managing user engagement, rewards, and analytics while enabling seamless integration with external repositories and services. The system's architecture ensures reliability, performance, and security while maintaining flexibility for future enhancements and integrations.

Whether you're building a new service or integrating with existing infrastructure, this system provides the tools and patterns needed to create a robust, interconnected ecosystem that enhances user experience and drives engagement.
