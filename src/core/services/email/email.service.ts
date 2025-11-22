import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

/**
 * Email service interface for sending emails
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * SMTP email service for sending transactional emails
 * Uses nodemailer for email delivery
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter with SMTP configuration
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.smtpHost,
      port: this.configService.smtpPort,
      secure: this.configService.smtpSecure, // true for 465, false for other ports
      auth: {
        user: this.configService.smtpUser,
        pass: this.configService.smtpPassword,
      },
    });
  }

  /**
   * Send email using nodemailer
   * @param options - Email options (to, subject, html, text)
   * @returns Promise resolving to sent message info
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.configService.smtpFromName} <${this.configService.smtpFromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   * @param email - User email address
   * @param name - User full name
   * @param referralCode - User referral code (nullable)
   */
  async sendWelcomeEmail(email: string, name: string, referralCode: string | null): Promise<void> {
    const html = this.emailTemplateService.getWelcomeTemplate(name, referralCode || '');
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Rangers FX',
      html,
    });
  }

  /**
   * Send password reset email
   * @param email - User email address
   * @param name - User full name
   * @param resetToken - Password reset token
   */
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.appUrl}/auth/reset-password?token=${resetToken}`;
    const html = this.emailTemplateService.getPasswordResetTemplate(name, resetUrl);
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Rangers FX',
      html,
    });
  }

  /**
   * Send email verification OTP
   * @param email - User email address
   * @param name - User full name
   * @param otp - Verification OTP code
   */
  async sendVerificationEmail(email: string, name: string, otp: string): Promise<void> {
    try {
      const html = this.emailTemplateService.getVerificationTemplate(name, otp);
      await this.sendEmail({
        to: email,
        subject: 'Verify Your Email - Rangers FX',
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  /**
   * Strip HTML tags from HTML string to create plain text version
   * @param html - HTML string
   * @returns Plain text string
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
