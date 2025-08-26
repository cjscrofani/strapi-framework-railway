import { Suspense } from 'react';
import { generateMetadata } from '@/lib/seo';
import { HeroSection } from '@/components/sections/hero-section';
import { AboutPreviewSection } from '@/components/sections/about-preview-section';
import { ServicesPreviewSection } from '@/components/sections/services-preview-section';
import { BlogPreviewSection } from '@/components/sections/blog-preview-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { CTASection } from '@/components/sections/cta-section';
import { NewsletterSection } from '@/components/sections/newsletter-section';
import { LoadingSkeleton } from '@/components/ui/loading';
import { StructuredData } from '@/components/seo/structured-data';

// Metadata for home page
export const metadata = generateMetadata({
  title: 'Home',
  description: 'Welcome to our modern full-stack platform built with Strapi CMS, Next.js, and Railway. Experience cutting-edge technology with seamless email integration.',
  keywords: ['strapi', 'nextjs', 'railway', 'full-stack', 'cms', 'sendgrid'],
  canonical: '/',
  openGraph: {
    title: 'Modern Full-Stack Platform | Strapi Railway Framework',
    description: 'Experience the power of modern web development with our comprehensive platform.',
    type: 'website',
    url: '/',
  },
});

// Structured data for the website
const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Strapi Railway Framework',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  description: 'A modern full-stack framework built with Strapi CMS, Next.js, and Railway.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Strapi Railway Framework',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
  description: 'Building exceptional digital experiences with modern technology.',
  sameAs: [
    'https://github.com/strapi-railway-framework',
  ],
};

// Home page loading skeleton
function HomePageSkeleton() {
  return (
    <div className="space-y-16">
      <LoadingSkeleton height="h-96" />
      <LoadingSkeleton lines={3} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} height="h-48" />
        ))}
      </div>
      <LoadingSkeleton lines={2} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <StructuredData data={[websiteStructuredData, organizationStructuredData]} />
      
      <main className="min-h-screen">
        <Suspense fallback={<HomePageSkeleton />}>
          {/* Hero Section */}
          <HeroSection />
          
          {/* About Preview Section */}
          <AboutPreviewSection />
          
          {/* Services Preview Section */}
          <ServicesPreviewSection />
          
          {/* Testimonials Section */}
          <TestimonialsSection />
          
          {/* Blog Preview Section */}
          <BlogPreviewSection />
          
          {/* Newsletter Section */}
          <NewsletterSection />
          
          {/* Call to Action Section */}
          <CTASection />
        </Suspense>
      </main>
    </>
  );
}