/**
 * Content types for the 5 standard pages
 */

import type { StrapiEntity, StrapiMedia } from './common'

// ===== HOME PAGE =====
export interface HomePage extends StrapiEntity {
  attributes: {
    hero: HeroSection
    features: FeatureSection[]
    newsletter: NewsletterSection
    latestPosts: LatestPostsSection
    seo: SeoComponent
  }
}

export interface HeroSection {
  headline: string
  subheadline: string
  ctaText: string
  ctaLink: string
  backgroundImage?: StrapiMedia
  backgroundVideo?: StrapiMedia
}

export interface FeatureSection {
  icon: string
  title: string
  description: string
  link?: string
}

export interface NewsletterSection {
  title: string
  description: string
  placeholder: string
  buttonText: string
  successMessage: string
}

export interface LatestPostsSection {
  title: string
  description: string
  showCount: number
}

// ===== ABOUT PAGE =====
export interface AboutPage extends StrapiEntity {
  attributes: {
    companyStory: RichTextContent
    timeline: TimelineItem[]
    team: TeamMember[]
    statistics: StatisticItem[]
    seo: SeoComponent
  }
}

export interface TimelineItem {
  year: string
  title: string
  description: string
  image?: StrapiMedia
}

export interface TeamMember {
  name: string
  role: string
  bio: string
  image: StrapiMedia
  socialLinks: SocialLink[]
}

export interface StatisticItem {
  label: string
  value: string
  description: string
}

export interface SocialLink {
  platform: string
  url: string
}

// ===== SERVICES PAGE =====
export interface ServicesPage extends StrapiEntity {
  attributes: {
    intro: RichTextContent
    categories: ServiceCategory[]
    comparisonTable: ComparisonTable
    seo: SeoComponent
  }
}

export interface ServiceCategory {
  name: string
  description: string
  services: Service[]
}

export interface Service extends StrapiEntity {
  attributes: {
    title: string
    description: string
    features: string[]
    price: PricingTier[]
    image?: StrapiMedia
    category: ServiceCategory
  }
}

export interface PricingTier {
  name: string
  price: string
  period: string
  features: string[]
  recommended: boolean
}

export interface ComparisonTable {
  title: string
  features: ComparisonFeature[]
  services: ComparisonService[]
}

export interface ComparisonFeature {
  name: string
  description: string
}

export interface ComparisonService {
  name: string
  features: Record<string, boolean | string>
}

// ===== BLOG PAGE =====
export interface BlogPost extends StrapiEntity {
  attributes: {
    title: string
    slug: string
    excerpt: string
    content: RichTextContent
    featuredImage: StrapiMedia
    author: Author
    categories: BlogCategory[]
    tags: Tag[]
    readTime: number
    seo: SeoComponent
  }
}

export interface Author extends StrapiEntity {
  attributes: {
    name: string
    bio: string
    avatar: StrapiMedia
    socialLinks: SocialLink[]
  }
}

export interface BlogCategory extends StrapiEntity {
  attributes: {
    name: string
    slug: string
    description: string
    color: string
  }
}

export interface Tag extends StrapiEntity {
  attributes: {
    name: string
    slug: string
  }
}

// ===== CONTACT PAGE =====
export interface ContactPage extends StrapiEntity {
  attributes: {
    contactForm: ContactFormConfig
    contactInfo: ContactInfo
    offices: Office[]
    faq: FaqSection
    seo: SeoComponent
  }
}

export interface ContactFormConfig {
  title: string
  description: string
  fields: FormField[]
  submitText: string
  successMessage: string
  errorMessage: string
}

export interface FormField {
  name: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: Record<string, any>
}

export interface ContactInfo {
  email: string
  phone: string
  businessHours: BusinessHours[]
  departments: Department[]
}

export interface BusinessHours {
  days: string
  hours: string
}

export interface Department {
  name: string
  email: string
  description: string
}

export interface Office {
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface FaqSection {
  title: string
  items: FaqItem[]
}

export interface FaqItem {
  question: string
  answer: RichTextContent
}

// ===== SHARED COMPONENTS =====
export interface RichTextContent {
  type: string
  children: any[]
}

export interface SeoComponent {
  metaTitle: string
  metaDescription: string
  keywords?: string
  canonicalURL?: string
  metaImage?: StrapiMedia
  metaRobots?: string
  structuredData?: any
}

// ===== NAVIGATION =====
export interface NavigationItem {
  label: string
  url: string
  target?: '_blank' | '_self'
  children?: NavigationItem[]
}

export interface GlobalConfig extends StrapiEntity {
  attributes: {
    siteName: string
    siteDescription: string
    logo: StrapiMedia
    favicon: StrapiMedia
    mainNavigation: NavigationItem[]
    footerNavigation: NavigationItem[]
    socialLinks: SocialLink[]
    contactInfo: ContactInfo
    defaultSeo: SeoComponent
  }
}