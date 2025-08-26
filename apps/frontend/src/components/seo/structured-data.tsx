'use client';

import * as React from 'react';

interface StructuredDataProps {
  data: Record<string, any> | Array<Record<string, any>>;
  id?: string;
}

export function StructuredData({ data, id }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd),
      }}
    />
  );
}

// Specific structured data components
interface WebsiteStructuredDataProps {
  name: string;
  url: string;
  description?: string;
  logo?: string;
}

export function WebsiteStructuredData(props: WebsiteStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    ...props,
  };

  return <StructuredData data={data} id="website-structured-data" />;
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

export function OrganizationStructuredData(props: OrganizationStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    description: props.description,
    ...(props.logo && {
      logo: {
        '@type': 'ImageObject',
        url: props.logo,
      },
    }),
    ...(props.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...props.contactPoint,
      },
    }),
    ...(props.address && {
      address: {
        '@type': 'PostalAddress',
        ...props.address,
      },
    }),
    ...(props.sameAs && { sameAs: props.sameAs }),
  };

  return <StructuredData data={data} id="organization-structured-data" />;
}

interface ArticleStructuredDataProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
  url: string;
}

export function ArticleStructuredData(props: ArticleStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.headline,
    description: props.description,
    ...(props.image && {
      image: {
        '@type': 'ImageObject',
        url: props.image,
      },
    }),
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      '@type': 'Person',
      name: props.author.name,
      ...(props.author.url && { url: props.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: props.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: props.publisher.logo,
      },
    },
    url: props.url,
  };

  return <StructuredData data={data} id="article-structured-data" />;
}

interface BreadcrumbStructuredDataProps {
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbStructuredData({ breadcrumbs }: BreadcrumbStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData data={data} id="breadcrumb-structured-data" />;
}

interface FAQStructuredDataProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={data} id="faq-structured-data" />;
}

interface ServiceStructuredDataProps {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  serviceType: string;
  url?: string;
  image?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

export function ServiceStructuredData(props: ServiceStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: props.name,
    description: props.description,
    serviceType: props.serviceType,
    provider: {
      '@type': 'Organization',
      name: props.provider.name,
      url: props.provider.url,
    },
    ...(props.url && { url: props.url }),
    ...(props.image && {
      image: {
        '@type': 'ImageObject',
        url: props.image,
      },
    }),
    ...(props.offers && {
      offers: {
        '@type': 'Offer',
        price: props.offers.price,
        priceCurrency: props.offers.priceCurrency,
        availability: `https://schema.org/${props.offers.availability}`,
      },
    }),
  };

  return <StructuredData data={data} id="service-structured-data" />;
}