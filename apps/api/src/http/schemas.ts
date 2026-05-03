import { z } from 'zod';

const localizedTextSchema = z.object({
  pt: z.string().trim().min(1).max(180),
  en: z.string().trim().min(1).max(180),
  es: z.string().trim().min(1).max(180),
  zh: z.string().trim().min(1).max(180),
  ja: z.string().trim().min(1).max(180),
});

const localizedDescriptionSchema = z.object({
  pt: z.string().trim().min(2).max(1000),
  en: z.string().trim().min(2).max(1000),
  es: z.string().trim().min(2).max(1000),
  zh: z.string().trim().min(2).max(1000),
  ja: z.string().trim().min(2).max(1000),
});

const productPricesSchema = z.object({
  brlCents: z.number().int().nonnegative(),
  usdCents: z.number().int().nonnegative(),
});

const productVariantSchema = z.object({
  id: z.string().trim().optional(),
  sku: z.string().trim().min(1).max(120),
  attributes: z.record(z.string().trim().min(1).max(80), z.string().trim().min(1).max(180)),
  prices: productPricesSchema,
  stock: z.number().int().nonnegative(),
  active: z.boolean().optional(),
});

export const loginBodySchema = z.object({
  login: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

export const productBodySchema = z.object({
  name: localizedTextSchema,
  description: localizedDescriptionSchema,
  imageUrl: z.string().trim().min(1).max(7_500_000).optional(),
  variants: z.array(productVariantSchema).min(1).max(100),
  active: z.boolean().optional(),
});

export const productListQuerySchema = z.object({
  country: z.string().trim().length(2).optional(),
  lang: z.enum(['pt', 'en', 'es', 'zh', 'ja']).optional(),
});

export const orderBodySchema = z.object({
  contact: z.object({
    name: z.string().trim().min(2).max(180),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(6).max(40),
  }),
  address: z.object({
    country: z.string().trim().length(2),
    postalCode: z.string().trim().min(3).max(32),
    state: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    line1: z.string().trim().min(3).max(240),
    line2: z.string().trim().max(240).optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(120),
        variantId: z.string().trim().min(1).max(120),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(100),
  lang: z.enum(['pt', 'en', 'es', 'zh', 'ja']).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'cancelled']),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ProductBody = z.infer<typeof productBodySchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type OrderBody = z.infer<typeof orderBodySchema>;
export type OrderStatusUpdateBody = z.infer<typeof orderStatusUpdateSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
