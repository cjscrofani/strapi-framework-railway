# Strapi Railway Framework

> **Production-ready full-stack Strapi + Next.js framework optimized for Railway deployment**

A comprehensive, monorepo framework combining Strapi CMS with Next.js frontend, featuring advanced email marketing, responsive component library, and seamless Railway deployment.

## 🚀 Features

### **Complete Full-Stack Solution**
- **Monorepo Architecture** with Turborepo for optimized builds
- **Strapi 4** CMS backend with TypeScript and Redis caching
- **Next.js 14+** frontend with App Router and modern React patterns  
- **PostgreSQL** database with connection pooling and migrations
- **SendGrid Integration** for comprehensive email marketing system
- **Railway Optimized** for one-click deployment

### **5-Page Website Framework**
Ready-to-use page templates with dynamic content management:
1. **Home Page** - Hero sections, features, statistics, newsletter signup
2. **About Page** - Company story, team profiles, timeline, values
3. **Services Page** - Service catalog, pricing, process workflow
4. **Blog Page** - Articles, categories, search, pagination, sidebar
5. **Contact Page** - Contact forms, office locations, interactive maps

### **Advanced Email Marketing System**
- **Transactional Emails** - Welcome, password reset, confirmations
- **Marketing Campaigns** - Newsletter management, automation
- **Template Management** - Visual builder with Handlebars support
- **Analytics & Monitoring** - Open rates, clicks, deliverability tracking
- **Webhook Processing** - Real-time event handling
- **Compliance Features** - GDPR, CAN-SPAM, unsubscribe management

### **Production-Ready Component Library**
- **Responsive Design System** - Mobile-first with Tailwind CSS
- **UI Components** - Buttons, forms, modals, loading states
- **Layout Components** - Headers, footers, navigation, containers
- **SEO Optimization** - Meta tags, structured data, social sharing
- **Accessibility** - WCAG AA compliant components
- **TypeScript** - Full type safety throughout

## 📦 Project Structure

```
strapi-framework-railway/
├── apps/
│   ├── backend/                # Strapi CMS Backend
│   │   ├── src/api/            # Content types & controllers
│   │   ├── src/services/       # Email marketing & caching services
│   │   ├── config/             # Database & plugins config
│   │   ├── database/           # Migrations & seed data
│   │   └── email-templates/    # Handlebars email templates
│   └── frontend/               # Next.js Frontend  
│       ├── src/components/     # UI & layout components
│       ├── src/app/            # Pages with App Router
│       └── src/lib/            # API integration & utilities
├── packages/
│   └── shared/                 # Shared TypeScript types
└── railway.json               # Railway deployment config
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database
- SendGrid account and API key
- Railway account (for deployment)

### Local Development

1. **Clone and install:**
```bash
git clone <your-repo>
cd strapi-framework
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env.local
# Fill in your database and SendGrid credentials
```

3. **Start development servers:**
```bash
npm run dev
# Backend: http://localhost:1337
# Frontend: http://localhost:3000
```

### Database Setup

```bash
# Create PostgreSQL database
createdb strapi_dev

# Run Strapi to create tables
cd apps/backend
npm run develop
```

## 🚢 Railway Deployment

### One-Click Deploy
1. Fork this repository
2. Connect to Railway
3. Set environment variables
4. Deploy!

### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project  
railway login
railway link

# Set environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set SENDGRID_API_KEY=SG.xxx

# Deploy
railway up
```

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Strapi
APP_KEYS=key1,key2,key3,key4
ADMIN_JWT_SECRET=your-admin-secret
API_TOKEN_SALT=your-api-salt  
TRANSFER_TOKEN_SALT=your-transfer-salt
JWT_SECRET=your-jwt-secret

# SendGrid Email System
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name
SENDGRID_WEBHOOK_SECRET=your-webhook-secret

# Site Configuration
SITE_NAME=Your Company Name
FRONTEND_URL=https://yourdomain.com
CONTACT_EMAIL=contact@yourdomain.com

# Optional: Redis (for caching)
REDIS_URL=redis://localhost:6379
```

## 📧 Email System

### SendGrid Integration Features
- **Template Management** - Visual template builder with Handlebars
- **Transactional Emails** - Welcome, password reset, contact confirmations  
- **Marketing Campaigns** - Newsletter subscriptions and automation
- **Analytics Dashboard** - Email performance, open rates, click tracking
- **Webhook Processing** - Real-time delivery and engagement events
- **Compliance Tools** - Unsubscribe management, GDPR compliance

### Quick Setup
1. **Create SendGrid account** and verify your sender domain
2. **Generate API key** with full access permissions
3. **Set environment variables** (see Required Environment Variables above)
4. **Configure webhook endpoint**: `https://yourdomain.com/api/webhooks/sendgrid`
5. **Deploy and test** email functionality

### Available Email Templates
- **Welcome Email** - User onboarding and account activation
- **Password Reset** - Secure password reset with time-sensitive links
- **Contact Confirmation** - Form submission acknowledgments

## 🎨 Customization

### Content Management
Manage all content through Strapi admin panel at `http://localhost:1337/admin`:
- **Page Content** - Home, About, Services, Contact page content
- **Blog Management** - Posts, categories, tags, and media
- **Email Templates** - Template content, variables, and analytics  
- **Site Settings** - Navigation, SEO, social media links

### Frontend Components
```bash
# UI Components (buttons, forms, modals)
apps/frontend/src/components/ui/

# Layout Components (header, footer, navigation)  
apps/frontend/src/components/layout/

# Page Sections (hero, features, testimonials)
apps/frontend/src/components/sections/

# Customize Tailwind theme
apps/frontend/tailwind.config.js
```

### Email Template Customization
```bash
# Handlebars templates
apps/backend/email-templates/

# Template variables and styling  
# Manage through Strapi admin panel
# Test templates at: POST /api/email-templates/:id/test
```

## 🛠️ Development

### Available Scripts
```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start Strapi backend only  
npm run dev:frontend     # Start Next.js frontend only

# Production  
npm run build           # Build both applications
npm run start           # Start production servers

# Database
npm run migrate         # Run database migrations
npm run seed            # Seed sample data

# Code Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript validation
npm run format          # Prettier formatting
```

### API Endpoints
```bash
# Content APIs
GET  /api/home-pages     # Home page content
GET  /api/services       # Services with filtering
GET  /api/blog-posts     # Blog posts with pagination
POST /api/contact-submissions  # Contact form submission

# Email APIs  
POST /api/emails/welcome           # Welcome email
POST /api/emails/password-reset    # Password reset  
POST /api/emails/contact-confirmation  # Contact confirmation
POST /api/webhooks/sendgrid        # SendGrid webhook events

# Health & Monitoring
GET  /api/_health        # Backend health check
GET  /api/health         # Frontend health check
```

## 🔒 Security & Performance

### Security Features
- **Input Validation** - Comprehensive form and API validation
- **Rate Limiting** - API abuse prevention with configurable limits
- **CORS Protection** - Properly configured cross-origin policies  
- **Email Security** - Webhook signature verification
- **Database Security** - SQL injection prevention through ORM
- **File Upload Security** - Type validation and malicious file detection

### Performance Optimizations  
- **Redis Caching** - API response caching with automatic invalidation
- **Image Optimization** - Responsive images with Next.js Image component
- **Database Optimization** - Connection pooling and query optimization
- **Bundle Optimization** - Tree-shaking and code splitting
- **SEO Optimization** - Meta tags, structured data, Core Web Vitals

## 🤝 Contributing

This framework is production-ready and includes:
- ✅ Complete backend with Strapi CMS, email system, and caching
- ✅ Modern frontend with Next.js, responsive components, and SEO
- ✅ Railway deployment configuration with one-click setup
- ✅ Comprehensive documentation and development tools

Ready to build your next website! 🚀
