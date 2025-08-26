'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  children?: NavigationItem[];
}

interface HeaderProps {
  navigation: NavigationItem[];
  logo?: {
    src?: string;
    alt?: string;
    text?: string;
    href?: string;
  };
  cta?: {
    text: string;
    href: string;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}

export function Header({
  navigation = [],
  logo = { text: 'Logo', href: '/' },
  cta,
  className,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleDropdown = (title: string) => {
    setActiveDropdown(activeDropdown === title ? null : title);
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    closeAllDropdowns();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b'
          : 'bg-transparent',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href={logo.href || '/'}
              className="flex items-center space-x-2 text-xl font-bold"
              onClick={closeMobileMenu}
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.title} className="relative">
                {item.children ? (
                  <div className="relative">
                    <button
                      className={cn(
                        'flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary',
                        isActivePath(item.href)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                      onClick={() => toggleDropdown(item.title)}
                      onMouseEnter={() => setActiveDropdown(item.title)}
                    >
                      <span>{item.title}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === item.title && (
                      <div
                        className="absolute left-0 top-full mt-2 w-64 bg-background border rounded-lg shadow-lg py-2 z-50"
                        onMouseLeave={closeAllDropdowns}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.title}
                            href={child.href}
                            className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={closeAllDropdowns}
                          >
                            <div className="font-medium">{child.title}</div>
                            {child.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {child.description}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActivePath(item.href)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Button & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {cta && (
              <Button
                asChild
                variant={cta.variant || 'default'}
                className="hidden md:inline-flex"
              >
                <Link href={cta.href}>{cta.text}</Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <div key={item.title}>
                  {item.children ? (
                    <div>
                      <button
                        className="flex w-full items-center justify-between text-base font-medium py-2"
                        onClick={() => toggleDropdown(item.title)}
                      >
                        <span
                          className={cn(
                            isActivePath(item.href)
                              ? 'text-primary'
                              : 'text-foreground'
                          )}
                        >
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            activeDropdown === item.title && 'rotate-180'
                          )}
                        />
                      </button>
                      {activeDropdown === item.title && (
                        <div className="ml-4 space-y-2 py-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.title}
                              href={child.href}
                              className="block text-sm text-muted-foreground hover:text-primary py-2"
                              onClick={closeMobileMenu}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'block text-base font-medium py-2',
                        isActivePath(item.href)
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                      onClick={closeMobileMenu}
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
              {cta && (
                <Button asChild variant={cta.variant || 'default'} className="mt-4">
                  <Link href={cta.href} onClick={closeMobileMenu}>
                    {cta.text}
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}