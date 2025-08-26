/**
 * Shared validation schemas using Zod
 */

import { z } from 'zod'

// ===== EMAIL VALIDATION =====
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(254, 'Email is too long')

export const newsletterSubscriptionSchema = z.object({
  email: emailSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  source: z.string().default('website'),
})

// ===== CONTACT FORM VALIDATION =====
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
  email: emailSchema,
  subject: z
    .string()
    .max(200, 'Subject is too long')
    .optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long')
    .trim(),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(100, 'Company name is too long')
    .optional(),
})

// ===== QUOTE REQUEST VALIDATION =====
export const quoteRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: emailSchema,
  company: z
    .string()
    .max(100, 'Company name is too long')
    .optional(),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional(),
  services: z
    .array(z.string())
    .min(1, 'Please select at least one service'),
  budget: z
    .enum(['under-10k', '10k-25k', '25k-50k', '50k-100k', '100k-plus'])
    .optional(),
  timeline: z
    .enum(['asap', '1-3-months', '3-6-months', '6-plus-months'])
    .optional(),
  message: z
    .string()
    .min(10, 'Please provide more details about your project')
    .max(2000, 'Message is too long'),
})

// ===== COMMENT VALIDATION =====
export const commentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: emailSchema,
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment is too long'),
})

// ===== PAGINATION VALIDATION =====
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .default(1),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(25),
})

// ===== SEARCH VALIDATION =====
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .trim(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(['relevance', 'date', 'title', 'views'])
    .default('relevance'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

// ===== STRAPI QUERY VALIDATION =====
export const strapiQuerySchema = z.object({
  populate: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  filters: z.record(z.any()).optional(),
  sort: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  pagination: paginationSchema.optional(),
  publicationState: z
    .enum(['live', 'preview'])
    .default('live')
    .optional(),
  locale: z.string().optional(),
})

// ===== API RESPONSE VALIDATION =====
export const apiErrorSchema = z.object({
  status: z.number(),
  name: z.string(),
  message: z.string(),
  details: z.any().optional(),
})

export const apiResponseSchema = z.object({
  data: z.any().optional(),
  error: apiErrorSchema.optional(),
  meta: z.any().optional(),
})

// ===== ENVIRONMENT VALIDATION =====
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  STRAPI_API_URL: z.string().url(),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: emailSchema,
  JWT_SECRET: z.string().min(32),
  ADMIN_JWT_SECRET: z.string().min(32),
})

// ===== EXPORT TYPES =====
export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type QuoteRequestData = z.infer<typeof quoteRequestSchema>
export type CommentData = z.infer<typeof commentSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type SearchParams = z.infer<typeof searchSchema>
export type StrapiQuery = z.infer<typeof strapiQuerySchema>
export type ApiError = z.infer<typeof apiErrorSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type EnvConfig = z.infer<typeof envSchema>