'use client';

import { MessageCircle, FileText, Code, Rocket, CheckCircle } from 'lucide-react';
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

export function ServicesProcessSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const processSteps = [
    {
      id: '1',
      number: '01',
      title: 'Discovery & Planning',
      description: 'We start by understanding your business goals, requirements, and constraints through detailed consultation and research.',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      duration: '1-2 weeks'
    },
    {
      id: '2',
      number: '02',
      title: 'Design & Strategy',
      description: 'Our team creates detailed wireframes, mockups, and technical specifications tailored to your specific needs.',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      duration: '2-3 weeks'
    },
    {
      id: '3',
      number: '03',
      title: 'Development & Testing',
      description: 'We build your solution using best practices, with continuous testing and quality assurance throughout the process.',
      icon: Code,
      color: 'from-green-500 to-emerald-500',
      duration: '4-8 weeks'
    },
    {
      id: '4',
      number: '04',
      title: 'Launch & Deployment',
      description: 'We handle the complete deployment process, ensuring your solution goes live smoothly and successfully.',
      icon: Rocket,
      color: 'from-orange-500 to-red-500',
      duration: '1-2 weeks'
    },
    {
      id: '5',
      number: '05',
      title: 'Support & Maintenance',
      description: 'Ongoing support, monitoring, and maintenance to ensure your solution continues to perform optimally.',
      icon: CheckCircle,
      color: 'from-indigo-500 to-purple-500',
      duration: 'Ongoing'
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
                Our Process
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We follow a proven methodology that ensures successful project delivery from initial concept to ongoing support.
            </p>
          </motion.div>

          {/* Process Steps */}
          <motion.div variants={itemVariants}>
            <div className="space-y-8 lg:space-y-12">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={step.id}
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
                    className={`flex flex-col lg:flex-row items-center gap-8 ${
                      isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* Step Content */}
                    <div className="flex-1 space-y-4">
                      <div className={`text-${isEven ? 'left' : 'right'} lg:text-${isEven ? 'left' : 'right'}`}>
                        {/* Step Number */}
                        <div className={`inline-flex items-center gap-3 mb-4`}>
                          <span className={`text-4xl font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                            {step.number}
                          </span>
                          <div className={`px-3 py-1 rounded-full bg-gradient-to-br ${step.color} opacity-10`}>
                            <span className={`text-sm font-medium bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                              {step.duration}
                            </span>
                          </div>
                        </div>

                        {/* Step Title */}
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {step.title}
                        </h3>

                        {/* Step Description */}
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {/* Background Circle */}
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} opacity-10 absolute inset-0`}></div>
                        
                        {/* Icon Container */}
                        <div className="w-24 h-24 rounded-full bg-background border-4 border-border/50 flex items-center justify-center relative">
                          <Icon className={`w-10 h-10 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} />
                        </div>

                        {/* Connection Line (except for last item) */}
                        {index < processSteps.length - 1 && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-border to-transparent lg:hidden"></div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Connection Line */}
                    {index < processSteps.length - 1 && (
                      <div className="hidden lg:block absolute left-1/2 top-full transform -translate-x-1/2 w-px h-8 bg-gradient-to-b from-border to-transparent"></div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Process Benefits */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Why Our Process Works
              </h3>
              <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                Our structured approach ensures transparency, reduces risks, and delivers results that exceed expectations. 
                You'll be involved every step of the way with regular updates and clear communication.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Transparent Communication</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Project Monitoring</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}