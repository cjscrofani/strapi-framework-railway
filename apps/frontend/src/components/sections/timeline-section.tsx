'use client';

import { Calendar, Award, Users, Rocket, Target, Globe } from 'lucide-react';
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

export function TimelineSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Timeline data
  const timelineEvents = [
    {
      id: '1',
      year: '2020',
      title: 'Company Founded',
      description: 'Started our journey with a vision to transform digital experiences through innovative technology solutions.',
      icon: Rocket,
      milestone: 'Beginning'
    },
    {
      id: '2',
      year: '2021',
      title: 'First Major Client',
      description: 'Successfully delivered our first enterprise-level project, establishing our reputation in the market.',
      icon: Users,
      milestone: 'Growth'
    },
    {
      id: '3',
      year: '2022',
      title: 'Team Expansion',
      description: 'Grew our team to 25+ talented professionals across various disciplines and expertise areas.',
      icon: Users,
      milestone: 'Scale'
    },
    {
      id: '4',
      year: '2023',
      title: 'Industry Recognition',
      description: 'Received multiple awards for innovation and excellence in digital transformation projects.',
      icon: Award,
      milestone: 'Recognition'
    },
    {
      id: '5',
      year: '2024',
      title: 'Global Expansion',
      description: 'Expanded our services internationally, serving clients across North America and Europe.',
      icon: Globe,
      milestone: 'Expansion'
    },
    {
      id: '6',
      year: '2025',
      title: 'Future Vision',
      description: 'Continuing to innovate with AI-powered solutions and next-generation technologies.',
      icon: Target,
      milestone: 'Future'
    }
  ];

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
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Our Journey
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From a small startup to an industry leader, explore the key milestones that have shaped our company's growth and success.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={itemVariants} className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-primary via-secondary to-primary"></div>

            {/* Timeline Events */}
            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={event.id}
                    variants={{
                      hidden: { 
                        y: 30, 
                        opacity: 0,
                        x: isEven ? -30 : 30
                      },
                      visible: {
                        y: 0,
                        opacity: 1,
                        x: 0,
                        transition: {
                          delay: index * 0.1,
                          duration: 0.6
                        }
                      }
                    }}
                    className={`relative flex items-center ${
                      isEven ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                      <div className="w-16 h-16 bg-background rounded-full border-4 border-primary/20 flex items-center justify-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Content */}
                    <div className={`w-5/12 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                        {/* Year Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3`}>
                          <Calendar className="w-4 h-4" />
                          {event.year}
                        </div>

                        {/* Event Title */}
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {event.title}
                        </h3>

                        {/* Event Description */}
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          {event.description}
                        </p>

                        {/* Milestone Tag */}
                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                          {event.milestone}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Timeline Summary */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Looking Ahead
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our journey continues as we push the boundaries of what's possible in digital innovation. 
                With each milestone, we're building toward a future where technology seamlessly enhances human experiences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Projects Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">50+</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">15+</div>
                  <div className="text-sm text-muted-foreground">Countries Served</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}