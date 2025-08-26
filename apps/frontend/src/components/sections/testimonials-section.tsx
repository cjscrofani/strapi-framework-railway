'use client';

import { Star, Quote } from 'lucide-react';
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

export function TestimonialsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Default testimonials data
  const testimonials = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'CEO, TechStartup Inc.',
      company: 'TechStartup Inc.',
      content: 'Working with this team has been an absolute game-changer for our business. They delivered a solution that exceeded our expectations and helped us scale rapidly.',
      rating: 5,
      avatar: '/images/testimonials/sarah.jpg'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'CTO, Innovation Labs',
      company: 'Innovation Labs',
      content: 'The technical expertise and attention to detail is outstanding. Our new platform has significantly improved our user engagement and conversion rates.',
      rating: 5,
      avatar: '/images/testimonials/michael.jpg'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Product Manager, Digital Solutions',
      company: 'Digital Solutions',
      content: 'Exceptional service from start to finish. The team understood our vision and brought it to life with remarkable precision and creativity.',
      rating: 5,
      avatar: '/images/testimonials/emily.jpg'
    },
    {
      id: '4',
      name: 'David Thompson',
      role: 'Founder, E-commerce Plus',
      company: 'E-commerce Plus',
      content: 'Our online sales have increased by 300% since launching the new platform. The ROI has been incredible and the ongoing support is fantastic.',
      rating: 5,
      avatar: '/images/testimonials/david.jpg'
    },
    {
      id: '5',
      name: 'Lisa Park',
      role: 'Marketing Director, Brand Co.',
      company: 'Brand Co.',
      content: 'The design and user experience they created for us is simply beautiful. Our customers love the new interface and our team loves managing it.',
      rating: 5,
      avatar: '/images/testimonials/lisa.jpg'
    },
    {
      id: '6',
      name: 'James Wilson',
      role: 'Operations Manager, LogiTech',
      company: 'LogiTech',
      content: 'The automation solution has saved us countless hours and improved our accuracy significantly. The implementation was smooth and professional.',
      rating: 5,
      avatar: '/images/testimonials/james.jpg'
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

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
                What Our Clients Say
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Don't just take our word for it. Here's what our satisfied clients have to say about their experience working with us.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
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
                  className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 relative"
                >
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4">
                    <Quote className="w-6 h-6 text-primary/30" />
                  </div>

                  <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Testimonial Content */}
                    <blockquote className="text-muted-foreground leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>

                    {/* Client Information */}
                    <div className="flex items-center gap-3 pt-2">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>

                      {/* Name and Role */}
                      <div>
                        <div className="font-semibold text-foreground">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="mt-12">
            <div className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">4.9/5 Average Rating</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-border"></div>
                <div className="text-sm">50+ Satisfied Clients</div>
                <div className="hidden sm:block w-px h-6 bg-border"></div>
                <div className="text-sm">100+ Projects Completed</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}