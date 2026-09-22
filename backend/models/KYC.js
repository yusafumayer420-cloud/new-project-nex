const mongoose = require('mongoose');

const KYCSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'submitted'],
    default: 'pending'
  },
  documents: {
    idFront: {
      url: String,
      uploadedAt: Date,
      verified: Boolean
    },
    idBack: {
      url: String,
      uploadedAt: Date,
      verified: Boolean
    },
    selfie: {
      url: String,
      uploadedAt: Date,
      verified: Boolean
    },
    proofOfAddress: {
      url: String,
      uploadedAt: Date,
      verified: Boolean
    }
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    country: String,
    address: String,
    city: String,
    postalCode: String
  },
  verificationNotes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('KYC', KYCSchema);