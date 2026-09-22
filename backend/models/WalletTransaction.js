const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'trade', 'transfer', 'exchange', 'trade_close'],
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  transactionHash: String,
  fromAddress: String,
  toAddress: String,
  chain: String,
  voucher: String,
  metadata: {
    type: new mongoose.Schema({
      pair: String,
      price: Number,
      orderId: String
    }, { _id: false, strict: false })
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

WalletTransactionSchema.index({ userId: 1 });
WalletTransactionSchema.index({ type: 1 });
WalletTransactionSchema.index({ status: 1 });
WalletTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);