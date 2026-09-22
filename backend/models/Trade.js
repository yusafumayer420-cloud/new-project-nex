const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pair: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'long', 'short'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['market', 'limit'],
    required: true,
    default: 'market'
  },
  tradeMode: {
    type: String,
    enum: ['spot', 'perpetual', 'delivery'],
    default: 'spot'
  },
  price: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'closed'],
    default: 'pending'
  },
  // Delivery contract specific fields
  deliverySeconds: {
    type: Number,  // e.g. 60, 180, 300, 600, 900, 1800
    default: null
  },
  profitPercent: {
    type: Number,  // e.g. 13, 15, 20, 27, 75, 90
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  outcome: {
    type: String,
    enum: ['win', 'loss', null],
    default: null
  },
  profitAmount: {
    type: Number,
    default: 0
  },
  closePrice: {
    type: Number,
    default: null
  },
  pnl: {
    type: Number,
    default: null
  },
  position: {
    leverage: { type: Number, default: 1 },
    liquidationPrice: Number,
    takeProfit: Number,
    stopLoss: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TradeSchema.index({ userId: 1 });
TradeSchema.index({ status: 1 });
TradeSchema.index({ tradeMode: 1 });
TradeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);