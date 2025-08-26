'use client';

import { TrendingUp, Award, Users, Globe, Clock, Star } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
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

export function StatsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Company statistics
  const stats = [
    {
      id: '1',
      value: '500+',
      label: 'Projects Completed',
      description: 'Successfully delivered projects',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '2',
      value: '50+',
      label: 'Happy Clients',
      description: 'Satisfied customers worldwide',
      icon: Users,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '3',
      value: '15+',
      label: 'Countries Served',
      description: 'Global presence and reach',
      icon: Globe,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: '4',
      value: '98%',
      label: 'Client Satisfaction',
      description: 'Average customer rating',
      icon: Star,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: '5',
      value: '24/7',
      label: 'Support Available',
      description: 'Round-the-clock assistance',
      icon: Clock,
      color: 'from-red-500 to-rose-500'
    },
    {
      id: '6',
      value: '25+',
      label: 'Industry Awards',
      description: 'Recognition for excellence',
      icon: Award,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <Section spacing="lg">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.id}
                    variants={{
                      hidden: { y: 30, opacity: 0, scale: 0.9 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        transition: {
                          delay: index * 0.1,
                          duration: 0.6,
                          type: 'spring',
                          stiffness: 100
                        }
                      }
                    }}
                    className="group bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 text-center"
                  >
                    {/* Stat Icon */}
                    <div className="relative mx-auto mb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} opacity-10 absolute inset-0`}></div>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative">
                        <Icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                      </div>
                    </div>

                    {/* Stat Value */}
                    <div className="space-y-2">
                      <div className={`text-3xl lg:text-4xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground text-sm lg:text-base">
                          {stat.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stat.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Achievement Highlight */}
          <motion.div variants={itemVariants} className="mt-12">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Driving Success Through Innovation
              </h3>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                These numbers represent more than statistics—they reflect our commitment to excellence, 
                our passion for innovation, and the trust our clients place in us every day.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}