'use client';

import { ArrowRight, MessageCircle, Phone, Mail } from 'lucide-react';
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

export function CTASection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const contactMethods = [
    {
      icon: MessageCircle,
      label: 'Start a Conversation',
      description: 'Get in touch to discuss your project',
      action: 'Contact Us',
      href: '/contact'
    },
    {
      icon: Phone,
      label: 'Schedule a Call',
      description: 'Book a free consultation call',
      action: 'Book Call',
      href: '/contact?type=call'
    },
    {
      icon: Mail,
      label: 'Send a Message',
      description: 'Drop us an email anytime',
      action: 'Send Email',
      href: 'mailto:hello@example.com'
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
                Ready to Get Started?
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Let's bring your vision to life. Our team is ready to help you build something amazing.
            </p>
          </motion.div>

          {/* Primary Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto flex-1 sm:flex-none"
              asChild
            >
              <a href="/contact">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto flex-1 sm:flex-none"
              asChild
            >
              <a href="/services">
                View Our Services
              </a>
            </Button>
          </motion.div>

          {/* Contact Methods */}
          <motion.div variants={itemVariants} className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.label}
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
                  <div className="space-y-4 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {method.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      asChild
                    >
                      <a href={method.href}>
                        {method.action}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Trust Signals */}
          <motion.div variants={itemVariants} className="pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Response within 24 hours</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Free consultation available</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">No commitment required</span>
              </div>
            </div>
          </motion.div>

          {/* Additional CTA Text */}
          <motion.div variants={itemVariants}>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join the hundreds of businesses that have transformed their digital presence with our expert solutions. 
              Let's discuss how we can help you achieve your goals.
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}