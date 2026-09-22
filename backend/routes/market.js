const express = require('express');
const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');
const router = express.Router();

// Simple in-memory cache for market data (klines)
const klineCache = new Map();
const KLINE_CACHE_TTL = 10000; // 10 seconds

// Get system settings (Market Cap, Volume, etc)
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get market data from external API (using CoinGecko as example)
router.get('/prices', async (req, res) => {
  try {
    // In production, use real API
    // const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
    
    // Mock data for development
    const mockData = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 70587.31,
        market_cap: 1380000000000,
        market_cap_rank: 1,
        price_change_percentage_24h: -0.97,
        total_volume: 30486232104
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 2115.23,
        market_cap: 254000000000,
        market_cap_rank: 2,
        price_change_percentage_24h: -1.9,
        total_volume: 14987043210
      },
      {
        id: 'solana',
        symbol: 'sol',
        name: 'Solana',
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        current_price: 106.45,
        market_cap: 46000000000,
        market_cap_rank: 5,
        price_change_percentage_24h: -1.04,
        total_volume: 379644412
      },
      {
        id: 'ripple',
        symbol: 'xrp',
        name: 'XRP',
        image: 'https://assets.coingecko.com/coins/images/44/large/xrp.png',
        current_price: 0.52,
        market_cap: 28000000000,
        market_cap_rank: 6,
        price_change_percentage_24h: -0.78,
        total_volume: 274422594
      },
      {
        id: 'cardano',
        symbol: 'ada',
        name: 'Cardano',
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        current_price: 0.37,
        market_cap: 13000000000,
        market_cap_rank: 9,
        price_change_percentage_24h: -0.57,
        total_volume: 48003066
      }
    ];
    
    res.json(mockData);
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});

// Get order book for specific pair
router.get('/orderbook/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    
    // Generate mock order book
    const generateOrderBook = () => {
      const basePrice = pair.includes('BTC') ? 70000 : 
                       pair.includes('ETH') ? 2100 : 100;
      
      const bids = [];
      const asks = [];
      
      for (let i = 0; i < 10; i++) {
        const bidPrice = basePrice - Math.random() * 100;
        const askPrice = basePrice + Math.random() * 100;
        
        bids.push({
          price: bidPrice,
          amount: Math.random() * 5,
          total: bidPrice * Math.random() * 5
        });
        
        asks.push({
          price: askPrice,
          amount: Math.random() * 5,
          total: askPrice * Math.random() * 5
        });
      }
      
      return {
        bids: bids.sort((a, b) => b.price - a.price),
        asks: asks.sort((a, b) => a.price - b.price)
      };
    };
    
    res.json(generateOrderBook());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trading pairs
router.get('/pairs', async (req, res) => {
  try {
    const pairs = [
      { symbol: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104 },
      { symbol: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210 },
      { symbol: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412 },
      { symbol: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594 },
      { symbol: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066 },
      { symbol: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567 },
      { symbol: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267 },
      { symbol: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235 }
    ];
    
    res.json(pairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Coinbase Candles (OHLCV) Proxy — used by TradingChart for historical candles
// GET /api/market/klines?symbol=BTCUSDT&interval=1m&limit=500
// ---------------------------------------------------------------------------

// Map Binance-style intervals → Coinbase granularity (seconds)
// Coinbase supported: 60, 300, 900, 3600, 21600, 86400
const COINBASE_GRANULARITY_MAP = {
  '1m':  60,
  '5m':  300,
  '15m': 900,
  '1h':  3600,
  '4h':  21600,  // Coinbase doesn't support 4h; use 6h (21600) as closest
  '6h':  21600,
  '1d':  86400,
};

// Convert BTCUSDT → BTC-USD for Coinbase product IDs
function toCoinbaseSymbol(symbol) {
  // Strip trailing USDT/USD and rebuild as BASE-USD
  const base = symbol.replace(/USDT$/, '').replace(/USD$/, '');
  return `${base}-USD`;
}

router.get('/klines', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1m', limit = 500 } = req.query;

    // Sanitize inputs
    const safeSymbol   = String(symbol).replace(/[^A-Z0-9]/g, '').toUpperCase();
    const safeInterval = String(interval).replace(/[^0-9a-zA-Z]/g, '');
    const safeLimit    = Math.min(Math.max(parseInt(limit, 10) || 500, 1), 1000);

    // Map to Coinbase granularity in seconds (default to 60 if unrecognised)
    const granularity = COINBASE_GRANULARITY_MAP[safeInterval] || 60;

    // Convert symbol format: BTCUSDT → BTC-USD
    const coinbaseSymbol = toCoinbaseSymbol(safeSymbol);

    // Check cache first
    const cacheKey = `${safeSymbol}_${safeInterval}_${safeLimit}`;
    const cachedEntry = klineCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < KLINE_CACHE_TTL)) {
      return res.json(cachedEntry.data);
    }

    // Coinbase Exchange candles endpoint
    // Response: [[time(unix), low, high, open, close, volume], ...] — newest first
    const response = await axios.get(
      `https://api.exchange.coinbase.com/products/${coinbaseSymbol}/candles`,
      {
        params: { granularity, limit: safeLimit },
        timeout: 10000,
        headers: {
          'User-Agent': 'NexVor/1.0',
          'Accept':     'application/json',
        },
      }
    );

    const rawList = response.data;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Unexpected response from Coinbase candles API');
    }

    // Transform Coinbase candle format into lightweight-charts format:
    // Each entry: [time(unix sec), low, high, open, close, volume]
    // Coinbase returns newest-first → reverse to get oldest-first for the chart
    const candles = rawList
      .slice()
      .reverse()
      .map(k => ({
        time:   k[0],            // already Unix seconds
        open:   parseFloat(k[3]),
        high:   parseFloat(k[2]),
        low:    parseFloat(k[1]),
        close:  parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));

    // Save to cache
    klineCache.set(cacheKey, { timestamp: Date.now(), data: candles });

    res.json(candles);
  } catch (error) {
    console.error('Klines proxy error:', error.message);
    res.status(502).json({ message: 'Failed to fetch klines from Coinbase', error: error.message });
  }
});

module.exports = router;