const Trade = require('../models/Trade');
const User = require('../models/User');
const Match = require('../models/Match');
const WalletTransaction = require('../models/WalletTransaction');

async function generateAndEmitOrderBook(pair, io) {
  try {
    const asks = await Trade.aggregate([
      { $match: { pair, tradeMode: 'spot', type: 'sell', status: 'pending' } },
      { $group: { _id: "$price", total: { $sum: { $subtract: ["$amount", "$filledAmount"] } } } },
      { $sort: { _id: 1 } },
      { $limit: 20 }
    ]);
    const bids = await Trade.aggregate([
      { $match: { pair, tradeMode: 'spot', type: 'buy', status: 'pending' } },
      { $group: { _id: "$price", total: { $sum: { $subtract: ["$amount", "$filledAmount"] } } } },
      { $sort: { _id: -1 } },
      { $limit: 20 }
    ]);
    
    io.emit(`orderbook_${pair}`, { asks: asks.reverse(), bids });
  } catch(e) {
    console.error('Error generating order book:', e);
  }
}

async function matchOrder(order, io) {
  if (order.tradeMode !== 'spot' || order.status !== 'pending') return;

  const isBuy = order.type === 'buy';
  const oppositeSide = isBuy ? 'sell' : 'buy';
  const currency = order.pair.split('/')[0].toLowerCase();
  
  let query = {
    pair: order.pair,
    type: oppositeSide,
    tradeMode: 'spot',
    status: 'pending'
  };

  if (order.orderType === 'limit') {
    if (isBuy) {
      query.price = { $lte: order.price };
    } else {
      query.price = { $gte: order.price };
    }
  }

  const sort = isBuy ? { price: 1, createdAt: 1 } : { price: -1, createdAt: 1 };
  
  while (order.status === 'pending' && order.filledAmount < order.amount) {
    const remainingToFill = order.amount - order.filledAmount;

    const makerOrder = await Trade.findOne(query).sort(sort);
    if (!makerOrder) break;

    const makerRemaining = makerOrder.amount - makerOrder.filledAmount;
    
    const matchAmount = Math.min(remainingToFill, makerRemaining);
    const matchPrice = makerOrder.price;
    const matchTotal = matchAmount * matchPrice;

    const updatedMaker = await Trade.findOneAndUpdate(
      { _id: makerOrder._id, status: 'pending', filledAmount: makerOrder.filledAmount },
      {
        $inc: { filledAmount: matchAmount },
        $set: { status: (makerOrder.filledAmount + matchAmount >= makerOrder.amount) ? 'completed' : 'pending' }
      },
      { new: true }
    );

    if (!updatedMaker) {
      continue;
    }

    order.filledAmount += matchAmount;
    const prevTotal = (order.filledAmount - matchAmount) * (order.averagePrice || 0);
    order.averagePrice = (prevTotal + matchTotal) / order.filledAmount;

    if (order.filledAmount >= order.amount) {
      order.status = 'completed';
    }
    await order.save();
    
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    const feeRate = (settings?.spotFee || 0.1) / 100;

    const settleUser = async (tradeId, userId, type, amountCur, amountUsdt, originalPrice, fillPrice) => {
      const feeCur = type === 'buy' ? amountCur * feeRate : 0;
      const feeUsdt = type === 'sell' ? amountUsdt * feeRate : 0;

      const updateObj = { $inc: {} };
      if (type === 'buy') {
        const reservedUsdt = matchAmount * originalPrice;
        const actualCostUsdt = matchAmount * fillPrice;
        const refundUsdt = reservedUsdt - actualCostUsdt;

        updateObj.$inc[`lockedWallet.usdt`] = -reservedUsdt;
        updateObj.$inc[`wallet.${currency}`] = amountCur - feeCur;
        if (refundUsdt !== 0) {
          updateObj.$inc[`wallet.usdt`] = refundUsdt;
        }
      } else {
        updateObj.$inc[`lockedWallet.${currency}`] = -matchAmount;
        updateObj.$inc[`wallet.usdt`] = amountUsdt - feeUsdt;
      }

      const u = await User.findByIdAndUpdate(userId, updateObj, { new: true });
      await Trade.findByIdAndUpdate(tradeId, { $inc: { fee: feeCur || feeUsdt } });
      
      if (io && u) io.to(`user_${u._id}`).emit('balance_updated', { wallet: u.wallet, lockedWallet: u.lockedWallet });
    };

    await settleUser(makerOrder._id, makerOrder.userId, makerOrder.type, matchAmount, matchTotal, makerOrder.price, matchPrice);
    await settleUser(order._id, order.userId, order.type, matchAmount, matchTotal, order.price, matchPrice);

    const matchRecord = await Match.create({
      makerOrderId: makerOrder._id,
      takerOrderId: order._id,
      makerUserId: makerOrder.userId,
      takerUserId: order.userId,
      pair: order.pair,
      price: matchPrice,
      amount: matchAmount,
      makerSide: makerOrder.type
    });

    if (io) {
      io.emit(`recent_trades_${order.pair}`, [matchRecord]);
      const popMaker = await Trade.findById(makerOrder._id).populate('userId', 'email fullName profilePicture');
      const popTaker = await Trade.findById(order._id).populate('userId', 'email fullName profilePicture');
      
      io.to(`user_${makerOrder.userId}`).emit('trade_updated', popMaker);
      io.to(`user_${order.userId}`).emit('trade_updated', popTaker);
    }
  }

  // If Market Order and not fully filled, fill it against the house
  if (order.orderType === 'market' && order.status === 'pending') {
    const unfilled = order.amount - order.filledAmount;
    
    order.filledAmount = order.amount;
    order.status = 'completed';
    await order.save();

    const fillPrice = order.price;
    const matchAmount = unfilled;
    const matchTotal = unfilled * fillPrice;

    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    const feeRate = (settings?.spotFee || 0.1) / 100;

    const feeCur = order.type === 'buy' ? matchAmount * feeRate : 0;
    const feeUsdt = order.type === 'sell' ? matchTotal * feeRate : 0;

    const updateObj = { $inc: {} };
    if (order.type === 'buy') {
      const reservedUsdt = matchAmount * order.price;
      updateObj.$inc[`lockedWallet.usdt`] = -reservedUsdt;
      updateObj.$inc[`wallet.${currency}`] = matchAmount - feeCur;
    } else {
      updateObj.$inc[`lockedWallet.${currency}`] = -matchAmount;
      updateObj.$inc[`wallet.usdt`] = matchTotal - feeUsdt;
    }

    const u = await User.findByIdAndUpdate(order.userId, updateObj, { new: true });
    const taker = await Trade.findByIdAndUpdate(order._id, { $inc: { fee: feeCur || feeUsdt } }, { new: true }).populate('userId', 'email fullName profilePicture');
    
    const matchRecord = await Match.create({
      makerOrderId: order._id,
      takerOrderId: order._id,
      makerUserId: order.userId,
      takerUserId: order.userId,
      pair: order.pair,
      price: fillPrice,
      amount: matchAmount,
      makerSide: order.type === 'buy' ? 'sell' : 'buy'
    });

    if (io) {
      io.emit(`recent_trades_${order.pair}`, [matchRecord]);
      io.to(`user_${order.userId}`).emit('trade_updated', taker);
      if (u) io.to(`user_${u._id}`).emit('balance_updated', { wallet: u.wallet, lockedWallet: u.lockedWallet });
    }
  }

  if (io) {
    generateAndEmitOrderBook(order.pair, io);
  }
}

module.exports = { matchOrder, generateAndEmitOrderBook };
