import { Suspense } from 'react';
import { generateMetadata } from '@/lib/seo';
import { BlogHeroSection } from '@/components/sections/blog-hero-section';
import { BlogListSection } from '@/components/sections/blog-list-section';
import { BlogSidebarSection } from '@/components/sections/blog-sidebar-section';
import { LoadingSkeleton } from '@/components/ui/loading';
import { StructuredData } from '@/components/seo/structured-data';
import { Container } from '@/components/ui/container';

// Metadata for blog page
export const metadata = generateMetadata({
  title: 'Blog',
  description: 'Stay updated with the latest insights, tutorials, and industry trends in web development, design, and digital innovation.',
  keywords: ['blog', 'articles', 'web development', 'design', 'tutorials', 'technology', 'insights'],
  canonical: '/blog',
  openGraph: {
    title: 'Blog | Latest Insights and Tutorials',
    description: 'Explore our latest articles on web development, design, and digital innovation.',
    type: 'website',
    url: '/blog',
  },
});

// Structured data for the blog page
const blogStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Strapi Railway Framework Blog',
  url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog`,
  description: 'Latest insights, tutorials, and industry trends in web development and digital innovation.',
  publisher: {
    '@type': 'Organization',
    name: 'Strapi Railway Framework',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog`
  }
};

// Blog page loading skeleton
function BlogPageSkeleton() {
  return (
    <div className="space-y-16">
      <LoadingSkeleton height="h-64" />
      <Container>
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6">
                <LoadingSkeleton height="h-48 md:h-32" className="md:w-48 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <LoadingSkeleton height="h-8" />
                  <LoadingSkeleton lines={3} />
                  <div className="flex gap-4">
                    <LoadingSkeleton height="h-6" className="w-20" />
                    <LoadingSkeleton height="h-6" className="w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <LoadingSkeleton height="h-64" />
            <LoadingSkeleton height="h-48" />
            <LoadingSkeleton height="h-32" />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function BlogPage() {
  return (
    <>
      <StructuredData data={[blogStructuredData]} />
      
      <main className="min-h-screen">
        <Suspense fallback={<BlogPageSkeleton />}>
          {/* Hero Section */}
          <BlogHeroSection />
          
          {/* Blog Content with Sidebar */}
          <div className="py-16">
            <Container>
              <div className="grid lg:grid-cols-4 gap-12">
                {/* Main Blog List */}
                <div className="lg:col-span-3">
                  <BlogListSection />
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <BlogSidebarSection />
                </div>
              </div>
            </Container>
          </div>
        </Suspense>
      </main>
    </>
  );
}