/**
 * Email-related types for SendGrid integration
 */

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  plainTextContent?: string
  variables: EmailVariable[]
}

export interface EmailVariable {
  name: string
  description: string
  defaultValue?: string
  required: boolean
}

export interface EmailContact {
  email: string
  firstName?: string
  lastName?: string
  customFields?: Record<string, any>
}

export interface NewsletterSubscription {
  email: string
  firstName?: string
  lastName?: string
  preferences: string[]
  source: string
  subscribedAt: Date
}

export interface ContactFormSubmission {
  name: string
  email: string
  subject?: string
  message: string
  phone?: string
  company?: string
  metadata?: Record<string, any>
  submittedAt: Date
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  templateId: string
  listIds: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduledAt?: Date
  sentAt?: Date
  stats?: EmailStats
}

export interface EmailStats {
  delivered: number
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
  spamReports: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
}

export interface SendEmailRequest {
  to: string | string[]
  from?: string
  subject: string
  text?: string
  html?: string
  templateId?: string
  templateData?: Record<string, any>
  attachments?: EmailAttachment[]
  categories?: string[]
  customArgs?: Record<string, string>
}

export interface EmailAttachment {
  content: string // base64 encoded
  filename: string
  type: string
  disposition?: 'attachment' | 'inline'
  contentId?: string
}

export interface EmailEvent {
  email: string
  timestamp: number
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe'
  sg_message_id: string
  category?: string[]
  url?: string
  reason?: string
  status?: string
  response?: string
  attempt?: string
  useragent?: string
  ip?: string
  url_offset?: {
    index: number
    type: string
  }
}

export interface EmailList {
  id: string
  name: string
  contactCount: number
  createdAt: Date
  updatedAt: Date
}

export interface EmailProvider {
  sendEmail(request: SendEmailRequest): Promise<{ messageId: string }>
  addToList(listId: string, contact: EmailContact): Promise<void>
  removeFromList(listId: string, email: string): Promise<void>
  createList(name: string): Promise<EmailList>
  getList(listId: string): Promise<EmailList>
  getListContacts(listId: string): Promise<EmailContact[]>
  sendCampaign(campaign: EmailCampaign): Promise<{ campaignId: string }>
  getCampaignStats(campaignId: string): Promise<EmailStats>
}

export interface EmailService {
  // Newsletter
  subscribeToNewsletter(email: string, preferences?: string[]): Promise<void>
  unsubscribeFromNewsletter(email: string): Promise<void>
  sendNewsletterWelcome(email: string, name?: string): Promise<void>
  
  // Contact forms
  processContactForm(submission: ContactFormSubmission): Promise<void>
  sendContactConfirmation(email: string, name: string): Promise<void>
  
  // Transactional emails
  sendPasswordReset(email: string, resetToken: string): Promise<void>
  sendAccountVerification(email: string, verificationToken: string): Promise<void>
  sendOrderConfirmation(email: string, orderDetails: any): Promise<void>
  
  // Marketing campaigns
  createCampaign(campaign: Omit<EmailCampaign, 'id' | 'stats'>): Promise<EmailCampaign>
  scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<void>
  sendCampaign(campaignId: string): Promise<void>
  
  // Analytics
  getEmailStats(campaignId: string): Promise<EmailStats>
  processWebhookEvent(event: EmailEvent): Promise<void>
}