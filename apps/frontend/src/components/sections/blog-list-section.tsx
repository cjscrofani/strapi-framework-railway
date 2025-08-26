'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Tag, ChevronLeft, ChevronRight, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlogPosts, useBlogCategories } from '@/lib/react-query';
import { LoadingSkeleton } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function createExcerpt(content: string, maxLength: number = 200): string {
  const textContent = content.replace(/<[^>]*>/g, '');
  if (textContent.length <= maxLength) return textContent;
  return textContent.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function BlogListSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  
  const pageSize = 6;
  
  const { data: blogData, isLoading, error } = useBlogPosts({
    page: currentPage,
    pageSize,
    category: selectedCategory
  });
  
  const { data: categoriesData } = useBlogCategories();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Default blog posts if no data from API
  const defaultPosts = Array.from({ length: 12 }, (_, i) => ({
    id: `${i + 1}`,
    attributes: {
      title: `${[
        'The Future of Web Development: Trends to Watch in 2024',
        'Building Scalable Applications with Microservices Architecture',
        'Optimizing User Experience with Performance Best Practices',
        'Advanced React Patterns for Better Code Organization',
        'Getting Started with Next.js 14 and App Router',
        'TypeScript Tips and Tricks for Better Development',
        'CSS Grid vs Flexbox: When to Use Each',
        'Security Best Practices for Modern Web Applications',
        'DevOps Fundamentals: CI/CD Pipeline Setup',
        'Database Design Patterns for Web Applications',
        'API Design Best Practices with REST and GraphQL',
        'Mobile-First Design: Creating Responsive Interfaces'
      ][i]}`,
      slug: `post-${i + 1}`,
      content: `This is a comprehensive article about modern web development practices and techniques. We'll explore various approaches, best practices, and provide practical examples that you can implement in your projects. The article covers everything from basic concepts to advanced strategies that will help you build better applications. Whether you're a beginner or an experienced developer, you'll find valuable insights and actionable advice throughout this detailed guide.`,
      excerpt: `${[
        'Explore the latest trends and technologies shaping the future of web development in 2024.',
        'Discover the benefits and challenges of implementing microservices architecture in modern applications.',
        'Learn essential performance optimization techniques to improve user experience and engagement.',
        'Master advanced React patterns that will make your code more maintainable and scalable.',
        'A comprehensive guide to getting started with Next.js 14 and its powerful App Router.',
        'Discover TypeScript features and patterns that will improve your development workflow.',
        'Understand when and how to use CSS Grid and Flexbox for different layout scenarios.',
        'Essential security practices every web developer should implement in their applications.',
        'Learn how to set up efficient CI/CD pipelines for your development workflow.',
        'Best practices for designing scalable and efficient database schemas.',
        'Compare REST and GraphQL approaches for building modern APIs.',
        'Create beautiful, responsive interfaces that work perfectly on all devices.'
      ][i]}`,
      publishedAt: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
      author: {
        data: {
          attributes: {
            name: ['John Developer', 'Sarah Architect', 'Mike Performance', 'Emily Frontend', 'David Backend', 'Lisa Designer'][i % 6]
          }
        }
      },
      category: {
        data: {
          attributes: {
            name: ['Technology', 'Architecture', 'Performance', 'React', 'Next.js', 'TypeScript'][i % 6],
            slug: ['technology', 'architecture', 'performance', 'react', 'nextjs', 'typescript'][i % 6]
          }
        }
      },
      tags: {
        data: [
          { attributes: { name: ['Web Development', 'JavaScript', 'React', 'TypeScript', 'Performance', 'Security'][i % 6] } },
          { attributes: { name: ['Frontend', 'Backend', 'Full-Stack', 'DevOps', 'Design', 'Mobile'][i % 6] } }
        ]
      },
      featuredImage: {
        data: {
          attributes: {
            url: `/images/blog/post-${i + 1}.jpg`,
            alternativeText: `Blog post ${i + 1} featured image`
          }
        }
      }
    }
  }));

  const posts = blogData?.data || defaultPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = blogData?.meta?.pagination?.pageCount || Math.ceil(defaultPosts.length / pageSize);
  const categories = categoriesData?.data || [
    { attributes: { name: 'Technology', slug: 'technology' } },
    { attributes: { name: 'Architecture', slug: 'architecture' } },
    { attributes: { name: 'Performance', slug: 'performance' } },
    { attributes: { name: 'React', slug: 'react' } },
    { attributes: { name: 'Next.js', slug: 'nextjs' } },
    { attributes: { name: 'TypeScript', slug: 'typescript' } }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <LoadingSkeleton height="h-8" className="w-48" />
          <div className="flex gap-2">
            <LoadingSkeleton height="h-10" className="w-24" />
            <LoadingSkeleton height="h-10" className="w-24" />
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Controls */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Latest Articles
          {selectedCategory && (
            <span className="text-lg font-normal text-muted-foreground ml-2">
              in {categories.find(c => c.attributes.slug === selectedCategory)?.attributes.name}
            </span>
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {/* Category Filter */}
          <div className={`flex flex-wrap gap-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.attributes.slug}
                variant={selectedCategory === category.attributes.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSelectedCategory(category.attributes.slug); setCurrentPage(1); }}
              >
                {category.attributes.name}
              </Button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Blog Posts */}
      <motion.div variants={itemVariants}>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts found in this category.</p>
            <Button 
              variant="outline" 
              onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
              className="mt-4"
            >
              View All Posts
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-8' : 'space-y-8'}>
            {posts.map((post: any, index: number) => {
              const postData = post.attributes;
              const readTime = calculateReadTime(postData.content);
              const excerpt = postData.excerpt || createExcerpt(postData.content);

              return (
                <motion.article
                  key={post.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        delay: index * 0.1,
                        duration: 0.5
                      }
                    }
                  }}
                  className={`group ${viewMode === 'grid' 
                    ? 'bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300'
                    : 'flex flex-col md:flex-row gap-6 pb-8 border-b border-border/50 last:border-b-0'
                  }`}
                >
                  {/* Featured Image */}
                  {postData.featuredImage?.data && (
                    <div className={`relative ${viewMode === 'grid' 
                      ? 'h-48 bg-muted overflow-hidden'
                      : 'h-48 md:h-32 md:w-48 flex-shrink-0 bg-muted rounded-lg overflow-hidden'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
                      
                      {/* Category Badge */}
                      {postData.category?.data && (
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                            {postData.category.data.attributes.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className={`${viewMode === 'grid' ? 'p-6' : 'flex-1'} space-y-4`}>
                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={postData.publishedAt}>
                          {formatDate(postData.publishedAt)}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{readTime} min read</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`${viewMode === 'grid' ? 'text-xl' : 'text-2xl'} font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2`}>
                      <a href={`/blog/${postData.slug}`}>
                        {postData.title}
                      </a>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2">
                      {/* Author */}
                      {postData.author?.data && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{postData.author.data.attributes.name}</span>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {postData.tags?.data && postData.tags.data.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {postData.tags.data.slice(0, 2).map((tag: any, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag.attributes.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex justify-center items-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}