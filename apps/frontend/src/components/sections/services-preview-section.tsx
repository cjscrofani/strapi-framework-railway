'use client';

import { ArrowRight, Code, Smartphone, Palette, Search, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { useFeaturedServices } from '@/lib/react-query';
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

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

// Default service icons mapping
const serviceIcons = {
  'Web Development': Code,
  'Mobile Development': Smartphone,
  'UI/UX Design': Palette,
  'SEO': Search,
  'Security': Shield,
  'Performance': Zap,
};

export function ServicesPreviewSection() {
  const { data: servicesData, isLoading, error } = useFeaturedServices();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  if (isLoading) {
    return (
      <Section spacing="xl">
        <Container>
          <div className="text-center space-y-8">
            <LoadingSkeleton height="h-12" className="max-w-2xl mx-auto" />
            <LoadingSkeleton height="h-6" className="max-w-3xl mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingSkeleton key={i} height="h-64" />
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return null;
  }

  // Default services if no data from API
  const defaultServices = [
    {
      id: '1',
      title: 'Web Development',
      description: 'Custom web applications built with modern technologies and best practices.',
      icon: 'Code',
      featured: true
    },
    {
      id: '2',
      title: 'Mobile Development',
      description: 'Native and cross-platform mobile apps that deliver exceptional user experiences.',
      icon: 'Smartphone',
      featured: true
    },
    {
      id: '3',
      title: 'UI/UX Design',
      description: 'User-centered design that combines aesthetics with functionality.',
      icon: 'Palette',
      featured: true
    },
    {
      id: '4',
      title: 'SEO Optimization',
      description: 'Improve your search rankings and drive organic traffic to your site.',
      icon: 'Search',
      featured: true
    },
    {
      id: '5',
      title: 'Security Solutions',
      description: 'Protect your digital assets with comprehensive security measures.',
      icon: 'Shield',
      featured: true
    },
    {
      id: '6',
      title: 'Performance Optimization',
      description: 'Maximize your application performance and user satisfaction.',
      icon: 'Zap',
      featured: true
    }
  ];

  const services = servicesData?.data || defaultServices;

  return (
    <Section spacing="xl">
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
                Our Services
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We offer comprehensive digital solutions to help your business succeed in the modern marketplace.
            </p>
          </motion.div>

          {/* Services Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 6).map((service: any, index: number) => {
                const iconName = service.attributes?.icon || service.icon || 'Code';
                const IconComponent = serviceIcons[iconName as keyof typeof serviceIcons] || Code;
                
                return (
                  <motion.div
                    key={service.id}
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
                    className="group bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Service Icon */}
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>

                      {/* Service Content */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {service.attributes?.title || service.title}
                        </h3>
                        <div 
                          className="text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: service.attributes?.description || service.description 
                          }}
                        />
                      </div>

                      {/* Service Link */}
                      <div className="pt-2">
                        <a 
                          href={`/services/${service.attributes?.slug || service.id}`}
                          className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <a href="/services">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}