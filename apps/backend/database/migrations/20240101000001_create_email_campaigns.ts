/**
 * Migration: Create email campaigns tables
 * Creates tables for email marketing campaigns, templates, and subscribers
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Email templates table
  await knex.schema.createTable('email_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.string('subject').notNullable();
    table.text('html_content').notNullable();
    table.text('text_content');
    table.json('variables'); // Template variables
    table.json('style_config'); // Template styling
    table.string('category').defaultTo('general');
    table.string('provider').checkIn(['sendgrid', 'mailchimp', 'both']).defaultTo('both');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['category', 'is_active']);
    table.index('provider');
  });

  // Email subscribers table
  await knex.schema.createTable('email_subscribers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('first_name');
    table.string('last_name');
    table.json('custom_fields'); // Additional subscriber data
    table.json('tags'); // Subscriber tags
    table.json('segments'); // Segment IDs
    table.string('status').checkIn(['subscribed', 'unsubscribed', 'pending', 'bounced']).defaultTo('pending');
    table.string('source').defaultTo('website'); // How they subscribed
    table.string('language').defaultTo('en');
    table.string('timezone');
    table.timestamp('subscribed_at');
    table.timestamp('unsubscribed_at');
    table.timestamp('last_activity');
    table.json('provider_data'); // Provider-specific data (SendGrid/MailChimp IDs)
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('email');
    table.index(['status', 'subscribed_at']);
    table.index('source');
  });

  // Email campaigns table
  await knex.schema.createTable('email_campaigns', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('template_id').references('id').inTable('email_templates').onDelete('SET NULL');
    table.string('subject').notNullable();
    table.text('html_content').notNullable();
    table.text('text_content');
    table.string('from_name').notNullable();
    table.string('from_email').notNullable();
    table.string('reply_to');
    table.json('recipient_segments'); // Segment conditions
    table.json('recipient_lists'); // Explicit recipient lists
    table.string('provider').checkIn(['sendgrid', 'mailchimp', 'both']).defaultTo('both');
    table.string('status').checkIn(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled']).defaultTo('draft');
    table.timestamp('scheduled_at');
    table.timestamp('sent_at');
    table.json('provider_campaign_ids'); // Campaign IDs from providers
    table.integer('total_recipients').defaultTo(0);
    table.integer('sent_count').defaultTo(0);
    table.integer('delivered_count').defaultTo(0);
    table.integer('opened_count').defaultTo(0);
    table.integer('clicked_count').defaultTo(0);
    table.integer('bounced_count').defaultTo(0);
    table.integer('unsubscribed_count').defaultTo(0);
    table.decimal('open_rate', 5, 2).defaultTo(0);
    table.decimal('click_rate', 5, 2).defaultTo(0);
    table.json('ab_test_config'); // A/B testing configuration
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['status', 'scheduled_at']);
    table.index('provider');
    table.index('template_id');
  });

  // Email automation workflows table
  await knex.schema.createTable('email_workflows', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.json('trigger_config'); // Trigger conditions and settings
    table.json('steps'); // Workflow steps configuration
    table.string('provider').checkIn(['sendgrid', 'mailchimp', 'both']).defaultTo('both');
    table.boolean('is_active').defaultTo(false);
    table.integer('triggered_count').defaultTo(0);
    table.integer('completed_count').defaultTo(0);
    table.integer('failed_count').defaultTo(0);
    table.decimal('completion_rate', 5, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['is_active', 'provider']);
  });

  // Workflow executions table
  await knex.schema.createTable('workflow_executions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('workflow_id').references('id').inTable('email_workflows').onDelete('CASCADE');
    table.uuid('subscriber_id').references('id').inTable('email_subscribers').onDelete('CASCADE');
    table.json('subscriber_data'); // Snapshot of subscriber data at trigger time
    table.string('current_step_id');
    table.string('status').checkIn(['pending', 'running', 'completed', 'failed', 'paused']).defaultTo('pending');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.timestamp('scheduled_at');
    table.json('execution_log'); // Step-by-step execution log
    table.text('error_message');
    table.json('variables'); // Runtime variables
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['workflow_id', 'status']);
    table.index(['subscriber_id', 'status']);
    table.index('scheduled_at');
  });

  // Email preferences table
  await knex.schema.createTable('email_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('subscriber_id').references('id').inTable('email_subscribers').onDelete('CASCADE');
    table.string('category').notNullable(); // newsletter, promotions, etc.
    table.boolean('subscribed').defaultTo(true);
    table.string('frequency').checkIn(['immediate', 'daily', 'weekly', 'monthly', 'never']).defaultTo('weekly');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['subscriber_id', 'category']);
    table.index(['category', 'subscribed']);
  });

  // Unsubscribe requests table
  await knex.schema.createTable('unsubscribe_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('subscriber_email').notNullable();
    table.uuid('campaign_id').references('id').inTable('email_campaigns').onDelete('SET NULL');
    table.string('method').checkIn(['link_click', 'email_reply', 'manual', 'api', 'bounce', 'spam_complaint']).notNullable();
    table.text('reason');
    table.json('categories'); // Partial unsubscribe from specific categories
    table.string('ip_address');
    table.text('user_agent');
    table.string('provider').checkIn(['sendgrid', 'mailchimp', 'both']).defaultTo('both');
    table.boolean('processed').defaultTo(false);
    table.timestamp('processed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['subscriber_email', 'processed']);
    table.index(['campaign_id', 'method']);
  });

  // Email analytics events table
  await knex.schema.createTable('email_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('campaign_id').references('id').inTable('email_campaigns').onDelete('CASCADE');
    table.string('subscriber_email').notNullable();
    table.string('event_type').checkIn(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'spam_report']).notNullable();
    table.string('provider').checkIn(['sendgrid', 'mailchimp']).notNullable();
    table.string('provider_event_id'); // Provider's unique event ID
    table.json('event_data'); // Additional event data from provider
    table.string('url'); // For click events
    table.string('user_agent');
    table.string('ip_address');
    table.string('device_type');
    table.string('email_client');
    table.timestamp('occurred_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['campaign_id', 'event_type']);
    table.index(['subscriber_email', 'event_type']);
    table.index(['provider', 'provider_event_id']);
    table.index('occurred_at');
  });

  console.log('Email marketing tables created successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('email_events');
  await knex.schema.dropTableIfExists('unsubscribe_requests');
  await knex.schema.dropTableIfExists('email_preferences');
  await knex.schema.dropTableIfExists('workflow_executions');
  await knex.schema.dropTableIfExists('email_workflows');
  await knex.schema.dropTableIfExists('email_campaigns');
  await knex.schema.dropTableIfExists('email_subscribers');
  await knex.schema.dropTableIfExists('email_templates');
  
  console.log('Email marketing tables dropped successfully');
}