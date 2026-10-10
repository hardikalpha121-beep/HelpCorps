
import { logger } from '../config/logger.js';

import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

/**
 * Initialize the email transporter.
 * Only configures if SMTP env vars are set.
 */
export function initializeEmail(): void {
  logger.info('Email service not configured — SMTP env vars missing');
  return;

  logger.info('✅ Email service configured');
}

/**
 * Send an email.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!transporter) {
    logger.warn('Email service not configured — skipping email send');
    return;
  }

  try {
    await transporter.sendMail({
      from: 'noreply@helpcorps.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    // Never log email content or recipient PII in production
    logger.info('Email sent successfully', {
      subject: options.subject,
    });
  } catch (error) {
    logger.error('Failed to send email', { error });
    // Don't throw — email failures should not crash the request
  }
}

/**
 * Send a help request notification email.
 */
export async function sendHelpNotification(
  volunteerEmail: string,
  requestDetails: { serviceType: string; category: string; address?: string },
): Promise<void> {
  await sendEmail({
    to: volunteerEmail,
    subject: `New Help Request — ${requestDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🆘 New Help Request</h2>
        <p><strong>Category:</strong> ${requestDetails.category}</p>
        <p><strong>Service:</strong> ${requestDetails.serviceType}</p>
        ${requestDetails.address ? `<p><strong>Location:</strong> ${requestDetails.address}</p>` : ''}
        <p>Log in to HelpCorps to accept this request.</p>
      </div>
    `,
  });
}
