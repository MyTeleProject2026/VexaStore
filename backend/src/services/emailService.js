const axios = require('axios');

// ============================================================
// Brevo API Configuration (HTTPS – no timeout)
// ============================================================
const BREVO_API_KEY = process.env.SMTP_PASS; // This is your Brevo API key
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.FROM_EMAIL || 'vexatradeblockchainecosystem@gmail.com';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'VexaTrade.inc';

// ============================================================
// Send Email via Brevo REST API
// ============================================================
async function sendEmail({ to, subject, html }) {
  // If no API key, fallback to console log
  if (!BREVO_API_KEY || BREVO_API_KEY.startsWith('xsmtpsib-') === false) {
    console.warn('⚠️ Brevo API key not configured. Falling back to console log.');
    console.log('📧 [FAKE EMAIL] To:', to);
    console.log('📧 [FAKE EMAIL] Subject:', subject);
    console.log('📧 [FAKE EMAIL] Body:', html);
    return true;
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        timeout: 30000, // 30 seconds
      }
    );

    console.log('✅ Email sent via Brevo API to:', to, 'Message ID:', response.data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error.response?.data || error.message);
    // Fallback: log to console
    console.log('📧 [FALLBACK] To:', to);
    console.log('📧 [FALLBACK] Subject:', subject);
    return false;
  }
}

// ============================================================
// Send OTP Email
// ============================================================
async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background: #0b0b0b; color: #ffffff;">
      <h2 style="margin:0 0 16px;">VexaStore Verification</h2>
      <p style="margin:0 0 16px;">Your 6-digit verification code is:</p>
      <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#06b6d4; margin:16px 0;">
        ${otp}
      </div>
      <p style="margin:16px 0 0; color:#cbd5e1;">This code expires in 10 minutes.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'VexaStore Email Verification', html });
}

// ============================================================
// Send Password Reset Email
// ============================================================
async function sendResetEmail(to, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background: #0b0b0b; color: #ffffff;">
      <h2 style="margin:0 0 16px;">Reset Your Password</h2>
      <p style="margin:0 0 16px;">Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="display: inline-block; background: #06b6d4; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 16px 0;">
        Reset Password
      </a>
      <p style="margin:16px 0 0; color:#cbd5e1;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'VexaStore Password Reset', html });
}

module.exports = { sendEmail, sendOtpEmail, sendResetEmail };
