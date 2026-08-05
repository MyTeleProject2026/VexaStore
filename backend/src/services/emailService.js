const nodemailer = require('nodemailer');

// Force fallback mode – always log emails to console
const USE_FAKE_EMAIL = true; // Set to false to enable real email

async function sendEmail({ to, subject, html }) {
  if (USE_FAKE_EMAIL) {
    console.log(`📧 [FAKE EMAIL] To: ${to}`);
    console.log(`📧 [FAKE EMAIL] Subject: ${subject}`);
    console.log(`📧 [FAKE EMAIL] Body: ${html}`);
    return true;
  }

  // Real email logic (if configured)
  // ... (keep your existing transporter code, but it won't be used)
}

async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background: #0b0b0b; color: #ffffff;">
      <h2>VexaStore Verification</h2>
      <p>Your 6-digit code is:</p>
      <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#06b6d4; margin:16px 0;">
        ${otp}
      </div>
      <p>Expires in 10 minutes.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'VexaStore Email Verification', html });
}

module.exports = { sendEmail, sendOtpEmail };
