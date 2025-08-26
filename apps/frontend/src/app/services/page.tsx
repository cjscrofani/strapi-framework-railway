import { Suspense } from 'react';
import { generateMetadata } from '@/lib/seo';
import { ServicesHeroSection } from '@/components/sections/services-hero-section';
import { ServicesGridSection } from '@/components/sections/services-grid-section';
import { ServicesFeaturesSection } from '@/components/sections/services-features-section';
import { ServicesProcessSection } from '@/components/sections/services-process-section';
import { ServicesCTASection } from '@/components/sections/services-cta-section';
import { LoadingSkeleton } from '@/components/ui/loading';
import { StructuredData } from '@/components/seo/structured-data';

// Metadata for services page
export const metadata = generateMetadata({
  title: 'Our Services',
  description: 'Discover our comprehensive range of digital services including web development, mobile apps, UI/UX design, and more. Transform your business with our expert solutions.',
  keywords: ['services', 'web development', 'mobile apps', 'ui ux design', 'digital solutions', 'consulting'],
  canonical: '/services',
  openGraph: {
    title: 'Our Services | Professional Digital Solutions',
    description: 'Explore our full range of services designed to help your business thrive in the digital age.',
    type: 'website',
    url: '/services',
  },
});

// Structured data for the services page
const servicesStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Digital Solutions Services',
  provider: {
    '@type': 'Organization',
    name: 'Strapi Railway Framework',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  description: 'Comprehensive digital services including web development, mobile applications, UI/UX design, and digital consulting.',
  serviceType: 'Digital Services',
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide'
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Digital Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Web Development',
          description: 'Custom web applications and websites'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Mobile Development',
          description: 'Native and cross-platform mobile applications'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'UI/UX Design',
          description: 'User interface and user experience design'
        }
      }
    ]
  }
};

// Services page loading skeleton
function ServicesPageSkeleton() {
  return (
    <div className="space-y-16">
      <LoadingSkeleton height="h-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <LoadingSkeleton key={i} height="h-64" />
        ))}
      </div>
      <LoadingSkeleton lines={3} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} height="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <StructuredData data={[servicesStructuredData]} />
      
      <main className="min-h-screen">
        <Suspense fallback={<ServicesPageSkeleton />}>
          {/* Hero Section */}
          <ServicesHeroSection />
          
          {/* Services Grid with Filtering */}
          <ServicesGridSection />
          
          {/* Service Features */}
          <ServicesFeaturesSection />
          
          {/* Our Process */}
          <ServicesProcessSection />
          
          {/* Call to Action */}
          <ServicesCTASection />
        </Suspense>
      </main>
    </>
  );
}