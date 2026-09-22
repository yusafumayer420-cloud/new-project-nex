const mongoose = require('mongoose');

const DepositAddressSchema = new mongoose.Schema({
  coin: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  network: {
    type: String,
    required: true,
    trim: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  keywords: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DepositAddressSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DepositAddress', DepositAddressSchema);
