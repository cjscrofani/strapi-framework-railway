'use client';

import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { useHomePage } from '@/lib/react-query';
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
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export function HeroSection() {
  const { data: homePage, isLoading, error } = useHomePage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  if (isLoading) {
    return (
      <Section spacing="xl" className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center space-y-8">
          <LoadingSkeleton height="h-16" className="max-w-4xl mx-auto" />
          <LoadingSkeleton height="h-6" className="max-w-2xl mx-auto" />
          <div className="flex justify-center gap-4">
            <LoadingSkeleton height="h-12" className="w-32" />
            <LoadingSkeleton height="h-12" className="w-32" />
          </div>
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section spacing="xl" className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load hero content</p>
        </div>
      </Section>
    );
  }

  const heroData = homePage?.data?.attributes?.hero || {
    title: 'Build Your Digital Future',
    subtitle: 'Innovative Solutions for Modern Businesses',
    description: 'We create exceptional digital experiences that help your business thrive in the digital age. From web development to mobile applications, we have the expertise to bring your vision to life.',
    primaryButton: {
      text: 'Get Started',
      url: '/contact'
    },
    secondaryButton: {
      text: 'Learn More',
      url: '/about'
    }
  };

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

      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={containerVariants}
        className="text-center space-y-8 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-2" />
            Powered by Strapi & Railway
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {heroData.title}
            </span>
          </h1>
          {heroData.subtitle && (
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-medium">
              {heroData.subtitle}
            </p>
          )}
        </motion.div>

        {/* Description */}
        {heroData.description && (
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <div 
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: heroData.description }}
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          {heroData.primaryButton && (
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto"
              asChild
            >
              <a href={heroData.primaryButton.url}>
                {heroData.primaryButton.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          )}
          {heroData.secondaryButton && (
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto"
              asChild
            >
              <a href={heroData.secondaryButton.url}>
                <Play className="mr-2 h-5 w-5" />
                {heroData.secondaryButton.text}
              </a>
            </Button>
          )}
        </motion.div>

        {/* Stats or Features */}
        <motion.div variants={itemVariants} className="pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
}