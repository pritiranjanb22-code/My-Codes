import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

interface CreateAddressData {
  label: string;
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export class AddressService {
  async getAddresses(customerId: string) {
    const result = await query(
      'SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
      [customerId]
    );
    return result.rows;
  }

  async getDefaultAddress(customerId: string) {
    const result = await query(
      'SELECT * FROM addresses WHERE customer_id = $1 AND is_default = true LIMIT 1',
      [customerId]
    );
    return result.rows[0] || null;
  }

  async getAddressById(addressId: string, customerId: string) {
    const result = await query(
      'SELECT * FROM addresses WHERE id = $1 AND customer_id = $2',
      [addressId, customerId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  async createAddress(customerId: string, data: CreateAddressData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE customer_id = $1',
          [customerId]
        );
      }
      
      // Check if this is the first address
      const countResult = await client.query(
        'SELECT COUNT(*) FROM addresses WHERE customer_id = $1',
        [customerId]
      );
      
      const isFirst = parseInt(countResult.rows[0].count) === 0;
      const shouldBeDefault = data.isDefault || isFirst;
      
      const result = await client.query(
        `INSERT INTO addresses (
          customer_id, label, full_name, phone, house_number, street, area,
          landmark, city, state, pincode, latitude, longitude, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          customerId,
          data.label,
          data.fullName,
          data.phone,
          data.houseNumber,
          data.street,
          data.area,
          data.landmark || null,
          data.city,
          data.state,
          data.pincode,
          data.latitude || null,
          data.longitude || null,
          shouldBeDefault,
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

  async updateAddress(addressId: string, customerId: string, data: Partial<CreateAddressData>) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify ownership
      const existingResult = await client.query(
        'SELECT * FROM addresses WHERE id = $1 AND customer_id = $2',
        [addressId, customerId]
      );
      
      if (existingResult.rows.length === 0) {
        throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
      }
      
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE customer_id = $1 AND id != $2',
          [customerId, addressId]
        );
      }
      
      const updates: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let paramIndex = 1;
      
      const fieldMap: Record<string, string> = {
        label: 'label',
        fullName: 'full_name',
        phone: 'phone',
        houseNumber: 'house_number',
        street: 'street',
        area: 'area',
        landmark: 'landmark',
        city: 'city',
        state: 'state',
        pincode: 'pincode',
        latitude: 'latitude',
        longitude: 'longitude',
        isDefault: 'is_default',
      };
      
      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (data[key as keyof CreateAddressData] !== undefined) {
          params.push(data[key as keyof CreateAddressData]);
          updates.push(`${dbField} = $${paramIndex++}`);
        }
      }
      
      params.push(addressId);
      
      const result = await client.query(
        `UPDATE addresses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
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

  async deleteAddress(addressId: string, customerId: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify ownership
      const existingResult = await client.query(
        'SELECT is_default FROM addresses WHERE id = $1 AND customer_id = $2',
        [addressId, customerId]
      );
      
      if (existingResult.rows.length === 0) {
        throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
      }
      
      const wasDefault = existingResult.rows[0].is_default;
      
      await client.query(
        'DELETE FROM addresses WHERE id = $1 AND customer_id = $2',
        [addressId, customerId]
      );
      
      // If deleted address was default, set another as default
      if (wasDefault) {
        const nextAddress = await client.query(
          'SELECT id FROM addresses WHERE customer_id = $1 ORDER BY created_at LIMIT 1',
          [customerId]
        );
        
        if (nextAddress.rows.length > 0) {
          await client.query(
            'UPDATE addresses SET is_default = true WHERE id = $1',
            [nextAddress.rows[0].id]
          );
        }
      }
      
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setDefaultAddress(addressId: string, customerId: string) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify ownership
      const existingResult = await client.query(
        'SELECT id FROM addresses WHERE id = $1 AND customer_id = $2',
        [addressId, customerId]
      );
      
      if (existingResult.rows.length === 0) {
        throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
      }
      
      await client.query(
        'UPDATE addresses SET is_default = false WHERE customer_id = $1',
        [customerId]
      );
      
      await client.query(
        'UPDATE addresses SET is_default = true WHERE id = $1',
        [addressId]
      );
      
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const addressService = new AddressService();