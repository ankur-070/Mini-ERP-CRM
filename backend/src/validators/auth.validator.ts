import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['Admin', 'Sales', 'Warehouse', 'Accounts'], {
      errorMap: () => ({ message: 'Role must be one of: Admin, Sales, Warehouse, Accounts' }),
    }),
  }),
});
