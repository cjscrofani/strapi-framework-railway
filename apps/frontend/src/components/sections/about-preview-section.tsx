'use client';

import { ArrowRight, Users, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function AboutPreviewSection() {
  const { data: aboutPage, isLoading, error } = useAboutPage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  if (isLoading) {
    return (
      <Section spacing="xl" className="bg-muted/30">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <LoadingSkeleton height="h-12" className="max-w-md" />
              <LoadingSkeleton lines={4} />
              <LoadingSkeleton height="h-12" className="w-40" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} height="h-32" />
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
    description: 'We are passionate about creating innovative solutions that help businesses thrive in the digital age. Our team combines years of experience with cutting-edge technology to deliver exceptional results.',
    mission: 'To empower businesses with innovative digital solutions.',
    vision: 'Leading the future of digital transformation.',
    values: 'Innovation, Quality, Integrity, Excellence'
  };

  const features = [
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Skilled professionals with years of experience'
    },
    {
      icon: Target,
      title: 'Goal Focused',
      description: 'Dedicated to achieving your business objectives'
    },
    {
      icon: Award,
      title: 'Quality Driven',
      description: 'Committed to delivering exceptional results'
    },
    {
      icon: ArrowRight,
      title: 'Future Ready',
      description: 'Preparing your business for tomorrow'
    }
  ];

  return (
    <Section spacing="xl" className="bg-muted/30">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Content Side */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {aboutData.title}
                </span>
              </h2>
              
              <div 
                className="text-lg text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: aboutData.description }}
              />
            </div>

            {/* Mission/Vision/Values */}
            {(aboutData.mission || aboutData.vision || aboutData.values) && (
              <div className="space-y-4">
                {aboutData.mission && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
                    <p className="text-muted-foreground">{aboutData.mission}</p>
                  </div>
                )}
                {aboutData.vision && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Our Vision</h3>
                    <p className="text-muted-foreground">{aboutData.vision}</p>
                  </div>
                )}
              </div>
            )}

            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <a href="/about">
                Learn More About Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
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
                    className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}