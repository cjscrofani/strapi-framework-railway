'use client';

import { useState } from 'react';
import { Search, Mail, Tag, Calendar, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBlogCategories, useNewsletterSubscription } from '@/lib/react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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
    month: 'short',
    day: 'numeric'
  });
}

export function BlogSidebarSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const { data: categoriesData } = useBlogCategories();
  const newsletterMutation = useNewsletterSubscription();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Default data
  const categories = categoriesData?.data || [
    { attributes: { name: 'Technology', slug: 'technology', postCount: 15 } },
    { attributes: { name: 'Web Development', slug: 'web-development', postCount: 12 } },
    { attributes: { name: 'Design', slug: 'design', postCount: 8 } },
    { attributes: { name: 'Performance', slug: 'performance', postCount: 6 } },
    { attributes: { name: 'Security', slug: 'security', postCount: 5 } },
    { attributes: { name: 'DevOps', slug: 'devops', postCount: 4 } }
  ];

  const popularPosts = [
    {
      id: '1',
      title: 'The Future of Web Development in 2024',
      slug: 'future-web-development-2024',
      publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      views: 2540
    },
    {
      id: '2',
      title: 'Building Scalable React Applications',
      slug: 'scalable-react-applications',
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      views: 1890
    },
    {
      id: '3',
      title: 'CSS Grid vs Flexbox: Complete Guide',
      slug: 'css-grid-vs-flexbox',
      publishedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      views: 1654
    },
    {
      id: '4',
      title: 'TypeScript Best Practices for 2024',
      slug: 'typescript-best-practices',
      publishedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      views: 1432
    }
  ];

  const tags = [
    { name: 'React', count: 24 },
    { name: 'JavaScript', count: 18 },
    { name: 'TypeScript', count: 16 },
    { name: 'Next.js', count: 14 },
    { name: 'CSS', count: 12 },
    { name: 'Performance', count: 10 },
    { name: 'Security', count: 8 },
    { name: 'DevOps', count: 6 },
    { name: 'Testing', count: 5 },
    { name: 'API', count: 4 }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/blog?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await newsletterMutation.mutateAsync(email);
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="space-y-8"
    >
      {/* Search */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Search Articles
        </h3>
        <form onSubmit={handleSearch} className="space-y-3">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Search
          </Button>
        </form>
      </motion.div>

      {/* Newsletter Subscription */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Newsletter
        </h3>
        
        {isSubscribed ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Thank you for subscribing! You'll receive our latest articles in your inbox.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsSubscribed(false)}>
              Subscribe Another Email
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest articles and insights delivered straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={newsletterMutation.isPending}
              >
                {newsletterMutation.isPending ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </>
        )}
      </motion.div>

      {/* Categories */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <a
              key={category.attributes.slug}
              href={`/blog?category=${category.attributes.slug}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                {category.attributes.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {category.attributes.postCount || 0}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Popular Posts */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Popular Posts
        </h3>
        <div className="space-y-4">
          {popularPosts.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{post.views} views</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag.name}
              href={`/blog?tag=${tag.name.toLowerCase()}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-sm text-muted-foreground"
            >
              {tag.name}
              <span className="text-xs opacity-70">({tag.count})</span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Author Info */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          About the Authors
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">JD</span>
            </div>
            <div>
              <div className="font-medium text-foreground">John Developer</div>
              <div className="text-xs text-muted-foreground">Senior Full-Stack Developer</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Our team of experienced developers and designers share insights, tutorials, and industry best practices to help you stay ahead in the ever-evolving world of technology.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}