'use client';

import { Users, Target, Award, Heart } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { useAboutPage } from '@/lib/react-query';
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

export function AboutHeroSection() {
  const { data: aboutPage, isLoading, error } = useAboutPage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  if (isLoading) {
    return (
      <Section spacing="xl" className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <Container>
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <LoadingSkeleton height="h-16" className="max-w-3xl mx-auto" />
            <LoadingSkeleton lines={3} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} height="h-20" />
              ))}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return null;
  }

  const aboutData = aboutPage?.data?.attributes || {
    title: 'About Our Company',
    subtitle: 'Building the Future Together',
    description: 'We are passionate about creating innovative solutions that help businesses thrive in the digital age. Our team combines years of experience with cutting-edge technology to deliver exceptional results that exceed expectations.',
    mission: 'To empower businesses with innovative digital solutions that drive growth and success.',
    vision: 'Leading the future of digital transformation through creativity and excellence.',
    values: ['Innovation', 'Quality', 'Integrity', 'Excellence']
  };

  const highlights = [
    {
      icon: Users,
      value: '50+',
      label: 'Team Members',
      description: 'Talented professionals'
    },
    {
      icon: Target,
      value: '500+',
      label: 'Projects Completed',
      description: 'Successful deliveries'
    },
    {
      icon: Award,
      value: '98%',
      label: 'Client Satisfaction',
      description: 'Happy customers'
    },
    {
      icon: Heart,
      value: '5+',
      label: 'Years Experience',
      description: 'Industry expertise'
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
                {aboutData.title}
              </span>
            </h1>
            
            {aboutData.subtitle && (
              <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-medium">
                {aboutData.subtitle}
              </p>
            )}
            
            <div 
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
              dangerouslySetInnerHTML={{ __html: aboutData.description }}
            />
          </motion.div>

          {/* Highlights Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <motion.div
                    key={highlight.label}
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
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {highlight.value}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {highlight.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {highlight.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Mission & Vision */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {aboutData.mission && (
                <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {aboutData.mission}
                  </p>
                </div>
              )}
              
              {aboutData.vision && (
                <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {aboutData.vision}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}