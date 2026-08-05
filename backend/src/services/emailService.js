const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // Try Keplers SMTP
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
  } 
  // Try Gmail SMTP
  else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } 
  // Fallback: console logger (no real email)
  else {
    console.warn('⚠️ No mail service configured. Emails will be logged to console.');
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

/**
 * Send an email
 * @param {Object} options - { to, subject, html }
 * @returns {Promise<boolean>} - true if sent, false if error
 */
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'VexaStore'}" <${process.env.KEPLERS_EMAIL || process.env.GMAIL_USER || 'noreply@vexastore.com'}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
}

/**
 * Send OTP email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit code
 * @returns {Promise<boolean>}
 */
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

module.exports = { sendEmail, sendOtpEmail };
