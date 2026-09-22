const WebSocket = require('ws');
const axios = require('axios');

const COINS = [
  { symbol: 'BTC/USDT', binanceSymbol: 'btcusdt', coinbaseSymbol: 'BTC-USD' },
  { symbol: 'ETH/USDT', binanceSymbol: 'ethusdt', coinbaseSymbol: 'ETH-USD' },
  { symbol: 'SOL/USDT', binanceSymbol: 'solusdt', coinbaseSymbol: 'SOL-USD' },
  { symbol: 'XRP/USDT', binanceSymbol: 'xrpusdt', coinbaseSymbol: 'XRP-USD' },
  { symbol: 'ADA/USDT', binanceSymbol: 'adausdt', coinbaseSymbol: 'ADA-USD' },
  { symbol: 'DOGE/USDT', binanceSymbol: 'dogeusdt', coinbaseSymbol: 'DOGE-USD' },
  { symbol: 'BNB/USDT', binanceSymbol: 'bnbusdt', coinbaseSymbol: 'BNB-USD' },
  { symbol: 'AVAX/USDT', binanceSymbol: 'avaxusdt', coinbaseSymbol: 'AVAX-USD' },
  { symbol: 'LINK/USDT', binanceSymbol: 'linkusdt', coinbaseSymbol: 'LINK-USD' },
  { symbol: 'DOT/USDT', binanceSymbol: 'dotusdt', coinbaseSymbol: 'DOT-USD' },
  { symbol: 'LTC/USDT', binanceSymbol: 'ltcusdt', coinbaseSymbol: 'LTC-USD' },
  { symbol: 'SHIB/USDT', binanceSymbol: 'shibusdt', coinbaseSymbol: 'SHIB-USD' },
  { symbol: 'UNI/USDT', binanceSymbol: 'uniusdt', coinbaseSymbol: 'UNI-USD' },
  { symbol: 'ATOM/USDT', binanceSymbol: 'atomusdt', coinbaseSymbol: 'ATOM-USD' },
  { symbol: 'XLM/USDT', binanceSymbol: 'xlmusdt', coinbaseSymbol: 'XLM-USD' },
  { symbol: 'ETC/USDT', binanceSymbol: 'etcusdt', coinbaseSymbol: 'ETC-USD' },
  { symbol: 'FIL/USDT', binanceSymbol: 'filusdt', coinbaseSymbol: 'FIL-USD' },
  { symbol: 'NEAR/USDT', binanceSymbol: 'nearusdt', coinbaseSymbol: 'NEAR-USD' },
  { symbol: 'ALGO/USDT', binanceSymbol: 'algousdt', coinbaseSymbol: 'ALGO-USD' },
  { symbol: 'VET/USDT', binanceSymbol: 'vetusdt', coinbaseSymbol: 'VET-USD' },
  { symbol: 'ICP/USDT', binanceSymbol: 'icpusdt', coinbaseSymbol: 'ICP-USD' },
  { symbol: 'MANA/USDT', binanceSymbol: 'manausdt', coinbaseSymbol: 'MANA-USD' },
  { symbol: 'SAND/USDT', binanceSymbol: 'sandusdt', coinbaseSymbol: 'SAND-USD' },
  { symbol: 'AXS/USDT', binanceSymbol: 'axsusdt', coinbaseSymbol: 'AXS-USD' },
  { symbol: 'THETA/USDT', binanceSymbol: 'thetausdt', coinbaseSymbol: 'THETA-USD' },
  { symbol: 'FTM/USDT', binanceSymbol: 'ftmusdt', coinbaseSymbol: 'FTM-USD' },
  { symbol: 'EGLD/USDT', binanceSymbol: 'egldusdt', coinbaseSymbol: 'EGLD-USD' },
  { symbol: 'XTZ/USDT', binanceSymbol: 'xtzusdt', coinbaseSymbol: 'XTZ-USD' }
];

let socket = null;
let openPrices = {}; // map symbol -> open price from stats
let latestPrices = COINS.map(coin => ({
  symbol: coin.symbol,
  price: 0,
  change24h: '0.00', // will be updated per ticker using stored open price
  volume: '0.00'
}));

async function fetchInitialPrices() {
  try {
    console.log('Fetching initial prices from Coinbase REST API...');
    // Fetch ticker for each coin from Coinbase
    const pricePromises = COINS.map(async coin => {
    try {
      const [tickerResp, statsResp] = await Promise.all([
        axios.get(`https://api.exchange.coinbase.com/products/${coin.coinbaseSymbol}/ticker`, { headers: { 'User-Agent': 'trading-app', 'Accept': 'application/json' } }),
        axios.get(`https://api.exchange.coinbase.com/products/${coin.coinbaseSymbol}/stats`, { headers: { 'User-Agent': 'trading-app', 'Accept': 'application/json' } })
      ]);
      const ticker = tickerResp.data;
      const stats = statsResp.data;
      const price = parseFloat(ticker.price);
      const open = parseFloat(stats.open);
      // Store open price for later change calculation
      openPrices[coin.symbol] = open;
      const change = open ? ((price - open) / open * 100).toFixed(2) : '0.00';
      return {
        symbol: coin.symbol,
        price,
        change24h: change,
        volume: parseFloat(ticker.last_size || 0).toFixed(2)
      };
    } catch (e) {
      // Fallback to Bitstamp REST API
      const pair = coin.symbol.replace('/', '').toLowerCase();
      const bsResp = await axios.get(`https://www.bitstamp.net/api/v2/ticker/${pair}/`);
      const data = bsResp.data;
      return {
        symbol: coin.symbol,
        price: parseFloat(data.last),
        change24h: '0.00',
        volume: parseFloat(data.volume).toFixed(2)
      };
    }
  });
  const results = await Promise.all(pricePromises);
    results.forEach(data => {
      const priceIndex = latestPrices.findIndex(p => p.symbol === data.symbol);
      if (priceIndex !== -1) {
        latestPrices[priceIndex] = data;
      }
    });
    console.log('Initial prices loaded successfully');
  } catch (error) {
    console.error('Error fetching initial prices:', error.message);
  }
}

function startPriceFeed(io) {
  let throttleTimer = null;
  function broadcastUpdate() {
    if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        io.emit('priceUpdate', latestPrices);
        throttleTimer = null;
      }, 2500);
    }
  }

  // Coinbase uses a single endpoint for all product ticker updates
  const url = `wss://ws-feed.exchange.coinbase.com`;

  async function connect() {
    await fetchInitialPrices();
    
    // Broadcast initial prices
    io.emit('priceUpdate', latestPrices);

    console.log('Connecting to Coinbase WebSocket...');
    socket = new WebSocket(url);

    socket.on('open', () => {
      console.log('Connected to Coinbase WebSocket');
      // Subscribe to ticker channel for all product IDs
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: COINS.map(c => c.coinbaseSymbol),
        channels: ['ticker']
      };
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(subscribeMsg));
      }
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Coinbase ticker messages have type 'ticker'
        if (message.type !== 'ticker') return;
        const coin = COINS.find(c => c.coinbaseSymbol === message.product_id);

        if (coin) {
          const priceIndex = latestPrices.findIndex(p => p.symbol === coin.symbol);
          if (priceIndex !== -1) {
            const open = openPrices[coin.symbol] || 0;
            const change = open ? ((parseFloat(message.price) - open) / open * 100).toFixed(2) : '0.00';
            latestPrices[priceIndex] = {
              symbol: coin.symbol,
              price: parseFloat(message.price),
              // Compute 24h change using stored open price
              change24h: change,
              volume: parseFloat(message.last_size || 0).toFixed(2)
            };
            
            // Broadcast update
            broadcastUpdate();
          }
        }
      } catch (error) {
        console.error('Error processing Coinbase message:', error.message);
      }
    });

    // WebSocket error handling – fall back to Bitstamp if Coinbase fails
    socket.on('error', (error) => {
      console.error('Coinbase WebSocket error:', error.message);
      console.log('Falling back to Bitstamp WebSocket...');
      // Close existing socket and connect to Bitstamp
      try { if (socket) socket.close(); } catch (_) {}
      connectBitstamp();
    });

    function connectBitstamp() {
      const bitstampUrl = 'wss://ws.bitstamp.net';
      let bsSocket;
      try {
        bsSocket = new WebSocket(bitstampUrl);
      } catch (e) {
        console.error('Failed to create Bitstamp WebSocket:', e.message);
        console.log('Retrying price feed in 30 seconds...');
        setTimeout(connect, 30000);
        return;
      }

      // ⚠️ Must add error handler BEFORE any network call to prevent uncaught crash
      bsSocket.on('error', (err) => {
        console.error('Bitstamp WebSocket error:', err.message);
        console.log('Both price feeds unavailable. Retrying in 30 seconds...');
        try { bsSocket.terminate(); } catch (_) {}
        setTimeout(connect, 30000);
      });

      bsSocket.on('open', () => {
        console.log('Connected to Bitstamp WebSocket');
        // Subscribe to live ticker for each pair
        COINS.forEach(coin => {
          const pair = coin.symbol.replace('/', '').toLowerCase();
          bsSocket.send(JSON.stringify({
            event: 'bts:subscribe',
            data: { channel: `live_trades_${pair}` }
          }));
        });
      });
      bsSocket.on('message', (msg) => {
        try {
          const data = JSON.parse(msg);
          if (data.event !== 'trade') return;
          const productId = data.data?.currency_pair?.replace('_', '-').toUpperCase();
          const coin = COINS.find(c => c.symbol.replace('/', '-') === productId);
          if (!coin) return;
          const priceIndex = latestPrices.findIndex(p => p.symbol === coin.symbol);
          if (priceIndex !== -1) {
            latestPrices[priceIndex] = {
              symbol: coin.symbol,
              price: parseFloat(data.data.price),
              change24h: latestPrices[priceIndex].change24h, // keep existing change if present
              volume: parseFloat(data.data.amount).toFixed(2)
            };
            broadcastUpdate();
          }
        } catch (e) {
          console.error('Error processing Bitstamp message:', e.message);
        }
      });
      bsSocket.on('close', () => {
        console.log('Bitstamp WebSocket closed, retrying in 10s');
        setTimeout(connectBitstamp, 10000);
      });
    }

    socket.on('close', (code, reason) => {
      console.log(`Coinbase WebSocket closed (${code}: ${reason}). Reconnecting in 5 seconds...`);
      setTimeout(connect, 5000);
    });
  }

  connect();
}

module.exports = {
  startPriceFeed,
  getLatestPrices: () => latestPrices
};
