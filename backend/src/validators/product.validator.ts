import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU/Code is required'),
    category: z.string().min(2, 'Category is required'),
    unit_price: z.number().min(0, 'Unit price must be greater than or equal to 0'),
    current_stock: z.number().int().min(0, 'Current stock must be a non-negative integer').default(0),
    min_stock_alert: z.number().int().min(0, 'Minimum stock alert quantity must be a non-negative integer').default(0),
    location: z.string().min(2, 'Warehouse/Location is required'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a numeric integer'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    unit_price: z.number().min(0).optional(),
    current_stock: z.number().int().min(0).optional(),
    min_stock_alert: z.number().int().min(0).optional(),
    location: z.string().min(2).optional(),
  }),
});
