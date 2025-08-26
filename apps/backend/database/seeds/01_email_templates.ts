/**
 * Seed: Email Templates
 * Creates default email templates for the email marketing system
 */

import { Knex } from 'knex';

export const environment = ['development', 'staging'];
export const priority = 1;

export async function seed(knex: Knex): Promise<void> {
  // Clear existing templates
  await knex('email_templates').del();

  // Insert default email templates
  await knex('email_templates').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Welcome Email',
      description: 'Welcome new subscribers to your community',
      subject: 'Welcome to {{company_name}}!',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to {{company_name}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to {{company_name}}!</h1>
            <p style="font-size: 18px; color: #7f8c8d;">We're thrilled to have you join our community</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hi {{first_name | 'there'}},</h2>
            <p>Thank you for subscribing to our newsletter! You're now part of a community of {{subscriber_count | '1,000+'}} like-minded individuals who are passionate about staying updated with the latest news and insights.</p>
            
            <p>Here's what you can expect from us:</p>
            <ul style="margin: 20px 0;">
              <li>Weekly updates on industry trends</li>
              <li>Exclusive content and early access to new features</li>
              <li>Tips and best practices from our experts</li>
              <li>Special offers and promotions</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{website_url}}" style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Explore Our Website</a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #7f8c8d;">
            <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
            <p style="margin-top: 20px;">
              Best regards,<br>
              The {{company_name}} Team
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #95a5a6;">
            <p>You received this email because you subscribed to {{company_name}}.</p>
            <p><a href="{{unsubscribe_url}}" style="color: #95a5a6;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #95a5a6;">Update Preferences</a></p>
          </div>
        </body>
        </html>
      `,
      text_content: `
        Welcome to {{company_name}}!
        
        Hi {{first_name | 'there'}},
        
        Thank you for subscribing to our newsletter! You're now part of a community of {{subscriber_count | '1,000+'}} like-minded individuals.
        
        Here's what you can expect from us:
        - Weekly updates on industry trends
        - Exclusive content and early access to new features
        - Tips and best practices from our experts
        - Special offers and promotions
        
        Visit our website: {{website_url}}
        
        If you have any questions, contact us at {{support_email}}.
        
        Best regards,
        The {{company_name}} Team
        
        ---
        You received this email because you subscribed to {{company_name}}.
        Unsubscribe: {{unsubscribe_url}}
        Update Preferences: {{preferences_url}}
      `,
      variables: JSON.stringify({
        company_name: { type: 'string', default: 'Our Company', description: 'Company name' },
        first_name: { type: 'string', default: 'there', description: 'Subscriber first name' },
        subscriber_count: { type: 'string', default: '1,000+', description: 'Total subscriber count' },
        website_url: { type: 'url', required: true, description: 'Main website URL' },
        support_email: { type: 'email', required: true, description: 'Support email address' },
        unsubscribe_url: { type: 'url', required: true, description: 'Unsubscribe link' },
        preferences_url: { type: 'url', required: true, description: 'Preferences center link' }
      }),
      style_config: JSON.stringify({
        colors: {
          primary: '#3498db',
          secondary: '#2c3e50',
          text: '#333333',
          muted: '#7f8c8d',
          background: '#f8f9fa'
        },
        fonts: {
          primary: 'Arial, sans-serif'
        },
        spacing: {
          padding: '20px',
          margin: '30px'
        }
      }),
      category: 'onboarding',
      provider: 'both',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Weekly Newsletter',
      description: 'Regular newsletter template with featured content',
      subject: '{{newsletter_title}} - Week of {{week_date}}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{newsletter_title}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <header style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3498db; padding-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0;">{{newsletter_title}}</h1>
            <p style="color: #7f8c8d; margin: 10px 0 0 0;">{{week_date}}</p>
          </header>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2c3e50;">Hi {{first_name | 'there'}},</h2>
            <p>{{intro_message}}</p>
          </div>
          
          {{#if featured_article}}
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">🌟 Featured This Week</h3>
            <h4 style="margin: 15px 0 10px 0;"><a href="{{featured_article.url}}" style="color: #3498db; text-decoration: none;">{{featured_article.title}}</a></h4>
            <p style="color: #7f8c8d; margin: 0;">{{featured_article.description}}</p>
            <div style="margin-top: 15px;">
              <a href="{{featured_article.url}}" style="background: #3498db; color: white; padding: 8px 20px; text-decoration: none; border-radius: 4px; font-size: 14px;">Read More</a>
            </div>
          </div>
          {{/if}}
          
          {{#if articles}}
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">Latest Articles</h3>
            {{#each articles}}
            <div style="margin: 20px 0; padding: 15px 0; border-bottom: 1px solid #ecf0f1;">
              <h4 style="margin: 0 0 8px 0;"><a href="{{url}}" style="color: #2c3e50; text-decoration: none;">{{title}}</a></h4>
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">{{description}}</p>
              <div style="margin-top: 10px;">
                <a href="{{url}}" style="color: #3498db; font-size: 14px; text-decoration: none;">Continue reading →</a>
              </div>
            </div>
            {{/each}}
          </div>
          {{/if}}
          
          {{#if upcoming_events}}
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">📅 Upcoming Events</h3>
            {{#each upcoming_events}}
            <div style="margin: 15px 0;">
              <strong>{{name}}</strong> - {{date}}<br>
              <span style="color: #7f8c8d; font-size: 14px;">{{description}}</span>
              {{#if url}}<br><a href="{{url}}" style="color: #3498db; font-size: 14px;">Learn more</a>{{/if}}
            </div>
            {{/each}}
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #7f8c8d;">That's all for this week! Have a great week ahead.</p>
            <div style="margin-top: 20px;">
              <a href="{{website_url}}" style="color: #3498db; margin: 0 10px;">Visit Website</a>
              <a href="{{archive_url}}" style="color: #3498db; margin: 0 10px;">Newsletter Archive</a>
            </div>
          </div>
          
          <footer style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #95a5a6; text-align: center;">
            <p>{{company_name}} | {{company_address}}</p>
            <p><a href="{{unsubscribe_url}}" style="color: #95a5a6;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #95a5a6;">Update Preferences</a></p>
          </footer>
        </body>
        </html>
      `,
      text_content: `
        {{newsletter_title}} - {{week_date}}
        
        Hi {{first_name | 'there'}},
        
        {{intro_message}}
        
        {{#if featured_article}}
        🌟 FEATURED THIS WEEK
        {{featured_article.title}}
        {{featured_article.description}}
        Read more: {{featured_article.url}}
        {{/if}}
        
        {{#if articles}}
        LATEST ARTICLES
        {{#each articles}}
        - {{title}}: {{url}}
          {{description}}
        {{/each}}
        {{/if}}
        
        {{#if upcoming_events}}
        📅 UPCOMING EVENTS
        {{#each upcoming_events}}
        - {{name}} - {{date}}
          {{description}}
          {{#if url}}{{url}}{{/if}}
        {{/each}}
        {{/if}}
        
        That's all for this week! Have a great week ahead.
        
        {{company_name}} | {{company_address}}
        
        Unsubscribe: {{unsubscribe_url}}
        Update Preferences: {{preferences_url}}
      `,
      variables: JSON.stringify({
        newsletter_title: { type: 'string', default: 'Weekly Update', description: 'Newsletter title' },
        week_date: { type: 'string', required: true, description: 'Week date range' },
        first_name: { type: 'string', default: 'there', description: 'Subscriber first name' },
        intro_message: { type: 'text', required: true, description: 'Weekly introduction message' },
        featured_article: { type: 'object', description: 'Featured article with title, description, url' },
        articles: { type: 'array', description: 'Array of articles with title, description, url' },
        upcoming_events: { type: 'array', description: 'Array of events with name, date, description, url' },
        company_name: { type: 'string', required: true, description: 'Company name' },
        company_address: { type: 'string', description: 'Company address' },
        website_url: { type: 'url', required: true, description: 'Website URL' },
        archive_url: { type: 'url', description: 'Newsletter archive URL' },
        unsubscribe_url: { type: 'url', required: true, description: 'Unsubscribe URL' },
        preferences_url: { type: 'url', required: true, description: 'Preferences URL' }
      }),
      category: 'newsletter',
      provider: 'both',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Product Announcement',
      description: 'Template for announcing new products or features',
      subject: '🚀 Introducing {{product_name}}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Introducing {{product_name}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">🚀 Big News!</h1>
            <h2 style="margin: 0; font-weight: normal; opacity: 0.9;">Introducing {{product_name}}</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50;">Hi {{first_name | 'there'}},</h3>
            <p style="font-size: 16px;">{{announcement_message}}</p>
          </div>
          
          {{#if product_image}}
          <div style="text-align: center; margin: 30px 0;">
            <img src="{{product_image}}" alt="{{product_name}}" style="max-width: 100%; height: auto; border-radius: 8px;">
          </div>
          {{/if}}
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">What makes {{product_name}} special?</h3>
            {{#if features}}
            <ul style="margin: 20px 0; padding-left: 20px;">
              {{#each features}}
              <li style="margin: 10px 0;">{{this}}</li>
              {{/each}}
            </ul>
            {{/if}}
            
            {{#if benefits}}
            <div style="margin-top: 25px;">
              <h4 style="color: #2c3e50;">Key Benefits:</h4>
              {{#each benefits}}
              <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                <strong>{{title}}</strong><br>
                <span style="color: #7f8c8d;">{{description}}</span>
              </div>
              {{/each}}
            </div>
            {{/if}}
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            {{#if cta_button}}
            <a href="{{cta_button.url}}" style="background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block; margin-bottom: 20px;">{{cta_button.text}}</a>
            {{/if}}
            
            {{#if secondary_cta}}
            <div style="margin-top: 15px;">
              <a href="{{secondary_cta.url}}" style="color: #3498db; text-decoration: none;">{{secondary_cta.text}} →</a>
            </div>
            {{/if}}
          </div>
          
          {{#if pricing}}
          <div style="background: #e8f4f8; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0; text-align: center;">Special Launch Pricing</h3>
            <div style="text-align: center;">
              {{#if pricing.discount}}
              <p style="font-size: 24px; color: #e74c3c; margin: 10px 0;"><s>{{pricing.original}}</s> <strong>{{pricing.discounted}}</strong></p>
              <p style="color: #7f8c8d;">Save {{pricing.discount}}% for a limited time!</p>
              {{else}}
              <p style="font-size: 24px; color: #2c3e50; margin: 10px 0;"><strong>{{pricing.price}}</strong></p>
              {{/if}}
            </div>
          </div>
          {{/if}}
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #7f8c8d;">
            <p>We're excited to see how {{product_name}} helps you achieve your goals. If you have any questions, don't hesitate to reach out!</p>
            <p style="margin-top: 20px;">
              Best regards,<br>
              The {{company_name}} Team
            </p>
          </div>
          
          <footer style="text-align: center; margin-top: 30px; font-size: 12px; color: #95a5a6;">
            <p>{{company_name}} | Follow us on <a href="{{social_links.twitter}}" style="color: #95a5a6;">Twitter</a></p>
            <p><a href="{{unsubscribe_url}}" style="color: #95a5a6;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #95a5a6;">Update Preferences</a></p>
          </footer>
        </body>
        </html>
      `,
      text_content: `
        🚀 Introducing {{product_name}}
        
        Hi {{first_name | 'there'}},
        
        {{announcement_message}}
        
        What makes {{product_name}} special?
        {{#if features}}
        {{#each features}}
        - {{this}}
        {{/each}}
        {{/if}}
        
        {{#if benefits}}
        Key Benefits:
        {{#each benefits}}
        - {{title}}: {{description}}
        {{/each}}
        {{/if}}
        
        {{#if cta_button}}
        {{cta_button.text}}: {{cta_button.url}}
        {{/if}}
        
        {{#if pricing}}
        Special Launch Pricing:
        {{#if pricing.discount}}
        Was {{pricing.original}}, now {{pricing.discounted}} (Save {{pricing.discount}}%)
        {{else}}
        {{pricing.price}}
        {{/if}}
        {{/if}}
        
        We're excited to see how {{product_name}} helps you achieve your goals!
        
        Best regards,
        The {{company_name}} Team
        
        {{company_name}} | Twitter: {{social_links.twitter}}
        
        Unsubscribe: {{unsubscribe_url}}
        Update Preferences: {{preferences_url}}
      `,
      variables: JSON.stringify({
        product_name: { type: 'string', required: true, description: 'Product name' },
        first_name: { type: 'string', default: 'there', description: 'Subscriber first name' },
        announcement_message: { type: 'text', required: true, description: 'Main announcement message' },
        product_image: { type: 'url', description: 'Product image URL' },
        features: { type: 'array', description: 'Array of product features' },
        benefits: { type: 'array', description: 'Array of benefit objects with title and description' },
        cta_button: { type: 'object', description: 'Primary CTA with text and url' },
        secondary_cta: { type: 'object', description: 'Secondary CTA with text and url' },
        pricing: { type: 'object', description: 'Pricing information with price, original, discounted, discount' },
        company_name: { type: 'string', required: true, description: 'Company name' },
        social_links: { type: 'object', description: 'Social media links' },
        unsubscribe_url: { type: 'url', required: true, description: 'Unsubscribe URL' },
        preferences_url: { type: 'url', required: true, description: 'Preferences URL' }
      }),
      category: 'product',
      provider: 'both',
      is_active: true
    }
  ]);

  console.log('Email templates seeded successfully');
}