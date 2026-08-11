import { z } from 'zod';

export const createChallanSchema = z.object({
  body: z.object({
    customer_id: z.number().int().positive('Customer ID must be a positive integer'),
    status: z.enum(['Draft', 'Confirmed'], {
      errorMap: () => ({ message: 'Initial status must be Draft or Confirmed' }),
    }).default('Draft'),
    items: z
      .array(
        z.object({
          product_id: z.number().int().positive('Product ID must be a positive integer'),
          quantity: z.number().int().positive('Quantity must be a positive integer'),
        })
      )
      .min(1, 'At least one product item must be included in the sales challan'),
  }),
});

export const updateChallanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Challan ID must be a numeric integer'),
  }),
  body: z.object({
    customer_id: z.number().int().positive().optional(),
    items: z
      .array(
        z.object({
          product_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1)
      .optional(),
  }),
});
