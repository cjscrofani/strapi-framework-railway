import { Suspense } from 'react';
import { generateMetadata } from '@/lib/seo';
import { ContactHeroSection } from '@/components/sections/contact-hero-section';
import { ContactFormSection } from '@/components/sections/contact-form-section';
import { ContactInfoSection } from '@/components/sections/contact-info-section';
import { ContactMapSection } from '@/components/sections/contact-map-section';
import { LoadingSkeleton } from '@/components/ui/loading';
import { StructuredData } from '@/components/seo/structured-data';
import { Container } from '@/components/ui/container';

// Metadata for contact page
export const metadata = generateMetadata({
  title: 'Contact Us',
  description: 'Get in touch with our team. We\'re here to help you bring your digital vision to life. Contact us for consultations, quotes, and project discussions.',
  keywords: ['contact', 'get in touch', 'consultation', 'quote', 'support', 'help'],
  canonical: '/contact',
  openGraph: {
    title: 'Contact Us | Get Your Project Started',
    description: 'Ready to start your project? Contact our expert team for consultations and quotes.',
    type: 'website',
    url: '/contact',
  },
});

// Structured data for the contact page
const contactStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Us',
  url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contact`,
  description: 'Contact our team for digital solutions, consultations, and project support.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Strapi Railway Framework',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-555-0123',
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: ['English']
      },
      {
        '@type': 'ContactPoint',
        email: 'hello@example.com',
        contactType: 'customer service'
      }
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Innovation Drive',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US'
    }
  }
};

// Contact page loading skeleton
function ContactPageSkeleton() {
  return (
    <div className="space-y-16">
      <LoadingSkeleton height="h-64" />
      <Container>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <LoadingSkeleton height="h-96" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton height="h-64" />
            <LoadingSkeleton height="h-48" />
          </div>
        </div>
      </Container>
      <LoadingSkeleton height="h-64" />
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <StructuredData data={[contactStructuredData]} />
      
      <main className="min-h-screen">
        <Suspense fallback={<ContactPageSkeleton />}>
          {/* Hero Section */}
          <ContactHeroSection />
          
          {/* Contact Form and Info */}
          <div className="py-16">
            <Container>
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div>
                  <ContactFormSection />
                </div>
                
                {/* Contact Information */}
                <div>
                  <ContactInfoSection />
                </div>
              </div>
            </Container>
          </div>
          
          {/* Map Section */}
          <ContactMapSection />
        </Suspense>
      </main>
    </>
  );
}