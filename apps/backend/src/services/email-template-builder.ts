/**
 * Advanced Email Template Builder
 * Creates responsive, branded email templates for both SendGrid and MailChimp
 */

import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

export interface EmailTemplateConfig {
  name: string;
  description: string;
  category: 'marketing' | 'transactional' | 'automation' | 'newsletter';
  version: string;
  author: string;
  tags: string[];
  responsive: boolean;
  darkModeSupport: boolean;
  previewText?: string;
  variables: {
    [key: string]: {
      type: 'text' | 'number' | 'boolean' | 'date' | 'url' | 'image' | 'color';
      required: boolean;
      default?: any;
      description: string;
      validation?: RegExp;
    };
  };
  sections: {
    [key: string]: {
      editable: boolean;
      repeatable: boolean;
      description: string;
    };
  };
}

export interface EmailTemplateStyle {
  brand: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    linkColor: string;
    fontFamily: string;
    logoUrl?: string;
    brandName: string;
  };
  layout: {
    maxWidth: number;
    padding: number;
    borderRadius: number;
    shadowLevel: 'none' | 'light' | 'medium' | 'heavy';
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    h1Size: string;
    h2Size: string;
    h3Size: string;
    bodySize: string;
    lineHeight: number;
  };
  components: {
    button: {
      backgroundColor: string;
      textColor: string;
      borderRadius: number;
      padding: string;
      fontSize: string;
      fontWeight: string;
    };
    card: {
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      borderRadius: number;
      padding: string;
      shadow: boolean;
    };
  };
}

export interface EmailTemplate {
  id: string;
  config: EmailTemplateConfig;
  style: EmailTemplateStyle;
  html: string;
  text: string;
  subject: string;
  preheader?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateRenderOptions {
  data: Record<string, any>;
  style?: Partial<EmailTemplateStyle>;
  darkMode?: boolean;
  testMode?: boolean;
  previewMode?: boolean;
}

class EmailTemplateBuilder {
  private templates: Map<string, EmailTemplate> = new Map();
  private templateCache: Map<string, string> = new Map();
  private baseTemplatesPath: string;

  constructor(baseTemplatesPath: string = './email-templates') {
    this.baseTemplatesPath = baseTemplatesPath;
    this.registerHelpers();
  }

  // Template Creation
  async createTemplate(
    config: EmailTemplateConfig,
    style: EmailTemplateStyle,
    htmlContent: string,
    textContent?: string
  ): Promise<string> {
    try {
      const templateId = this.generateTemplateId(config.name);
      
      const template: EmailTemplate = {
        id: templateId,
        config,
        style,
        html: htmlContent,
        text: textContent || this.generateTextFromHtml(htmlContent),
        subject: `{{subject}}`,
        preheader: config.previewText,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate template
      await this.validateTemplate(template);

      // Store template
      this.templates.set(templateId, template);
      
      // Save to file system
      await this.saveTemplateToFile(template);

      return templateId;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  // Template Rendering
  async renderTemplate(
    templateId: string,
    options: TemplateRenderOptions
  ): Promise<{ html: string; text: string; subject: string }> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Merge style overrides
      const finalStyle = this.mergeStyles(template.style, options.style);
      
      // Prepare render context
      const renderContext = {
        ...options.data,
        style: finalStyle,
        brand: finalStyle.brand,
        darkMode: options.darkMode || false,
        testMode: options.testMode || false,
        previewMode: options.previewMode || false,
        currentYear: new Date().getFullYear(),
        timestamp: new Date().toISOString(),
      };

      // Compile and render templates
      const htmlTemplate = Handlebars.compile(template.html);
      const textTemplate = Handlebars.compile(template.text);
      const subjectTemplate = Handlebars.compile(template.subject);

      const html = this.inlineCss(htmlTemplate(renderContext), finalStyle);
      const text = textTemplate(renderContext);
      const subject = subjectTemplate(renderContext);

      // Cache rendered template
      const cacheKey = `${templateId}_${JSON.stringify(options)}`;
      this.templateCache.set(cacheKey, html);

      return { html, text, subject };
    } catch (error) {
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  // Pre-built Template Library
  async createMarketingNewsletterTemplate(style: EmailTemplateStyle): Promise<string> {
    const config: EmailTemplateConfig = {
      name: 'Marketing Newsletter',
      description: 'Professional newsletter template with header, articles, and footer',
      category: 'newsletter',
      version: '1.0.0',
      author: 'Email Template Builder',
      tags: ['newsletter', 'marketing', 'articles'],
      responsive: true,
      darkModeSupport: true,
      previewText: 'Latest updates and insights from {{brand.brandName}}',
      variables: {
        headerTitle: { type: 'text', required: true, description: 'Newsletter title', default: 'Weekly Newsletter' },
        headerSubtitle: { type: 'text', required: false, description: 'Newsletter subtitle' },
        articles: { type: 'text', required: true, description: 'Newsletter articles array' },
        ctaText: { type: 'text', required: false, description: 'Call to action text', default: 'Read More' },
        ctaUrl: { type: 'url', required: false, description: 'Call to action URL' },
        unsubscribeUrl: { type: 'url', required: true, description: 'Unsubscribe link' },
      },
      sections: {
        header: { editable: true, repeatable: false, description: 'Newsletter header' },
        articles: { editable: true, repeatable: true, description: 'Article sections' },
        footer: { editable: true, repeatable: false, description: 'Newsletter footer' },
      },
    };

    const html = this.buildNewsletterHtml();
    const text = this.buildNewsletterText();

    return await this.createTemplate(config, style, html, text);
  }

  async createWelcomeEmailTemplate(style: EmailTemplateStyle): Promise<string> {
    const config: EmailTemplateConfig = {
      name: 'Welcome Email',
      description: 'Warm welcome email for new subscribers',
      category: 'transactional',
      version: '1.0.0',
      author: 'Email Template Builder',
      tags: ['welcome', 'onboarding', 'transactional'],
      responsive: true,
      darkModeSupport: true,
      previewText: 'Welcome to {{brand.brandName}}! Get started with your account.',
      variables: {
        firstName: { type: 'text', required: true, description: 'User first name' },
        welcomeMessage: { type: 'text', required: false, description: 'Custom welcome message' },
        nextSteps: { type: 'text', required: false, description: 'Next steps for the user' },
        ctaText: { type: 'text', required: true, description: 'Call to action text', default: 'Get Started' },
        ctaUrl: { type: 'url', required: true, description: 'Call to action URL' },
      },
      sections: {
        hero: { editable: true, repeatable: false, description: 'Welcome hero section' },
        content: { editable: true, repeatable: false, description: 'Welcome content' },
        cta: { editable: true, repeatable: false, description: 'Call to action section' },
      },
    };

    const html = this.buildWelcomeHtml();
    const text = this.buildWelcomeText();

    return await this.createTemplate(config, style, html, text);
  }

  async createPromotionalTemplate(style: EmailTemplateStyle): Promise<string> {
    const config: EmailTemplateConfig = {
      name: 'Promotional Campaign',
      description: 'Eye-catching promotional email template',
      category: 'marketing',
      version: '1.0.0',
      author: 'Email Template Builder',
      tags: ['promotional', 'marketing', 'sales'],
      responsive: true,
      darkModeSupport: true,
      previewText: 'Special offer from {{brand.brandName}} - Limited time only!',
      variables: {
        offerTitle: { type: 'text', required: true, description: 'Promotion title' },
        offerDescription: { type: 'text', required: true, description: 'Promotion description' },
        discount: { type: 'text', required: false, description: 'Discount amount' },
        promoCode: { type: 'text', required: false, description: 'Promotion code' },
        expiryDate: { type: 'date', required: false, description: 'Offer expiry date' },
        ctaText: { type: 'text', required: true, description: 'Call to action text', default: 'Shop Now' },
        ctaUrl: { type: 'url', required: true, description: 'Call to action URL' },
      },
      sections: {
        hero: { editable: true, repeatable: false, description: 'Promotional hero' },
        offer: { editable: true, repeatable: false, description: 'Offer details' },
        products: { editable: true, repeatable: true, description: 'Featured products' },
        urgency: { editable: true, repeatable: false, description: 'Urgency/scarcity section' },
      },
    };

    const html = this.buildPromotionalHtml();
    const text = this.buildPromotionalText();

    return await this.createTemplate(config, style, html, text);
  }

  // Template Management
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async listTemplates(category?: string): Promise<EmailTemplate[]> {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.config.category === category) : templates;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return false;
      }

      // Delete from memory
      this.templates.delete(templateId);
      
      // Delete from file system
      await this.deleteTemplateFile(templateId);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<boolean> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return false;
      }

      const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
      
      // Validate updated template
      await this.validateTemplate(updatedTemplate);

      // Update in memory
      this.templates.set(templateId, updatedTemplate);
      
      // Update file system
      await this.saveTemplateToFile(updatedTemplate);

      return true;
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  // Template Testing
  async testTemplate(templateId: string, testData: Record<string, any>): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    preview: { html: string; text: string; subject: string };
  }> {
    const result = {
      success: true,
      errors: [] as string[],
      warnings: [] as string[],
      preview: { html: '', text: '', subject: '' },
    };

    try {
      // Test rendering
      const rendered = await this.renderTemplate(templateId, {
        data: testData,
        testMode: true,
      });

      result.preview = rendered;

      // Test HTML validation
      const htmlErrors = this.validateHtml(rendered.html);
      result.errors.push(...htmlErrors);

      // Test responsive design
      const responsiveWarnings = this.checkResponsiveDesign(rendered.html);
      result.warnings.push(...responsiveWarnings);

      // Test accessibility
      const accessibilityWarnings = this.checkAccessibility(rendered.html);
      result.warnings.push(...accessibilityWarnings);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  // Template Export/Import
  async exportTemplate(templateId: string): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return JSON.stringify(template, null, 2);
  }

  async importTemplate(templateJson: string): Promise<string> {
    try {
      const template: EmailTemplate = JSON.parse(templateJson);
      
      // Validate imported template
      await this.validateTemplate(template);

      // Generate new ID to avoid conflicts
      const newId = this.generateTemplateId(template.config.name);
      template.id = newId;
      template.createdAt = new Date();
      template.updatedAt = new Date();

      // Store template
      this.templates.set(newId, template);
      await this.saveTemplateToFile(template);

      return newId;
    } catch (error) {
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }

  // Private Helper Methods
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';
      const d = new Date(date);
      switch (format) {
        case 'short': return d.toLocaleDateString();
        case 'long': return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        case 'time': return d.toLocaleTimeString();
        default: return d.toISOString();
      }
    });

    // URL helper
    Handlebars.registerHelper('url', (path: string, baseUrl?: string) => {
      const base = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Loop helper with index
    Handlebars.registerHelper('eachWithIndex', function(array: any[], options: any) {
      let result = '';
      for (let i = 0; i < array.length; i++) {
        result += options.fn({
          ...array[i],
          index: i,
          first: i === 0,
          last: i === array.length - 1,
        });
      }
      return result;
    });

    // Color helper
    Handlebars.registerHelper('lighten', (color: string, amount: number) => {
      return this.lightenColor(color, amount);
    });

    Handlebars.registerHelper('darken', (color: string, amount: number) => {
      return this.darkenColor(color, amount);
    });
  }

  private generateTemplateId(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `${slug}_${Date.now()}`;
  }

  private mergeStyles(base: EmailTemplateStyle, overrides?: Partial<EmailTemplateStyle>): EmailTemplateStyle {
    if (!overrides) return base;
    
    return {
      brand: { ...base.brand, ...overrides.brand },
      layout: { ...base.layout, ...overrides.layout },
      typography: { ...base.typography, ...overrides.typography },
      components: {
        button: { ...base.components.button, ...overrides.components?.button },
        card: { ...base.components.card, ...overrides.components?.card },
      },
    };
  }

  private inlineCss(html: string, style: EmailTemplateStyle): string {
    // This is a simplified version - in production you'd use a proper CSS inliner
    let inlinedHtml = html;
    
    // Inline basic styles
    inlinedHtml = inlinedHtml.replace(/{{style\.brand\.primaryColor}}/g, style.brand.primaryColor);
    inlinedHtml = inlinedHtml.replace(/{{style\.brand\.secondaryColor}}/g, style.brand.secondaryColor);
    inlinedHtml = inlinedHtml.replace(/{{style\.brand\.textColor}}/g, style.brand.textColor);
    inlinedHtml = inlinedHtml.replace(/{{style\.brand\.backgroundColor}}/g, style.brand.backgroundColor);
    inlinedHtml = inlinedHtml.replace(/{{style\.brand\.fontFamily}}/g, style.brand.fontFamily);
    
    return inlinedHtml;
  }

  private generateTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async validateTemplate(template: EmailTemplate): Promise<void> {
    // Validate required fields
    if (!template.config.name) {
      throw new Error('Template name is required');
    }

    if (!template.html) {
      throw new Error('Template HTML is required');
    }

    // Validate HTML
    const htmlErrors = this.validateHtml(template.html);
    if (htmlErrors.length > 0) {
      throw new Error(`HTML validation errors: ${htmlErrors.join(', ')}`);
    }
  }

  private validateHtml(html: string): string[] {
    const errors: string[] = [];
    
    // Check for unclosed tags
    const openTags = html.match(/<[^\/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      errors.push('Unclosed HTML tags detected');
    }

    // Check for required email elements
    if (!html.includes('<!DOCTYPE')) {
      errors.push('Missing DOCTYPE declaration');
    }

    if (!html.includes('<html')) {
      errors.push('Missing HTML tag');
    }

    return errors;
  }

  private checkResponsiveDesign(html: string): string[] {
    const warnings: string[] = [];
    
    if (!html.includes('viewport')) {
      warnings.push('Missing viewport meta tag for mobile responsiveness');
    }

    if (!html.includes('@media')) {
      warnings.push('No media queries found - template may not be responsive');
    }

    return warnings;
  }

  private checkAccessibility(html: string): string[] {
    const warnings: string[] = [];
    
    const imgTags = html.match(/<img[^>]*>/g) || [];
    for (const img of imgTags) {
      if (!img.includes('alt=')) {
        warnings.push('Image missing alt text');
      }
    }

    if (!html.includes('lang=')) {
      warnings.push('Missing language attribute');
    }

    return warnings;
  }

  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in production use a proper color library
    return color;
  }

  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - in production use a proper color library
    return color;
  }

  // Template HTML builders
  private buildNewsletterHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{headerTitle}} - {{brand.brandName}}</title>
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        
        /* Main styles */
        body { margin: 0; padding: 0; background-color: {{style.brand.backgroundColor}}; font-family: {{style.brand.fontFamily}}; }
        .container { max-width: {{style.layout.maxWidth}}px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: {{style.brand.primaryColor}}; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: {{style.typography.h1Size}}; }
        .content { padding: 40px 20px; }
        .article { margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #eaeaea; }
        .article:last-child { border-bottom: none; margin-bottom: 0; }
        .article h2 { color: {{style.brand.textColor}}; font-size: {{style.typography.h2Size}}; margin-bottom: 15px; }
        .article p { color: {{style.brand.textColor}}; line-height: {{style.typography.lineHeight}}; margin-bottom: 15px; }
        .cta-button { display: inline-block; background-color: {{style.components.button.backgroundColor}}; color: {{style.components.button.textColor}}; text-decoration: none; padding: {{style.components.button.padding}}; border-radius: {{style.components.button.borderRadius}}px; font-weight: {{style.components.button.fontWeight}}; margin-top: 20px; }
        .footer { background-color: #f8f9fa; padding: 30px 20px; text-align: center; font-size: 14px; color: #666; }
        .footer a { color: {{style.brand.linkColor}}; text-decoration: none; }
        
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .header, .content, .footer { padding: 20px !important; }
            .header h1 { font-size: 24px !important; }
            .article h2 { font-size: 20px !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            {{#if brand.logoUrl}}
            <img src="{{brand.logoUrl}}" alt="{{brand.brandName}}" style="max-height: 60px; margin-bottom: 20px;">
            {{/if}}
            <h1>{{headerTitle}}</h1>
            {{#if headerSubtitle}}
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">{{headerSubtitle}}</p>
            {{/if}}
        </div>
        
        <!-- Content -->
        <div class="content">
            {{#each articles}}
            <div class="article">
                {{#if this.image}}
                <img src="{{this.image}}" alt="{{this.title}}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
                {{/if}}
                <h2>{{this.title}}</h2>
                <p>{{this.summary}}</p>
                {{#if this.url}}
                <a href="{{this.url}}" class="cta-button">{{../ctaText}}</a>
                {{/if}}
            </div>
            {{/each}}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>© {{currentYear}} {{brand.brandName}}. All rights reserved.</p>
            <p>
                <a href="{{url '/'}}" style="color: {{style.brand.linkColor}};">Visit our website</a> | 
                <a href="{{unsubscribeUrl}}" style="color: {{style.brand.linkColor}};">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private buildNewsletterText(): string {
    return `
{{headerTitle}} - {{brand.brandName}}

{{#if headerSubtitle}}{{headerSubtitle}}{{/if}}

{{#each articles}}
{{this.title}}
{{this.summary}}
{{#if this.url}}Read more: {{this.url}}{{/if}}

{{/each}}

© {{currentYear}} {{brand.brandName}}. All rights reserved.

Visit our website: {{url '/'}}
Unsubscribe: {{unsubscribeUrl}}
    `;
  }

  private buildWelcomeHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{brand.brandName}}</title>
    <style>
        body { margin: 0; padding: 0; background-color: {{style.brand.backgroundColor}}; font-family: {{style.brand.fontFamily}}; }
        .container { max-width: {{style.layout.maxWidth}}px; margin: 0 auto; background-color: #ffffff; }
        .hero { background: linear-gradient(135deg, {{style.brand.primaryColor}}, {{style.brand.secondaryColor}}); padding: 60px 20px; text-align: center; color: white; }
        .hero h1 { font-size: {{style.typography.h1Size}}; margin-bottom: 20px; }
        .hero p { font-size: 18px; margin-bottom: 30px; }
        .content { padding: 40px 20px; text-align: center; }
        .content h2 { color: {{style.brand.textColor}}; margin-bottom: 20px; }
        .content p { color: {{style.brand.textColor}}; line-height: {{style.typography.lineHeight}}; margin-bottom: 20px; }
        .cta-button { display: inline-block; background-color: {{style.components.button.backgroundColor}}; color: {{style.components.button.textColor}}; text-decoration: none; padding: {{style.components.button.padding}}; border-radius: {{style.components.button.borderRadius}}px; font-weight: {{style.components.button.fontWeight}}; font-size: {{style.components.button.fontSize}}; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 30px 20px; text-align: center; font-size: 14px; color: #666; }
        
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .hero, .content, .footer { padding: 20px !important; }
            .hero h1 { font-size: 28px !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            {{#if brand.logoUrl}}
            <img src="{{brand.logoUrl}}" alt="{{brand.brandName}}" style="max-height: 60px; margin-bottom: 30px;">
            {{/if}}
            <h1>Welcome{{#if firstName}}, {{firstName}}{{/if}}!</h1>
            <p>{{#if welcomeMessage}}{{welcomeMessage}}{{else}}We're thrilled to have you join {{brand.brandName}}{{/if}}</p>
        </div>
        
        <div class="content">
            <h2>Get Started</h2>
            {{#if nextSteps}}
            <p>{{nextSteps}}</p>
            {{else}}
            <p>Here are your next steps to get the most out of {{brand.brandName}}:</p>
            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>Complete your profile</li>
                <li>Explore our features</li>
                <li>Connect with our community</li>
            </ul>
            {{/if}}
            
            <a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>
        </div>
        
        <div class="footer">
            <p>Need help? <a href="{{url '/support'}}">Contact our support team</a></p>
            <p>© {{currentYear}} {{brand.brandName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private buildWelcomeText(): string {
    return `
Welcome{{#if firstName}}, {{firstName}}{{/if}}!

{{#if welcomeMessage}}{{welcomeMessage}}{{else}}We're thrilled to have you join {{brand.brandName}}.{{/if}}

Get Started:
{{#if nextSteps}}{{nextSteps}}{{else}}
Here are your next steps:
- Complete your profile
- Explore our features  
- Connect with our community
{{/if}}

{{ctaText}}: {{ctaUrl}}

Need help? Contact our support team: {{url '/support'}}

© {{currentYear}} {{brand.brandName}}. All rights reserved.
    `;
  }

  private buildPromotionalHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{offerTitle}} - {{brand.brandName}}</title>
    <style>
        body { margin: 0; padding: 0; background-color: {{style.brand.backgroundColor}}; font-family: {{style.brand.fontFamily}}; }
        .container { max-width: {{style.layout.maxWidth}}px; margin: 0 auto; background-color: #ffffff; }
        .hero { background: linear-gradient(135deg, {{style.brand.primaryColor}}, {{style.brand.secondaryColor}}); padding: 60px 20px; text-align: center; color: white; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat; animation: sparkle 3s linear infinite; }
        .hero h1 { font-size: {{style.typography.h1Size}}; margin-bottom: 20px; position: relative; z-index: 1; }
        .discount-badge { display: inline-block; background-color: {{style.brand.accentColor}}; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 50px; margin: 20px 0; position: relative; z-index: 1; }
        .content { padding: 40px 20px; text-align: center; }
        .offer-details { background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 30px 0; }
        .promo-code { background-color: {{style.brand.primaryColor}}; color: white; font-size: 20px; font-weight: bold; padding: 15px; border-radius: 5px; display: inline-block; margin: 20px 0; letter-spacing: 2px; }
        .urgency { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .urgency p { margin: 0; color: #856404; font-weight: bold; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, {{style.brand.primaryColor}}, {{style.brand.secondaryColor}}); color: white; text-decoration: none; padding: 20px 40px; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        
        @keyframes sparkle { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-10px) translateY(-10px); } }
        
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .hero, .content { padding: 20px !important; }
            .hero h1 { font-size: 28px !important; }
            .discount-badge { font-size: 20px !important; padding: 10px 20px !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>{{offerTitle}}</h1>
            {{#if discount}}
            <div class="discount-badge">{{discount}} OFF</div>
            {{/if}}
            <p style="font-size: 18px; margin: 0;">{{offerDescription}}</p>
        </div>
        
        <div class="content">
            {{#if promoCode}}
            <p>Use code:</p>
            <div class="promo-code">{{promoCode}}</div>
            {{/if}}
            
            {{#if expiryDate}}
            <div class="urgency">
                <p>⏰ Limited Time Offer - Expires {{formatDate expiryDate 'long'}}</p>
            </div>
            {{/if}}
            
            <a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>
            
            <div class="offer-details">
                <h3>Offer Details</h3>
                <p>{{offerDescription}}</p>
                <p style="font-size: 12px; color: #666;">*Terms and conditions apply. See website for full details.</p>
            </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; font-size: 14px; color: #666;">
            <p>© {{currentYear}} {{brand.brandName}}. All rights reserved.</p>
            <p><a href="{{url '/unsubscribe'}}">Unsubscribe</a> from promotional emails</p>
        </div>
    </div>
</body>
</html>`;
  }

  private buildPromotionalText(): string {
    return `
{{offerTitle}}

{{#if discount}}{{discount}} OFF{{/if}}

{{offerDescription}}

{{#if promoCode}}Use code: {{promoCode}}{{/if}}

{{#if expiryDate}}⏰ Limited Time Offer - Expires {{formatDate expiryDate 'long'}}{{/if}}

{{ctaText}}: {{ctaUrl}}

*Terms and conditions apply. See website for full details.

© {{currentYear}} {{brand.brandName}}. All rights reserved.
Unsubscribe from promotional emails: {{url '/unsubscribe'}}
    `;
  }

  private async saveTemplateToFile(template: EmailTemplate): Promise<void> {
    const templateDir = path.join(this.baseTemplatesPath, template.id);
    await fs.mkdir(templateDir, { recursive: true });
    
    // Save template files
    await fs.writeFile(path.join(templateDir, 'config.json'), JSON.stringify(template.config, null, 2));
    await fs.writeFile(path.join(templateDir, 'style.json'), JSON.stringify(template.style, null, 2));
    await fs.writeFile(path.join(templateDir, 'template.html'), template.html);
    await fs.writeFile(path.join(templateDir, 'template.txt'), template.text);
  }

  private async deleteTemplateFile(templateId: string): Promise<void> {
    const templateDir = path.join(this.baseTemplatesPath, templateId);
    await fs.rm(templateDir, { recursive: true, force: true });
  }
}

export default EmailTemplateBuilder;