/**
 * Common types shared across the Strapi Railway Framework
 */

export interface StrapiEntity {
  id: number
  attributes: Record<string, any>
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface StrapiResponse<T = any> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiCollection<T = any> {
  data: T[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiMedia {
  id: number
  attributes: {
    name: string
    alternativeText: string | null
    caption: string | null
    width: number
    height: number
    formats: {
      thumbnail?: MediaFormat
      small?: MediaFormat
      medium?: MediaFormat
      large?: MediaFormat
    }
    hash: string
    ext: string
    mime: string
    size: number
    url: string
    previewUrl: string | null
    provider: string
    provider_metadata: any | null
    createdAt: string
    updatedAt: string
  }
}

export interface MediaFormat {
  name: string
  hash: string
  ext: string
  mime: string
  path: string | null
  width: number
  height: number
  size: number
  url: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: {
    status: number
    name: string
    message: string
    details?: any
  }
  meta?: any
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface FilterParams {
  populate?: string | string[]
  filters?: Record<string, any>
  sort?: string | string[]
  publicationState?: 'live' | 'preview'
  locale?: string
}

export interface QueryParams extends PaginationParams, FilterParams {}

export type Environment = 'development' | 'staging' | 'production'

export interface AppConfig {
  env: Environment
  api: {
    url: string
    timeout: number
  }
  frontend: {
    url: string
    siteName: string
    siteDescription: string
  }
  features: {
    newsletter: boolean
    blog: boolean
    contactForm: boolean
    emailNotifications: boolean
  }
}