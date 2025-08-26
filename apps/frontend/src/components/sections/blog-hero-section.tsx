'use client';

import { Search, BookOpen, TrendingUp, Users } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export function BlogHeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const blogStats = [
    {
      icon: BookOpen,
      value: '100+',
      label: 'Articles Published'
    },
    {
      icon: Users,
      value: '10k+',
      label: 'Monthly Readers'
    },
    {
      icon: TrendingUp,
      value: '25+',
      label: 'Topics Covered'
    }
  ];

  return (
    <Section 
      spacing="xl" 
      className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center space-y-12 max-w-5xl mx-auto"
        >
          {/* Main Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Our Blog
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto">
              Insights, Tutorials & Industry Trends
            </p>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              Stay ahead of the curve with our expert insights on web development, design, and digital innovation. 
              From technical tutorials to industry analysis, we share knowledge that helps you build better digital experiences.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={itemVariants}>
            <form className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-12 h-14 text-lg bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Blog Stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {blogStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: {
                          delay: index * 0.1
                        }
                      }
                    }}
                    className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-colors text-center"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Featured Topics */}
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <p className="text-muted-foreground font-medium">Popular Topics:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  'Web Development',
                  'React & Next.js',
                  'UI/UX Design',
                  'Performance',
                  'Security',
                  'DevOps',
                  'JavaScript',
                  'TypeScript'
                ].map((topic) => (
                  <a
                    key={topic}
                    href={`/blog?category=${topic.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary"
                  >
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}