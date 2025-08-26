'use client';

import { CheckCircle, Clock, Users, Shield, Zap, Award } from 'lucide-react';
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

export function ServicesFeaturesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      id: '1',
      title: 'Quality Assurance',
      description: 'Rigorous testing and quality control processes ensure your project meets the highest standards.',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '2',
      title: 'Timely Delivery',
      description: 'We respect deadlines and deliver projects on time, every time, without compromising quality.',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '3',
      title: 'Expert Team',
      description: 'Work with experienced professionals who stay current with the latest technologies and trends.',
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: '4',
      title: 'Security First',
      description: 'Security is built into every solution we create, protecting your data and users.',
      icon: Shield,
      color: 'from-red-500 to-rose-500'
    },
    {
      id: '5',
      title: 'Performance Optimized',
      description: 'Every solution is optimized for speed, scalability, and exceptional user experience.',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: '6',
      title: 'Award Winning',
      description: 'Our work has been recognized by industry leaders and satisfied clients worldwide.',
      icon: Award,
      color: 'from-indigo-500 to-purple-500'
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
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Why Choose Us
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We combine technical expertise with business acumen to deliver solutions that not only work flawlessly but drive real results for your business.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
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
                    className="group bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 text-center"
                  >
                    {/* Feature Icon */}
                    <div className="relative mx-auto mb-6">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} opacity-10 absolute inset-0`}></div>
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative group-hover:scale-105 transition-transform">
                        <Icon className={`w-10 h-10 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} />
                      </div>
                    </div>

                    {/* Feature Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Projects Completed</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Expert Developers</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">5+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}