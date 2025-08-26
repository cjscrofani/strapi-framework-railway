import axios from 'axios';

interface DomainAuthenticationStatus {
  domain: string;
  isAuthenticated: boolean;
  dnsTxtRecord?: string;
  dnsStatus?: 'valid' | 'invalid' | 'pending';
  verificationKey?: string;
  lastChecked: Date;
}

interface SendGridDomainInfo {
  id: number;
  domain: string;
  subdomain: string;
  username: string;
  user_id: number;
  ips: string[];
  custom_link: boolean;
  default: boolean;
  legacy: boolean;
  automatic_security: boolean;
  valid: boolean;
  dns: {
    mail_cname: {
      valid: boolean;
      type: string;
      host: string;
      data: string;
    };
    mail_server: {
      valid: boolean;
      type: string;
      host: string;
      data: string;
    };
    subdomain_spf: {
      valid: boolean;
      type: string;
      host: string;
      data: string;
    };
    domain_spf: {
      valid: boolean;
      type: string;
      host: string;
      data: string;
    };
    dkim: {
      valid: boolean;
      type: string;
      host: string;
      data: string;
    };
  };
}

class SendGridDomainService {
  private apiKey: string;
  private apiUrl = 'https://api.sendgrid.com/v3';

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    if (!this.apiKey) {
      strapi.log.warn('SendGrid API key not found. Domain services will not work.');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: any) {
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error) {
      strapi.log.error('SendGrid API error:', error.response?.data || error.message);
      throw new Error(`SendGrid API error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async getDomainAuthentications(): Promise<SendGridDomainInfo[]> {
    try {
      const response = await this.makeRequest('/whitelabel/domains');
      return response;
    } catch (error) {
      strapi.log.error('Failed to get domain authentications:', error);
      return [];
    }
  }

  async createDomainAuthentication(domain: string, subdomain?: string): Promise<SendGridDomainInfo> {
    const payload = {
      domain,
      subdomain: subdomain || 'em',
      automatic_security: true,
      custom_link: false,
      default: true,
    };

    try {
      const response = await this.makeRequest('/whitelabel/domains', 'POST', payload);
      strapi.log.info(`Domain authentication created for: ${domain}`);
      return response;
    } catch (error) {
      strapi.log.error(`Failed to create domain authentication for ${domain}:`, error);
      throw error;
    }
  }

  async validateDomainAuthentication(domainId: number): Promise<SendGridDomainInfo> {
    try {
      const response = await this.makeRequest(`/whitelabel/domains/${domainId}/validate`, 'POST');
      strapi.log.info(`Domain validation attempted for ID: ${domainId}`);
      return response;
    } catch (error) {
      strapi.log.error(`Failed to validate domain ${domainId}:`, error);
      throw error;
    }
  }

  async getDomainStatus(domain: string): Promise<DomainAuthenticationStatus> {
    try {
      const domains = await this.getDomainAuthentications();
      const domainInfo = domains.find(d => d.domain === domain);

      if (!domainInfo) {
        return {
          domain,
          isAuthenticated: false,
          lastChecked: new Date(),
        };
      }

      return {
        domain: domainInfo.domain,
        isAuthenticated: domainInfo.valid,
        dnsStatus: domainInfo.valid ? 'valid' : 'invalid',
        lastChecked: new Date(),
      };
    } catch (error) {
      strapi.log.error(`Failed to get domain status for ${domain}:`, error);
      return {
        domain,
        isAuthenticated: false,
        dnsStatus: 'invalid',
        lastChecked: new Date(),
      };
    }
  }

  async getSenderVerifications(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/verified_senders');
      return response.results || [];
    } catch (error) {
      strapi.log.error('Failed to get sender verifications:', error);
      return [];
    }
  }

  async createSenderVerification(email: string, nickname?: string): Promise<any> {
    const payload = {
      nickname: nickname || email.split('@')[0],
      from_email: email,
      from_name: process.env.SENDGRID_FROM_NAME || 'Strapi App',
      reply_to: email,
      address: process.env.COMPANY_ADDRESS || 'Your Company Address',
      city: process.env.COMPANY_CITY || 'Your City',
      state: process.env.COMPANY_STATE || 'Your State',
      zip: process.env.COMPANY_ZIP || '12345',
      country: process.env.COMPANY_COUNTRY || 'US',
    };

    try {
      const response = await this.makeRequest('/verified_senders', 'POST', payload);
      strapi.log.info(`Sender verification created for: ${email}`);
      return response;
    } catch (error) {
      strapi.log.error(`Failed to create sender verification for ${email}:`, error);
      throw error;
    }
  }

  async resendSenderVerification(senderId: number): Promise<void> {
    try {
      await this.makeRequest(`/verified_senders/${senderId}/resend`, 'POST');
      strapi.log.info(`Sender verification email resent for ID: ${senderId}`);
    } catch (error) {
      strapi.log.error(`Failed to resend sender verification for ${senderId}:`, error);
      throw error;
    }
  }

  generateDNSInstructions(domainInfo: SendGridDomainInfo): string {
    const instructions = [];
    
    instructions.push('=== DNS CONFIGURATION REQUIRED ===');
    instructions.push(`Domain: ${domainInfo.domain}`);
    instructions.push('');
    instructions.push('Add the following DNS records to your domain:');
    instructions.push('');

    // Mail CNAME record
    if (domainInfo.dns.mail_cname) {
      instructions.push('1. MAIL CNAME RECORD:');
      instructions.push(`   Type: ${domainInfo.dns.mail_cname.type}`);
      instructions.push(`   Host: ${domainInfo.dns.mail_cname.host}`);
      instructions.push(`   Points to: ${domainInfo.dns.mail_cname.data}`);
      instructions.push('');
    }

    // SPF Record for subdomain
    if (domainInfo.dns.subdomain_spf) {
      instructions.push('2. SUBDOMAIN SPF RECORD:');
      instructions.push(`   Type: ${domainInfo.dns.subdomain_spf.type}`);
      instructions.push(`   Host: ${domainInfo.dns.subdomain_spf.host}`);
      instructions.push(`   Value: ${domainInfo.dns.subdomain_spf.data}`);
      instructions.push('');
    }

    // DKIM Record
    if (domainInfo.dns.dkim) {
      instructions.push('3. DKIM RECORD:');
      instructions.push(`   Type: ${domainInfo.dns.dkim.type}`);
      instructions.push(`   Host: ${domainInfo.dns.dkim.host}`);
      instructions.push(`   Value: ${domainInfo.dns.dkim.data}`);
      instructions.push('');
    }

    // Main domain SPF record
    if (domainInfo.dns.domain_spf) {
      instructions.push('4. DOMAIN SPF RECORD (if not already present):');
      instructions.push(`   Type: ${domainInfo.dns.domain_spf.type}`);
      instructions.push(`   Host: ${domainInfo.dns.domain_spf.host}`);
      instructions.push(`   Value: ${domainInfo.dns.domain_spf.data}`);
      instructions.push('');
    }

    instructions.push('After adding these records, wait up to 48 hours for DNS propagation,');
    instructions.push('then run domain validation to complete the setup.');
    
    return instructions.join('\n');
  }

  async setupDomainForProduction(domain: string): Promise<{
    success: boolean;
    domainInfo?: SendGridDomainInfo;
    instructions?: string;
    error?: string;
  }> {
    try {
      // Check if domain already exists
      const existingDomains = await this.getDomainAuthentications();
      let domainInfo = existingDomains.find(d => d.domain === domain);

      if (!domainInfo) {
        // Create new domain authentication
        domainInfo = await this.createDomainAuthentication(domain);
      }

      const instructions = this.generateDNSInstructions(domainInfo);

      return {
        success: true,
        domainInfo,
        instructions,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkAllDomainStatuses(): Promise<DomainAuthenticationStatus[]> {
    try {
      const domains = await this.getDomainAuthentications();
      const statuses = [];

      for (const domain of domains) {
        const status = await this.getDomainStatus(domain.domain);
        statuses.push(status);
      }

      return statuses;
    } catch (error) {
      strapi.log.error('Failed to check domain statuses:', error);
      return [];
    }
  }
}

export default new SendGridDomainService();