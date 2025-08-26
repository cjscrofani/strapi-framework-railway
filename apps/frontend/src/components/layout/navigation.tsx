'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface NavigationProps {
  breadcrumbs?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Navigation({
  breadcrumbs = [],
  showHome = true,
  className,
}: NavigationProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const generatedBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs.length > 0) return breadcrumbs;

    const pathSegments = pathname.split('/').filter(Boolean);
    const generated: BreadcrumbItem[] = [];

    if (showHome) {
      generated.push({ title: 'Home', href: '/' });
    }

    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const title = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      generated.push({
        title,
        href: index === pathSegments.length - 1 ? undefined : href,
      });
    });

    return generated;
  }, [breadcrumbs, pathname, showHome]);

  if (generatedBreadcrumbs.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {generatedBreadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            )}
            
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors flex items-center"
              >
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-1" />
                )}
                {item.title}
              </Link>
            ) : (
              <span className="text-foreground font-medium flex items-center">
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-1" />
                )}
                {item.title}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface TabNavigationItem {
  id: string;
  label: string;
  href?: string;
  count?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  items: TabNavigationItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills';
  className?: string;
}

export function TabNavigation({
  items,
  activeTab,
  onTabChange,
  variant = 'default',
  className,
}: TabNavigationProps) {
  const pathname = usePathname();
  
  const getActiveTab = () => {
    if (activeTab) return activeTab;
    return items.find(item => item.href && pathname === item.href)?.id || items[0]?.id;
  };

  const currentTab = getActiveTab();

  const handleTabClick = (item: TabNavigationItem) => {
    if (item.disabled) return;
    
    if (item.href) {
      // Navigation handled by Link
      return;
    }
    
    onTabChange?.(item.id);
  };

  const TabContent = ({ item }: { item: TabNavigationItem }) => (
    <>
      <span>{item.label}</span>
      {item.count !== undefined && (
        <span
          className={cn(
            'ml-2 px-2 py-0.5 text-xs rounded-full',
            variant === 'pills'
              ? currentTab === item.id
                ? 'bg-primary-foreground text-primary'
                : 'bg-muted text-muted-foreground'
              : currentTab === item.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {item.count}
        </span>
      )}
    </>
  );

  return (
    <nav className={cn('flex', className)}>
      {variant === 'default' ? (
        <div className="flex space-x-8 border-b border-border">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors',
                    currentTab === item.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground hover:border-transparent'
                  )}
                >
                  <TabContent item={item} />
                </Link>
              ) : (
                <button
                  onClick={() => handleTabClick(item)}
                  className={cn(
                    'flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors',
                    currentTab === item.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground hover:border-transparent'
                  )}
                  disabled={item.disabled}
                >
                  <TabContent item={item} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {items.map((item) => (
            <div key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    currentTab === item.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
                  )}
                >
                  <TabContent item={item} />
                </Link>
              ) : (
                <button
                  onClick={() => handleTabClick(item)}
                  className={cn(
                    'flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    currentTab === item.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
                  )}
                  disabled={item.disabled}
                >
                  <TabContent item={item} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}