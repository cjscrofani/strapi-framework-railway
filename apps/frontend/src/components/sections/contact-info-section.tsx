'use client';

import { Phone, Mail, MapPin, Clock, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

export function ContactInfoSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const contactInfo = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      action: 'Call us',
      href: 'tel:+15551234567',
      description: 'Mon-Fri, 9AM-6PM PST'
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'hello@example.com',
      action: 'Send email',
      href: 'mailto:hello@example.com',
      description: '24/7 support available'
    },
    {
      icon: MapPin,
      label: 'Office',
      value: '123 Innovation Drive\nSan Francisco, CA 94105',
      action: 'Get directions',
      href: 'https://maps.google.com/?q=123+Innovation+Drive,+San+Francisco,+CA+94105',
      description: 'Visit us by appointment'
    },
    {
      icon: Clock,
      label: 'Business Hours',
      value: 'Mon-Fri: 9:00 AM - 6:00 PM\nWeekends: By appointment',
      action: null,
      href: null,
      description: 'Pacific Standard Time'
    }
  ];

  const quickActions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our team right now',
      action: 'Start chat',
      href: '#',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      description: 'Book a time that works for you',
      action: 'Book now',
      href: '/contact?type=meeting',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Phone,
      title: 'Request Callback',
      description: 'We\'ll call you back ASAP',
      action: 'Request call',
      href: '/contact?type=callback',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Sales Director',
      specialty: 'New projects & partnerships',
      avatar: 'SJ',
      email: 'sarah@example.com'
    },
    {
      name: 'Michael Chen',
      role: 'Technical Lead',
      specialty: 'Technical consultations',
      avatar: 'MC',
      email: 'michael@example.com'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Support Manager',
      specialty: 'Customer support & issues',
      avatar: 'ER',
      email: 'emily@example.com'
    }
  ];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="space-y-8"
    >
      {/* Contact Information */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Contact Information
        </h2>
        
        <div className="space-y-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={info.label}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      delay: index * 0.1,
                      duration: 0.5
                    }
                  }
                }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{info.label}</h3>
                    {info.action && info.href && (
                      <a
                        href={info.href}
                        target={info.href.startsWith('http') ? '_blank' : undefined}
                        rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        {info.action}
                      </a>
                    )}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {info.value}
                  </p>
                  {info.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {info.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.a
                key={action.title}
                href={action.href}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      delay: index * 0.1,
                      duration: 0.5
                    }
                  }
                }}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} opacity-10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 bg-gradient-to-br ${action.color} bg-clip-text text-transparent`} />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
                
                <div className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.action}
                </div>
              </motion.a>
            );
          })}
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Our Team
        </h3>
        
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    delay: index * 0.1,
                    duration: 0.5
                  }
                }
              }}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {member.avatar}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-foreground">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.role}</div>
                <div className="text-xs text-muted-foreground">{member.specialty}</div>
              </div>
              
              <a
                href={`mailto:${member.email}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={itemVariants} className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Frequently Asked Questions
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              How quickly do you respond?
            </h4>
            <p className="text-sm text-muted-foreground">
              We typically respond to all inquiries within 24 hours. For urgent matters, please call us directly.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Do you offer free consultations?
            </h4>
            <p className="text-sm text-muted-foreground">
              Yes! We provide free initial consultations to understand your project and discuss how we can help.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-foreground mb-2">
              What information should I include in my inquiry?
            </h4>
            <p className="text-sm text-muted-foreground">
              Please include your project goals, timeline, budget range, and any specific requirements or questions you have.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-red-200/50 dark:border-red-800/50">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Phone className="w-5 h-5 text-red-600" />
          Emergency Support
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          For critical issues affecting your live production systems, call our emergency hotline:
        </p>
        <div className="flex items-center gap-4">
          <a
            href="tel:+15551234999"
            className="font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            +1 (555) 123-4999
          </a>
          <span className="text-xs text-muted-foreground">Available 24/7</span>
        </div>
      </motion.div>
    </motion.div>
  );
}