const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect: auth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { createAdminNotification } = require('../utils/notificationHelper');
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/kyc');
const profileDir = path.join(__dirname, '../uploads/profiles');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profile') {
      cb(null, profileDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone, country, address, city, zipCode } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (zipCode !== undefined) user.zipCode = zipCode;
    
    await user.save();
    
    // Return full user object to prevent frontend state loss (e.g. wallet)
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({
      message: 'Profile updated',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile picture
router.post('/profile-picture', auth, upload.single('profile'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('Profile Picture Upload: No file received in req.file');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    const user = await User.findById(req.user.id);
    user.profilePicture = fileUrl;
    await user.save();

    res.json({
      message: 'Profile picture updated',
      profilePicture: fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update KYC documents (with multer error handling)
router.post('/kyc/upload', auth, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 50MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected file field. Please use the correct upload form.' });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'File upload failed. Please try again.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      console.log('KYC Upload: No file received in req.file');
      return res.status(400).json({ message: 'No file uploaded. Please select a file and try again.' });
    }
    
    if (!type) {
      console.log('KYC Upload: Document type missing in req.body');
      return res.status(400).json({ message: 'Document type is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.kycStatus === 'verified') {
      return res.status(400).json({ message: 'Your account is already verified. You cannot re-upload documents.' });
    }
    
    // Store authenticated URL path (not a public static URL)
    const fileUrl = `/api/users/kyc/file/${req.file.filename}`;
    
    if (!user.kycDocuments) {
      user.kycDocuments = {};
    }
    
    // type should be 'idFront', 'idBack', or 'selfie'
    if (['idFront', 'idBack', 'selfie'].includes(type)) {
      // Delete old file if re-uploading
      const oldUrl = user.kycDocuments?.[type];
      if (oldUrl) {
        try {
          const oldFilename = oldUrl.split('/').pop();
          const oldFilePath = path.join(uploadDir, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (cleanupErr) {
          console.warn('Failed to cleanup old KYC file:', cleanupErr.message);
        }
      }
      user.set(`kycDocuments.${type}`, fileUrl);
    } else {
      console.log('Invalid KYC document type received:', type);
      return res.status(400).json({ message: 'Invalid document type. Must be idFront, idBack, or selfie.' });
    }
    
    let justCompleted = false;
    
    // Set status to pending and submission timestamp when all 3 documents are uploaded
    if (user.kycDocuments.idFront && user.kycDocuments.idBack && user.kycDocuments.selfie) {
      if (user.kycStatus !== 'pending') {
        justCompleted = true;
      }
      user.kycStatus = 'pending';
      user.kycSubmittedAt = new Date();
    }
    
    await user.save();
    
    // Notify admins if this was the last document needed to complete the submission
    if (justCompleted) {
      await createAdminNotification(req.app.get('io'), {
        title: 'New KYC Submission',
        message: `User ${user.fullName || user.email} submitted all KYC documents`,
        type: 'kyc',
        relatedId: user._id
      });
    }
    
    res.json({
      message: 'KYC documents uploaded successfully',
      status: user.kycStatus,
      url: fileUrl
    });
  } catch (error) {
    console.error('KYC Upload Error in Route:', error);
    res.status(500).json({ message: 'An error occurred while uploading your document. Please try again.' });
  }
});

// Serve KYC files securely (authenticated access only)
router.get('/kyc/file/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Prevent path traversal attacks
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename || filename.includes('..')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user owns this file or is admin
    const isAdmin = user.role === 'admin';
    const isOwner = user.kycDocuments && (
      user.kycDocuments.idFront?.includes(filename) ||
      user.kycDocuments.idBack?.includes(filename) ||
      user.kycDocuments.selfie?.includes(filename)
    );
    
    if (!isOwner && !isAdmin) {
      // If admin, also check if the file belongs to ANY user (admin can view all)
      if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied. You can only view your own documents.' });
      }
    }
    
    // If admin but not owner, verify the file exists for some user
    if (isAdmin && !isOwner) {
      // Create a regex that matches the filename at the end of the stored URL
      const fileRegex = new RegExp(`/${filename}$`);
      const fileOwner = await User.findOne({
        $or: [
          { 'kycDocuments.idFront': fileRegex },
          { 'kycDocuments.idBack': fileRegex },
          { 'kycDocuments.selfie': fileRegex }
        ]
      });
      if (!fileOwner) {
        return res.status(404).json({ message: 'Document not found' });
      }
    }
    
    const filePath = path.join(uploadDir, sanitizedFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set proper content type based on extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('KYC File Serve Error:', error);
    res.status(500).json({ message: 'Failed to load document' });
  }
});


// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    user.plainPassword = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();
    
    // Log the password change in security logs
    const LoginLog = require('../models/LoginLog');
    await LoginLog.create({
      userId: user._id,
      action: 'password_change',
      device: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
      status: 'success'
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get security logs (login history)
router.get('/security-logs', auth, async (req, res) => {
  try {
    const LoginLog = require('../models/LoginLog');
    const logs = await LoginLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;