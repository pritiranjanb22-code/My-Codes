import { query, getClient } from '../db/pool.js';
import { config } from '../config/index.js';
import { notificationService } from './notificationService.js';
import { AppError } from '../utils/AppError.js';
import { generateUpiQrCode, formatUpiUrl } from '../utils/qrCode.js';

interface CreateOrderData {
  customerId: string;
  addressId: string;
  notes?: string;
  couponCode?: string;
}

interface OrderItemData {
  productId: string;
  quantity: number;
}

export class OrderService {
  async createOrder(data: CreateOrderData, items: OrderItemData[]) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get shop settings for delivery charges
      const settingsResult = await client.query(
        'SELECT key, value FROM shop_settings WHERE key IN ($1, $2, $3, $4, $5)',
        ['delivery_charge', 'free_delivery_threshold', 'min_order_value', 'upi_id', 'tax_percentage']
      );
      
      const settings: Record<string, any> = {};
      for (const row of settingsResult.rows) {
        settings[row.key] = JSON.parse(row.value);
      }
      
      const deliveryCharge = settings.delivery_charge || 30;
      const freeDeliveryThreshold = settings.free_delivery_threshold || 500;
      const minOrderValue = settings.min_order_value || 100;
      const taxPercentage = settings.tax_percentage || 0;
      
      // Validate and calculate order
      let subtotal = 0;
      const orderItems: any[] = [];
      
      for (const item of items) {
        const productResult = await client.query(
          `SELECT id, name, image_url, selling_price, mrp_price, discount_percentage, unit, 
                  stock_quantity, min_order_quantity, max_order_quantity, is_active, stock_status
           FROM products WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );
        
        if (productResult.rows.length === 0) {
          throw new AppError(`Product not found: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
        }
        
        const product = productResult.rows[0];
        
        if (!product.is_active) {
          throw new AppError(`Product not available: ${product.name}`, 400, 'PRODUCT_UNAVAILABLE');
        }
        
        if (product.stock_status === 'out_of_stock' || product.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400, 'INSUFFICIENT_STOCK');
        }
        
        if (item.quantity < parseFloat(product.min_order_quantity)) {
          throw new AppError(`Minimum order quantity for ${product.name} is ${product.min_order_quantity} ${product.unit}`, 400, 'MIN_QUANTITY_NOT_MET');
        }
        
        if (product.max_order_quantity && item.quantity > parseFloat(product.max_order_quantity)) {
          throw new AppError(`Maximum order quantity for ${product.name} is ${product.max_order_quantity} ${product.unit}`, 400, 'MAX_QUANTITY_EXCEEDED');
        }
        
        const unitPrice = parseFloat(product.selling_price);
        const mrpPrice = product.mrp_price ? parseFloat(product.mrp_price) : null;
        const discountPercentage = parseFloat(product.discount_percentage) || 0;
        const totalPrice = unitPrice * item.quantity;
        
        subtotal += totalPrice;
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImageUrl: product.image_url,
          unit: product.unit,
          quantity: item.quantity,
          unitPrice,
          mrpPrice,
          discountPercentage,
          totalPrice,
        });
        
        // Update stock (will be committed only if order succeeds)
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1, 
                  stock_status = CASE 
                    WHEN stock_quantity - $1 <= 0 THEN 'out_of_stock'
                    WHEN stock_quantity - $1 <= low_stock_threshold THEN 'low_stock'
                    ELSE 'in_stock'
                  END,
                  updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, product.id]
        );
        
        // Log inventory change
        await client.query(
          `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_type, notes)
           VALUES ($1, 'order_deduction', -$2, $3, $4, 'order', 'Order deduction')`,
          [product.id, item.quantity, product.stock_quantity, product.stock_quantity - item.quantity]
        );
      }
      
      if (subtotal < minOrderValue) {
        throw new AppError(`Minimum order value is ₹${minOrderValue}`, 400, 'MIN_ORDER_VALUE_NOT_MET');
      }
      
      // Calculate delivery charge
      const applicableDeliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
      
      // Calculate tax
      const taxAmount = (subtotal * taxPercentage) / 100;
      
      // Calculate total
      const totalAmount = subtotal + applicableDeliveryCharge + taxAmount;
      
      // Generate order number
      const orderNumberResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\\d+') AS INTEGER)), 0) + 1 as next_num
         FROM orders WHERE order_number LIKE 'ORD%'`
      );
      const orderNumber = `ORD${String(orderNumberResult.rows[0].next_num).padStart(6, '0')}`;
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, customer_id, address_id, status, payment_status,
          subtotal, discount_amount, delivery_charge, tax_amount, total_amount, notes
        ) VALUES ($1, $2, $3, 'payment_pending', 'pending', $4, 0, $5, $6, $7, $8)
        RETURNING *`,
        [orderNumber, data.customerId, data.addressId, subtotal, applicableDeliveryCharge, taxAmount, totalAmount, data.notes || null]
      );
      
      const order = orderResult.rows[0];
      
      // Create order items
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_image_url, unit, quantity,
            unit_price, mrp_price, discount_percentage, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [order.id, item.productId, item.productName, item.productImageUrl, item.unit, item.quantity,
           item.unitPrice, item.mrpPrice, item.discountPercentage, item.totalPrice]
        );
      }
      
      // Create payment record
      const upiId = settings.upi_id || config.shop.upiId;
      await client.query(
        `INSERT INTO payments (order_id, amount, method, status, upi_id)
         VALUES ($1, $2, 'upi_manual', 'pending', $3)`,
        [order.id, totalAmount, upiId]
      );
      
      // Clear cart items for ordered products
      await client.query(
        `DELETE FROM cart_items WHERE customer_id = $1 AND product_id = ANY($2)`,
        [data.customerId, items.map(i => i.productId)]
      );
      
      await client.query('COMMIT');
      
      // Send notification
      await notificationService.notifyOrderPlaced(data.customerId, orderNumber, totalAmount);
      
      // Get complete order with items
      const completeOrder = await this.getOrderById(order.id);
      
      return completeOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderById(orderId: string) {
    const orderResult = await query(
      `SELECT o.*, a.*, u.phone as customer_phone, u.full_name as customer_name
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    const order = orderResult.rows[0];
    
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    const paymentResult = await query(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    );
    
    return {
      ...order,
      items: itemsResult.rows,
      payment: paymentResult.rows[0] || null,
    };
  }

  async getCustomerOrders(customerId: string, page: number = 1, limit: number = 20, status?: string) {
    let whereClause = 'WHERE o.customer_id = $1';
    const params: any[] = [customerId];
    
    if (status) {
      whereClause += ' AND o.status = $2';
      params.push(status);
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
    
    // Group items by order
    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    const orders = ordersResult.rows.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      status ? [customerId, status] : [customerId]
    );
    
    return {
      orders,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async getAllOrders(page: number = 1, limit: number = 20, filters: any = {}) {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (filters.status) {
      params.push(filters.status);
      whereClause += ` AND o.status = $${params.length}`;
    }
    
    if (filters.paymentStatus) {
      params.push(filters.paymentStatus);
      whereClause += ` AND o.payment_status = $${params.length}`;
    }
    
    if (filters.customerId) {
      params.push(filters.customerId);
      whereClause += ` AND o.customer_id = $${params.length}`;
    }
    
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      whereClause += ` AND o.created_at >= $${params.length}`;
    }
    
    if (filters.dateTo) {
      params.push(filters.dateTo);
      whereClause += ` AND o.created_at <= $${params.length}`;
    }
    
    if (filters.search) {
      params.push(`%${filters.search}%`);
      whereClause += ` AND (o.order_number ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }
    
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const ordersResult = await query(
      `SELECT o.*, cp.user_id, u.full_name as customer_name, u.phone as customer_phone,
              a.house_number, a.street, a.area, a.city, a.pincode
       FROM orders o
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
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
    
    // Get total count
    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       ${whereClause}`,
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

  async updateOrderStatus(orderId: string, status: string, notes?: string, adminId?: string) {
    const validStatuses = [
      'payment_pending',
      'payment_verification_pending',
      'confirmed',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid order status', 400, 'INVALID_STATUS');
    }
    
    const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];
    
    if (notes) {
      params.push(notes);
      updateFields.push(`notes = $${params.length}`);
    }
    
    if (status === 'confirmed') {
      updateFields.push('confirmed_at = NOW()');
    }
    
    if (status === 'delivered') {
      updateFields.push('delivered_at = NOW()');
    }
    
    if (status === 'cancelled') {
      updateFields.push('cancelled_at = NOW()');
      if (notes) {
        updateFields.push(`cancelled_reason = $${params.length}`);
      }
    }
    
    params.push(orderId);
    
    await query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );
    
    // Send notifications based on status
    const order = await this.getOrderById(orderId);
    
    switch (status) {
      case 'confirmed':
        await notificationService.notifyOrderConfirmed(order.customer_id, order.order_number);
        break;
      case 'preparing':
        await notificationService.notifyPreparing(order.customer_id, order.order_number);
        break;
      case 'out_for_delivery':
        await notificationService.notifyOutForDelivery(order.customer_id, order.order_number);
        break;
      case 'delivered':
        await notificationService.notifyDelivered(order.customer_id, order.order_number);
        break;
      case 'cancelled':
        await notificationService.notifyOrderCancelled(order.customer_id, order.order_number, notes || 'Cancelled by admin');
        // Restore stock
        await this.restoreStock(orderId);
        break;
    }
    
    return this.getOrderById(orderId);
  }

  async verifyPayment(orderId: string, action: 'confirm' | 'reject', adminId: string, rejectionReason?: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get payment
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE order_id = $1 FOR UPDATE',
        [orderId]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
      }
      
      const payment = paymentResult.rows[0];
      
      if (payment.status !== 'verification_pending') {
        throw new AppError('Payment is not pending verification', 400, 'INVALID_PAYMENT_STATUS');
      }
      
      // Get order
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }
      
      const order = orderResult.rows[0];
      
      if (action === 'confirm') {
        // Update payment
        await client.query(
          `UPDATE payments SET status = 'paid', verified_by = $1, verified_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [adminId, payment.id]
        );
        
        // Update order
        await client.query(
          `UPDATE orders SET payment_status = 'paid', status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        );
        
        await client.query('COMMIT');
        
        // Send notification
        await notificationService.notifyPaymentConfirmed(order.customer_id, order.order_number);
        await notificationService.notifyOrderConfirmed(order.customer_id, order.order_number);
        
      } else {
        // Reject payment
        await client.query(
          `UPDATE payments SET status = 'rejected', verified_by = $1, verified_at = NOW(), 
                  rejection_reason = $2, updated_at = NOW()
           WHERE id = $3`,
          [adminId, rejectionReason, payment.id]
        );
        
        // Update order
        await client.query(
          `UPDATE orders SET payment_status = 'rejected', status = 'payment_pending', updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        );
        
        // Restore stock
        await this.restoreStockForOrder(orderId, client);
        
        await client.query('COMMIT');
        
        // Send notification
        await notificationService.notifyPaymentRejected(order.customer_id, order.order_number, rejectionReason || 'Payment verification failed');
      }
      
      return this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async submitPaymentConfirmation(orderId: string, customerId: string, utrNumber: string, paymentAmount: number, paymentDate: string, paymentScreenshot?: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify order belongs to customer
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE',
        [orderId, customerId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }
      
      const order = orderResult.rows[0];
      
      if (order.payment_status !== 'pending') {
        throw new AppError('Payment already processed', 400, 'INVALID_PAYMENT_STATUS');
      }
      
      // Get payment record
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE order_id = $1 FOR UPDATE',
        [orderId]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
      }
      
      const payment = paymentResult.rows[0];
      
      // Verify amount matches
      if (paymentAmount !== parseFloat(order.total_amount.toString())) {
        throw new AppError('Payment amount does not match order total', 400, 'AMOUNT_MISMATCH');
      }
      
      // Update payment with customer submission
      await client.query(
        `UPDATE payments SET 
          upi_transaction_id = $1,
          upi_transaction_amount = $2,
          upi_transaction_date = $3,
          payment_screenshot_url = $4,
          status = 'verification_pending',
          updated_at = NOW()
         WHERE id = $5`,
        [utrNumber, paymentAmount, paymentDate, paymentScreenshot || null, payment.id]
      );
      
      // Update order status
      await client.query(
        `UPDATE orders SET payment_status = 'verification_pending', status = 'payment_verification_pending', updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      );
      
      await client.query('COMMIT');
      
      // Send notification
      await notificationService.notifyPaymentVerificationPending(customerId, order.order_number);
      
      return this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPaymentDetails(orderId: string) {
    const paymentResult = await query(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    );
    
    if (paymentResult.rows.length === 0) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }
    
    const payment = paymentResult.rows[0];
    
    // Generate QR code
    const qrCode = await generateUpiQrCode(payment.upi_id || config.shop.upiId, parseFloat(payment.amount.toString()));
    const upiUrl = formatUpiUrl(payment.upi_id || config.shop.upiId, parseFloat(payment.amount.toString()));
    
    return {
      ...payment,
      qrCode,
      upiUrl,
      instructions: config.shop.paymentInstructions,
    };
  }

  private async restoreStock(orderId: string) {
    const itemsResult = await query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    for (const item of itemsResult.rows) {
      await query(
        `UPDATE products SET 
           stock_quantity = stock_quantity + $1,
           stock_status = CASE 
             WHEN stock_quantity + $1 > low_stock_threshold THEN 'in_stock'
             WHEN stock_quantity + $1 > 0 THEN 'low_stock'
             ELSE 'out_of_stock'
           END,
           updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
      
      // Log inventory change
      const productResult = await query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
      const previousStock = parseFloat(productResult.rows[0]?.stock_quantity || '0');
      
      await query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_type, notes)
         VALUES ($1, 'return', $2, $3, $4, 'order', 'Order cancelled - stock restored')`,
        [item.product_id, item.quantity, previousStock, previousStock + item.quantity]
      );
    }
  }

  private async restoreStockForOrder(orderId: string, client: any) {
    const itemsResult = await client.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE products SET 
           stock_quantity = stock_quantity + $1,
           stock_status = CASE 
             WHEN stock_quantity + $1 > low_stock_threshold THEN 'in_stock'
             WHEN stock_quantity + $1 > 0 THEN 'low_stock'
             ELSE 'out_of_stock'
           END,
           updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
      
      const productResult = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
      const previousStock = parseFloat(productResult.rows[0]?.stock_quantity || '0');
      
      await client.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_type, notes)
         VALUES ($1, 'return', $2, $3, $4, 'order', 'Payment rejected - stock restored')`,
        [item.product_id, item.quantity, previousStock, previousStock + item.quantity]
      );
    }
  }

  async getOrderStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= $1) as today_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= $1), 0) as today_sales,
        COUNT(*) FILTER (WHERE payment_status = 'verification_pending') as pending_payments,
        COUNT(*) FILTER (WHERE status = 'confirmed') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'out_for_delivery') as delivering_orders,
        COUNT(*) FILTER (WHERE status = 'delivered' AND created_at >= $1) as completed_today,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND created_at >= $1) as cancelled_today
      FROM orders
    `, [today]);
    
    const lowStockResult = await query(`
      SELECT COUNT(*) as count FROM products 
      WHERE stock_status = 'low_stock' OR stock_status = 'out_of_stock'
    `);
    
    return {
      ...stats.rows[0],
      lowStockProducts: parseInt(lowStockResult.rows[0].count),
    };
  }
}

export const orderService = new OrderService();