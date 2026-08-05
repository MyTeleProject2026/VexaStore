const nodemailer = require('nodemailer');

// ============================================================
// SMTP Configuration (from environment variables)
// ============================================================
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER; // Your SMTP username (e.g., Brevo login email)
const SMTP_PASS = process.env.SMTP_PASS; // Your SMTP password or API key
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@vexastore.com';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'VexaStore';

// ============================================================
// Transporter – Reusable SMTP connection
// ============================================================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Use SMTP if configured
  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = SSL, 587 = TLS
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log('✅ SMTP transporter initialized with:', SMTP_HOST);
  } else {
    // Fallback: console logging (for development/testing)
    console.warn('⚠️ SMTP not configured. Emails will be logged to console.');
    transporter = {
      sendMail: (mailOptions) => {
        console.log('📧 [FAKE EMAIL] To:', mailOptions.to);
        console.log('📧 [FAKE EMAIL] Subject:', mailOptions.subject);
        console.log('📧 [FAKE EMAIL] Body:', mailOptions.html);
        return Promise.resolve();
      }
    };
  }
  return transporter;
}

// ============================================================
// Send Email – Main function
// ============================================================
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log('✅ Email sent to:', to, 'Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
}

// ============================================================
// Send OTP Email – Verification code
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
// Export functions
// ============================================================
module.exports = { sendEmail, sendOtpEmail };
