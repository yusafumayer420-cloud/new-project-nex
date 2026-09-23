const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  marketCap: {
    type: String,
    
  },
  volume24h: {
    type: String,
    
  },
  btcDominance: {
    type: String,
    
  },
  tradingEnabled: {
    type: Boolean,
    default: true
  },
  ecrPrice: {
    type: Number,
    default: 0.10
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
