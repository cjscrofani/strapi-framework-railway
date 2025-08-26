'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container, Section } from '@/components/ui/container';
import { useNewsletterSubscription } from '@/lib/react-query';
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

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const newsletterMutation = useNewsletterSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await newsletterMutation.mutateAsync(email);
      setIsSubmitted(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <Section spacing="xl" className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Thank You for Subscribing!
            </h2>
            <p className="text-lg text-muted-foreground">
              We've sent a confirmation email to your inbox. You'll receive our latest updates, insights, and exclusive content.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
              className="mt-4"
            >
              Subscribe Another Email
            </Button>
          </motion.div>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="xl" className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Stay in the Loop
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get the latest insights, updates, and exclusive content delivered straight to your inbox. Join our community of forward-thinking professionals.
            </p>
          </motion.div>

          {/* Newsletter Form */}
          <motion.div variants={itemVariants}>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 text-base"
                  disabled={newsletterMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-12 px-8 whitespace-nowrap"
                  disabled={newsletterMutation.isPending}
                >
                  {newsletterMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={itemVariants} className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Weekly Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get curated industry insights and trends every week
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Exclusive Content</h3>
              <p className="text-sm text-muted-foreground">
                Access to exclusive guides, templates, and resources
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                <Send className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to know about new features and updates
              </p>
            </div>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div variants={itemVariants}>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              We respect your privacy. Unsubscribe at any time. By subscribing, you agree to our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
              .
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}