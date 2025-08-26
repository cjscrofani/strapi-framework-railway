'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, CheckCircle, AlertCircle, User, Mail, Phone, Building, MessageSquare, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useContactForm } from '@/lib/react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  inquiryType: z.enum(['general', 'quote', 'support', 'consultation', 'partnership']),
  budget: z.string().optional(),
  timeline: z.string().optional()
});

type ContactFormData = z.infer<typeof contactSchema>;

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

export function ContactFormSection() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const contactMutation = useContactForm();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      inquiryType: 'general'
    }
  });

  const inquiryType = watch('inquiryType');

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry', icon: MessageSquare },
    { value: 'quote', label: 'Request Quote', icon: Briefcase },
    { value: 'support', label: 'Technical Support', icon: AlertCircle },
    { value: 'consultation', label: 'Free Consultation', icon: User },
    { value: 'partnership', label: 'Partnership', icon: Building }
  ];

  const budgetRanges = [
    { value: 'under-5k', label: 'Under $5,000' },
    { value: '5k-15k', label: '$5,000 - $15,000' },
    { value: '15k-50k', label: '$15,000 - $50,000' },
    { value: '50k-plus', label: '$50,000+' },
    { value: 'discuss', label: 'Let\'s discuss' }
  ];

  const timelineOptions = [
    { value: 'asap', label: 'ASAP' },
    { value: '1-3-months', label: '1-3 months' },
    { value: '3-6-months', label: '3-6 months' },
    { value: '6-plus-months', label: '6+ months' },
    { value: 'flexible', label: 'Flexible' }
  ];

  const onSubmit = async (data: ContactFormData) => {
    try {
      await contactMutation.mutateAsync(data);
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Thank You for Reaching Out!
        </h3>
        
        <p className="text-muted-foreground mb-6">
          We've received your message and will get back to you within 24 hours. 
          Our team is excited to learn more about your project and how we can help bring your vision to life.
        </p>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">What's Next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• We'll review your inquiry and assign the right team member</li>
              <li>• Expect a personalized response within 24 hours</li>
              <li>• We'll schedule a call to discuss your project in detail</li>
            </ul>
          </div>
          
          <Button 
            onClick={() => setIsSubmitted(false)}
            variant="outline"
          >
            Send Another Message
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={itemVariants}
    >
      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/50">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Send Us a Message
          </h2>
          <p className="text-muted-foreground">
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Inquiry Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              What can we help you with?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inquiryTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      inquiryType === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('inquiryType')}
                      className="sr-only"
                    />
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  {...register('name')}
                  placeholder="Your full name"
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  {...register('company')}
                  placeholder="Your company name"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subject *
            </label>
            <Input
              {...register('subject')}
              placeholder="Brief description of your inquiry"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message *
            </label>
            <Textarea
              {...register('message')}
              rows={6}
              placeholder="Tell us more about your project, requirements, or questions..."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Budget and Timeline - Show only for quote/consultation */}
          {(inquiryType === 'quote' || inquiryType === 'consultation') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Budget Range
                </label>
                <select
                  {...register('budget')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Timeline
                </label>
                <select
                  {...register('timeline')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Select timeline</option>
                  {timelineOptions.map((timeline) => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6"
              disabled={contactMutation.isPending}
            >
              {contactMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Message...
                </>
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            {contactMutation.error && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Failed to send message. Please try again.
              </p>
            )}
          </div>

          {/* Privacy Note */}
          <div className="text-xs text-muted-foreground text-center">
            By submitting this form, you agree to our{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . We'll never share your information with third parties.
          </div>
        </form>
      </div>
    </motion.div>
  );
}