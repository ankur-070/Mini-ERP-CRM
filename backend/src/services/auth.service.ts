import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { AuthUser } from '../middleware/auth.middleware';

export class AuthService {
  static async login(email: string, pass: string) {
    const query = 'SELECT id, name, email, password_hash, role FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      throw ApiError.unauthorized('Invalid email or password credentials', 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(pass, user.password_hash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password credentials', 'INVALID_CREDENTIALS');
    }

    const payload: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET as string, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async register(name: string, email: string, pass: string, role: string) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      throw ApiError.conflict('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `;
    const result = await pool.query(query, [name, email.toLowerCase().trim(), passwordHash, role]);
    return result.rows[0];
  }

  static async getUserProfile(userId: number) {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    return result.rows[0];
  }
}
