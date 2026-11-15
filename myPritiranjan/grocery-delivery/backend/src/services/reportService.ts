import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

interface DateRange {
  from: string;
  to: string;
}

export class ReportService {
  async getSalesReport(dateRange: DateRange, groupBy: 'day' | 'week' | 'month' = 'day') {
    let dateFormat: string;
    let groupByClause: string;
    
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupByClause = "DATE(created_at)";
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        groupByClause = "DATE_TRUNC('week', created_at)";
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupByClause = "DATE_TRUNC('month', created_at)";
        break;
    }
    
    const result = await query(
      `SELECT 
        TO_CHAR(${groupByClause}, $1) as period,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as total_sales,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'cancelled'), 0) as cancelled_sales,
        COALESCE(AVG(total_amount) FILTER (WHERE status = 'delivered'), 0) as avg_order_value
       FROM orders
       WHERE created_at >= $2 AND created_at <= $3
       GROUP BY ${groupByClause}
       ORDER BY ${groupByClause}`,
      [dateFormat, dateRange.from, dateRange.to]
    );
    
    return result.rows;
  }

  async getProductSalesReport(dateRange: DateRange, limit: number = 20) {
    const result = await query(
      `SELECT 
        p.id, p.name, p.selling_price, p.unit, c.name as category_name,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'delivered'
       GROUP BY p.id, p.name, p.selling_price, p.unit, c.name
       ORDER BY total_quantity_sold DESC
       LIMIT $3`,
      [dateRange.from, dateRange.to, limit]
    );
    
    return result.rows;
  }

  async getCustomerStats(dateRange: DateRange) {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT o.customer_id) as unique_customers,
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(*) FILTER (WHERE o.status = 'delivered') as completed_orders,
        COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE cp.created_at >= $1 AND cp.created_at <= $2) as new_customers
       FROM orders o
       JOIN customer_profiles cp ON o.customer_id = cp.id
       WHERE o.created_at >= $1 AND o.created_at <= $2`,
      [dateRange.from, dateRange.to]
    );
    
    return result.rows[0];
  }

  async getTopCustomers(limit: number = 10, dateRange?: DateRange) {
    let whereClause = 'WHERE o.status = $1';
    const params: any[] = ['delivered'];
    
    if (dateRange) {
      params.push(dateRange.from, dateRange.to);
      whereClause += ` AND o.created_at >= $${params.length - 1} AND o.created_at <= $${params.length}`;
    }
    
    params.push(limit);
    
    const result = await query(
      `SELECT 
        cp.id as customer_id, u.full_name, u.phone, u.email,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
       FROM orders o
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       ${whereClause}
       GROUP BY cp.id, u.full_name, u.phone, u.email
       ORDER BY total_spent DESC
       LIMIT $${params.length}`,
      params
    );
    
    return result.rows;
  }

  async getInventoryReport() {
    const result = await query(
      `SELECT 
        p.id, p.name, p.sku, p.unit, p.stock_quantity, p.low_stock_threshold,
        p.stock_status, p.selling_price, c.name as category_name,
        (p.stock_quantity * p.selling_price) as stock_value
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true
       ORDER BY 
        CASE p.stock_status 
          WHEN 'out_of_stock' THEN 0
          WHEN 'low_stock' THEN 1
          ELSE 2
        END,
        p.stock_quantity ASC`
    );
    
    return result.rows;
  }

  async getLowStockReport() {
    const result = await query(
      `SELECT 
        p.id, p.name, p.unit, p.stock_quantity, p.low_stock_threshold,
        p.stock_status, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.stock_status IN ('low_stock', 'out_of_stock')
       ORDER BY 
        CASE p.stock_status WHEN 'out_of_stock' THEN 0 ELSE 1 END,
        p.stock_quantity ASC`
    );
    
    return result.rows;
  }

  async getDeliveryReport(dateRange: DateRange) {
    const result = await query(
      `SELECT 
        da.delivery_person_id,
        u.full_name as delivery_person_name,
        dp.employee_id,
        COUNT(*) as total_deliveries,
        COUNT(*) FILTER (WHERE da.status = 'delivered') as completed_deliveries,
        COUNT(*) FILTER (WHERE da.status != 'delivered') as pending_deliveries,
        AVG(EXTRACT(EPOCH FROM (da.delivered_at - da.assigned_at))/60) as avg_delivery_time_minutes
       FROM delivery_assignments da
       JOIN delivery_persons dp ON da.delivery_person_id = dp.id
       JOIN users u ON dp.user_id = u.id
       JOIN orders o ON da.order_id = o.id
       WHERE o.created_at >= $1 AND o.created_at <= $2
       GROUP BY da.delivery_person_id, u.full_name, dp.employee_id
       ORDER BY total_deliveries DESC`,
      [dateRange.from, dateRange.to]
    );
    
    return result.rows;
  }

  async getPaymentReport(dateRange: DateRange) {
    const result = await query(
      `SELECT 
        p.status,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.created_at >= $1 AND o.created_at <= $2
       GROUP BY p.status
       ORDER BY count DESC`,
      [dateRange.from, dateRange.to]
    );
    
    return result.rows;
  }

  async getCategorySalesReport(dateRange: DateRange) {
    const result = await query(
      `SELECT 
        c.id, c.name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'delivered'
       GROUP BY c.id, c.name
       ORDER BY total_revenue DESC`,
      [dateRange.from, dateRange.to]
    );
    
    return result.rows;
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    
    const [
      todayStats,
      thisMonthStats,
      lastMonthStats,
      inventoryStats,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      // Today's stats
      query(
        `SELECT 
          COUNT(*) as orders_count,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as sales,
          COUNT(*) FILTER (WHERE payment_status = 'verification_pending') as pending_payments
         FROM orders WHERE created_at >= $1`,
        [today]
      ),
      // This month stats
      query(
        `SELECT 
          COUNT(*) as orders_count,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as sales
         FROM orders WHERE created_at >= $1`,
        [thisMonthStart]
      ),
      // Last month stats
      query(
        `SELECT 
          COUNT(*) as orders_count,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as sales
         FROM orders WHERE created_at >= $1 AND created_at <= $2`,
        [lastMonthStart, lastMonthEnd]
      ),
      // Inventory stats
      query(
        `SELECT 
          COUNT(*) FILTER (WHERE stock_status = 'out_of_stock') as out_of_stock,
          COUNT(*) FILTER (WHERE stock_status = 'low_stock') as low_stock,
          COUNT(*) FILTER (WHERE stock_status = 'in_stock') as in_stock
         FROM products WHERE is_active = true`
      ),
      // Top products this month
      query(
        `SELECT 
          p.id, p.name, p.image_url, SUM(oi.quantity) as quantity_sold
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.created_at >= $1 AND o.status = 'delivered'
         GROUP BY p.id, p.name, p.image_url
         ORDER BY quantity_sold DESC
         LIMIT 5`,
        [thisMonthStart]
      ),
      // Recent orders
      query(
        `SELECT 
          o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at,
          u.full_name as customer_name, u.phone as customer_phone
         FROM orders o
         JOIN customer_profiles cp ON o.customer_id = cp.id
         JOIN users u ON cp.user_id = u.id
         ORDER BY o.created_at DESC
         LIMIT 10`
      ),
    ]);
    
    const thisMonthSales = parseFloat(thisMonthStats.rows[0].sales);
    const lastMonthSales = parseFloat(lastMonthStats.rows[0].sales);
    const salesGrowth = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;
    
    return {
      today: todayStats.rows[0],
      thisMonth: { ...thisMonthStats.rows[0], salesGrowth: Math.round(salesGrowth * 100) / 100 },
      lastMonth: lastMonthStats.rows[0],
      inventory: inventoryStats.rows[0],
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
    };
  }

  async exportSalesToCsv(dateRange: DateRange): Promise<string> {
    const result = await query(
      `SELECT 
        o.order_number, o.created_at, o.status, o.payment_status,
        o.subtotal, o.discount_amount, o.delivery_charge, o.tax_amount, o.total_amount,
        u.full_name as customer_name, u.phone as customer_phone,
        a.house_number, a.street, a.area, a.city, a.pincode
       FROM orders o
       JOIN customer_profiles cp ON o.customer_id = cp.id
       JOIN users u ON cp.user_id = u.id
       JOIN addresses a ON o.address_id = a.id
       WHERE o.created_at >= $1 AND o.created_at <= $2
       ORDER BY o.created_at DESC`,
      [dateRange.from, dateRange.to]
    );
    
    const headers = [
      'Order Number', 'Date', 'Status', 'Payment Status',
      'Subtotal', 'Discount', 'Delivery Charge', 'Tax', 'Total',
      'Customer Name', 'Customer Phone',
      'Address'
    ];
    
    const rows = result.rows.map(order => [
      order.order_number,
      new Date(order.created_at).toLocaleDateString(),
      order.status,
      order.payment_status,
      order.subtotal,
      order.discount_amount,
      order.delivery_charge,
      order.tax_amount,
      order.total_amount,
      order.customer_name,
      order.customer_phone,
      `${order.house_number}, ${order.street}, ${order.area}, ${order.city} - ${order.pincode}`,
    ]);
    
    return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  }
}

export const reportService = new ReportService();