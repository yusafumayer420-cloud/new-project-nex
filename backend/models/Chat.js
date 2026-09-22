const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  type: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'user'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  room: {
    type: String,
    default: 'general'
  },
  attachments: [{
    type: String
  }],
  metadata: {
    userAgent: String,
    ip: String,
    location: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ChatMessageSchema.index({ userId: 1, createdAt: -1 });
ChatMessageSchema.index({ room: 1, createdAt: -1 });
ChatMessageSchema.index({ isRead: 1, type: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);