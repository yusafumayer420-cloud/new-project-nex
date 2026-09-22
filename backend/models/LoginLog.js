const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['login_success', 'login_failed', 'password_change'],
    default: 'login_success'
  },
  device: {
    type: String,
    default: 'Unknown Device'
  },
  location: {
    type: String,
    default: 'Unknown Location'
  },
  ipAddress: {
    type: String,
    default: '0.0.0.0'
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoginLog', LoginLogSchema);
