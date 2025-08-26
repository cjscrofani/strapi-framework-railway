# Strapi Railway Framework

> **Full-stack Strapi + Next.js framework optimized for Railway deployment with SendGrid integration**

A production-ready, monorepo framework that combines the power of Strapi CMS with Next.js frontend, optimized for seamless deployment on Railway with integrated email functionality via SendGrid.

## 🚀 Features

### **Full-Stack Architecture**
- **Monorepo structure** with Turborepo for optimized builds
- **Strapi 4** CMS backend with TypeScript
- **Next.js 14+** frontend with App Router
- **PostgreSQL** database with optimized connection pooling
- **Redis** caching layer (optional)
- **SendGrid** integration for transactional and marketing emails

### **5 Standard Pages Framework**
1. **Home Page** - Hero, features, newsletter, latest posts
2. **About Page** - Company story, team, timeline, statistics  
3. **Services Page** - Service catalog, pricing, comparisons
4. **Blog Page** - Articles, categories, search, pagination
5. **Contact Page** - Forms, office locations, FAQ, support

### **Email Marketing Integration**
- Newsletter subscription management
- Contact form automation
- Transactional email templates
- Campaign analytics and reporting
- Webhook event processing
- GDPR-compliant unsubscribe handling

### **Railway Optimized**
- One-click deployment configuration
- Automatic builds from GitHub
- Environment variable management  
- Custom domain support
- Health checks and monitoring

## 📦 Project Structure

```
strapi-framework/
├── apps/
│   ├── backend/          # Strapi CMS
│   └── frontend/         # Next.js application
├── packages/
│   ├── shared/           # Shared TypeScript types
│   ├── ui/              # UI component library  
│   └── email-templates/ # Email template management
├── .github/
│   └── workflows/       # CI/CD pipelines
└── railway.json         # Railway deployment config
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
APP_KEYS=key1,key2
ADMIN_JWT_SECRET=your-secret
API_TOKEN_SALT=your-salt
TRANSFER_TOKEN_SALT=your-salt

# SendGrid
SENDGRID_API_KEY=SG.your-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## 📧 Email Configuration

### SendGrid Setup
1. Create SendGrid account
2. Verify sender domain
3. Create API key with full access
4. Set up webhook endpoints
5. Configure email templates

### Email Features
- **Transactional**: Welcome, password reset, confirmations
- **Marketing**: Newsletters, campaigns, automation
- **Forms**: Contact forms, quote requests, feedback
- **Analytics**: Open rates, clicks, bounces, unsubscribes

## 🎨 Customization

### Content Management
All content is managed through Strapi's admin panel:
- Page content and metadata
- Navigation menus
- Blog posts and categories
- Team members and services
- Email templates and campaigns

### Frontend Theming
```bash
# Customize Tailwind theme
apps/frontend/tailwind.config.js

# Update global styles  
apps/frontend/src/app/globals.css

# Modify components
apps/frontend/src/components/
```

### Email Templates
```bash
# Manage templates in Strapi
packages/email-templates/

# SendGrid dynamic templates
# Configure in SendGrid dashboard
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📊 Monitoring

### Health Checks
- Backend: `/api/_health`
- Frontend: `/api/health`
- Database connectivity
- SendGrid API status

### Analytics
- Email performance metrics
- User engagement tracking
- Error monitoring and alerts
- Performance optimization

## 🔒 Security

- **Environment variables** properly secured
- **API rate limiting** configured
- **CORS** policies set
- **Input validation** on all forms
- **Email compliance** (GDPR, CAN-SPAM)
- **SQL injection** prevention
- **XSS protection** enabled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please read our [Contributing Guidelines](.github/CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation](docs/)
- **Issues**: [GitHub Issues](issues)
- **Community**: [Discussions](discussions)

---

**Made with ❤️ for developers who want to ship fast**