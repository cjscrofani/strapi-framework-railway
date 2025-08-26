/**
 * Main entry point for @strapi-railway-framework/shared
 */

// Types
export * from './types/common'
export * from './types/content'

// Email
export * from './email/types'

// Utils
export * from './utils/validation'
export * from './utils/api'

// Re-export commonly used external dependencies
export { z } from 'zod'