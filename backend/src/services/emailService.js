const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Option 1: Keplers SMTP
  if (process.env.KEPLERS_SMTP_HOST && process.env.KEPLERS_EMAIL && process.env.KEPLERS_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.KEPLERS_SMTP_HOST,
      port: parseInt(process.env.KEPLERS_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.KEPLERS_EMAIL,
        pass: process.env.KEPLERS_PASSWORD,
      },
    });
    console.log('✅ Email service configured: Keplers SMTP');
    return transporter;
  }

  // Option 2: Gmail
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log('✅ Email service configured: Gmail');
    return transporter;
  }

  // Option 3: Custom SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    console.log('✅ Email service configured: Custom SMTP');
    return transporter;
  }

  console.warn('⚠️ No email service configured. OTP emails will not be sent.');
  return null;
}

async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('❌ Mail service not configured');
    return false;
  }

  const fromEmail = process.env.KEPLERS_EMAIL || process.env.GMAIL_USER || process.env.MAIL_FROM_EMAIL || 'noreply@vexastore.com';
  const fromName = process.env.MAIL_FROM_NAME || 'VexaStore';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
}

async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background: #0b0b0b; color: #ffffff; max-width: 500px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #06b6d4;">VexaStore</h2>
        <p style="color: #94a3b8;">The Official App Hub of VexaTrade Blockchain Ecosystem</p>
      </div>
      <hr style="border-color: #1e293b;">
      <p style="margin: 16px 0;">Hello,</p>
      <p style="margin: 16px 0;">Your 6-digit verification code is:</p>
      <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #06b6d4; background: #0a0e1a; padding: 16px; border-radius: 12px; text-align: center; margin: 16px 0; border: 1px solid #1e293b;">
        ${otp}
      </div>
      <p style="margin: 16px 0; color: #94a3b8; font-size: 14px;">This code expires in <strong style="color: #ffffff;">10 minutes</strong>.</p>
      <hr style="border-color: #1e293b;">
      <p style="margin: 16px 0; color: #94a3b8; font-size: 12px; text-align: center;">
        If you didn't request this code, please ignore this email.
      </p>
      <p style="margin: 16px 0; color: #94a3b8; font-size: 12px; text-align: center;">
        © 2026 VexaStore — VexaTrade Blockchain Ecosystem
      </p>
    </div>
  `;
  return sendEmail({ to, subject: 'VexaStore Email Verification Code', html });
}

module.exports = { sendEmail, sendOtpEmail };
