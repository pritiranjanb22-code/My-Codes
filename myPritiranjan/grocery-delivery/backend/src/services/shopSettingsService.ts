import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

interface ShopSettings {
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  shopOpeningHours?: string;
  shopLogoUrl?: string;
  deliveryRadiusKm?: number;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  minOrderValue?: number;
  upiId?: string;
  upiQrCodeUrl?: string;
  paymentInstructions?: string;
  taxPercentage?: number;
  maintenanceMode?: boolean;
}

export class ShopSettingsService {
  async getSettings() {
    const result = await query('SELECT key, value FROM shop_settings');
    
    const settings: Record<string, any> = {};
    for (const row of result.rows) {
      settings[row.key] = JSON.parse(row.value);
    }
    
    return settings;
  }

  async getPublicSettings() {
    // Return only settings needed by customer app
    const publicKeys = [
      'shop_name', 'shop_phone', 'shop_address', 'shop_opening_hours', 'shop_logo_url',
      'delivery_radius_km', 'delivery_charge', 'free_delivery_threshold', 'min_order_value',
      'upi_id', 'upi_qr_code_url', 'payment_instructions', 'tax_percentage', 'maintenance_mode'
    ];
    
    const placeholders = publicKeys.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(
      `SELECT key, value FROM shop_settings WHERE key IN (${placeholders})`,
      publicKeys
    );
    
    const settings: Record<string, any> = {};
    for (const row of result.rows) {
      settings[row.key] = JSON.parse(row.value);
    }
    
    return settings;
  }

  async updateSettings(data: ShopSettings) {
    const client = await query.pool?.connect?.() || (await import('../db/pool.js')).getClient();
    
    try {
      await client.query('BEGIN');
      
      const fieldMap: Record<string, string> = {
        shopName: 'shop_name',
        shopPhone: 'shop_phone',
        shopAddress: 'shop_address',
        shopOpeningHours: 'shop_opening_hours',
        shopLogoUrl: 'shop_logo_url',
        deliveryRadiusKm: 'delivery_radius_km',
        deliveryCharge: 'delivery_charge',
        freeDeliveryThreshold: 'free_delivery_threshold',
        minOrderValue: 'min_order_value',
        upiId: 'upi_id',
        upiQrCodeUrl: 'upi_qr_code_url',
        paymentInstructions: 'payment_instructions',
        taxPercentage: 'tax_percentage',
        maintenanceMode: 'maintenance_mode',
      };
      
      for (const [key, dbKey] of Object.entries(fieldMap)) {
        const value = data[key as keyof ShopSettings];
        if (value !== undefined) {
          await client.query(
            `INSERT INTO shop_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [dbKey, JSON.stringify(value)]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return this.getSettings();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUpiDetails() {
    const result = await query(
      `SELECT key, value FROM shop_settings WHERE key IN ('upi_id', 'upi_qr_code_url', 'payment_instructions')`
    );
    
    const settings: Record<string, any> = {};
    for (const row of result.rows) {
      settings[row.key] = JSON.parse(row.value);
    }
    
    return settings;
  }

  async updateUpiDetails(upiId: string, qrCodeUrl?: string, instructions?: string) {
    const client = await query.pool?.connect?.() || (await import('../db/pool.js')).getClient();
    
    try {
      await client.query('BEGIN');
      
      await client.query(
        `INSERT INTO shop_settings (key, value) VALUES ('upi_id', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [JSON.stringify(upiId)]
      );
      
      if (qrCodeUrl !== undefined) {
        await client.query(
          `INSERT INTO shop_settings (key, value) VALUES ('upi_qr_code_url', $1)
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify(qrCodeUrl)]
        );
      }
      
      if (instructions !== undefined) {
        await client.query(
          `INSERT INTO shop_settings (key, value) VALUES ('payment_instructions', $1)
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify(instructions)]
        );
      }
      
      await client.query('COMMIT');
      
      return this.getUpiDetails();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const shopSettingsService = new ShopSettingsService();