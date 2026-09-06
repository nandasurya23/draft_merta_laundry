import { z } from 'zod';

// Auth Schemas
export const LoginSchema = z.object({
  pin: z.string().min(1, 'PIN is required'),
});

// Customers Schemas
export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  phone: z.string().max(20).optional(),
  customKiloanPrice: z.number().int().min(0).optional().nullable(),
  customItems: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().int().min(0),
      })
    )
    .optional()
    .nullable(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// Settings Schema
export const UpdateSettingsSchema = z.object({
  laundryName: z.string().min(1).max(150).optional(),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  kiloanPrices: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        price: z.number().int().min(0),
      })
    )
    .optional(),
  satuanPrices: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().int().min(1),
      })
    )
    .optional()
    .nullable(),
});

// Transactions Schema
export const TransactionItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(0),
});

export const KiloDetailSchema = z.object({
  weight: z.number().min(0.1),
  pricePerKg: z.number().int().min(0),
  totalItemCount: z.number().int().min(0),
  items: z.array(TransactionItemSchema).optional(),
});

export const SatuanItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
});

export const UnitDetailSchema = z.object({
  items: z.array(SatuanItemSchema),
});

export const CreateTransactionSchema = z.object({
  date: z.string().datetime().optional(),
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().min(1).max(150),
  customerPhone: z.string().max(20).optional(),
  type: z.enum(['KILOAN', 'SATUAN', 'KILOAN_SATUAN']),
  kiloDetail: KiloDetailSchema.optional(),
  unitDetail: UnitDetailSchema.optional(),
  paymentStatus: z.enum(['BELUM_BAYAR', 'LUNAS']).default('BELUM_BAYAR'),
});

export const UpdateTransactionSchema = z.object({
  paymentStatus: z.enum(['BELUM_BAYAR', 'LUNAS']).optional(),
  laundryStatus: z.enum(['DITERIMA', 'DIPROSES', 'SELESAI', 'DIAMBIL']).optional(),
});

// User Schemas
export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  pin: z.string().trim().regex(/^\d{4}$/, 'PIN harus berupa 4 digit angka'),
});

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  pin: z.string().trim().regex(/^\d{4}$/, 'PIN harus berupa 4 digit angka').optional(),
});

// Types
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
