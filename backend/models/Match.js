const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  makerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  takerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  makerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  takerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pair: { type: String, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  makerSide: { type: String, enum: ['buy', 'sell'], required: true },
  createdAt: { type: Date, default: Date.now }
});

MatchSchema.index({ pair: 1, createdAt: -1 });

module.exports = mongoose.model('Match', MatchSchema);
