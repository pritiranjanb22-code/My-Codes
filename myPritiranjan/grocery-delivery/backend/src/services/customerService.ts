import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

interface CustomerProfileData {
  fullName?: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  fcmToken?: string;
}

export class CustomerService {
  async getProfile(userId: string) {
    const result = await query(
      `SELECT cp.*, u.phone, u.email, u.full_name, u.role, u.created_at as user_created_at
       FROM customer_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async updateProfile(userId: string, data: CustomerProfileData) {
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (data.fullName !== undefined) {
      params.push(data.fullName);
      updates.push(`full_name = $${paramIndex++}`);
      // Also update users table
      await query('UPDATE users SET full_name = $1 WHERE id = $2', [data.fullName, userId]);
    }
    
    if (data.email !== undefined) {
      params.push(data.email);
      updates.push(`email = $${paramIndex++}`);
      // Also update users table
      await query('UPDATE users SET email = $1 WHERE id = $2', [data.email, userId]);
    }
    
    if (data.dateOfBirth !== undefined) {
      params.push(data.dateOfBirth);
      updates.push(`date_of_birth = $${paramIndex++}`);
    }
    
    if (data.gender !== undefined) {
      params.push(data.gender);
      updates.push(`gender = $${paramIndex++}`);
    }
    
    if (data.fcmToken !== undefined) {
      params.push(data.fcmToken);
      updates.push(`fcm_token = $${paramIndex++}`);
    }
    
    if (params.length === 0) {
      return this.getProfile(userId);
    }
    
    params.push(userId);
    
    const result = await query(
      `UPDATE customer_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      params
    );
    
    return result.rows[0];
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get current password hash
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }
    
    const newHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
    
    // Revoke all refresh tokens
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1', [userId]);
    
    return { success: true };
  }

  async getOrderHistory(userId: string, page: number = 1, limit: number = 20, status?: string) {
    // Get customer profile ID
    const profileResult = await query('SELECT id FROM customer_profiles WHERE user_id = $1', [userId]);
    
    if (profileResult.rows.length === 0) {
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    const customerId = profileResult.rows[0].id;
    
    let whereClause = 'WHERE o.customer_id = $1';
    const params: any[] = [customerId];
    
    if (status) {
      params.push(status);
      whereClause += ` AND o.status = $${params.length}`;
    }
    
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const ordersResult = await query(
      `SELECT o.*, a.house_number, a.street, a.area, a.city, a.pincode
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    // Get items for each order
    const orderIds = ordersResult.rows.map(o => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const itemsResult = await query(
        `SELECT * FROM order_items WHERE order_id = ANY($1)`,
        [orderIds]
      );
      items = itemsResult.rows;
    }
    
    // Get payments
    let payments: any[] = [];
    if (orderIds.length > 0) {
      const paymentsResult = await query(
        `SELECT * FROM payments WHERE order_id = ANY($1)`,
        [orderIds]
      );
      payments = paymentsResult.rows;
    }
    
    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    const paymentsByOrder = payments.reduce((acc, p) => {
      acc[p.order_id] = p;
      return acc;
    }, {} as Record<string, any>);
    
    const orders = ordersResult.rows.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      payment: paymentsByOrder[order.id] || null,
    }));
    
    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      countParams
    );
    
    return {
      orders,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async getStats(userId: string) {
    const profileResult = await query('SELECT id FROM customer_profiles WHERE user_id = $1', [userId]);
    
    if (profileResult.rows.length === 0) {
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    const customerId = profileResult.rows[0].id;
    
    const result = await query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE status IN ('confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery')) as active_orders
       FROM orders WHERE customer_id = $1`,
      [customerId]
    );
    
    return result.rows[0];
  }

  async reorder(orderId: string, userId: string) {
    const profileResult = await query('SELECT id FROM customer_profiles WHERE user_id = $1', [userId]);
    if (profileResult.rows.length === 0) {
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    const customerId = profileResult.rows[0].id;
    
    const orderResult = await query(
      `SELECT o.*, oi.* FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [orderId, customerId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    const items = orderResult.rows.map(row => ({
      productId: row.product_id,
      quantity: parseFloat(row.quantity),
    }));
    
    // Add to cart
    for (const item of items) {
      // Check if product is still available
      const productResult = await query(
        'SELECT is_active, stock_status, stock_quantity FROM products WHERE id = $1',
        [item.productId]
      );
      
      if (productResult.rows.length === 0) continue;
      
      const product = productResult.rows[0];
      if (!product.is_active || product.stock_status === 'out_of_stock') continue;
      
      const availableQty = Math.min(item.quantity, parseFloat(product.stock_quantity));
      if (availableQty <= 0) continue;
      
      await query(
        `INSERT INTO cart_items (customer_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (customer_id, product_id) DO UPDATE SET 
           quantity = LEAST(cart_items.quantity + $3, $4),
           updated_at = NOW()`,
        [customerId, item.productId, availableQty, parseFloat(product.stock_quantity)]
      );
    }
    
    return { success: true, itemsAdded: items.length };
  }

  async getCustomerById(customerId: string) {
    const result = await query(
      `SELECT u.id, u.phone, u.email, u.full_name, u.role, u.created_at,
              cp.loyalty_points, cp.total_orders, cp.total_spent
       FROM users u
       JOIN customer_profiles cp ON u.id = cp.user_id
       WHERE cp.id = $1`,
      [customerId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async getCustomerAddresses(customerId: string) {
    const result = await query(
      `SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  async getCustomerOrders(customerId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const ordersResult = await query(
      `SELECT o.*, a.house_number, a.street, a.area, a.city, a.pincode
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );
    
    const orderIds = ordersResult.rows.map(o => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const itemsResult = await query(
        `SELECT * FROM order_items WHERE order_id = ANY($1)`,
        [orderIds]
      );
      items = itemsResult.rows;
    }
    
    let payments: any[] = [];
    if (orderIds.length > 0) {
      const paymentsResult = await query(
        `SELECT * FROM payments WHERE order_id = ANY($1)`,
        [orderIds]
      );
      payments = paymentsResult.rows;
    }
    
    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    const paymentsByOrder = payments.reduce((acc, p) => {
      acc[p.order_id] = p;
      return acc;
    }, {} as Record<string, any>);
    
    const orders = ordersResult.rows.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      payment: paymentsByOrder[order.id] || null,
    }));
    
    const countResult = await query(
      `SELECT COUNT(*) FROM orders WHERE customer_id = $1`,
      [customerId]
    );
    
    return {
      orders,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }
}

export const customerService = new CustomerService();