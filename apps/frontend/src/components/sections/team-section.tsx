'use client';

import { Mail, Linkedin, Twitter, Github } from 'lucide-react';
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

export function TeamSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Default team members data
  const teamMembers = [
    {
      id: '1',
      name: 'John Smith',
      role: 'Chief Executive Officer',
      department: 'Leadership',
      bio: 'John leads our company with over 15 years of experience in technology and business strategy. He is passionate about innovation and building exceptional teams.',
      image: '/images/team/john-smith.jpg',
      email: 'john@example.com',
      linkedin: 'https://linkedin.com/in/johnsmith',
      twitter: 'https://twitter.com/johnsmith',
      skills: ['Leadership', 'Strategy', 'Innovation']
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Chief Technology Officer',
      department: 'Engineering',
      bio: 'Sarah oversees our technical architecture and engineering teams. With a background in full-stack development, she ensures we deliver cutting-edge solutions.',
      image: '/images/team/sarah-johnson.jpg',
      email: 'sarah@example.com',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      github: 'https://github.com/sarahjohnson',
      skills: ['Full-Stack Development', 'Architecture', 'DevOps']
    },
    {
      id: '3',
      name: 'Michael Chen',
      role: 'Lead Designer',
      department: 'Design',
      bio: 'Michael creates beautiful and intuitive user experiences. His design philosophy focuses on simplicity, accessibility, and user-centered design.',
      image: '/images/team/michael-chen.jpg',
      email: 'michael@example.com',
      linkedin: 'https://linkedin.com/in/michaelchen',
      twitter: 'https://twitter.com/michaelchen',
      skills: ['UI/UX Design', 'Prototyping', 'User Research']
    },
    {
      id: '4',
      name: 'Emily Rodriguez',
      role: 'Senior Developer',
      department: 'Engineering',
      bio: 'Emily specializes in frontend development and has a passion for creating performant, accessible web applications using modern technologies.',
      image: '/images/team/emily-rodriguez.jpg',
      email: 'emily@example.com',
      linkedin: 'https://linkedin.com/in/emilyrodriguez',
      github: 'https://github.com/emilyrodriguez',
      skills: ['React', 'TypeScript', 'Performance Optimization']
    },
    {
      id: '5',
      name: 'David Park',
      role: 'DevOps Engineer',
      department: 'Infrastructure',
      bio: 'David manages our cloud infrastructure and deployment pipelines. He ensures our applications are scalable, secure, and highly available.',
      image: '/images/team/david-park.jpg',
      email: 'david@example.com',
      linkedin: 'https://linkedin.com/in/davidpark',
      github: 'https://github.com/davidpark',
      skills: ['AWS', 'Docker', 'Kubernetes']
    },
    {
      id: '6',
      name: 'Lisa Thompson',
      role: 'Product Manager',
      department: 'Product',
      bio: 'Lisa bridges the gap between business requirements and technical implementation. She ensures our products meet user needs and business objectives.',
      image: '/images/team/lisa-thompson.jpg',
      email: 'lisa@example.com',
      linkedin: 'https://linkedin.com/in/lisathompson',
      twitter: 'https://twitter.com/lisathompson',
      skills: ['Product Strategy', 'Agile', 'Analytics']
    }
  ];

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'email':
        return Mail;
      case 'linkedin':
        return Linkedin;
      case 'twitter':
        return Twitter;
      case 'github':
        return Github;
      default:
        return Mail;
    }
  };

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
                Meet Our Team
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get to know the talented individuals who make our success possible. Our diverse team brings together expertise from various disciplines.
            </p>
          </motion.div>

          {/* Team Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
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
                  className="group bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                >
                  {/* Member Image */}
                  <div className="relative h-64 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Placeholder avatar with initials */}
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Department Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-muted-foreground border border-border/50">
                        {member.department}
                      </span>
                    </div>
                  </div>

                  {/* Member Content */}
                  <div className="p-6 space-y-4">
                    {/* Name and Role */}
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-primary font-medium">
                        {member.role}
                      </p>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground leading-relaxed text-center">
                      {member.bio}
                    </p>

                    {/* Skills */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {member.skills.slice(0, 3).map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="flex justify-center gap-3 pt-2">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-[#0077b5] hover:text-white transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-[#1da1f2] hover:text-white transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {member.github && (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-[#333] hover:text-white transition-colors"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Join Team CTA */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Join Our Team
              </h3>
              <p className="text-muted-foreground mb-6">
                We're always looking for talented individuals who share our passion for innovation and excellence. 
                Explore opportunities to grow your career with us.
              </p>
              <a
                href="/careers"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                View Open Positions
              </a>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}