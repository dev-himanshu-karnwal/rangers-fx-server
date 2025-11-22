import { Injectable } from '@nestjs/common';

/**
 * Email template service for generating HTML email templates
 * Centralizes email template logic for maintainability
 */
@Injectable()
export class EmailTemplateService {
  /**
   * Get welcome email template
   * @param name - User's full name
   * @param referralCode - User's referral code
   * @returns HTML email template
   */
  getWelcomeTemplate(name: string, referralCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Rangers FX</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">Welcome to Rangers FX!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${name},</p>
          <p>Thank you for joining Rangers FX! We're excited to have you on board.</p>
          <p>Your account has been successfully created. Here are your account details:</p>
          <div style="background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0;"><strong>Your Referral Code:</strong></p>
            <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0;">${referralCode}</p>
          </div>
          <p>You can use this referral code to invite others and earn rewards.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Rangers FX Team</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   * @param name - User's full name
   * @param resetUrl - Password reset URL with token
   * @returns HTML email template
   */
  getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Rangers FX Team</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email verification template
   * @param name - User's full name
   * @param otp - Verification OTP code
   * @returns HTML email template
   */
  getVerificationTemplate(name: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${name},</p>
          <p>Please use the following code to verify your email address:</p>
          <div style="background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border-left: 4px solid #667eea;">
            <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 5px;">${otp}</p>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Rangers FX Team</p>
        </div>
      </body>
      </html>
    `;
  }
}
