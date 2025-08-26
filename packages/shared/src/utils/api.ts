/**
 * Shared API utilities and helpers
 */

import type { QueryParams, StrapiResponse, StrapiCollection, ApiResponse } from '../types/common'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function buildStrapiUrl(baseUrl: string, endpoint: string, params?: QueryParams): string {
  const url = new URL(`${baseUrl}/${endpoint}`)
  
  if (params) {
    // Handle pagination
    if (params.page) {
      url.searchParams.set('pagination[page]', params.page.toString())
    }
    if (params.pageSize) {
      url.searchParams.set('pagination[pageSize]', params.pageSize.toString())
    }
    
    // Handle population
    if (params.populate) {
      if (Array.isArray(params.populate)) {
        params.populate.forEach(field => {
          url.searchParams.append('populate', field)
        })
      } else {
        url.searchParams.set('populate', params.populate)
      }
    }
    
    // Handle filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(`filters[${key}]`, String(value))
        }
      })
    }
    
    // Handle sorting
    if (params.sort) {
      if (Array.isArray(params.sort)) {
        params.sort.forEach(field => {
          url.searchParams.append('sort', field)
        })
      } else {
        url.searchParams.set('sort', params.sort)
      }
    }
    
    // Handle publication state
    if (params.publicationState) {
      url.searchParams.set('publicationState', params.publicationState)
    }
    
    // Handle locale
    if (params.locale) {
      url.searchParams.set('locale', params.locale)
    }
  }
  
  return url.toString()
}

export function extractStrapiData<T>(response: StrapiResponse<T>): T {
  return response.data
}

export function extractStrapiCollection<T>(response: StrapiCollection<T>): T[] {
  return response.data
}

export function formatStrapiImageUrl(baseUrl: string, imagePath: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  return `${baseUrl}${imagePath}`
}

export function createApiClient(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
  return {
    async get<T = any>(endpoint: string, params?: QueryParams): Promise<T> {
      const url = buildStrapiUrl(baseUrl, endpoint, params)
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
        },
      })
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      
      return response.json()
    },
    
    async post<T = any>(endpoint: string, data?: any): Promise<T> {
      const url = `${baseUrl}/${endpoint}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
        },
        body: data ? JSON.stringify(data) : undefined,
      })
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      
      return response.json()
    },
    
    async put<T = any>(endpoint: string, data?: any): Promise<T> {
      const url = `${baseUrl}/${endpoint}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
        },
        body: data ? JSON.stringify(data) : undefined,
      })
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      
      return response.json()
    },
    
    async delete<T = any>(endpoint: string): Promise<T> {
      const url = `${baseUrl}/${endpoint}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
        },
      })
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      
      return response.json()
    }
  }
}

export function handleApiError(error: unknown): ApiResponse {
  if (error instanceof ApiError) {
    return {
      error: {
        status: error.status,
        name: error.name,
        message: error.message,
        details: error.details,
      }
    }
  }
  
  if (error instanceof Error) {
    return {
      error: {
        status: 500,
        name: 'InternalError',
        message: error.message,
      }
    }
  }
  
  return {
    error: {
      status: 500,
      name: 'UnknownError',
      message: 'An unknown error occurred',
    }
  }
}

export function isApiError(response: ApiResponse): response is { error: NonNullable<ApiResponse['error']> } {
  return response.error !== undefined
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      await sleep(delayMs * attempt) // Exponential backoff
    }
  }
  
  throw lastError!
}