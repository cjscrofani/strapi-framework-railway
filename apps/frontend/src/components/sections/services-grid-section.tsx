'use client';

import { useState } from 'react';
import { ArrowRight, Filter, Search, Code, Smartphone, Palette, Search as SearchIcon, Shield, Zap, Cloud, Database, Globe, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container, Section } from '@/components/ui/container';
import { useServices } from '@/lib/react-query';
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
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6
    }
  }
};

// Service icons mapping
const serviceIcons = {
  'Web Development': Code,
  'Mobile Development': Smartphone,
  'UI/UX Design': Palette,
  'SEO': SearchIcon,
  'Security': Shield,
  'Performance': Zap,
  'Cloud Services': Cloud,
  'Database': Database,
  'Consulting': Headphones,
  'E-commerce': Globe,
};

export function ServicesGridSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: servicesData, isLoading, error } = useServices();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Default services if no data from API
  const defaultServices = [
    {
      id: '1',
      attributes: {
        title: 'Web Development',
        slug: 'web-development',
        description: 'Custom web applications built with modern technologies like React, Next.js, and Node.js. We create responsive, performant, and SEO-friendly websites.',
        category: { data: { attributes: { name: 'Development' } } },
        featured: true,
        pricing: { startingPrice: 2500 },
        deliveryTime: '4-8 weeks',
        technologies: ['React', 'Next.js', 'TypeScript'],
        icon: 'Web Development'
      }
    },
    {
      id: '2',
      attributes: {
        title: 'Mobile App Development',
        slug: 'mobile-development',
        description: 'Native and cross-platform mobile applications for iOS and Android. Built with React Native and Flutter for optimal performance.',
        category: { data: { attributes: { name: 'Development' } } },
        featured: true,
        pricing: { startingPrice: 5000 },
        deliveryTime: '6-12 weeks',
        technologies: ['React Native', 'Flutter', 'Swift'],
        icon: 'Mobile Development'
      }
    },
    {
      id: '3',
      attributes: {
        title: 'UI/UX Design',
        slug: 'ui-ux-design',
        description: 'User-centered design that combines aesthetics with functionality. From wireframes to high-fidelity prototypes.',
        category: { data: { attributes: { name: 'Design' } } },
        featured: true,
        pricing: { startingPrice: 1500 },
        deliveryTime: '2-4 weeks',
        technologies: ['Figma', 'Adobe XD', 'Sketch'],
        icon: 'UI/UX Design'
      }
    },
    {
      id: '4',
      attributes: {
        title: 'SEO Optimization',
        slug: 'seo-optimization',
        description: 'Improve search rankings and drive organic traffic with comprehensive SEO strategies and technical optimizations.',
        category: { data: { attributes: { name: 'Marketing' } } },
        featured: false,
        pricing: { startingPrice: 800 },
        deliveryTime: '1-3 months',
        technologies: ['Google Analytics', 'SEMrush', 'Ahrefs'],
        icon: 'SEO'
      }
    },
    {
      id: '5',
      attributes: {
        title: 'Cloud Infrastructure',
        slug: 'cloud-infrastructure',
        description: 'Scalable cloud solutions using AWS, Azure, and Google Cloud. Infrastructure as code and DevOps best practices.',
        category: { data: { attributes: { name: 'Infrastructure' } } },
        featured: false,
        pricing: { startingPrice: 3000 },
        deliveryTime: '2-6 weeks',
        technologies: ['AWS', 'Docker', 'Kubernetes'],
        icon: 'Cloud Services'
      }
    },
    {
      id: '6',
      attributes: {
        title: 'Security Auditing',
        slug: 'security-auditing',
        description: 'Comprehensive security assessments and penetration testing to protect your digital assets.',
        category: { data: { attributes: { name: 'Security' } } },
        featured: false,
        pricing: { startingPrice: 2000 },
        deliveryTime: '1-3 weeks',
        technologies: ['OWASP', 'Nmap', 'Burp Suite'],
        icon: 'Security'
      }
    }
  ];

  const services = servicesData?.data || defaultServices;
  
  // Extract unique categories
  const categories = ['All', ...new Set(services.map((service: any) => service.attributes.category?.data?.attributes?.name || 'Other'))];

  // Filter services based on search and category
  const filteredServices = services.filter((service: any) => {
    const matchesSearch = service.attributes.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.attributes.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                           service.attributes.category?.data?.attributes?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Section spacing="xl" id="services-grid">
        <Container>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <LoadingSkeleton height="h-8" className="w-48" />
              <LoadingSkeleton height="h-10" className="w-64" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <LoadingSkeleton key={i} height="h-80" />
              ))}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="xl" id="services-grid">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {/* Section Header with Filters */}
          <motion.div variants={itemVariants} className="space-y-6 mb-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  All Services
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore our comprehensive range of digital services designed to accelerate your business growth.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                <div className={`flex flex-wrap gap-2 ${showFilters ? 'block' : 'hidden md:flex'}`}>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-sm"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Services Grid */}
          <motion.div variants={itemVariants}>
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No services found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service: any, index: number) => {
                  const serviceData = service.attributes;
                  const iconName = serviceData.icon || 'Code';
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
                      className="group bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 relative"
                    >
                      {/* Featured Badge */}
                      {serviceData.featured && (
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            Featured
                          </span>
                        </div>
                      )}

                      {/* Service Content */}
                      <div className="space-y-4">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="w-7 h-7 text-primary" />
                        </div>

                        {/* Title and Category */}
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                            {serviceData.title}
                          </h3>
                          {serviceData.category?.data && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                              {serviceData.category.data.attributes.name}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div 
                          className="text-muted-foreground leading-relaxed line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: serviceData.description }}
                        />

                        {/* Technologies */}
                        {serviceData.technologies && (
                          <div className="flex flex-wrap gap-1">
                            {serviceData.technologies.slice(0, 3).map((tech: string, techIndex: number) => (
                              <span
                                key={techIndex}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Pricing and Timeline */}
                        <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border/50 pt-4">
                          {serviceData.pricing?.startingPrice && (
                            <span>From ${serviceData.pricing.startingPrice.toLocaleString()}</span>
                          )}
                          {serviceData.deliveryTime && (
                            <span>{serviceData.deliveryTime}</span>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="pt-2">
                          <a 
                            href={`/services/${serviceData.slug}`}
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
            )}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Don't See What You Need?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We offer custom solutions tailored to your specific requirements. Let's discuss your project and create something amazing together.
              </p>
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <a href="/contact">
                  Get Custom Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}