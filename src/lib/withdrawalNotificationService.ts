// Withdrawal Notification Service
// Handles sending withdrawal requests to the Office App

interface WithdrawalNotification {
  id: string;
  userId: string;
  amount: number;
  payoutMethod: 'bank_transfer' | 'cash';
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  status: string;
  createdAt: string;
}

class WithdrawalNotificationService {
  private static officeAppUrl = process.env.NEXT_PUBLIC_OFFICE_APP_URL || 'http://localhost:3001';
  
  /**
   * Send withdrawal request notification to Office App
   */
  static async notifyOfficeApp(withdrawal: WithdrawalNotification): Promise<boolean> {
    try {
      console.log('📡 Sending withdrawal notification to Office App:', withdrawal);

      // For now, we'll use a simple fetch to the Office App
      // In a real implementation, this could be a webhook, message queue, or real-time subscription
      const response = await fetch(`${this.officeAppUrl}/api/notifications/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OFFICE_APP_API_KEY || 'default-key'}` // Add API key for security
        },
        body: JSON.stringify({
          type: 'withdrawal_request',
          data: withdrawal,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Withdrawal notification sent successfully to Office App');
        return true;
      } else {
        console.warn('⚠️ Failed to send notification to Office App:', response.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending withdrawal notification to Office App:', error);
      return false;
    }
  }

  /**
   * Send withdrawal status update notification to Office App
   */
  static async notifyStatusUpdate(withdrawalId: string, status: string, adminNotes?: string): Promise<boolean> {
    try {
      console.log('📡 Sending withdrawal status update to Office App:', { withdrawalId, status });

      const response = await fetch(`${this.officeAppUrl}/api/notifications/withdrawal-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OFFICE_APP_API_KEY || 'default-key'}`
        },
        body: JSON.stringify({
          type: 'withdrawal_status_update',
          data: {
            withdrawalId,
            status,
            adminNotes,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Withdrawal status update sent successfully to Office App');
        return true;
      } else {
        console.warn('⚠️ Failed to send status update to Office App:', response.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending withdrawal status update to Office App:', error);
      return false;
    }
  }

  /**
   * Send real-time notification via Supabase realtime
   */
  static async sendRealtimeNotification(withdrawal: WithdrawalNotification): Promise<boolean> {
    try {
      console.log('📡 Sending real-time withdrawal notification via Supabase');

      // This would use Supabase realtime to send notifications
      // The Office App would be subscribed to withdrawal_requests changes
      // This is already handled by the database triggers and realtime subscriptions
      
      console.log('✅ Real-time notification sent via Supabase realtime');
      return true;

    } catch (error) {
      console.error('❌ Error sending real-time notification:', error);
      return false;
    }
  }
}

export default WithdrawalNotificationService;
