export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
export const CURRENCIES = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  { symbol: 'USDT', name: 'Tether', icon: '💵', color: '#26A17B' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#00FFA3' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F' },
  { symbol: 'ADA', name: 'Cardano', icon: 'A', color: '#0033AD' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', color: '#C2A633' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', color: '#E6007A' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł', color: '#345D9D' },
  { symbol: 'BNB', name: 'Binance Coin', icon: 'B', color: '#F3BA2F' },
  { symbol: 'MATIC', name: 'Polygon', icon: 'M', color: '#8247E5' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'A', color: '#E84142' },
  { symbol: 'LINK', name: 'Chainlink', icon: 'L', color: '#2A5ADA' },
  { symbol: 'SHIB', name: 'Shiba Inu', icon: 'S', color: '#E64600' },
  { symbol: 'TRX', name: 'Tron', icon: 'T', color: '#FF0013' },
  { symbol: 'UNI', name: 'Uniswap', icon: 'U', color: '#FF007A' },
  { symbol: 'ATOM', name: 'Cosmos', icon: 'A', color: '#2E3148' },
  { symbol: 'XLM', name: 'Stellar', icon: 'X', color: '#14B6E7' },
  { symbol: 'ETC', name: 'Ethereum Classic', icon: 'E', color: '#328332' },
  { symbol: 'FIL', name: 'Filecoin', icon: 'F', color: '#0090FF' },
  { symbol: 'NEAR', name: 'NEAR Protocol', icon: 'N', color: '#000000' },
  { symbol: 'ALGO', name: 'Algorand', icon: 'A', color: '#000000' },
  { symbol: 'VET', name: 'VeChain', icon: 'V', color: '#15BDFF' },
  { symbol: 'ICP', name: 'Internet Computer', icon: 'I', color: '#29ABE2' },
  { symbol: 'MANA', name: 'Decentraland', icon: 'M', color: '#FF2D55' },
  { symbol: 'SAND', name: 'The Sandbox', icon: 'S', color: '#00ADEF' },
  { symbol: 'AXS', name: 'Axie Infinity', icon: 'A', color: '#0055D5' },
  { symbol: 'THETA', name: 'Theta Network', icon: 'T', color: '#2AB8E6' },
  { symbol: 'FTM', name: 'Fantom', icon: 'F', color: '#1969FF' },
  { symbol: 'EGLD', name: 'Elrond', icon: 'E', color: '#1D1D2C' },
  { symbol: 'XTZ', name: 'Tezos', icon: 'X', color: '#2C7DF7' },
];

export const TRADING_PAIRS = [
  { pair: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104 },
  { pair: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210 },
  { pair: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412 },
  { pair: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594 },
  { pair: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066 },
  { pair: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567 },
  { pair: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267 },
  { pair: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235 },
];

export const NETWORKS = {
  'BTC': ['BTC Network', 'BEP20'],
  'ETH': ['ERC20', 'BEP20'],
  'USDT': ['ERC20', 'BEP20', 'BNB'],
  'SOL': ['SOL Network'],
};

export const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit'];
export const TRADE_SIDES = ['buy', 'sell'];
export const LEVERAGE_OPTIONS = [1, 3, 5, 10, 25, 50, 75, 100];

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUBMITTED: 'submitted',
};

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRADE: 'trade',
  TRANSFER: 'transfer',
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const CHART_TIME_FRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
  { label: '1w', value: '1w' },
];

export const INDICATORS = [
  'MA', 'EMA', 'MACD', 'RSI', 'Bollinger Bands', 'Volume'
];