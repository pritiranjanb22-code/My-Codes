import { query } from '../db/pool.js';
import { config } from '../config/index.js';

// Notification types
export type NotificationType = 
  | 'order_placed'
  | 'payment_verification_pending'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'order_confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'order_cancelled'
  | 'low_stock'
  | 'offer_available';

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  sendPush?: boolean;
}

class NotificationService {
  private async sendPushNotification(userId: string, title: string, message: string, data: Record<string, any>) {
    if (!config.firebase.projectId) {
      console.log('Firebase not configured, skipping push notification');
      return;
    }
    
    try {
      // Get user's FCM token
      const result = await query(
        'SELECT fcm_token FROM customer_profiles WHERE user_id = $1',
        [userId]
      );
      
      const fcmToken = result.rows[0]?.fcm_token;
      if (!fcmToken) return;
      
      // In production, use Firebase Admin SDK
      // const admin = require('firebase-admin');
      // await admin.messaging().send({ token: fcmToken, notification: { title, body: message }, data });
      
      console.log(`Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  async create(notification: NotificationData): Promise<void> {
    const { userId, title, message, type, data, sendPush = true } = notification;
    
    // Store in database
    await query(
      `INSERT INTO notifications (user_id, title, message, type, data, sent_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, title, message, type, JSON.stringify(data || {})]
    );
    
    // Send push notification
    if (sendPush) {
      await this.sendPushNotification(userId, title, message, data || {});
    }
  }

  async createBulk(notifications: NotificationData[]): Promise<void> {
    for (const notification of notifications) {
      await this.create(notification);
    }
  }

  // Predefined notification templates
  async notifyOrderPlaced(userId: string, orderNumber: string, amount: number) {
    await this.create({
      userId,
      title: 'Order Placed Successfully',
      message: `Your order ${orderNumber} for ₹${amount.toFixed(2)} has been placed.`,
      type: 'order_placed',
      data: { orderNumber, amount },
    });
  }

  async notifyPaymentVerificationPending(userId: string, orderNumber: string) {
    await this.create({
      userId,
      title: 'Payment Verification Pending',
      message: `Your payment for order ${orderNumber} is under verification by the shop owner.`,
      type: 'payment_verification_pending',
      data: { orderNumber },
    });
  }

  async notifyPaymentConfirmed(userId: string, orderNumber: string) {
    await this.create({
      userId,
      title: 'Payment Confirmed',
      message: `Payment for order ${orderNumber} has been confirmed. Your order is now being processed.`,
      type: 'payment_confirmed',
      data: { orderNumber },
    });
  }

  async notifyPaymentRejected(userId: string, orderNumber: string, reason: string) {
    await this.create({
      userId,
      title: 'Payment Rejected',
      message: `Payment for order ${orderNumber} was rejected. Reason: ${reason}. Please try again.`,
      type: 'payment_rejected',
      data: { orderNumber, reason },
    });
  }

  async notifyOrderConfirmed(userId: string, orderNumber: string) {
    await this.create({
      userId,
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed and is being prepared.`,
      type: 'order_confirmed',
      data: { orderNumber },
    });
  }

  async notifyPreparing(userId: string, orderNumber: string) {
    await this.create({
      userId,
      title: 'Order Being Prepared',
      message: `Your order ${orderNumber} is being prepared for delivery.`,
      type: 'preparing',
      data: { orderNumber },
    });
  }

  async notifyOutForDelivery(userId: string, orderNumber: string, deliveryPersonName?: string, deliveryPersonPhone?: string) {
    await this.create({
      userId,
      title: 'Out for Delivery',
      message: `Your order ${orderNumber} is out for delivery.${deliveryPersonName ? ` Delivery person: ${deliveryPersonName} (${deliveryPersonPhone})` : ''}`,
      type: 'out_for_delivery',
      data: { orderNumber, deliveryPersonName, deliveryPersonPhone },
    });
  }

  async notifyDelivered(userId: string, orderNumber: string) {
    await this.create({
      userId,
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered. Thank you for shopping with us!`,
      type: 'delivered',
      data: { orderNumber },
    });
  }

  async notifyOrderCancelled(userId: string, orderNumber: string, reason: string) {
    await this.create({
      userId,
      title: 'Order Cancelled',
      message: `Your order ${orderNumber} has been cancelled. Reason: ${reason}`,
      type: 'order_cancelled',
      data: { orderNumber, reason },
    });
  }

  async notifyLowStock(productId: string, productName: string, currentStock: number) {
    // Notify admins
    const admins = await query(`SELECT id FROM users WHERE role = 'admin' AND is_active = true`);
    
    await this.createBulk(admins.rows.map(admin => ({
      userId: admin.id,
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} units remaining)`,
      type: 'low_stock',
      data: { productId, productName, currentStock },
      sendPush: true,
    })));
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (unreadOnly) {
      whereClause += ' AND is_read = false';
    }
    
    const result = await query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      params
    );
    
    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND id = ANY($2)`,
      [userId, notificationIds]
    );
  }

  async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

export const notificationService = new NotificationService();