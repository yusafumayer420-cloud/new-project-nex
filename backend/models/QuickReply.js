const mongoose = require('mongoose');

const quickReplySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  shortcut: {
    type: String,
    trim: true,
    lowercase: true,
  },
  category: {
    type: String,
    default: 'general',
    trim: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('QuickReply', quickReplySchema);
