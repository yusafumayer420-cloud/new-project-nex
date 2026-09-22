const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createAdminNotification } = require('../utils/notificationHelper');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const LoginLog = require('../models/LoginLog');
const WalletTransaction = require('../models/WalletTransaction');
const sendEmail = require('../utils/emailService');
const router = express.Router();

// Register - Directly creates user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, referralCode } = req.body;
    
    // Check if a verified user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if referral code is valid (if provided)
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate a unique referral code
    const newReferralCode = `CSIM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create the actual user account now
    const user = await User.create({
      email,
      password,
      plainPassword: password,
      fullName,
      wallet: { usdt: 0, btc: 0, eth: 0, sol: 0 },
      isVerified: true,
      referralCode: newReferralCode,
      referredBy,
      lastIpAddress: req.ip || req.connection?.remoteAddress || ''
    });

    // Create Admin Notification
    createAdminNotification(req.app.get('io'), {
      title: 'New User Registered',
      message: `User ${user.fullName || user.email} just registered and verified their account`,
      type: 'user',
      relatedId: user._id
    }).catch(err => console.error('Notification error:', err));

    // Send Welcome Email
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@nexvor.com';
      const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
      
      await sendEmail({
        email: user.email,
        subject: 'Welcome to NexVor! 👋',
        message: `Welcome to NexVor!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>Dear ${firstName},</p>
            <p>Welcome to <strong>NexVor!</strong> 👋</p>
            <p>Thank you for creating your account with us. We’re excited to have you as part of the NexVor community.</p>
            <p>Your account has been successfully created, and you can now log in to access your NexVor account and explore our platform.</p>
            <p>If you have any questions or need assistance, our support team is always here to help.</p>
            <p><strong>Welcome aboard, and thank you for choosing NexVor!</strong></p>
            <br>
            <p>Best regards,<br>
            <strong>NexVor Support Team</strong><br>
            Support: ${supportEmail}</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        wallet: user.wallet,
        role: user.role,
        kycStatus: user.kycStatus,
        status: user.status,
        canViewDepositAddress: user.canViewDepositAddress === true,
        score: user.score,
        level: user.level
      },
      message: 'Account created successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      if (user) {
        await LoginLog.create({
          userId: user._id,
          action: 'login_failed',
          device: req.headers['user-agent'] || 'Unknown Device',
          ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
          status: 'failed'
        });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        reason: user.statusReason 
      });
    }


    
    await LoginLog.create({
      userId: user._id,
      action: 'login_success',
      device: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
      status: 'success'
    });
    
    user.lastIpAddress = req.ip || req.connection?.remoteAddress || '';
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        wallet: user.wallet,
        role: user.role,
        kycStatus: user.kycStatus,
        status: user.status,
        canViewDepositAddress: user.canViewDepositAddress === true,
        score: user.score,
        level: user.level
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP - Now creates the actual user account after verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // First check PendingRegistration (new registration flow)
    const pending = await PendingRegistration.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (pending) {
      // Check again that no user was created in the meantime
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await PendingRegistration.deleteOne({ email });
        return res.status(400).json({ message: 'User already exists. Please login instead.' });
      }

      // Generate a unique referral code (e.g. CSIM-XXXXXX)
      const referralCode = `CSIM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Create the actual user account now
      const user = await User.create({
        email: pending.email,
        password: pending.password,
        plainPassword: pending.password,
        fullName: pending.fullName,
        wallet: { usdt: 0, btc: 0, eth: 0, sol: 0 },
        isVerified: true,
        referralCode,
        referredBy: pending.referredBy,
        lastIpAddress: req.ip || req.connection?.remoteAddress || ''
      });

      // Clean up pending registration
      await PendingRegistration.deleteOne({ email });

      // Handle Referral Reward
      // Referral reward functionality has been removed.

      // Create Admin Notification
      createAdminNotification(req.app.get('io'), {
        title: 'New User Registered',
        message: `User ${user.fullName || user.email} just registered and verified their account`,
        type: 'user',
        relatedId: user._id
      }).catch(err => console.error('Notification error:', err));

      // Send Welcome Email
      try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@NexVor.com';
        const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
        
        await sendEmail({
          email: user.email,
          subject: 'Welcome to NexVor! 👋',
          message: `Welcome to NexVor!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <p>Dear ${firstName},</p>
              <p>Welcome to <strong>NexVor!</strong> 👋</p>
              <p>Thank you for creating your account with us. We’re excited to have you as part of the NexVor community.</p>
              <p>Your account has been successfully created, and you can now log in to access your NexVor account and explore our platform.</p>
              <p>If you have any questions or need assistance, our support team is always here to help.</p>
              <p><strong>Welcome aboard, and thank you for choosing NexVor!</strong></p>
              <br>
              <p>Best regards,<br>
              <strong>NexVor Support Team</strong><br>
              Support: ${supportEmail}</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          wallet: user.wallet,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          canViewDepositAddress: user.canViewDepositAddress === true,
          score: user.score,
          level: user.level
        },
        message: 'Email verified and account created successfully!'
      });
    }

    // Fallback: Check existing users (for legacy unverified users)
    const user = await User.findOne({ 
      email,
      verificationOTP: otp,
      verificationOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    user.lastIpAddress = req.ip || req.connection?.remoteAddress || '';
    await user.save();

    // Create Admin Notification now that user is verified
    createAdminNotification(req.app.get('io'), {
      title: 'New User Verified',
      message: `User ${user.fullName || user.email} just verified their account`,
      type: 'user',
      relatedId: user._id
    }).catch(err => console.error('Notification error:', err));

    // Send Welcome Email
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@NexVor.com';
      const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
      
      await sendEmail({
        email: user.email,
        subject: 'Welcome to NexVor! 👋',
        message: `Welcome to NexVor!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>Dear ${firstName},</p>
            <p>Welcome to <strong>NexVor!</strong> 👋</p>
            <p>Thank you for creating your account with us. We’re excited to have you as part of the NexVor community.</p>
            <p>Your account has been successfully created, and you can now log in to access your NexVor account and explore our platform.</p>
            <p>If you have any questions or need assistance, our support team is always here to help.</p>
            <p><strong>Welcome aboard, and thank you for choosing NexVor!</strong></p>
            <br>
            <p>Best regards,<br>
            <strong>NexVor Support Team</strong><br>
            Support: ${supportEmail}</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        wallet: user.wallet,
        role: user.role,
        kycStatus: user.kycStatus,
        status: user.status,
        canViewDepositAddress: user.canViewDepositAddress === true,
        score: user.score,
        level: user.level
      },
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    // Check PendingRegistration first (new flow)
    const pending = await PendingRegistration.findOne({ email });
    if (pending) {
      pending.otp = otp;
      pending.otpExpires = otpExpiry;
      await pending.save();

      await sendEmail({
        email,
        subject: 'Email Verification OTP',
        message: `Your new verification OTP is ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #00D395; text-align: center;">NexVor Verification</h2>
            <p>Your new verification OTP is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This OTP will expire in <strong>10 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 NexVor. All rights reserved.</p>
          </div>
        `
      });

      return res.status(200).json({ message: 'OTP resent successfully' });
    }

    // Fallback: Check existing users (legacy flow)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    user.verificationOTP = otp;
    user.verificationOTPExpires = otpExpiry;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Email Verification OTP',
      message: `Your new verification OTP is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00D395; text-align: center;">NexVor Verification</h2>
          <p>Your new verification OTP is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 NexVor. All rights reserved.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || req.get('origin');
    const resetUrl = `https://www.NexVor.com/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process within 1 hour of receiving it:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: message,
        html: `<p>You requested a password reset. Please click the link below to reset your password:</p>
               <a href="${resetUrl}">${resetUrl}</a>
               <p>This link expires in 1 hour.</p>`
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    user.password = password;
    user.plainPassword = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;