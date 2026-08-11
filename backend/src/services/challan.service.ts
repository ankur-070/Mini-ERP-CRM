import pool from '../config/db';
import { ApiError } from '../utils/apiError';
import { generateChallanNumber } from '../utils/challanNumber';

export interface CreateChallanInput {
  customer_id: number;
  status?: 'Draft' | 'Confirmed';
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export class ChallanService {
  static async createChallan(input: CreateChallanInput, userId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch customer & verify existence
      const custRes = await client.query('SELECT * FROM customers WHERE id = $1', [input.customer_id]);
      if (custRes.rows.length === 0) {
        throw ApiError.notFound(`Customer with ID ${input.customer_id} not found`);
      }
      const customer = custRes.rows[0];
      const customerSnapshot = {
        id: customer.id,
        name: customer.name,
        mobile_number: customer.mobile_number,
        email: customer.email,
        business_name: customer.business_name,
        gst_number: customer.gst_number,
        address: customer.address,
      };

      // 2. Fetch all requested products
      const productIds = input.items.map((item) => item.product_id);
      const prodRes = await client.query(
        'SELECT * FROM products WHERE id = ANY($1::int[]) FOR UPDATE',
        [productIds]
      );

      const productMap = new Map<number, any>();
      prodRes.rows.forEach((p) => productMap.set(p.id, p));

      // Verify all products exist
      for (const item of input.items) {
        if (!productMap.has(item.product_id)) {
          throw ApiError.notFound(`Product with ID ${item.product_id} not found`);
        }
      }

      // 3. Prepare product snapshots & totals
      let totalQuantity = 0;
      let totalAmount = 0;

      const challanItemsData = input.items.map((item) => {
        const product = productMap.get(item.product_id);
        const unitPrice = parseFloat(product.unit_price);
        const lineTotal = unitPrice * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += lineTotal;

        return {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          unit_price: unitPrice,
          quantity: item.quantity,
          line_total: lineTotal,
        };
      });

      // 4. Generate unique Challan Number
      const challanNumber = await generateChallanNumber(client);
      const targetStatus = input.status || 'Draft';

      // 5. If status is 'Confirmed', validate stock availability for ALL products first
      if (targetStatus === 'Confirmed') {
        const insufficientStockItems: any[] = [];

        for (const item of input.items) {
          const product = productMap.get(item.product_id);
          if (product.current_stock < item.quantity) {
            insufficientStockItems.push({
              productId: product.id,
              productName: product.name,
              productSku: product.sku,
              requested: item.quantity,
              available: product.current_stock,
            });
          }
        }

        if (insufficientStockItems.length > 0) {
          throw ApiError.badRequest(
            'Cannot create confirmed challan due to insufficient stock for one or more products',
            'INSUFFICIENT_STOCK',
            insufficientStockItems
          );
        }
      }

      // 6. Insert Sales Challan Header
      const challanInsert = await client.query(
        `
        INSERT INTO sales_challans (
          challan_number, customer_id, customer_snapshot, total_quantity, total_amount, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
          challanNumber,
          customer.id,
          JSON.stringify(customerSnapshot),
          totalQuantity,
          totalAmount,
          targetStatus,
          userId,
        ]
      );

      const challan = challanInsert.rows[0];

      // 7. Insert Sales Challan Line Items (Snapshots)
      const itemRows: any[] = [];
      for (const item of challanItemsData) {
        const itemRes = await client.query(
          `
          INSERT INTO sales_challan_items (
            challan_id, product_id, product_name, product_sku, unit_price, quantity, line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
          `,
          [
            challan.id,
            item.product_id,
            item.product_name,
            item.product_sku,
            item.unit_price,
            item.quantity,
            item.line_total,
          ]
        );
        itemRows.push(itemRes.rows[0]);
      }

      // 8. If status is 'Confirmed', deduct stock and record OUT stock movement
      if (targetStatus === 'Confirmed') {
        for (const item of challanItemsData) {
          // Deduct stock
          await client.query(
            `UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [item.quantity, item.product_id]
          );

          // Log OUT stock movement
          await client.query(
            `
            INSERT INTO stock_movements (product_id, quantity, movement_type, reason, challan_id, created_by)
            VALUES ($1, $2, 'OUT', $3, $4, $5)
            `,
            [
              item.product_id,
              item.quantity,
              `Sales Challan Confirmation #${challanNumber}`,
              challan.id,
              userId,
            ]
          );
        }
      }

      await client.query('COMMIT');

      return {
        ...challan,
        items: itemRows,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async confirmChallan(challanId: number, userId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Challan header & lock row
      const challanRes = await client.query(
        'SELECT * FROM sales_challans WHERE id = $1 FOR UPDATE',
        [challanId]
      );
      if (challanRes.rows.length === 0) {
        throw ApiError.notFound(`Sales Challan with ID ${challanId} not found`);
      }

      const challan = challanRes.rows[0];

      if (challan.status === 'Confirmed') {
        throw ApiError.badRequest(`Challan ${challan.challan_number} is already confirmed`, 'ALREADY_CONFIRMED');
      }

      if (challan.status === 'Cancelled') {
        throw ApiError.badRequest(`Cannot confirm a cancelled challan`, 'CHALLAN_CANCELLED');
      }

      // 2. Fetch line items for this challan
      const itemsRes = await client.query(
        'SELECT * FROM sales_challan_items WHERE challan_id = $1',
        [challanId]
      );
      const items = itemsRes.rows;

      if (items.length === 0) {
        throw ApiError.badRequest('Cannot confirm a challan with no line items', 'EMPTY_CHALLAN');
      }

      // 3. Lock target products and check stock availability
      const productIds = items.map((i) => i.product_id);
      const prodRes = await client.query(
        'SELECT * FROM products WHERE id = ANY($1::int[]) FOR UPDATE',
        [productIds]
      );

      const productMap = new Map<number, any>();
      prodRes.rows.forEach((p) => productMap.set(p.id, p));

      const insufficientStockItems: any[] = [];

      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw ApiError.notFound(`Product ID ${item.product_id} associated with item no longer exists`);
        }

        if (product.current_stock < item.quantity) {
          insufficientStockItems.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            requested: item.quantity,
            available: product.current_stock,
          });
        }
      }

      // If stock check fails for ANY item, ROLLBACK transaction and return 400 Bad Request
      if (insufficientStockItems.length > 0) {
        throw ApiError.badRequest(
          'Cannot confirm challan due to insufficient stock for one or more products',
          'INSUFFICIENT_STOCK',
          insufficientStockItems
        );
      }

      // 4. Update stock and record OUT stock movement records
      for (const item of items) {
        await client.query(
          `UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [item.quantity, item.product_id]
        );

        await client.query(
          `
          INSERT INTO stock_movements (product_id, quantity, movement_type, reason, challan_id, created_by)
          VALUES ($1, $2, 'OUT', $3, $4, $5)
          `,
          [
            item.product_id,
            item.quantity,
            `Sales Challan Confirmation #${challan.challan_number}`,
            challan.id,
            userId,
          ]
        );
      }

      // 5. Update Challan status to 'Confirmed'
      const updatedChallanRes = await client.query(
        `UPDATE sales_challans SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [challanId]
      );

      await client.query('COMMIT');

      return {
        ...updatedChallanRes.rows[0],
        items,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cancelChallan(challanId: number, userId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanRes = await client.query(
        'SELECT * FROM sales_challans WHERE id = $1 FOR UPDATE',
        [challanId]
      );
      if (challanRes.rows.length === 0) {
        throw ApiError.notFound(`Sales Challan with ID ${challanId} not found`);
      }

      const challan = challanRes.rows[0];

      if (challan.status === 'Cancelled') {
        throw ApiError.badRequest(`Challan ${challan.challan_number} is already cancelled`, 'ALREADY_CANCELLED');
      }

      // If previously confirmed, restore stock and log IN stock movement
      if (challan.status === 'Confirmed') {
        const itemsRes = await client.query('SELECT * FROM sales_challan_items WHERE challan_id = $1', [challanId]);
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [item.quantity, item.product_id]
          );

          await client.query(
            `
            INSERT INTO stock_movements (product_id, quantity, movement_type, reason, challan_id, created_by)
            VALUES ($1, $2, 'IN', $3, $4, $5)
            `,
            [
              item.product_id,
              item.quantity,
              `Sales Challan Cancellation #${challan.challan_number}`,
              challan.id,
              userId,
            ]
          );
        }
      }

      const updatedChallanRes = await client.query(
        `UPDATE sales_challans SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [challanId]
      );

      await client.query('COMMIT');
      return updatedChallanRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getChallans(options: {
    status?: string;
    customerId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.status) {
      whereConditions.push(`sc.status = $${paramIndex}`);
      values.push(options.status);
      paramIndex++;
    }

    if (options.customerId) {
      whereConditions.push(`sc.customer_id = $${paramIndex}`);
      values.push(options.customerId);
      paramIndex++;
    }

    if (options.search) {
      whereConditions.push(`(sc.challan_number ILIKE $${paramIndex} OR sc.customer_snapshot->>'name' ILIKE $${paramIndex} OR sc.customer_snapshot->>'business_name' ILIKE $${paramIndex})`);
      values.push(`%${options.search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM sales_challans sc ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT
        sc.*,
        u.name as created_by_name
      FROM sales_challans sc
      JOIN users u ON sc.created_by = u.id
      ${whereClause}
      ORDER BY sc.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      challans: dataResult.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getChallanById(id: number) {
    const challanRes = await pool.query(
      `
      SELECT sc.*, u.name as created_by_name
      FROM sales_challans sc
      JOIN users u ON sc.created_by = u.id
      WHERE sc.id = $1
      `,
      [id]
    );

    if (challanRes.rows.length === 0) {
      throw ApiError.notFound(`Sales Challan with ID ${id} not found`);
    }

    const itemsRes = await pool.query(
      `SELECT * FROM sales_challan_items WHERE challan_id = $1 ORDER BY id ASC`,
      [id]
    );

    return {
      ...challanRes.rows[0],
      items: itemsRes.rows,
    };
  }
}
