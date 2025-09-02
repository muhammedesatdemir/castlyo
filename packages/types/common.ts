import { z } from 'zod';

// Base entity schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Base entity type
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  statusCode: z.number().optional(),
});

export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>
export type ApiError = z.infer<typeof ApiErrorSchema>;

// File upload schemas
export const FileUploadSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimetype: z.string(),
  size: z.number(),
  url: z.string().url(),
});

export type FileUpload = z.infer<typeof FileUploadSchema>;

// Address schema
export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export type Address = z.infer<typeof AddressSchema>;

// Contact schema
export const ContactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
