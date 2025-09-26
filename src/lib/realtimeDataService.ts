import { supabase } from './supabase';
import { WorkingWalletService } from './workingWalletService';

interface RealtimeSubscription {
  channel: any;
  userId: string;
  type: 'wallet' | 'collections' | 'withdrawals' | 'notifications';
}

class RealtimeDataService {
  private static instance: RealtimeDataService;
  private subscriptions = new Map<string, RealtimeSubscription>();
  private reconnectAttempts = new Map<string, number>();
  private isOnline = true;
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();

  static getInstance(): RealtimeDataService {
    if (!RealtimeDataService.instance) {
      RealtimeDataService.instance = new RealtimeDataService();
    }
    return RealtimeDataService.instance;
  }

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnectAllSubscriptions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Reconnect when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.reconnectAllSubscriptions();
      }
    });
  }

  /**
   * Subscribe to real-time wallet updates for a user
   */
  subscribeToWalletUpdates(userId: string, onUpdate: (data: any) => void): string {
    const subscriptionId = `wallet_${userId}`;
    
    // Clean up existing subscription
    this.unsubscribe(subscriptionId);

    const channel = supabase
      .channel(`wallet_updates_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'unified_collections',
          filter: `customer_id=eq.${userId}` 
        }, 
        async (payload) => {
          console.log('🔄 Real-time collection update detected:', payload);
          try {
            // Fetch fresh wallet data
            const walletData = await WorkingWalletService.getWalletData(userId);
            onUpdate(walletData);
          } catch (error) {
            console.error('Error fetching updated wallet data:', error);
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'withdrawal_requests',
          filter: `user_id=eq.${userId}` 
        }, 
        async (payload) => {
          console.log('🔄 Real-time withdrawal update detected:', payload);
          try {
            const walletData = await WorkingWalletService.getWalletData(userId);
            onUpdate(walletData);
          } catch (error) {
            console.error('Error fetching updated wallet data:', error);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Real-time wallet subscription connected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Wallet real-time subscription active');
          this.reconnectAttempts.set(subscriptionId, 0);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('❌ Wallet subscription error, attempting reconnect...');
          this.scheduleReconnect(subscriptionId, () => this.subscribeToWalletUpdates(userId, onUpdate));
        }
      });

    this.subscriptions.set(subscriptionId, {
      channel,
      userId,
      type: 'wallet'
    });

    return subscriptionId;
  }

  /**
   * Subscribe to real-time collection updates
   */
  subscribeToCollectionUpdates(userId: string, onUpdate: (data: any) => void): string {
    const subscriptionId = `collections_${userId}`;
    
    this.unsubscribe(subscriptionId);

    const channel = supabase
      .channel(`collections_updates_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'unified_collections',
          filter: `customer_id=eq.${userId}` 
        }, 
        (payload) => {
          console.log('📦 Real-time collection change:', payload);
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Collections real-time subscription active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.scheduleReconnect(subscriptionId, () => this.subscribeToCollectionUpdates(userId, onUpdate));
        }
      });

    this.subscriptions.set(subscriptionId, {
      channel,
      userId,
      type: 'collections'
    });

    return subscriptionId;
  }

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotificationUpdates(userId: string, onUpdate: (data: any) => void): string {
    const subscriptionId = `notifications_${userId}`;
    
    this.unsubscribe(subscriptionId);

    const channel = supabase
      .channel(`notifications_updates_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}` 
        }, 
        (payload) => {
          console.log('🔔 Real-time notification:', payload);
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Notifications real-time subscription active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.scheduleReconnect(subscriptionId, () => this.subscribeToNotificationUpdates(userId, onUpdate));
        }
      });

    this.subscriptions.set(subscriptionId, {
      channel,
      userId,
      type: 'notifications'
    });

    return subscriptionId;
  }

  /**
   * Subscribe to all real-time updates for a user
   */
  subscribeToAllUpdates(userId: string, callbacks: {
    onWalletUpdate?: (data: any) => void;
    onCollectionUpdate?: (data: any) => void;
    onNotificationUpdate?: (data: any) => void;
  }): string[] {
    const subscriptionIds: string[] = [];

    if (callbacks.onWalletUpdate) {
      subscriptionIds.push(this.subscribeToWalletUpdates(userId, callbacks.onWalletUpdate));
    }

    if (callbacks.onCollectionUpdate) {
      subscriptionIds.push(this.subscribeToCollectionUpdates(userId, callbacks.onCollectionUpdate));
    }

    if (callbacks.onNotificationUpdate) {
      subscriptionIds.push(this.subscribeToNotificationUpdates(userId, callbacks.onNotificationUpdate));
    }

    return subscriptionIds;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      try {
        supabase.removeChannel(subscription.channel);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      this.subscriptions.delete(subscriptionId);
      this.reconnectAttempts.delete(subscriptionId);
      
      const timeout = this.reconnectTimeouts.get(subscriptionId);
      if (timeout) {
        clearTimeout(timeout);
        this.reconnectTimeouts.delete(subscriptionId);
      }
    }
  }

  /**
   * Unsubscribe from all subscriptions for a user
   */
  unsubscribeUser(userId: string): void {
    const userSubscriptions = Array.from(this.subscriptions.keys()).filter(id => 
      id.includes(userId)
    );
    
    userSubscriptions.forEach(id => this.unsubscribe(id));
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(subscriptionId: string, reconnectFn: () => void): void {
    if (!this.isOnline) return;

    const attempts = this.reconnectAttempts.get(subscriptionId) || 0;
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      console.error(`Max reconnection attempts reached for ${subscriptionId}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
    
    const timeout = setTimeout(() => {
      if (this.isOnline) {
        console.log(`Reconnecting ${subscriptionId} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(subscriptionId, attempts + 1);
        reconnectFn();
      }
    }, delay);

    this.reconnectTimeouts.set(subscriptionId, timeout);
  }

  /**
   * Reconnect all active subscriptions
   */
  private reconnectAllSubscriptions(): void {
    console.log('🔄 Reconnecting all real-time subscriptions...');
    this.subscriptions.forEach((subscription, id) => {
      this.reconnectAttempts.set(id, 0);
      // Note: Actual reconnection would need to be handled by the calling components
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isOnline: boolean; activeSubscriptions: number } {
    return {
      isOnline: this.isOnline,
      activeSubscriptions: this.subscriptions.size
    };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((subscription, id) => {
      this.unsubscribe(id);
    });
  }
}

export const realtimeDataService = RealtimeDataService.getInstance();
export default realtimeDataService;
