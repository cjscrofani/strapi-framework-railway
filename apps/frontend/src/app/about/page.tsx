import { Suspense } from 'react';
import { generateMetadata } from '@/lib/seo';
import { AboutHeroSection } from '@/components/sections/about-hero-section';
import { TeamSection } from '@/components/sections/team-section';
import { TimelineSection } from '@/components/sections/timeline-section';
import { ValuesSection } from '@/components/sections/values-section';
import { StatsSection } from '@/components/sections/stats-section';
import { LoadingSkeleton } from '@/components/ui/loading';
import { StructuredData } from '@/components/seo/structured-data';

// Metadata for about page
export const metadata = generateMetadata({
  title: 'About Us',
  description: 'Learn about our mission, vision, and the passionate team behind our innovative solutions. Discover our journey and values that drive us forward.',
  keywords: ['about us', 'team', 'mission', 'vision', 'company history', 'values'],
  canonical: '/about',
  openGraph: {
    title: 'About Us | Our Story and Team',
    description: 'Meet the team and learn about our mission to deliver exceptional digital solutions.',
    type: 'website',
    url: '/about',
  },
});

// Structured data for the about page
const aboutStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Us',
  url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/about`,
  description: 'Learn about our mission, vision, and the passionate team behind our innovative solutions.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Strapi Railway Framework',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    description: 'Building exceptional digital experiences with modern technology.',
    foundingDate: '2020-01-01',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '10-50'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    }
  }
};

// About page loading skeleton
function AboutPageSkeleton() {
  return (
    <div className="space-y-16">
      <LoadingSkeleton height="h-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} height="h-32" />
        ))}
      </div>
      <LoadingSkeleton lines={4} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} height="h-64" />
        ))}
      </div>
      <LoadingSkeleton height="h-48" />
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <StructuredData data={[aboutStructuredData]} />
      
      <main className="min-h-screen">
        <Suspense fallback={<AboutPageSkeleton />}>
          {/* Hero Section */}
          <AboutHeroSection />
          
          {/* Company Stats */}
          <StatsSection />
          
          {/* Mission, Vision, Values */}
          <ValuesSection />
          
          {/* Company Timeline */}
          <TimelineSection />
          
          {/* Team Section */}
          <TeamSection />
        </Suspense>
      </main>
    </>
  );
}