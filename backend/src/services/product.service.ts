import pool from '../config/db';
import { ApiError } from '../utils/apiError';

export interface ProductData {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
}

export class ProductService {
  static async createProduct(data: ProductData) {
    const existingSku = await pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1)', [data.sku.trim()]);
    if (existingSku.rows.length > 0) {
      throw ApiError.conflict(`Product with SKU '${data.sku}' already exists`);
    }

    const query = `
      INSERT INTO products (
        name, sku, category, unit_price, current_stock, min_stock_alert, location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      data.name.trim(),
      data.sku.trim().toUpperCase(),
      data.category.trim(),
      data.unit_price,
      data.current_stock ?? 0,
      data.min_stock_alert ?? 0,
      data.location.trim(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateProduct(id: number, data: Partial<ProductData>) {
    const check = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    if (data.sku) {
      const existingSku = await pool.query(
        'SELECT id FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2',
        [data.sku.trim(), id]
      );
      if (existingSku.rows.length > 0) {
        throw ApiError.conflict(`Product SKU '${data.sku}' is already in use by another product`);
      }
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof ProductData)[] = [
      'name',
      'sku',
      'category',
      'unit_price',
      'current_stock',
      'min_stock_alert',
      'location',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(field === 'sku' ? (data[field] as string).trim().toUpperCase() : data[field]);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      const current = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return current.rows[0];
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE products
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getProducts(options: {
    search?: string;
    category?: string;
    lowStock?: boolean;
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
      whereConditions.push(`(name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      values.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options.category) {
      whereConditions.push(`category = $${paramIndex}`);
      values.push(options.category);
      paramIndex++;
    }

    if (options.lowStock) {
      whereConditions.push(`current_stock <= min_stock_alert`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT *,
        (current_stock <= min_stock_alert) AS is_low_stock
      FROM products
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      products: dataResult.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: number) {
    const result = await pool.query(
      `SELECT *, (current_stock <= min_stock_alert) AS is_low_stock FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    return result.rows[0];
  }
}
