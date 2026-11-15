import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

interface CartItemData {
  productId: string;
  quantity: number;
}

export class CartService {
  async getCart(customerId: string) {
    const result = await query(
      `SELECT ci.*, p.name, p.image_url, p.selling_price, p.mrp_price, p.discount_percentage,
              p.unit, p.stock_quantity, p.stock_status, p.is_active,
              c.name as category_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ci.customer_id = $1
       ORDER BY ci.created_at DESC`,
      [customerId]
    );
    
    const items = result.rows.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      selling_price: parseFloat(item.selling_price),
      mrp_price: item.mrp_price ? parseFloat(item.mrp_price) : null,
      discount_percentage: parseFloat(item.discount_percentage) || 0,
      stock_quantity: parseFloat(item.stock_quantity),
      subtotal: parseFloat(item.selling_price) * parseFloat(item.quantity),
    }));
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      items,
      subtotal,
      itemCount,
    };
  }

  async addToCart(customerId: string, data: CartItemData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify product exists and is available
      const productResult = await client.query(
        `SELECT id, name, stock_quantity, stock_status, min_order_quantity, max_order_quantity, is_active
         FROM products WHERE id = $1 FOR UPDATE`,
        [data.productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      
      const product = productResult.rows[0];
      
      if (!product.is_active) {
        throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
      }
      
      if (product.stock_status === 'out_of_stock') {
        throw new AppError('Product is out of stock', 400, 'OUT_OF_STOCK');
      }
      
      const minQty = parseFloat(product.min_order_quantity);
      const maxQty = product.max_order_quantity ? parseFloat(product.max_order_quantity) : Infinity;
      const availableStock = parseFloat(product.stock_quantity);
      
      if (data.quantity < minQty) {
        throw new AppError(`Minimum order quantity is ${minQty} ${product.unit}`, 400, 'MIN_QUANTITY_NOT_MET');
      }
      
      if (data.quantity > maxQty) {
        throw new AppError(`Maximum order quantity is ${maxQty} ${product.unit}`, 400, 'MAX_QUANTITY_EXCEEDED');
      }
      
      // Check if already in cart
      const existingResult = await client.query(
        'SELECT quantity FROM cart_items WHERE customer_id = $1 AND product_id = $2 FOR UPDATE',
        [customerId, data.productId]
      );
      
      let newQuantity = data.quantity;
      
      if (existingResult.rows.length > 0) {
        newQuantity = parseFloat(existingResult.rows[0].quantity) + data.quantity;
        
        if (newQuantity > maxQty) {
          throw new AppError(`Maximum order quantity is ${maxQty} ${product.unit}`, 400, 'MAX_QUANTITY_EXCEEDED');
        }
        
        if (newQuantity > availableStock) {
          throw new AppError(`Only ${availableStock} ${product.unit} available`, 400, 'INSUFFICIENT_STOCK');
        }
        
        await client.query(
          `UPDATE cart_items SET quantity = $1, updated_at = NOW() 
           WHERE customer_id = $2 AND product_id = $3`,
          [newQuantity, customerId, data.productId]
        );
      } else {
        if (data.quantity > availableStock) {
          throw new AppError(`Only ${availableStock} ${product.unit} available`, 400, 'INSUFFICIENT_STOCK');
        }
        
        await client.query(
          `INSERT INTO cart_items (customer_id, product_id, quantity)
           VALUES ($1, $2, $3)`,
          [customerId, data.productId, data.quantity]
        );
      }
      
      await client.query('COMMIT');
      
      return this.getCart(customerId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateQuantity(customerId: string, productId: string, quantity: number) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify product
      const productResult = await client.query(
        `SELECT stock_quantity, stock_status, min_order_quantity, max_order_quantity, is_active
         FROM products WHERE id = $1`,
        [productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      
      const product = productResult.rows[0];
      
      if (!product.is_active || product.stock_status === 'out_of_stock') {
        throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
      }
      
      const minQty = parseFloat(product.min_order_quantity);
      const maxQty = product.max_order_quantity ? parseFloat(product.max_order_quantity) : Infinity;
      const availableStock = parseFloat(product.stock_quantity);
      
      if (quantity < minQty) {
        throw new AppError(`Minimum quantity is ${minQty}`, 400, 'MIN_QUANTITY_NOT_MET');
      }
      
      if (quantity > maxQty) {
        throw new AppError(`Maximum quantity is ${maxQty}`, 400, 'MAX_QUANTITY_EXCEEDED');
      }
      
      if (quantity > availableStock) {
        throw new AppError(`Only ${availableStock} available in stock`, 400, 'INSUFFICIENT_STOCK');
      }
      
      // Check if item exists in cart
      const existingResult = await client.query(
        'SELECT id FROM cart_items WHERE customer_id = $1 AND product_id = $2',
        [customerId, productId]
      );
      
      if (existingResult.rows.length === 0) {
        throw new AppError('Item not in cart', 404, 'ITEM_NOT_IN_CART');
      }
      
      await client.query(
        `UPDATE cart_items SET quantity = $1, updated_at = NOW() 
         WHERE customer_id = $2 AND product_id = $3`,
        [quantity, customerId, productId]
      );
      
      await client.query('COMMIT');
      
      return this.getCart(customerId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeFromCart(customerId: string, productId: string) {
    const result = await query(
      'DELETE FROM cart_items WHERE customer_id = $1 AND product_id = $2 RETURNING id',
      [customerId, productId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Item not in cart', 404, 'ITEM_NOT_IN_CART');
    }
    
    return this.getCart(customerId);
  }

  async clearCart(customerId: string) {
    await query('DELETE FROM cart_items WHERE customer_id = $1', [customerId]);
    return { success: true, items: [], subtotal: 0, itemCount: 0 };
  }

  async getCartCount(customerId: string) {
    const result = await query(
      'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE customer_id = $1',
      [customerId]
    );
    
    return parseFloat(result.rows[0].count);
  }

  async validateCart(customerId: string) {
    const cart = await this.getCart(customerId);
    const issues: string[] = [];
    
    for (const item of cart.items) {
      if (!item.is_active) {
        issues.push(`${item.name} is no longer available`);
      }
      
      if (item.stock_status === 'out_of_stock') {
        issues.push(`${item.name} is out of stock`);
      }
      
      if (item.quantity > item.stock_quantity) {
        issues.push(`${item.name}: only ${item.stock_quantity} ${item.unit} available (you have ${item.quantity} in cart)`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      cart,
    };
  }
}

export const cartService = new CartService();