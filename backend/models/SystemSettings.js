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
  ecrVolume: {
    type: String,
    default: "1000000.00"
  },
  ecrChange: {
    type: String,
    default: "0.00"
  },
  spotFee: {
    type: Number,
    default: 0.1
  },
  spotMinAmount: {
    type: Number,
    default: 10
  },
  spotMaxAmount: {
    type: Number,
    default: 100000
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
