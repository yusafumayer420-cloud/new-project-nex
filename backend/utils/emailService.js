const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if we have credentials
  const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (!hasCredentials) {
    console.log('--- MOCK EMAIL START ---');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    console.log('--- MOCK EMAIL END ---');
    return; // Success in mock mode
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `NexVor Support <${process.env.EMAIL_FROM || 'support@nexvor.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    if (transporter.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    // Even if it fails, we don't want to crash the whole flow in dev
    console.log('MOCK EMAIL (After failure):', options.message);
  }
};

module.exports = sendEmail;
