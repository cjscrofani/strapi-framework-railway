'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

interface FooterProps {
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  contactInfo?: ContactInfo;
  newsletter?: {
    title: string;
    description: string;
    onSubmit: (email: string) => Promise<void>;
  };
  copyright?: string;
  logo?: {
    src?: string;
    alt?: string;
    text?: string;
    href?: string;
  };
  className?: string;
}

export function Footer({
  sections = [],
  socialLinks = [],
  contactInfo,
  newsletter,
  copyright,
  logo = { text: 'Logo', href: '/' },
  className,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletter?.onSubmit || !email) return;

    setIsSubscribing(true);
    try {
      await newsletter.onSubmit(email);
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-background border-t', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 lg:gap-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <Link
                href={logo.href || '/'}
                className="flex items-center space-x-2 text-xl font-bold mb-4"
              >
                {logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.alt || 'Logo'}
                    className="h-8 w-auto"
                  />
                ) : (
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {logo.text}
                  </span>
                )}
              </Link>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
                Building exceptional digital experiences with modern technology.
                Empowering businesses to succeed in the digital age.
              </p>

              {/* Contact Info */}
              {contactInfo && (
                <div className="space-y-3">
                  {contactInfo.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        {contactInfo.address}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex space-x-4 mt-6">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-md"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        {...(link.external && {
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        })}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter Signup */}
            {newsletter && (
              <div>
                <h3 className="font-semibold text-foreground mb-4">
                  {newsletter.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {newsletter.description}
                </p>
                {!subscribed ? (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="sm"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      loading={isSubscribing}
                      className="w-full"
                    >
                      Subscribe
                    </Button>
                  </form>
                ) : (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Successfully subscribed!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              {copyright || `© ${currentYear} All rights reserved.`}
            </p>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <button
                onClick={scrollToTop}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Scroll to top"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}