import { z } from 'zod';

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive('Product ID must be a positive integer'),
    quantity: z.number().int().positive('Quantity changed must be a positive integer'),
    movement_type: z.enum(['IN', 'OUT'], {
      errorMap: () => ({ message: 'Movement type must be IN or OUT' }),
    }),
    reason: z.string().min(3, 'Reason for stock movement is required'),
  }),
});
