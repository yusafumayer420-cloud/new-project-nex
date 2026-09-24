const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  plainPassword: {
    type: String
  },
  fullName: {
    type: String,
    required: true
  },
  phone: String,
  country: String,
  address: String,
  city: String,
  zipCode: String,
  profilePicture: String,
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  kycDocuments: {
    idFront: String,
    idBack: String,
    selfie: String
  },
  kycDetails: {
    reviewNote: String,
    idType: String,
    country: String
  },
  kycSubmittedAt: Date,
  wallet: {
    type: new mongoose.Schema({
      usdt: { type: Number, default: 0 },
      btc: { type: Number, default: 0 },
      eth: { type: Number, default: 0 },
      sol: { type: Number, default: 0 },
      xrp: { type: Number, default: 0 },
      ada: { type: Number, default: 0 },
      doge: { type: Number, default: 0 },
      dot: { type: Number, default: 0 },
      ltc: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      matic: { type: Number, default: 0 },
      avax: { type: Number, default: 0 },
      link: { type: Number, default: 0 },
      shib: { type: Number, default: 0 },
      trx: { type: Number, default: 0 },
      uni: { type: Number, default: 0 },
      atom: { type: Number, default: 0 },
      xlm: { type: Number, default: 0 },
      etc: { type: Number, default: 0 },
      fil: { type: Number, default: 0 },
      near: { type: Number, default: 0 },
      algo: { type: Number, default: 0 },
      vet: { type: Number, default: 0 },
      icp: { type: Number, default: 0 },
      mana: { type: Number, default: 0 },
      sand: { type: Number, default: 0 },
      axs: { type: Number, default: 0 },
      theta: { type: Number, default: 0 },
      ftm: { type: Number, default: 0 },
      egld: { type: Number, default: 0 },
      xtz: { type: Number, default: 0 }
    }, { _id: false, strict: false }),
    default: () => ({ usdt: 0, btc: 0, eth: 0, sol: 0, xrp: 0, ada: 0, doge: 0, dot: 0, ltc: 0, bnb: 0, matic: 0, avax: 0, link: 0, shib: 0, trx: 0, uni: 0, atom: 0, xlm: 0, etc: 0, fil: 0, near: 0, algo: 0, vet: 0, icp: 0, mana: 0, sand: 0, axs: 0, theta: 0, ftm: 0, egld: 0, xtz: 0 })
  },
  lockedWallet: {
    type: new mongoose.Schema({
      usdt: { type: Number, default: 0 },
      btc: { type: Number, default: 0 },
      eth: { type: Number, default: 0 },
      sol: { type: Number, default: 0 },
      xrp: { type: Number, default: 0 },
      ada: { type: Number, default: 0 },
      doge: { type: Number, default: 0 },
      dot: { type: Number, default: 0 },
      ltc: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      matic: { type: Number, default: 0 },
      avax: { type: Number, default: 0 },
      link: { type: Number, default: 0 },
      shib: { type: Number, default: 0 },
      trx: { type: Number, default: 0 },
      uni: { type: Number, default: 0 },
      atom: { type: Number, default: 0 },
      xlm: { type: Number, default: 0 },
      etc: { type: Number, default: 0 },
      fil: { type: Number, default: 0 },
      near: { type: Number, default: 0 },
      algo: { type: Number, default: 0 },
      vet: { type: Number, default: 0 },
      icp: { type: Number, default: 0 },
      mana: { type: Number, default: 0 },
      sand: { type: Number, default: 0 },
      axs: { type: Number, default: 0 },
      theta: { type: Number, default: 0 },
      ftm: { type: Number, default: 0 },
      egld: { type: Number, default: 0 },
      xtz: { type: Number, default: 0 }
    }, { _id: false, strict: false }),
    default: () => ({ usdt: 0, btc: 0, eth: 0, sol: 0, xrp: 0, ada: 0, doge: 0, dot: 0, ltc: 0, bnb: 0, matic: 0, avax: 0, link: 0, shib: 0, trx: 0, uni: 0, atom: 0, xlm: 0, etc: 0, fil: 0, near: 0, algo: 0, vet: 0, icp: 0, mana: 0, sand: 0, axs: 0, theta: 0, ftm: 0, egld: 0, xtz: 0 })
  },
  addresses: {
    usdt: String
  },
  tradingStats: {
    totalTrades: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  score: {
    type: Number,
    default: 100
  },
  level: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'blocked'],
    default: 'active'
  },
  statusReason: String,
  deliveryTradeEnabled: {
    type: Boolean,
    default: true
  },
  canViewDepositAddress: {
    type: Boolean,
    default: false
  },
  withdrawalEnabled: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  verificationOTPExpires: Date,
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastIpAddress: String
}
);

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);