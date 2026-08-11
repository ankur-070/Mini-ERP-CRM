import pool from '../config/db';
import { ApiError } from '../utils/apiError';

export interface ManualStockAdjustment {
  product_id: number;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
}

export class StockService {
  static async getStockMovements(options: {
    productId?: number;
    movementType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.productId) {
      whereConditions.push(`sm.product_id = $${paramIndex}`);
      values.push(options.productId);
      paramIndex++;
    }

    if (options.movementType) {
      whereConditions.push(`sm.movement_type = $${paramIndex}`);
      values.push(options.movementType);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM stock_movements sm ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT
        sm.id,
        sm.product_id,
        p.name as product_name,
        p.sku as product_sku,
        sm.quantity,
        sm.movement_type,
        sm.reason,
        sm.challan_id,
        sm.created_by,
        u.name as created_by_name,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      movements: dataResult.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createManualAdjustment(data: ManualStockAdjustment, userId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check product existence and lock row
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [data.product_id]);
      if (prodRes.rows.length === 0) {
        throw ApiError.notFound(`Product with ID ${data.product_id} not found`);
      }

      const product = prodRes.rows[0];

      if (data.movement_type === 'OUT') {
        if (product.current_stock < data.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Requested OUT: ${data.quantity}, Available: ${product.current_stock}`,
            'INSUFFICIENT_STOCK',
            {
              productId: product.id,
              productName: product.name,
              requested: data.quantity,
              available: product.current_stock,
            }
          );
        }
      }

      // Update current stock
      const stockChange = data.movement_type === 'IN' ? data.quantity : -data.quantity;
      const updateRes = await client.query(
        `UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [stockChange, data.product_id]
      );

      // Insert stock movement record
      const moveRes = await client.query(
        `
        INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [data.product_id, data.quantity, data.movement_type, data.reason, userId]
      );

      await client.query('COMMIT');

      return {
        movement: moveRes.rows[0],
        updated_product: updateRes.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
