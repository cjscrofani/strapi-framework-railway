'use client';

import { ArrowRight, MessageCircle, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
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

export function ServicesCTASection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const ctaOptions = [
    {
      icon: MessageCircle,
      title: 'Free Consultation',
      description: 'Discuss your project with our experts',
      action: 'Schedule Call',
      href: '/contact?type=consultation',
      primary: true
    },
    {
      icon: FileText,
      title: 'Get a Quote',
      description: 'Receive a detailed project estimate',
      action: 'Request Quote',
      href: '/contact?type=quote',
      primary: false
    },
    {
      icon: Calendar,
      title: 'Book Discovery',
      description: 'Deep dive into your requirements',
      action: 'Book Session',
      href: '/contact?type=discovery',
      primary: false
    }
  ];

  return (
    <Section spacing="xl" className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2" />
      </div>

      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center space-y-12 max-w-5xl mx-auto"
        >
          {/* Main CTA Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Ready to Start Your Project?
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Let's transform your vision into reality. Our team is ready to bring your ideas to life with cutting-edge technology and expert craftsmanship.
            </p>
          </motion.div>

          {/* CTA Options */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {ctaOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.div
                    key={option.title}
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
                    className={`group bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 ${
                      option.primary ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="space-y-4 text-center">
                      {/* Icon */}
                      <div className={`w-14 h-14 ${option.primary ? 'bg-primary/20' : 'bg-primary/10'} rounded-xl flex items-center justify-center mx-auto group-hover:bg-primary/30 transition-colors`}>
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {option.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      
                      {/* CTA Button */}
                      <Button 
                        variant={option.primary ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a href={option.href}>
                          {option.action}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Additional Information */}
          <motion.div variants={itemVariants}>
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                What Happens Next?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="font-medium text-foreground">Initial Contact</div>
                  <div className="text-sm text-muted-foreground">We'll respond within 24 hours to schedule your consultation</div>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="font-medium text-foreground">Discovery Phase</div>
                  <div className="text-sm text-muted-foreground">We'll analyze your requirements and propose solutions</div>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div className="font-medium text-foreground">Project Kickoff</div>
                  <div className="text-sm text-muted-foreground">Once approved, we'll begin building your solution</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust Signals */}
          <motion.div variants={itemVariants}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Free initial consultation</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">No commitment required</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Response within 24 hours</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}