const nodemailer = require('nodemailer');

// ✅ Force fallback mode – always log emails to console (no real sending)
const USE_FAKE_EMAIL = true; // Set to false when you have SMTP configured

/**
 * Send email – logs to console in fake mode
 */
async function sendEmail({ to, subject, html }) {
  if (USE_FAKE_EMAIL) {
    console.log('📧 [FAKE EMAIL] To:', to);
    console.log('📧 [FAKE EMAIL] Subject:', subject);
    console.log('📧 [FAKE EMAIL] Body:', html);
    return true;
  }

  // Real email logic (if you configure SMTP later)
  let transporter = null;
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
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    console.warn('⚠️ No real mail service configured, but fake mode is enabled anyway.');
    return true;
  }

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
 * Send OTP email – logs OTP to console
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
