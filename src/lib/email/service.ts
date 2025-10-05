/**
 * Email Service
 *
 * Main email service with provider factory and simplified interface
 */

import { IEmailProvider, EmailProvider, SendEmailOptions, EmailSendResponse, EmailHealthStatus } from './types';
import { ResendProvider } from './providers/resend';
import { getProviderConfig, getActiveProvider, isEmailConfigured } from './config';

// Singleton instance
let emailServiceInstance: EmailService | null = null;

/**
 * Email Service Class
 */
export class EmailService {
  private provider: IEmailProvider;

  constructor(provider?: IEmailProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      // Auto-detect and create provider
      const activeProvider = getActiveProvider();
      this.provider = createEmailProvider(activeProvider);
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResponse> {
    // Validate email addresses
    const validation = this.validateEmailOptions(options);
    if (!validation.valid) {
      return {
        success: false,
        error: `Email validation failed: ${validation.errors.join(', ')}`,
        provider: this.provider.provider,
      };
    }

    try {
      const response = await this.provider.sendEmail(options);

      // Log send attempt
      if (response.success) {
        console.log('[Email Service] Email sent successfully:', {
          to: this.formatToString(options.to),
          subject: options.subject,
          messageId: response.messageId,
          provider: response.provider,
          category: options.category,
        });
      } else {
        console.error('[Email Service] Email send failed:', {
          to: this.formatToString(options.to),
          subject: options.subject,
          error: response.error,
          provider: response.provider,
        });
      }

      return response;
    } catch (error) {
      console.error('[Email Service] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.provider.provider,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<EmailHealthStatus> {
    return this.provider.healthCheck();
  }

  /**
   * Verify domain authentication
   */
  async verifyDomain(domain?: string) {
    if (this.provider.verifyDomain) {
      return this.provider.verifyDomain(domain);
    }

    throw new Error('Domain verification not supported by this provider');
  }

  /**
   * Get provider name
   */
  getProviderName(): EmailProvider {
    return this.provider.provider;
  }

  /**
   * Validate email options
   */
  private validateEmailOptions(options: SendEmailOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!options.to) {
      errors.push('Recipient (to) is required');
    }

    if (!options.subject || options.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!options.html || options.html.trim().length === 0) {
      errors.push('HTML content is required');
    }

    // Validate email addresses
    if (options.to) {
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      for (const addr of toAddresses) {
        const email = typeof addr === 'string' ? addr : addr.email;
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid recipient email: ${email}`);
        }
      }
    }

    if (options.from) {
      const fromEmail = typeof options.from === 'string' ? options.from : options.from.email;
      if (!this.isValidEmail(fromEmail)) {
        errors.push(`Invalid from email: ${fromEmail}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format to addresses for logging
   */
  private formatToString(to: SendEmailOptions['to']): string {
    if (Array.isArray(to)) {
      return to.map(addr => typeof addr === 'string' ? addr : addr.email).join(', ');
    }
    return typeof to === 'string' ? to : to.email;
  }
}

/**
 * Create email provider instance
 */
export function createEmailProvider(provider?: EmailProvider): IEmailProvider {
  const selectedProvider = provider || getActiveProvider();
  const config = getProviderConfig(selectedProvider);

  switch (selectedProvider) {
    case 'resend':
      return new ResendProvider(config);

    case 'sendgrid':
      // TODO: Implement SendGrid provider
      throw new Error('SendGrid provider not yet implemented. Use Resend instead.');

    default:
      throw new Error(`Unsupported email provider: ${selectedProvider}`);
  }
}

/**
 * Get singleton email service instance
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}

/**
 * Simplified email sending function
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResponse> {
  const service = getEmailService();
  return service.sendEmail(options);
}

/**
 * Check email service health
 */
export async function checkEmailHealth(): Promise<EmailHealthStatus> {
  if (!isEmailConfigured()) {
    return {
      healthy: false,
      provider: getActiveProvider(),
      error: 'Email service not configured',
      timestamp: new Date(),
    };
  }

  const service = getEmailService();
  return service.healthCheck();
}

/**
 * Verify domain authentication
 */
export async function verifyEmailDomain(domain?: string) {
  const service = getEmailService();
  return service.verifyDomain(domain);
}

// Export everything from types
export * from './types';
export * from './config';
