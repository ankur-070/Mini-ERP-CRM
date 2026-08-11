import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits').max(20),
    email: z.string().email('Invalid email address format'),
    business_name: z.string().min(2, 'Business name is required'),
    gst_number: z.string().optional().nullable(),
    customer_type: z.enum(['Retail', 'Wholesale', 'Distributor'], {
      errorMap: () => ({ message: 'Customer type must be Retail, Wholesale, or Distributor' }),
    }),
    address: z.string().min(5, 'Address must be at least 5 characters long'),
    status: z.enum(['Lead', 'Active', 'Inactive'], {
      errorMap: () => ({ message: 'Status must be Lead, Active, or Inactive' }),
    }).default('Lead'),
    follow_up_date: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Customer ID must be a numeric integer'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    mobile_number: z.string().min(8).max(20).optional(),
    email: z.string().email().optional(),
    business_name: z.string().min(2).optional(),
    gst_number: z.string().optional().nullable(),
    customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']).optional(),
    address: z.string().min(5).optional(),
    status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
    follow_up_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const addFollowUpNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Customer ID must be a numeric integer'),
  }),
  body: z.object({
    note: z.string().min(1, 'Note content is required'),
    follow_up_date: z.string().optional().nullable(),
  }),
});
