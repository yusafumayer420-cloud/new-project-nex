const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DepositAddress = require('../models/DepositAddress');

// Middleware: admin only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ── GET all deposit addresses (admin) ─────────────────────────────
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const addresses = await DepositAddress.find().sort({ coin: 1, network: 1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET public active addresses (used by frontend chat bot) ───────
router.get('/public', async (req, res) => {
  try {
    const addresses = await DepositAddress.find({ isActive: true }).select('-__v');
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST create a new deposit address ─────────────────────────────
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { coin, network, walletAddress, keywords, isActive } = req.body;

    if (!coin || !network || !walletAddress) {
      return res.status(400).json({ message: 'coin, network, and walletAddress are required' });
    }

    const existing = await DepositAddress.findOne({
      coin: coin.toUpperCase(),
      network: network.trim()
    });
    if (existing) {
      return res.status(409).json({ message: `A ${coin} (${network}) address already exists. Please edit it instead.` });
    }

    const addr = new DepositAddress({
      coin: coin.toUpperCase(),
      network: network.trim(),
      walletAddress: walletAddress.trim(),
      keywords: keywords || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await addr.save();
    res.status(201).json(addr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PUT update a deposit address ──────────────────────────────────
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { coin, network, walletAddress, keywords, isActive } = req.body;

    const addr = await DepositAddress.findById(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    if (coin)          addr.coin = coin.toUpperCase();
    if (network)       addr.network = network.trim();
    if (walletAddress) addr.walletAddress = walletAddress.trim();
    if (keywords)      addr.keywords = keywords;
    if (isActive !== undefined) addr.isActive = isActive;

    await addr.save();
    res.json(addr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE a deposit address ───────────────────────────────────────
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const addr = await DepositAddress.findByIdAndDelete(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
