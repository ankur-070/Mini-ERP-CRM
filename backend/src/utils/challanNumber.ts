import { PoolClient } from 'pg';
import pool from '../config/db';

/**
 * Generates a unique, clean auto-incrementing Challan Number (e.g. CH-20260811-0001 or CH-1001).
 */
export async function generateChallanNumber(client?: PoolClient): Promise<string> {
  const db = client || pool;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CH-${dateStr}-`;

  const result = await db.query(
    `SELECT challan_number FROM sales_challans WHERE challan_number LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastChallan = result.rows[0].challan_number;
  const parts = lastChallan.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  const seqPadded = String(nextSeq).padStart(4, '0');

  return `${prefix}${seqPadded}`;
}
