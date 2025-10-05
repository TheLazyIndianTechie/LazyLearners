/**
 * Resend Email Provider Implementation
 *
 * Official Resend SDK integration for email delivery
 */

import { Resend } from 'resend';
import {
  IEmailProvider,
  EmailProvider,
  SendEmailOptions,
  EmailSendResponse,
  EmailHealthStatus,
  EmailProviderConfig,
  EmailAddress,
} from '../types';

export class ResendProvider implements IEmailProvider {
  readonly provider: EmailProvider = 'resend';
  private client: Resend;
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
    this.client = new Resend(config.apiKey);
  }

  /**
   * Send an email via Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResponse> {
    try {
      // Validate required fields
      if (!options.to || !options.subject || !options.html) {
        return {
          success: false,
          error: 'Missing required fields: to, subject, or html',
          provider: this.provider,
        };
      }

      // Dry run mode - don't actually send
      if (this.config.dryRun) {
        console.log('[Resend DRY RUN] Email would be sent:', {
          to: this.formatEmailAddress(options.to),
          subject: options.subject,
          category: options.category,
          correlationId: options.correlationId,
        });

        return {
          success: true,
          messageId: `dry-run-${Date.now()}`,
          provider: this.provider,
        };
      }

      // Format email addresses
      const from = options.from || {
        email: this.config.fromEmail,
        name: this.config.fromName || 'LazyGameDevs',
      };

      const replyTo =
        options.replyTo || this.config.replyToEmail
          ? {
              email:
                typeof options.replyTo === 'string'
                  ? options.replyTo
                  : options.replyTo?.email || this.config.replyToEmail!,
              name:
                typeof options.replyTo === 'object'
                  ? options.replyTo.name
                  : undefined,
            }
          : undefined;

      // Build tags for Resend
      const tags: Array<{ name: string; value: string }> = [];

      if (options.category) {
        tags.push({ name: 'category', value: options.category });
      }

      if (options.correlationId) {
        tags.push({ name: 'correlation_id', value: options.correlationId });
      }

      if (options.tags) {
        tags.push(...options.tags);
      }

      // Build headers
      const headers: Record<string, string> = {
        'X-Entity-Ref-ID': options.correlationId || `email-${Date.now()}`,
        ...options.headers,
      };

      // Add List-Unsubscribe headers for compliance
      if (options.category !== 'transactional.general') {
        // TODO: Generate unsubscribe URL from preference management system
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=TODO`;
        headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }

      // Send via Resend
      const response = await this.client.emails.send({
        from: this.formatEmailAddressString(from),
        to: this.formatToAddresses(options.to),
        cc: options.cc ? this.formatToAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatToAddresses(options.bcc) : undefined,
        replyTo: replyTo ? this.formatEmailAddressString(replyTo) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          path: att.path,
        })),
        tags,
        headers,
      });

      // Check for errors in response
      if ('error' in response && response.error) {
        return {
          success: false,
          error: response.error.message || 'Unknown Resend error',
          provider: this.provider,
        };
      }

      return {
        success: true,
        messageId: response.data?.id || response.id,
        provider: this.provider,
      };
    } catch (error) {
      console.error('[Resend] Error sending email:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        provider: this.provider,
      };
    }
  }

  /**
   * Health check for Resend service
   */
  async healthCheck(): Promise<EmailHealthStatus> {
    const startTime = Date.now();

    try {
      // Try to verify API key by checking domains
      // Resend will return 401 if API key is invalid
      await this.client.domains.list();

      const latency = Date.now() - startTime;

      return {
        healthy: true,
        provider: this.provider,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        healthy: false,
        provider: this.provider,
        latency,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify domain authentication (SPF, DKIM, DMARC)
   */
  async verifyDomain(
    domain?: string
  ): Promise<{
    verified: boolean;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  }> {
    try {
      const domains = await this.client.domains.list();

      if (!domains.data || domains.data.length === 0) {
        return {
          verified: false,
          spf: false,
          dkim: false,
          dmarc: false,
        };
      }

      // Find the domain or use the first one
      const targetDomain = domain
        ? domains.data.find((d) => d.name === domain)
        : domains.data[0];

      if (!targetDomain) {
        return {
          verified: false,
          spf: false,
          dkim: false,
          dmarc: false,
        };
      }

      // Get detailed domain info
      const domainDetails = await this.client.domains.get(targetDomain.id);

      const records = domainDetails.data?.records || [];

      const spf = records.some((r) => r.record === 'SPF' && r.status === 'verified');
      const dkim = records.some((r) => r.record === 'DKIM' && r.status === 'verified');
      const dmarc = records.some((r) => r.record === 'DMARC' && r.status === 'verified');

      return {
        verified: targetDomain.status === 'verified',
        spf,
        dkim,
        dmarc,
      };
    } catch (error) {
      console.error('[Resend] Error verifying domain:', error);

      return {
        verified: false,
        spf: false,
        dkim: false,
        dmarc: false,
      };
    }
  }

  /**
   * Format email address to Resend format
   */
  private formatEmailAddressString(
    address: string | EmailAddress
  ): string {
    if (typeof address === 'string') {
      return address;
    }

    if (address.name) {
      return `${address.name} <${address.email}>`;
    }

    return address.email;
  }

  /**
   * Format to addresses (can be single or array)
   */
  private formatToAddresses(
    addresses: string | EmailAddress | Array<string | EmailAddress>
  ): string | string[] {
    if (Array.isArray(addresses)) {
      return addresses.map((addr) => this.formatEmailAddressString(addr));
    }

    return this.formatEmailAddressString(addresses);
  }

  /**
   * Format email address for logging
   */
  private formatEmailAddress(
    address: string | EmailAddress | Array<string | EmailAddress>
  ): string {
    if (Array.isArray(address)) {
      return address.map((a) => this.formatEmailAddress(a)).join(', ');
    }

    if (typeof address === 'string') {
      return address;
    }

    return address.name ? `${address.name} <${address.email}>` : address.email;
  }
}
