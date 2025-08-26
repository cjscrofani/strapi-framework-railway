'use client';

import { Lightbulb, Shield, Heart, Zap, Users, Target } from 'lucide-react';
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

export function ValuesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Company values data
  const values = [
    {
      id: '1',
      title: 'Innovation',
      description: 'We constantly push the boundaries of what\'s possible, embracing new technologies and creative solutions to solve complex challenges.',
      icon: Lightbulb,
      color: 'from-yellow-500/20 to-orange-500/20',
      iconColor: 'text-yellow-600'
    },
    {
      id: '2',
      title: 'Integrity',
      description: 'We build trust through transparency, honesty, and ethical practices in everything we do, creating lasting relationships with our clients.',
      icon: Shield,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-600'
    },
    {
      id: '3',
      title: 'Excellence',
      description: 'We strive for perfection in every project, delivering high-quality solutions that exceed expectations and drive meaningful results.',
      icon: Target,
      color: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-600'
    },
    {
      id: '4',
      title: 'Collaboration',
      description: 'We believe in the power of teamwork, fostering an environment where diverse perspectives come together to create extraordinary outcomes.',
      icon: Users,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-600'
    },
    {
      id: '5',
      title: 'Passion',
      description: 'We love what we do and it shows in our work. Our enthusiasm for technology and problem-solving drives us to go above and beyond.',
      icon: Heart,
      color: 'from-red-500/20 to-rose-500/20',
      iconColor: 'text-red-600'
    },
    {
      id: '6',
      title: 'Agility',
      description: 'We adapt quickly to changing requirements and market conditions, maintaining flexibility while delivering consistent, reliable results.',
      icon: Zap,
      color: 'from-cyan-500/20 to-teal-500/20',
      iconColor: 'text-cyan-600'
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
                Our Values
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              These core principles guide everything we do, from how we work with clients to how we support each other as a team.
            </p>
          </motion.div>

          {/* Values Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.id}
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
                    className="group bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 text-center"
                  >
                    {/* Value Icon */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-10 h-10 ${value.iconColor}`} />
                    </div>

                    {/* Value Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {value.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Culture Statement */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 text-center max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Our Culture
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                We've built a culture where innovation thrives, people grow, and exceptional work happens naturally. 
                Our values aren't just words on a wall—they're the foundation of how we operate every single day.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Employee Satisfaction</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">4.9/5</div>
                  <div className="text-sm text-muted-foreground">Client Rating</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support Available</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Remote Friendly</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}