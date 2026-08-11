import pool from '../config/db';
import { ApiError } from '../utils/apiError';

export interface CustomerData {
  name: string;
  mobile_number: string;
  email: string;
  business_name: string;
  gst_number?: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date?: string | null;
  notes?: string | null;
}

export class CustomerService {
  static async createCustomer(data: CustomerData) {
    const query = `
      INSERT INTO customers (
        name, mobile_number, email, business_name, gst_number,
        customer_type, address, status, follow_up_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.name,
      data.mobile_number,
      data.email.toLowerCase().trim(),
      data.business_name,
      data.gst_number || null,
      data.customer_type,
      data.address,
      data.status || 'Lead',
      data.follow_up_date ? new Date(data.follow_up_date) : null,
      data.notes || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateCustomer(id: number, data: Partial<CustomerData>) {
    const check = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof CustomerData)[] = [
      'name',
      'mobile_number',
      'email',
      'business_name',
      'gst_number',
      'customer_type',
      'address',
      'status',
      'follow_up_date',
      'notes',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        if (field === 'follow_up_date' && data[field]) {
          values.push(new Date(data[field] as string));
        } else {
          values.push(data[field]);
        }
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      const current = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      return current.rows[0];
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE customers
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getCustomers(options: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.search) {
      whereConditions.push(
        `(name ILIKE $${paramIndex} OR business_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR mobile_number ILIKE $${paramIndex})`
      );
      values.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options.type) {
      whereConditions.push(`customer_type = $${paramIndex}`);
      values.push(options.type);
      paramIndex++;
    }

    if (options.status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(options.status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM customers
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      customers: dataResult.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: number) {
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerResult.rows.length === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    const notesResult = await pool.query(
      `
      SELECT cn.*, u.name as created_by_name
      FROM customer_notes cn
      JOIN users u ON cn.created_by = u.id
      WHERE cn.customer_id = $1
      ORDER BY cn.created_at DESC
      `,
      [id]
    );

    return {
      ...customerResult.rows[0],
      notes_history: notesResult.rows,
    };
  }

  static async addFollowUpNote(id: number, note: string, followUpDate: string | null | undefined, userId: number) {
    const check = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    const parsedDate = followUpDate ? new Date(followUpDate) : null;

    const noteInsert = await pool.query(
      `
      INSERT INTO customer_notes (customer_id, note, follow_up_date, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [id, note, parsedDate, userId]
    );

    // Update customer follow_up_date & latest note
    await pool.query(
      `
      UPDATE customers
      SET follow_up_date = COALESCE($1, follow_up_date),
          notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [parsedDate, note, id]
    );

    return noteInsert.rows[0];
  }
}
