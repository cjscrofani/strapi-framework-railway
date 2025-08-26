/**
 * Environment Configuration Utility
 * Validates and manages environment variables across the monorepo
 */

const requiredEnvVars = {
  development: [
    'DATABASE_HOST',
    'DATABASE_PORT', 
    'DATABASE_NAME',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD'
  ],
  production: [
    'DATABASE_URL',
    'APP_KEYS',
    'API_TOKEN_SALT',
    'ADMIN_JWT_SECRET',
    'TRANSFER_TOKEN_SALT',
    'JWT_SECRET',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL'
  ]
}

const optionalEnvVars = [
  'REDIS_URL',
  'SENDGRID_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRAPI_API_URL',
  'NEXT_PUBLIC_STRAPI_MEDIA_URL'
]

function validateEnv(env = process.env.NODE_ENV || 'development') {
  const missing = []
  const required = requiredEnvVars[env] || requiredEnvVars.development

  required.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:')
    missing.forEach(envVar => {
      console.warn(`   - ${envVar}`)
    })
    console.warn('   Copy .env.example to .env.local and fill in the values')
  }

  return missing.length === 0
}

function getEnvConfig() {
  return {
    // Database
    database: {
      client: process.env.DATABASE_CLIENT || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      name: process.env.DATABASE_NAME || 'strapi_dev',
      username: process.env.DATABASE_USERNAME || 'strapi', 
      password: process.env.DATABASE_PASSWORD || 'strapi',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
    },

    // Strapi
    strapi: {
      host: process.env.HOST || '0.0.0.0',
      port: parseInt(process.env.PORT) || 1337,
      apiUrl: process.env.STRAPI_API_URL || 'http://localhost:1337/api',
      mediaUrl: process.env.STRAPI_MEDIA_URL || 'http://localhost:1337',
      publicUrl: process.env.PUBLIC_URL || 'http://localhost:1337'
    },

    // SendGrid  
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME || 'Strapi App',
      replyTo: process.env.SENDGRID_REPLY_TO,
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      newsletterListId: process.env.SENDGRID_NEWSLETTER_LIST_ID,
      contactListId: process.env.SENDGRID_CONTACT_LIST_ID
    },

    // Frontend
    frontend: {
      url: process.env.FRONTEND_URL || 'http://localhost:3000',
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Strapi Railway Framework',
      siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Full-stack framework'
    },

    // Redis
    redis: {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0
    },

    // Environment
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isRailway: !!process.env.RAILWAY_STATIC_URL
  }
}

module.exports = {
  validateEnv,
  getEnvConfig,
  requiredEnvVars,
  optionalEnvVars
}