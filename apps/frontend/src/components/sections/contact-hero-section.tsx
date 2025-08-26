'use client';

import { MessageCircle, Phone, Mail, Clock } from 'lucide-react';
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

export function ContactHeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Let\'s Chat',
      description: 'Start a conversation about your project',
      highlight: 'Free consultation available'
    },
    {
      icon: Phone,
      title: 'Quick Call',
      description: 'Schedule a call with our experts',
      highlight: 'Response within hours'
    },
    {
      icon: Mail,
      title: 'Send Email',
      description: 'Drop us a detailed message',
      highlight: '24/7 support available'
    },
    {
      icon: Clock,
      title: 'Book Meeting',
      description: 'Schedule a dedicated session',
      highlight: 'Flexible time slots'
    }
  ];

  return (
    <Section 
      spacing="xl" 
      className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
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
                Get In Touch
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto">
              Ready to Bring Your Vision to Life?
            </p>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              Whether you have a specific project in mind or just want to explore possibilities, 
              our team is here to help. Let's discuss how we can transform your ideas into exceptional digital experiences.
            </p>
          </motion.div>

          {/* Contact Methods */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <motion.div
                    key={method.title}
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
                    className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 text-center group"
                  >
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {method.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>

                        {/* Highlight */}
                        <div className="pt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {method.highlight}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Trust Signals */}
          <motion.div variants={itemVariants} className="pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Average response time: 2 hours</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Free initial consultation</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">No commitment required</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Text */}
          <motion.div variants={itemVariants}>
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 max-w-3xl mx-auto">
              <p className="text-muted-foreground">
                <strong className="text-foreground">What happens next?</strong><br />
                After you reach out, we'll schedule a free consultation to understand your needs, 
                discuss your project goals, and provide you with a detailed proposal tailored to your requirements.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}