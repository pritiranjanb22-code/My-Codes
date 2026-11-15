import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
  isFeatured?: boolean;
  inStock?: boolean;
}

interface CreateProductData {
  categoryId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sellingPrice: number;
  mrpPrice?: number;
  unit?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  brand?: string;
  barcode?: string;
}

export class ProductService {
  async getProducts(filters: ProductFilters = {}) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
      isFeatured,
      inStock,
    } = filters;
    
    let whereClause = 'WHERE p.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (categoryId) {
      params.push(categoryId);
      whereClause += ` AND p.category_id = $${paramIndex++}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`;
      paramIndex++;
    }
    
    if (minPrice !== undefined) {
      params.push(minPrice);
      whereClause += ` AND p.selling_price >= $${paramIndex++}`;
    }
    
    if (maxPrice !== undefined) {
      params.push(maxPrice);
      whereClause += ` AND p.selling_price <= $${paramIndex++}`;
    }
    
    if (isFeatured !== undefined) {
      params.push(isFeatured);
      whereClause += ` AND p.is_featured = $${paramIndex++}`;
    }
    
    if (inStock) {
      whereClause += ` AND p.stock_status != 'out_of_stock' AND p.stock_quantity > 0`;
    }
    
    // Validate sort parameters
    const allowedSortFields = ['name', 'selling_price', 'created_at', 'discount_percentage'];
    const allowedSortOrders = ['asc', 'desc'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = allowedSortOrders.includes(sortOrder) ? sortOrder : 'asc';
    
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const queryStr = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${safeSortBy} ${safeSortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    
    const result = await query(queryStr, params);
    
    // Get total count
    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      countParams
    );
    
    return {
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async getProductById(productId: string) {
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [productId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async getProductBySlug(slug: string) {
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async createProduct(data: CreateProductData, imageUrl?: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify category exists
      const catResult = await client.query('SELECT id FROM categories WHERE id = $1', [data.categoryId]);
      if (catResult.rows.length === 0) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
      
      // Generate slug
      const baseSlug = data.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const slugResult = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
        if (slugResult.rows.length === 0) break;
        slug = `${baseSlug}-${counter++}`;
      }
      
      const discountPercentage = data.mrpPrice 
        ? Math.round(((data.mrpPrice - data.sellingPrice) / data.mrpPrice) * 100)
        : 0;
      
      const stockStatus = data.stockQuantity && data.stockQuantity <= 0 ? 'out_of_stock' :
                          data.stockQuantity && data.stockQuantity <= (data.lowStockThreshold || 10) ? 'low_stock' : 'in_stock';
      
      const result = await client.query(
        `INSERT INTO products (
          category_id, name, slug, description, short_description, image_url,
          selling_price, mrp_price, discount_percentage, unit,
          min_order_quantity, max_order_quantity, stock_quantity,
          low_stock_threshold, stock_status, is_active, is_featured, tags, brand, barcode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          data.categoryId,
          data.name,
          slug,
          data.description || null,
          data.shortDescription || null,
          imageUrl || null,
          data.sellingPrice,
          data.mrpPrice || null,
          discountPercentage,
          data.unit || 'kg',
          data.minOrderQuantity || 1,
          data.maxOrderQuantity || null,
          data.stockQuantity || 0,
          data.lowStockThreshold || 10,
          stockStatus,
          data.isActive !== false,
          data.isFeatured || false,
          data.tags || [],
          data.brand || null,
          data.barcode || null,
        ]
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

  async updateProduct(productId: string, data: Partial<CreateProductData>, imageUrl?: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check if product exists
      const existingResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
      if (existingResult.rows.length === 0) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      
      const existing = existingResult.rows[0];
      
      // If category is being changed, verify it exists
      if (data.categoryId && data.categoryId !== existing.category_id) {
        const catResult = await client.query('SELECT id FROM categories WHERE id = $1', [data.categoryId]);
        if (catResult.rows.length === 0) {
          throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
        }
      }
      
      // Build update query
      const updates: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let paramIndex = 1;
      
      const fieldMap: Record<string, string> = {
        categoryId: 'category_id',
        name: 'name',
        description: 'description',
        shortDescription: 'short_description',
        sellingPrice: 'selling_price',
        mrpPrice: 'mrp_price',
        unit: 'unit',
        minOrderQuantity: 'min_order_quantity',
        maxOrderQuantity: 'max_order_quantity',
        stockQuantity: 'stock_quantity',
        lowStockThreshold: 'low_stock_threshold',
        isActive: 'is_active',
        isFeatured: 'is_featured',
        tags: 'tags',
        brand: 'brand',
        barcode: 'barcode',
      };
      
      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (data[key as keyof CreateProductData] !== undefined) {
          params.push(data[key as keyof CreateProductData]);
          updates.push(`${dbField} = $${paramIndex++}`);
        }
      }
      
      // Handle image update
      if (imageUrl !== undefined) {
        params.push(imageUrl);
        updates.push(`image_url = $${paramIndex++}`);
      }
      
      // Recalculate discount if prices changed
      if (data.sellingPrice !== undefined || data.mrpPrice !== undefined) {
        const sellingPrice = data.sellingPrice ?? existing.selling_price;
        const mrpPrice = data.mrpPrice ?? existing.mrp_price;
        const discount = mrpPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;
        params.push(discount);
        updates.push(`discount_percentage = $${paramIndex++}`);
      }
      
      // Update stock status if stock changed
      if (data.stockQuantity !== undefined) {
        const stock = data.stockQuantity;
        const threshold = data.lowStockThreshold ?? existing.low_stock_threshold;
        let stockStatus = 'in_stock';
        if (stock <= 0) stockStatus = 'out_of_stock';
        else if (stock <= threshold) stockStatus = 'low_stock';
        
        params.push(stockStatus);
        updates.push(`stock_status = $${paramIndex++}`);
      }
      
      params.push(productId);
      
      const result = await client.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
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

  async deleteProduct(productId: string) {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [productId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    return { success: true };
  }

  async updateStock(productId: string, quantityChange: number, referenceType: string = 'manual', referenceId?: string, notes?: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const productResult = await client.query(
        'SELECT stock_quantity, low_stock_threshold FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      
      const product = productResult.rows[0];
      const previousStock = parseFloat(product.stock_quantity);
      const newStock = previousStock + quantityChange;
      
      if (newStock < 0) {
        throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
      }
      
      let stockStatus = 'in_stock';
      if (newStock <= 0) stockStatus = 'out_of_stock';
      else if (newStock <= product.low_stock_threshold) stockStatus = 'low_stock';
      
      await client.query(
        `UPDATE products SET stock_quantity = $1, stock_status = $2, updated_at = NOW() WHERE id = $3`,
        [newStock, stockStatus, productId]
      );
      
      await client.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_type, reference_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [productId, referenceType, quantityChange, previousStock, newStock, referenceType, referenceId || null, notes || null]
      );
      
      await client.query('COMMIT');
      
      return { productId, previousStock, newStock, stockStatus };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getLowStockProducts() {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_status IN ('low_stock', 'out_of_stock') AND p.is_active = true
       ORDER BY p.stock_status DESC, p.stock_quantity ASC`
    );
    
    return result.rows;
  }

  async getFeaturedProducts(limit: number = 10) {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.is_active = true AND p.stock_status != 'out_of_stock'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  async searchProducts(query: string, limit: number = 20) {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true 
         AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.brand ILIKE $1)
       ORDER BY 
         CASE WHEN p.name ILIKE $2 THEN 0 ELSE 1 END,
         p.name
       LIMIT $3`,
      [`%${query}%`, `${query}%`, limit]
    );
    
    return result.rows;
  }

  async getCategories() {
    const result = await query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.display_order, c.name`
    );
    
    return result.rows;
  }

  async getCategoryById(categoryId: string) {
    const result = await query('SELECT * FROM categories WHERE id = $1', [categoryId]);
    if (result.rows.length === 0) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    return result.rows[0];
  }

  async createCategory(data: { name: string; description?: string; icon?: string; displayOrder?: number; parentId?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await query(
      `INSERT INTO categories (name, slug, description, icon, display_order, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, slug, data.description || null, data.icon || null, data.displayOrder || 0, data.parentId || null]
    );
    
    return result.rows[0];
  }

  async updateCategory(categoryId: string, data: Partial<{ name: string; description: string; icon: string; displayOrder: number; parentId: string; isActive: boolean }>) {
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      params.push(data.name);
      updates.push(`name = $${paramIndex++}`);
      // Update slug
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      params.push(slug);
      updates.push(`slug = $${paramIndex++}`);
    }
    
    if (data.description !== undefined) {
      params.push(data.description);
      updates.push(`description = $${paramIndex++}`);
    }
    
    if (data.icon !== undefined) {
      params.push(data.icon);
      updates.push(`icon = $${paramIndex++}`);
    }
    
    if (data.displayOrder !== undefined) {
      params.push(data.displayOrder);
      updates.push(`display_order = $${paramIndex++}`);
    }
    
    if (data.parentId !== undefined) {
      params.push(data.parentId);
      updates.push(`parent_id = $${paramIndex++}`);
    }
    
    if (data.isActive !== undefined) {
      params.push(data.isActive);
      updates.push(`is_active = $${paramIndex++}`);
    }
    
    params.push(categoryId);
    
    const result = await query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async deleteCategory(categoryId: string) {
    // Check if category has products
    const productCount = await query('SELECT COUNT(*) FROM products WHERE category_id = $1', [categoryId]);
    if (parseInt(productCount.rows[0].count) > 0) {
      throw new AppError('Cannot delete category with existing products', 400, 'CATEGORY_HAS_PRODUCTS');
    }
    
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [categoryId]);
    if (result.rows.length === 0) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    return { success: true };
  }
}

export const productService = new ProductService();