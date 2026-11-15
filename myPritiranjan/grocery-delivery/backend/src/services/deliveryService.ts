import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from './notificationService.js';

interface AssignDeliveryData {
  orderId: string;
  deliveryPersonId: string;
}

interface UpdateDeliveryStatusData {
  status: 'picked_up' | 'out_for_delivery' | 'delivered';
  deliveryOtp?: string;
  customerSignature?: string;
  notes?: string;
}

export class DeliveryService {
  async getDeliveryPersons(availableOnly: boolean = false) {
    let whereClause = 'WHERE u.is_active = true';
    if (availableOnly) {
      whereClause += ' AND dp.is_available = true';
    }
    
    const result = await query(
      `SELECT dp.*, u.full_name, u.phone
       FROM delivery_persons dp
       JOIN users u ON dp.user_id = u.id
       ${whereClause}
       ORDER BY dp.created_at`
    );
    
    return result.rows;
  }

  async getDeliveryPersonById(deliveryPersonId: string) {
    const result = await query(
      `SELECT dp.*, u.full_name, u.phone
       FROM delivery_persons dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.id = $1`,
      [deliveryPersonId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Delivery person not found', 404, 'DELIVERY_PERSON_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async getDeliveryPersonByUserId(userId: string) {
    const result = await query(
      `SELECT dp.*, u.full_name, u.phone
       FROM delivery_persons dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.user_id = $1`,
      [userId]
    );
    
    return result.rows[0] || null;
  }

  async createDeliveryPerson(userId: string, data: { employeeId: string; vehicleType?: string; vehicleNumber?: string; licenseNumber?: string }) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const userResult = await client.query(
        'SELECT id, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      
      if (userResult.rows[0].role !== 'delivery_person') {
        throw new AppError('User must have delivery_person role', 400, 'INVALID_ROLE');
      }
      
      const existingResult = await client.query(
        'SELECT id FROM delivery_persons WHERE user_id = $1',
        [userId]
      );
      
      if (existingResult.rows.length > 0) {
        throw new AppError('User is already a delivery person', 409, 'ALREADY_DELIVERY_PERSON');
      }
      
      const result = await client.query(
        `INSERT INTO delivery_persons (user_id, employee_id, vehicle_type, vehicle_number, license_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, data.employeeId, data.vehicleType || null, data.vehicleNumber || null, data.licenseNumber || null]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDeliveryPerson(deliveryPersonId: string, data: { isAvailable?: boolean; vehicleType?: string; vehicleNumber?: string; licenseNumber?: string; currentLatitude?: number; currentLongitude?: number }) {
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (data.isAvailable !== undefined) {
      params.push(data.isAvailable);
      updates.push(`is_available = $${paramIndex++}`);
    }
    
    if (data.vehicleType !== undefined) {
      params.push(data.vehicleType);
      updates.push(`vehicle_type = $${paramIndex++}`);
    }
    
    if (data.vehicleNumber !== undefined) {
      params.push(data.vehicleNumber);
      updates.push(`vehicle_number = $${paramIndex++}`);
    }
    
    if (data.licenseNumber !== undefined) {
      params.push(data.licenseNumber);
      updates.push(`license_number = $${paramIndex++}`);
    }
    
    if (data.currentLatitude !== undefined && data.currentLongitude !== undefined) {
      params.push(data.currentLatitude, data.currentLongitude);
      updates.push(`current_latitude = $${paramIndex++}, current_longitude = $${paramIndex++}, last_location_update = NOW()`);
    }
    
    params.push(deliveryPersonId);
    
    const result = await query(
      `UPDATE delivery_persons SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Delivery person not found', 404, 'DELIVERY_PERSON_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async assignOrder(data: AssignDeliveryData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const orderResult = await client.query(
        `SELECT o.*, a.house_number, a.street, a.area, a.city, a.pincode, a.latitude, a.longitude,
                u.full_name as customer_name, u.phone as customer_phone
         FROM orders o
         JOIN addresses a ON o.address_id = a.id
         JOIN customer_profiles cp ON o.customer_id = cp.id
         JOIN users u ON cp.user_id = u.id
         WHERE o.id = $1 FOR UPDATE`,
        [data.orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }
      
      const order = orderResult.rows[0];
      
      if (order.status !== 'ready_for_delivery') {
        throw new AppError(`Order must be ready for delivery to assign. Current status: ${order.status}`, 400, 'INVALID_ORDER_STATUS');
      }
      
      const dpResult = await client.query(
        'SELECT * FROM delivery_persons WHERE id = $1 AND is_available = true FOR UPDATE',
        [data.deliveryPersonId]
      );
      
      if (dpResult.rows.length === 0) {
        throw new AppError('Delivery person not found or not available', 404, 'DELIVERY_PERSON_UNAVAILABLE');
      }
      
      const deliveryPerson = dpResult.rows[0];
      
      const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const assignmentResult = await client.query(
        `INSERT INTO delivery_assignments (order_id, delivery_person_id, delivery_otp)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.orderId, data.deliveryPersonId, deliveryOtp]
      );
      
      await client.query(
        `UPDATE orders SET status = 'out_for_delivery', updated_at = NOW() WHERE id = $1`,
        [data.orderId]
      );
      
      await client.query(
        `UPDATE delivery_persons SET is_available = false, updated_at = NOW() WHERE id = $1`,
        [data.deliveryPersonId]
      );
      
      await client.query('COMMIT');
      
      await notificationService.notifyOutForDelivery(
        order.customer_id,
        order.order_number,
        deliveryPerson.full_name,
        deliveryPerson.phone
      );
      
      return {
        assignment: assignmentResult.rows[0],
        order,
        deliveryPerson,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDeliveryAssignments(deliveryPersonId: string, status?: string) {
    let whereClause = 'WHERE da.delivery_person_id = $1';
    const params: any[] = [deliveryPersonId];
    
    if (status) {
      params.push(status);
      whereClause += ` AND da.status = $${params.length}`;
    }
    
    const result = await query(
      `SELECT da.*, o.order_number, o.total_amount, o.status as order_status,
              a.house_number, a.street, a.area, a.city, a.pincode, a.latitude, a.longitude,
              u.full_name as customer_name, u.phone as customer_phone
       FROM delivery_assignments da
       JOIN orders o ON da.order_id = o.id
       JOIN addresses a ON o.address_id = a.id
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       ${whereClause}
       ORDER BY da.assigned_at DESC`,
      params
    );
    
    return result.rows;
  }

  async getAssignmentByOrderId(orderId: string) {
    const result = await query(
      `SELECT da.*, dp.employee_id, u.full_name as delivery_person_name, u.phone as delivery_person_phone
       FROM delivery_assignments da
       JOIN delivery_persons dp ON da.delivery_person_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE da.order_id = $1`,
      [orderId]
    );
    
    return result.rows[0] || null;
  }

  async updateDeliveryStatus(deliveryPersonId: string, orderId: string, data: UpdateDeliveryStatusData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const assignmentResult = await client.query(
        'SELECT * FROM delivery_assignments WHERE order_id = $1 AND delivery_person_id = $2 FOR UPDATE',
        [orderId, deliveryPersonId]
      );
      
      if (assignmentResult.rows.length === 0) {
        throw new AppError('Delivery assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
      }
      
      const assignment = assignmentResult.rows[0];
      
      const validTransitions: Record<string, string[]> = {
        picked_up: ['assigned'],
        out_for_delivery: ['picked_up'],
        delivered: ['out_for_delivery'],
      };
      
      const currentStatus = assignment.picked_up_at ? 'picked_up' : 
                           assignment.out_for_delivery_at ? 'out_for_delivery' : 'assigned';
      
      if (!validTransitions[data.status]?.includes(currentStatus)) {
        throw new AppError(`Invalid status transition from ${currentStatus} to ${data.status}`, 400, 'INVALID_STATUS_TRANSITION');
      }
      
      if (data.status === 'delivered' && assignment.delivery_otp) {
        if (!data.deliveryOtp || data.deliveryOtp !== assignment.delivery_otp) {
          throw new AppError('Invalid delivery OTP', 400, 'INVALID_OTP');
        }
      }
      
      const updateFields: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let paramIndex = 1;
      
      if (data.status === 'picked_up') {
        updateFields.push('picked_up_at = NOW()');
      } else if (data.status === 'out_for_delivery') {
        updateFields.push('out_for_delivery_at = NOW()');
      } else if (data.status === 'delivered') {
        updateFields.push('delivered_at = NOW()');
      }
      
      if (data.notes) {
        params.push(data.notes);
        updateFields.push(`delivery_notes = $${paramIndex++}`);
      }
      
      if (data.customerSignature) {
        params.push(data.customerSignature);
        updateFields.push(`customer_signature_url = $${paramIndex++}`);
      }
      
      params.push(orderId, deliveryPersonId);
      
      await client.query(
        `UPDATE delivery_assignments SET ${updateFields.join(', ')} WHERE order_id = $${paramIndex++} AND delivery_person_id = $${paramIndex++}`,
        params
      );
      
      let orderStatus = '';
      if (data.status === 'picked_up') orderStatus = 'out_for_delivery';
      else if (data.status === 'delivered') orderStatus = 'delivered';
      
      if (orderStatus) {
        await client.query(
          `UPDATE orders SET status = $1, updated_at = NOW() ${orderStatus === 'delivered' ? ', delivered_at = NOW()' : ''} WHERE id = $2`,
          [orderStatus, orderId]
        );
      }
      
      if (data.status === 'delivered') {
        await client.query(
          `UPDATE delivery_persons SET is_available = true, total_deliveries = total_deliveries + 1, updated_at = NOW() WHERE id = $1`,
          [deliveryPersonId]
        );
        
        const orderResult = await client.query(
          'SELECT customer_id, order_number FROM orders WHERE id = $1',
          [orderId]
        );
        
        if (orderResult.rows.length > 0) {
          await notificationService.notifyDelivered(orderResult.rows[0].customer_id, orderResult.rows[0].order_number);
        }
      }
      
      await client.query('COMMIT');
      
      return this.getAssignmentByOrderId(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderDeliveryDetails(orderId: string) {
    const result = await query(
      `SELECT o.*, a.*, u.full_name as customer_name, u.phone as customer_phone,
              da.*, dp.employee_id, dp.vehicle_type, dp.vehicle_number,
              dpu.full_name as delivery_person_name, dpu.phone as delivery_person_phone
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN delivery_assignments da ON o.id = da.order_id
       LEFT JOIN delivery_persons dp ON da.delivery_person_id = dp.id
       LEFT JOIN users dpu ON dp.user_id = dpu.id
       WHERE o.id = $1`,
      [orderId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async getDeliveryStats(deliveryPersonId?: string) {
    let whereClause = '';
    const params: any[] = [];
    
    if (deliveryPersonId) {
      whereClause = 'WHERE da.delivery_person_id = $1';
      params.push(deliveryPersonId);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE da.assigned_at >= $${params.length + 1}) as today_assigned,
        COUNT(*) FILTER (WHERE da.status = 'out_for_delivery') as out_for_delivery,
        COUNT(*) FILTER (WHERE da.delivered_at >= $${params.length + 1}) as today_delivered,
        COUNT(*) FILTER (WHERE da.status = 'assigned') as pending_pickup
       FROM delivery_assignments da
       ${whereClause}`,
      [...params, today]
    );
    
    return result.rows[0];
  }
}

export const deliveryService = new DeliveryService();