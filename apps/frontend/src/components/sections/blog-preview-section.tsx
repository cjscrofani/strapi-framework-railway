'use client';

import { ArrowRight, Calendar, Clock, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { useBlogPosts } from '@/lib/react-query';
import { LoadingSkeleton } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6
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

function createExcerpt(content: string, maxLength: number = 150): string {
  const textContent = content.replace(/<[^>]*>/g, '');
  if (textContent.length <= maxLength) return textContent;
  return textContent.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function BlogPreviewSection() {
  const { data: blogData, isLoading, error } = useBlogPosts({ pageSize: 3 });
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  if (isLoading) {
    return (
      <Section spacing="xl" className="bg-muted/30">
        <Container>
          <div className="text-center space-y-8">
            <LoadingSkeleton height="h-12" className="max-w-2xl mx-auto" />
            <LoadingSkeleton height="h-6" className="max-w-3xl mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <LoadingSkeleton height="h-48" />
                <LoadingSkeleton height="h-8" />
                <LoadingSkeleton lines={3} />
                <div className="flex gap-4">
                  <LoadingSkeleton height="h-6" className="w-20" />
                  <LoadingSkeleton height="h-6" className="w-24" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return null;
  }

  // Default blog posts if no data from API
  const defaultPosts = [
    {
      id: '1',
      attributes: {
        title: 'The Future of Web Development: Trends to Watch in 2024',
        slug: 'future-of-web-development-2024',
        content: 'As we move into 2024, the web development landscape continues to evolve at a rapid pace. From new frameworks to emerging technologies, developers need to stay ahead of the curve to create cutting-edge applications.',
        excerpt: 'Explore the latest trends and technologies shaping the future of web development in 2024.',
        publishedAt: new Date().toISOString(),
        author: {
          data: {
            attributes: {
              name: 'John Developer'
            }
          }
        },
        category: {
          data: {
            attributes: {
              name: 'Technology',
              slug: 'technology'
            }
          }
        },
        tags: {
          data: [
            { attributes: { name: 'Web Development' } },
            { attributes: { name: 'JavaScript' } }
          ]
        },
        featuredImage: {
          data: {
            attributes: {
              url: '/images/blog/web-dev-trends.jpg',
              alternativeText: 'Web Development Trends'
            }
          }
        }
      }
    },
    {
      id: '2',
      attributes: {
        title: 'Building Scalable Applications with Microservices Architecture',
        slug: 'scalable-microservices-architecture',
        content: 'Microservices architecture has become increasingly popular for building scalable and maintainable applications. Learn how to design and implement microservices that can grow with your business.',
        excerpt: 'Discover the benefits and challenges of implementing microservices architecture in modern applications.',
        publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        author: {
          data: {
            attributes: {
              name: 'Sarah Architect'
            }
          }
        },
        category: {
          data: {
            attributes: {
              name: 'Architecture',
              slug: 'architecture'
            }
          }
        },
        tags: {
          data: [
            { attributes: { name: 'Microservices' } },
            { attributes: { name: 'Scalability' } }
          ]
        },
        featuredImage: {
          data: {
            attributes: {
              url: '/images/blog/microservices.jpg',
              alternativeText: 'Microservices Architecture'
            }
          }
        }
      }
    },
    {
      id: '3',
      attributes: {
        title: 'Optimizing User Experience with Performance Best Practices',
        slug: 'ux-performance-best-practices',
        content: 'User experience is paramount in modern web applications. Performance plays a crucial role in delivering exceptional user experiences. Learn the best practices for optimizing your application performance.',
        excerpt: 'Learn essential performance optimization techniques to improve user experience and engagement.',
        publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        author: {
          data: {
            attributes: {
              name: 'Mike Performance'
            }
          }
        },
        category: {
          data: {
            attributes: {
              name: 'Performance',
              slug: 'performance'
            }
          }
        },
        tags: {
          data: [
            { attributes: { name: 'UX' } },
            { attributes: { name: 'Performance' } }
          ]
        },
        featuredImage: {
          data: {
            attributes: {
              url: '/images/blog/performance-ux.jpg',
              alternativeText: 'UX Performance Optimization'
            }
          }
        }
      }
    }
  ];

  const posts = blogData?.data || defaultPosts;

  return (
    <Section spacing="xl" className="bg-muted/30">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Latest Insights
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stay updated with our latest thoughts on technology, development, and industry trends.
            </p>
          </motion.div>

          {/* Blog Posts Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any, index: number) => {
                const postData = post.attributes;
                const readTime = calculateReadTime(postData.content);
                const excerpt = postData.excerpt || createExcerpt(postData.content);

                return (
                  <motion.article
                    key={post.id}
                    variants={{
                      hidden: { y: 30, opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: {
                          delay: index * 0.1,
                          duration: 0.6
                        }
                      }
                    }}
                    className="group bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                  >
                    {/* Featured Image */}
                    {postData.featuredImage?.data && (
                      <div className="relative h-48 bg-muted overflow-hidden">
                        <img
                          src={postData.featuredImage.data.attributes.url}
                          alt={postData.featuredImage.data.attributes.alternativeText || postData.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
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
                    <div className="p-6 space-y-4">
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
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        <a href={`/blog/${postData.slug}`}>
                          {postData.title}
                        </a>
                      </h3>

                      {/* Excerpt */}
                      <p className="text-muted-foreground leading-relaxed line-clamp-3">
                        {excerpt}
                      </p>

                      {/* Tags */}
                      {postData.tags?.data && postData.tags.data.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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

                      {/* Author and Read More */}
                      <div className="flex items-center justify-between pt-2">
                        {postData.author?.data && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{postData.author.data.attributes.name}</span>
                          </div>
                        )}
                        
                        <a 
                          href={`/blog/${postData.slug}`}
                          className="inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                        >
                          Read More
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <a href="/blog">
                View All Posts
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}