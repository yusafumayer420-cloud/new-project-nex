const express = require('express');
const { protect: auth } = require('../middleware/authMiddleware');
const Trade = require('../models/Trade');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const router = express.Router();

const SystemSettings = require('../models/SystemSettings');

// Delivery contract time slots (seconds → config)
const DELIVERY_SLOTS = {
  60:   { profit: 30, minAmount: 0 },
  120:  { profit: 50, minAmount: 0 },
  180:  { profit: 60, minAmount: 0 },
  240:  { profit: 70, minAmount: 0 },
  300:  { profit: 80, minAmount: 0 },
};

// Settle a delivery trade after timer expires
async function settleDeliveryTrade(tradeId, io) {
  try {
    // Atomic claim: atomically flip status from 'pending' → 'settling'
    // Only ONE caller will succeed; all others get null and bail out immediately.
    const trade = await Trade.findOneAndUpdate(
      { _id: tradeId, status: 'pending', tradeMode: 'delivery' },
      { $set: { status: 'settling' } },
      { new: true }
    ).populate('userId');

    if (!trade) return; // Already settled or claimed by another call

    const user = await User.findById(trade.userId._id || trade.userId);
    if (!user) {
      // Revert status so it can be retried
      await Trade.findByIdAndUpdate(tradeId, { $set: { status: 'pending' } });
      return;
    }

    const settings = await SystemSettings.findOne();
    // Global override and User override
    const globalWin = settings ? settings.tradingEnabled : true;
    const isWin = globalWin && (user.deliveryTradeEnabled !== false);

    let profitAmount = 0;
    let finalUser = user;

    if (isWin) {
      // Return original amount + profit
      profitAmount = trade.total * (trade.profitPercent / 100);
      
      // Atomic increment to prevent race conditions
      finalUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $inc: { 
            'wallet.usdt': trade.total + profitAmount,
            'tradingStats.totalTrades': 1,
            'tradingStats.profitLoss': profitAmount
          } 
        },
        { new: true }
      );
    } else {
      // For loss, just update stats (funds were already deducted)
      finalUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $inc: { 
            'tradingStats.totalTrades': 1,
            'tradingStats.profitLoss': -trade.total
          } 
        },
        { new: true }
      );
    }

    trade.status = 'completed';
    trade.outcome = isWin ? 'win' : 'loss';
    trade.profitAmount = profitAmount;
    await trade.save();

    // Create wallet transaction for win
    if (isWin) {
      await WalletTransaction.create({
        userId: finalUser._id,
        type: 'trade',
        currency: 'USDT',
        amount: trade.total + profitAmount,
        status: 'completed',
        metadata: {
          pair: trade.pair,
          price: trade.price,
          orderId: trade._id.toString(),
          outcome: 'win'
        }
      });
    }

    // Emit socket events
    if (io) {
      const populated = await Trade.findById(tradeId).populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${finalUser._id}`).emit('trade_updated', {
        ...populated.toObject(),
        title: isWin ? '🎉 Trade Won!' : '❌ Trade Lost',
        message: isWin
          ? `You won ${profitAmount.toFixed(2)} USDT on your ${trade.pair} delivery trade!`
          : `Your ${trade.pair} delivery trade expired as a loss.`
      });
      io.to(`user_${finalUser._id}`).emit('balance_updated', { wallet: finalUser.wallet });
    }
  } catch (err) {
    console.error('Error settling delivery trade:', err);
  }
}

// Place delivery order
router.post('/delivery-order', auth, async (req, res) => {
  try {
    const { pair, type, deliverySeconds, price, amount } = req.body;
    if (req.user.status === 'frozen') {
      return res.status(403).json({ message: 'Your account is temporarily frozen and under review.' });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !isFinite(amountNum)) {
      return res.status(400).json({ message: 'Invalid trade amount' });
    }

    // Validate time slot
    const slotConfig = DELIVERY_SLOTS[deliverySeconds];
    if (!slotConfig) {
      return res.status(400).json({ message: 'Invalid delivery time slot' });
    }

    // Atomic deduction: only subtract if balance is sufficient
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, 'wallet.usdt': { $gte: amountNum } },
      { $inc: { 'wallet.usdt': -amountNum } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ 
        message: 'Insufficient balance or user not found.' 
      });
    }

    const profitPercent = slotConfig.profit;
    const expiresAt = new Date(Date.now() + deliverySeconds * 1000);

    // Create pending delivery trade
    const trade = new Trade({
      userId: req.user.id,
      pair: pair || 'BTC/USDT',
      type: type === 'long' ? 'long' : 'short',
      orderType: 'market',
      tradeMode: 'delivery',
      price: parseFloat(price),
      amount: amountNum,
      total: amountNum,
      status: 'pending',
      deliverySeconds: parseInt(deliverySeconds),
      profitPercent,
      expiresAt,
      outcome: null
    });

    await trade.save();


    // Schedule settlement after timer
    const io = req.app.get('io');
    setTimeout(() => settleDeliveryTrade(trade._id, io), deliverySeconds * 1000);

    // Emit new trade event to admin
    if (io) {
      const populated = await Trade.findById(trade._id).populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('new_trade', populated);
      io.to(`user_${req.user.id}`).emit('order_placed', {
        title: 'Delivery Order Placed',
        message: `${pair} ${type} order for ${amountNum} USDT placed. Expires in ${deliverySeconds}s`,
        type: 'success',
        trade: populated
      });
      io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: 'Delivery order placed successfully', trade });
  } catch (error) {
    console.error('Delivery order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user delivery trades
router.get('/delivery-trades', auth, async (req, res) => {
  try {
    const io = req.app.get('io');

    // Auto-settle any pending trades whose timer has expired
    const expiredPending = await Trade.find({
      userId: req.user.id,
      tradeMode: 'delivery',
      status: 'pending',
      expiresAt: { $lte: new Date() }
    });

    for (const trade of expiredPending) {
      await settleDeliveryTrade(trade._id, io);
    }

    const trades = await Trade.find({
      userId: req.user.id,
      tradeMode: 'delivery'
    }).sort({ createdAt: -1 });

    const active = trades.filter(t => t.status === 'pending');
    const history = trades.filter(t => t.status === 'completed' || t.status === 'cancelled');

    res.json({ active, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place order (spot/perpetual)
router.post('/order', auth, async (req, res) => {
  try {
    const { pair, type, orderType, price, amount, leverage = 1 } = req.body;
    if (req.user.status === 'frozen') {
      return res.status(403).json({ message: 'Your account is temporarily frozen and under review.' });
    }

    const total = parseFloat(price) * parseFloat(amount);
    let user;

    const isPerpetual = type === 'long' || type === 'short';
    const marginRequired = isPerpetual ? total / leverage : total;

    // Atomic deduction: only subtract if balance is sufficient
    if (isPerpetual || type === 'buy') {
      user = await User.findOneAndUpdate(
        { _id: req.user.id, 'wallet.usdt': { $gte: marginRequired } },
        { $inc: { 'wallet.usdt': -marginRequired } },
        { new: true }
      );
      if (!user) {
        return res.status(400).json({ message: 'Insufficient USDT balance.' });
      }
    } else if (type === 'sell') {
      const currency = pair.split('/')[0].toLowerCase();
      const amountNum = parseFloat(amount);
      const updateObj = { $inc: {} };
      updateObj.$inc[`wallet.${currency}`] = -amountNum;

      const queryObj = { _id: req.user.id };
      queryObj[`wallet.${currency}`] = { $gte: amountNum };

      user = await User.findOneAndUpdate(queryObj, updateObj, { new: true });
      if (!user) {
        return res.status(400).json({ message: `Insufficient ${currency.toUpperCase()} balance.` });
      }
    }

    // Market orders are filled immediately; limit orders stay pending
    const tradeStatus = orderType === 'market' ? 'completed' : 'pending';
    const tradeMode = isPerpetual ? 'perpetual' : 'spot';

    // Create trade
    const trade = new Trade({
      userId: req.user.id,
      pair,
      type,
      orderType,
      tradeMode,
      price: parseFloat(price),
      amount: parseFloat(amount),
      total,
      status: tradeStatus,
      position: { leverage }
    });

    await trade.save();

    // For completed market orders: update trading stats atomically and credit assets
    if (tradeStatus === 'completed') {
      const incUpdate = { 'tradingStats.totalTrades': 1 };
      
      // If it's a spot trade, credit the receiving asset to the wallet
      if (!isPerpetual) {
        if (type === 'buy') {
          const currency = pair.split('/')[0].toLowerCase();
          incUpdate[`wallet.${currency}`] = parseFloat(amount);
        } else if (type === 'sell') {
          incUpdate['wallet.usdt'] = total;
        }
      }

      user = await User.findByIdAndUpdate(
        req.user.id, 
        { $inc: incUpdate },
        { new: true }
      );
    }

    // Create a wallet transaction record for completed trades
    if (tradeStatus === 'completed') {
      await WalletTransaction.create({
        userId: req.user.id,
        type: 'trade',
        currency: 'USDT',
        amount: total,
        status: 'completed',
        metadata: {
          pair,
          price: parseFloat(price),
          orderId: trade._id.toString()
        }
      });
    }

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const populatedTrade = await Trade.findById(trade._id).populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('new_trade', populatedTrade);
      io.to(`user_${req.user.id}`).emit('order_placed', {
        title: 'Order Placed',
        message: `${pair} ${type} order for ${amount} placed successfully`,
        type: 'success',
        trade: populatedTrade
      });
      if (tradeStatus === 'completed') {
        io.to('admin').emit('trade_updated', populatedTrade);
        io.to(`user_${req.user.id}`).emit('trade_updated', populatedTrade);
      }
      io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: 'Order placed successfully', trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user trades (positions and open orders)
router.get('/my-trades', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id, tradeMode: { $ne: 'delivery' } }).sort({ createdAt: -1 });

    const positions = trades.filter(t => t.status === 'completed');
    const openOrders = trades.filter(t => t.status === 'pending');
    const closedPositions = trades.filter(t => t.status === 'closed');

    res.json({ positions, openOrders, closedPositions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order (user)
router.post('/order/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Trade.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    if (order.tradeMode === 'delivery') return res.status(400).json({ message: 'Delivery orders cannot be cancelled' });

    let updatedUser;
    const isPerpetual = order.tradeMode === 'perpetual' || (order.tradeMode === 'spot' && (order.type === 'long' || order.type === 'short'));

    // Atomic refund
    if (isPerpetual) {
      const margin = order.total / (order.position.leverage || 1);
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { 'wallet.usdt': margin } },
        { new: true }
      );
    } else {
      if (order.type === 'buy') {
        updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $inc: { 'wallet.usdt': order.total } },
          { new: true }
        );
      } else if (order.type === 'sell') {
        const currency = order.pair.split('/')[0].toLowerCase();
        const updateObj = { $inc: {} };
        updateObj.$inc[`wallet.${currency}`] = order.amount;
        updatedUser = await User.findByIdAndUpdate(req.user.id, updateObj, { new: true });
      }
    }

    order.status = 'cancelled';
    await order.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await order.populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${req.user.id}`).emit('trade_updated', populated);
      if (updatedUser) {
        io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: updatedUser.wallet });
      }
    }

    res.json({ message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Close perpetual position
router.post('/order/:id/close', auth, async (req, res) => {
  try {
    const { price } = req.body;
    if (req.user.status === 'frozen') {
      return res.status(403).json({ message: 'Your account is temporarily frozen and under review.' });
    }
    if (!price) return res.status(400).json({ message: 'Current price is required to close position' });

    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    if (trade.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    const isLegacyPerpetual = trade.tradeMode === 'spot' && (trade.type === 'long' || trade.type === 'short');
    if (trade.tradeMode !== 'perpetual' && !isLegacyPerpetual) {
      return res.status(400).json({ message: 'Only perpetual positions can be closed' });
    }
    if (trade.status !== 'completed') {
      return res.status(400).json({ message: 'Position is already closed or not in open state' });
    }

    let pnl = 0;
    if (trade.type === 'long') {
      pnl = (parseFloat(price) - trade.price) * trade.amount;
    } else if (trade.type === 'short') {
      pnl = (trade.price - parseFloat(price)) * trade.amount;
    }

    const margin = trade.total / (trade.position.leverage || 1);
    const returnAmount = Math.max(0, margin + pnl);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $inc: { 
          'wallet.usdt': returnAmount,
          'tradingStats.profitLoss': pnl
        } 
      },
      { new: true }
    );

    trade.status = 'closed';
    trade.closePrice = parseFloat(price);
    trade.pnl = pnl;
    trade.profitAmount = pnl;
    await trade.save();

    await WalletTransaction.create({
      userId: req.user.id,
      type: 'trade_close',
      currency: 'USDT',
      amount: returnAmount,
      status: 'completed',
      metadata: {
        pair: trade.pair,
        closePrice: trade.closePrice,
        pnl: pnl,
        orderId: trade._id.toString()
      }
    });

    const io = req.app.get('io');
    if (io) {
      const populated = await trade.populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${req.user.id}`).emit('trade_updated', populated);
      if (updatedUser) {
        io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: updatedUser.wallet });
      }
    }

    res.json({ message: 'Position closed successfully', trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update trade status (admin)
router.put('/order/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use completed or cancelled' });
    }

    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });

    // If cancelling a pending order, refund funds to user
    if (status === 'cancelled' && trade.status === 'pending') {
      const user = await User.findById(trade.userId);
      if (user) {
        const isPerpetual = trade.tradeMode === 'perpetual' || (trade.tradeMode === 'spot' && (trade.type === 'long' || trade.type === 'short'));

        if (isPerpetual) {
          const margin = trade.total / (trade.position.leverage || 1);
          user.wallet.usdt += margin;
        } else {
          if (trade.type === 'buy') {
            user.wallet.usdt += trade.total;
          } else if (trade.type === 'sell') {
            const currency = trade.pair.split('/')[0].toLowerCase();
            if (user.wallet[currency] !== undefined) {
              user.wallet[currency] += trade.amount;
            }
          }
        }
        user.markModified('wallet');
        await user.save();
        
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('balance_updated', { wallet: user.wallet });
        }
      }
    }

    trade.status = status;
    await trade.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await trade.populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${trade.userId}`).emit('trade_updated', populated);
    }

    res.json({ message: `Trade ${status} successfully`, trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update trade outcome (admin) - forces a win or loss
router.put('/order/:id/outcome', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { outcome } = req.body;
    if (!['win', 'loss'].includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome. Use win or loss' });
    }

    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    if (trade.tradeMode !== 'delivery') return res.status(400).json({ message: 'Only delivery trades can have win/loss outcome' });

    const user = await User.findById(trade.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Revert old outcome
    if (trade.status === 'completed' && trade.outcome) {
      if (trade.outcome === 'win') {
        user.wallet.usdt -= (trade.total + (trade.profitAmount || 0));
        user.tradingStats.profitLoss -= (trade.profitAmount || 0);
      } else if (trade.outcome === 'loss') {
        user.tradingStats.profitLoss += trade.total;
      }
    }

    // Apply new outcome
    trade.outcome = outcome;
    trade.status = 'completed';

    if (outcome === 'win') {
      const profitAmount = trade.total * ((trade.profitPercent || 13) / 100);
      trade.profitAmount = profitAmount;
      user.wallet.usdt += (trade.total + profitAmount);
      user.tradingStats.profitLoss += profitAmount;
    } else {
      trade.profitAmount = 0;
      user.tradingStats.profitLoss -= trade.total;
    }

    user.markModified('wallet');
    user.markModified('tradingStats');
    await user.save();
    await trade.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await trade.populate('userId', 'email fullName profilePicture');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${trade.userId}`).emit('trade_updated', populated);
      io.to(`user_${trade.userId}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: `Trade outcome updated to ${outcome}`, trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;