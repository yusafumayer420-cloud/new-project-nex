import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  TrendingDown,
  FilterList,
  Refresh,
  ShowChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket from '../socket';
import TopGainersMarquee from '../components/TopGainersMarquee';
import Sparkline from '../components/Sparkline';
import { AnimatePresence } from 'framer-motion';

const MarketPage = ({ marketData }) => {
  const navigate = useNavigate();

  const coinMeta = {
    BTC: { color: '#F7931A', text: '₿' }, ETH: { color: '#627EEA', text: 'Ξ' },
    SOL: { color: '#9945FF', text: 'S' }, XRP: { color: '#00AAE4', text: 'X' },
    ADA: { color: '#0D1E2D', text: 'A' }, DOGE: { color: '#C2A633', text: 'D' },
    DOT: { color: '#E6007A', text: '●' }, LTC: { color: '#BFBBBB', text: 'Ł' },
    BNB: { color: '#F3BA2F', text: 'B' }, EGLD: { color: '#1B46C2', text: 'E' },
    AVAX: { color: '#E84142', text: 'A' }, LINK: { color: '#2A5ADA', text: '🔗' },
    UNI: { color: '#FF007A', text: 'U' }, ATOM: { color: '#2E3148', text: 'A' },
    FTM: { color: '#1969FF', text: 'F' }, NEAR: { color: '#000000', text: 'N' },
    ICP: { color: '#29ABE2', text: 'I' }, FIL: { color: '#0090FF', text: 'F' },
    AAVE: { color: '#B6509E', text: 'A' }, XTZ: { color: '#2C7DF7', text: 'T' },
    MANA: { color: '#FF2D55', text: 'M' }, SAND: { color: '#04ADEF', text: 'S' },
    AXS: { color: '#0055D5', text: 'A' }, THETA: { color: '#2AB8E6', text: 'T' },
    ETC: { color: '#328332', text: 'E' }, ALGO: { color: '#000000', text: 'A' },
    VET: { color: '#15BDFF', text: 'V' }, HBAR: { color: '#222222', text: 'H' },
    EOS: { color: '#000000', text: 'E' }, SHIB: { color: '#FFA409', text: '🐕' },
    PEPE: { color: '#009F3E', text: 'P' }, ARB: { color: '#12AAFF', text: 'A' },
    OP: { color: '#FF0420', text: 'O' }, SUI: { color: '#6FBCF0', text: 'S' },
    APT: { color: '#00C2FF', text: 'A' }, INJ: { color: '#00A3FF', text: 'I' },
    SEI: { color: '#9D1C1C', text: 'S' }, TIA: { color: '#7B2BF9', text: 'T' },
    RENDER: { color: '#A259FF', text: 'R' }, FET: { color: '#1D2D45', text: 'F' },
    TAO: { color: '#333333', text: 'T' }, WIF: { color: '#9945FF', text: 'W' },
    TON: { color: '#0088CC', text: 'T' }, XLM: { color: '#000000', text: '*' },
    BCH: { color: '#8DC351', text: 'B' }, LDO: { color: '#F7931A', text: 'L' },
    STX: { color: '#5546FF', text: 'S' }, IMX: { color: '#17B5CB', text: 'I' },
    GRT: { color: '#6F4CBA', text: 'G' }, RNDR: { color: '#A259FF', text: 'R' },
    MKR: { color: '#1AAB9B', text: 'M' }, GALA: { color: '#000000', text: 'G' },
    QNT: { color: '#1E2B53', text: 'Q' }, SNX: { color: '#00D1FF', text: 'S' },
    ASTR: { color: '#E6007A', text: 'A' }, MINA: { color: '#E39844', text: 'M' },
    FXS: { color: '#000000', text: 'F' }, DYDX: { color: '#6966FF', text: 'D' },
    COMP: { color: '#00D395', text: 'C' }, CRV: { color: '#FF0000', text: 'C' },
    CHZ: { color: '#CD0124', text: 'C' }, USDT: { color: '#26A17B', text: 'T' },
    USDC: { color: '#2775CA', text: '$' }, BTS: { color: '#F7931A', text: 'B' },
  };

  const CoinIcon = ({ symbol, size = 32, mr = 1.5 }) => {
    const sym = (symbol || '').toUpperCase().split('/')[0];
    const meta = coinMeta[sym] || { color: '#4F7CFF', text: sym.charAt(0) };
    const [imgFailed, setImgFailed] = React.useState(false);

    let imgSrc = null;
    if (!imgFailed) {
      try {
        imgSrc = require(`cryptocurrency-icons/svg/color/${sym.toLowerCase()}.svg`);
      } catch (e) {
        // icon not in package, use colored avatar
      }
    }

    return (
      <Avatar
        src={imgSrc || undefined}
        onError={() => setImgFailed(true)}
        sx={{
          width: size, height: size, mr,
          bgcolor: imgSrc && !imgFailed ? 'transparent' : meta.color,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          fontSize: size * 0.44,
          fontWeight: 800,
          '& img': { objectFit: 'contain', p: '4px' },
        }}
      >
        {meta.text}
      </Avatar>
    );
  };

  const sparklinesRef = React.useRef({});
  const lastUpdateRef = React.useRef({});
  const lastSortTimeRef = React.useRef(0);
  const currentOrderRef = React.useRef([]);
  const lastConfigRef = React.useRef({});
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filteredPairs, setFilteredPairs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [marketStats, setMarketStats] = useState({
    marketCap: '$2.4T',
    volume24h: '$64B',
    btcDominance: '51.2%'
  });

  useEffect(() => {
    const fetchMarketStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/market/settings`);
        const data = await response.json();
        if (data) {
          setMarketStats(prev => ({
            marketCap: data.marketCap || prev.marketCap,
            volume24h: data.volume24h || prev.volume24h,
            btcDominance: data.btcDominance || prev.btcDominance
          }));
        }
      } catch (error) {
        console.error('Failed to fetch market stats:', error);
      }
    };
    fetchMarketStats();
  }, []);

  // Helper to generate mock sparkline data
  const generateSparklineData = (basePrice, count = 20) => {
    const data = [];
    let current = basePrice * 0.95;
    for (let i = 0; i < count; i++) {
      current = current * (1 + (Math.random() - 0.48) * 0.02);
      data.push(current);
    }
    return data;
  };

  const tabs = ['Cryptos', 'ETF', 'Forex', 'US Stocks', 'HK Stock'];

  const mockCryptoData = [
    { pair: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104, marketCap: 1380000000000 },
    { pair: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210, marketCap: 254000000000 },
    { pair: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412, marketCap: 46000000000 },
    { pair: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594, marketCap: 28000000000 },
    { pair: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066, marketCap: 13000000000 },
    { pair: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567, marketCap: 14000000000 },
    { pair: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267, marketCap: 8300000000 },
    { pair: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235, marketCap: 4100000000 },
    { pair: 'BNB/USDT', price: 585.42, change24h: 0.45, volume: 1487543210, marketCap: 90000000000 },
    { pair: 'EGLD/USDT', price: 44.21, change24h: 1.23, volume: 425678432, marketCap: 4900000000 },
    { pair: 'AVAX/USDT', price: 36.85, change24h: -0.89, volume: 325678432, marketCap: 13600000000 },
    { pair: 'LINK/USDT', price: 14.32, change24h: 2.15, volume: 456783210, marketCap: 8400000000 },
    { pair: 'UNI/USDT', price: 7.82, change24h: 1.45, volume: 187654321, marketCap: 5900000000 },
    { pair: 'ATOM/USDT', price: 8.96, change24h: -1.11, volume: 145678432, marketCap: 3500000000 },
    { pair: 'FTM/USDT', price: 0.6994, change24h: -0.77, volume: 198765432, marketCap: 1960000000 },
    { pair: 'NEAR/USDT', price: 5.23, change24h: 2.34, volume: 234567890, marketCap: 5400000000 },
    { pair: 'ICP/USDT', price: 12.42, change24h: -5.72, volume: 156789012, marketCap: 5700000000 },
    { pair: 'FIL/USDT', price: 5.67, change24h: -1.89, volume: 178654321, marketCap: 3200000000 },
    { pair: 'AAVE/USDT', price: 92.15, change24h: 3.21, volume: 123456789, marketCap: 1350000000 },
    { pair: 'XTZ/USDT', price: 0.2425, change24h: 1.13, volume: 276543210, marketCap: 2100000000 },
    { pair: 'MANA/USDT', price: 0.0693, change24h: 1.32, volume: 487654321, marketCap: 4800000000 },
    { pair: 'SAND/USDT', price: 0.4812, change24h: -0.56, volume: 198765432, marketCap: 2100000000 },
    { pair: 'AXS/USDT', price: 0.9940, change24h: 0.51, volume: 156789012, marketCap: 1500000000 },
    { pair: 'THETA/USDT', price: 0.1625, change24h: -1.99, volume: 334567890, marketCap: 3300000000 },
    { pair: 'ETC/USDT', price: 7.37, change24h: 1.51, volume: 87654321, marketCap: 3400000000 },
    { pair: 'ALGO/USDT', price: 0.1834, change24h: -0.92, volume: 134567890, marketCap: 1500000000 },
    { pair: 'VET/USDT', price: 0.0312, change24h: 0.89, volume: 167890123, marketCap: 2300000000 },
    { pair: 'HBAR/USDT', price: 0.0745, change24h: 1.67, volume: 145678901, marketCap: 2700000000 },
    { pair: 'EOS/USDT', price: 0.7823, change24h: -0.34, volume: 112345678, marketCap: 870000000 },
    { pair: 'SHIB/USDT', price: 0.00001745, change24h: 2.34, volume: 567890123, marketCap: 10300000000 },
    { pair: 'PEPE/USDT', price: 0.00001123, change24h: 5.67, volume: 456789012, marketCap: 4700000000 },
    { pair: 'ARB/USDT', price: 1.12, change24h: -2.34, volume: 234567890, marketCap: 3400000000 },
    { pair: 'OP/USDT', price: 2.45, change24h: 1.89, volume: 198765432, marketCap: 2800000000 },
    { pair: 'SUI/USDT', price: 1.34, change24h: 3.45, volume: 312345678, marketCap: 3200000000 },
    { pair: 'APT/USDT', price: 8.67, change24h: -1.23, volume: 178654321, marketCap: 3600000000 },
    { pair: 'INJ/USDT', price: 24.56, change24h: 4.12, volume: 145678901, marketCap: 2300000000 },
    { pair: 'SEI/USDT', price: 0.5234, change24h: 2.78, volume: 123456789, marketCap: 1600000000 },
    { pair: 'TIA/USDT', price: 9.87, change24h: -3.45, volume: 167890123, marketCap: 1900000000 },
    { pair: 'RENDER/USDT', price: 7.89, change24h: 5.23, volume: 198765432, marketCap: 3100000000 },
    { pair: 'FET/USDT', price: 2.13, change24h: 4.56, volume: 234567890, marketCap: 5400000000 },
    { pair: 'TAO/USDT', price: 412.34, change24h: -2.67, volume: 112345678, marketCap: 3000000000 },
    { pair: 'WIF/USDT', price: 2.87, change24h: 8.91, volume: 345678901, marketCap: 2900000000 },
    { pair: 'TON/USDT', price: 6.75, change24h: 1.25, volume: 215436789, marketCap: 23500000000 },
    { pair: 'XLM/USDT', price: 0.1112, change24h: -0.32, volume: 312546879, marketCap: 3100000000 },
    { pair: 'BCH/USDT', price: 456.78, change24h: 2.15, volume: 425136879, marketCap: 8900000000 },
    { pair: 'LDO/USDT', price: 2.15, change24h: -1.45, volume: 95412368, marketCap: 1900000000 },
    { pair: 'STX/USDT', price: 1.85, change24h: 4.56, volume: 125436789, marketCap: 2600000000 },
    { pair: 'IMX/USDT', price: 2.45, change24h: -2.15, volume: 185436789, marketCap: 3500000000 },
    { pair: 'GRT/USDT', price: 0.28, change24h: 3.45, volume: 145123687, marketCap: 2600000000 },
    { pair: 'RNDR/USDT', price: 8.45, change24h: -1.25, volume: 215436789, marketCap: 3200000000 },
    { pair: 'MKR/USDT', price: 2845.67, change24h: 1.85, volume: 98541236, marketCap: 2600000000 },
    { pair: 'GALA/USDT', price: 0.045, change24h: -3.15, volume: 165436789, marketCap: 1600000000 },
    { pair: 'QNT/USDT', price: 115.45, change24h: 0.85, volume: 45123687, marketCap: 1400000000 },
    { pair: 'SNX/USDT', price: 3.25, change24h: -1.45, volume: 54123687, marketCap: 1100000000 },
    { pair: 'ASTR/USDT', price: 0.12, change24h: -0.45, volume: 35412368, marketCap: 650000000 },
    { pair: 'MINA/USDT', price: 1.15, change24h: 1.85, volume: 65412368, marketCap: 1200000000 },
    { pair: 'FXS/USDT', price: 4.85, change24h: -2.15, volume: 25412368, marketCap: 380000000 },
    { pair: 'DYDX/USDT', price: 2.15, change24h: 1.45, volume: 85412368, marketCap: 650000000 },
    { pair: 'COMP/USDT', price: 56.78, change24h: -1.25, volume: 45123687, marketCap: 380000000 },
    { pair: 'CRV/USDT', price: 0.45, change24h: 2.15, volume: 125436789, marketCap: 480000000 },
    { pair: 'CHZ/USDT', price: 0.12, change24h: -0.85, volume: 85412368, marketCap: 1100000000 },
  ];

  const mockETFData = [
    { symbol: 'Germany ETF', price: 1.86, change24h: 0.59, volume: 12543210 },
    { symbol: 'Nikkei ETF', price: 1.46, change24h: 0.07, volume: 9876543 },
    { symbol: 'Nasdaq ETF', price: 1.935, change24h: 0.05, volume: 23456789 },
    { symbol: 'France CAC40', price: 1.668, change24h: 0.37, volume: 8765432 },
    { symbol: 'Gold ETF', price: 7.588, change24h: -0.42, volume: 34567890 },
  ];

  const mockForexData = [
    { symbol: 'EUR/USD', price: 1.0845, change24h: 0.12, volume: 14500000000 },
    { symbol: 'GBP/USD', price: 1.2678, change24h: -0.24, volume: 11200000000 },
    { symbol: 'USD/JPY', price: 150.32, change24h: 0.45, volume: 13800000000 },
    { symbol: 'AUD/USD', price: 0.6543, change24h: -0.15, volume: 6500000000 },
    { symbol: 'USD/CHF', price: 0.8821, change24h: 0.08, volume: 4200000000 },
    { symbol: 'USD/CAD', price: 1.3456, change24h: -0.32, volume: 5100000000 },
    { symbol: 'NZD/USD', price: 0.6123, change24h: 0.18, volume: 3800000000 },
    { symbol: 'EUR/GBP', price: 0.8554, change24h: 0.36, volume: 4700000000 },
    { symbol: 'EUR/JPY', price: 163.02, change24h: 0.57, volume: 5900000000 },
    { symbol: 'GBP/JPY', price: 190.58, change24h: 0.21, volume: 4800000000 },
  ];

  const mockUSStocksData = [
    { symbol: 'AAPL', price: 173.50, change24h: 1.25, volume: 56000000 },
    { symbol: 'MSFT', price: 402.18, change24h: -0.85, volume: 24000000 },
    { symbol: 'GOOGL', price: 144.34, change24h: 0.45, volume: 22000000 },
    { symbol: 'AMZN', price: 175.35, change24h: 2.15, volume: 45000000 },
    { symbol: 'NVDA', price: 822.79, change24h: 4.56, volume: 65000000 },
    { symbol: 'META', price: 485.58, change24h: -1.24, volume: 18000000 },
    { symbol: 'TSLA', price: 198.87, change24h: -3.45, volume: 95000000 },
    { symbol: 'BRK.B', price: 405.12, change24h: 0.12, volume: 3500000 },
    { symbol: 'LLY', price: 780.23, change24h: 1.89, volume: 2800000 },
    { symbol: 'V', price: 280.45, change24h: 0.34, volume: 6500000 },
  ];

  const mockHKStocksData = [
    { symbol: '0700.HK', price: 288.40, change24h: 1.56, volume: 15000000 },
    { symbol: '9988.HK', price: 73.15, change24h: -2.34, volume: 22000000 },
    { symbol: '3690.HK', price: 92.50, change24h: 3.45, volume: 35000000 },
    { symbol: '0941.HK', price: 68.25, change24h: 0.15, volume: 12000000 },
    { symbol: '0005.HK', price: 60.15, change24h: -0.85, volume: 18000000 },
    { symbol: '1299.HK', price: 58.45, change24h: 0.67, volume: 16000000 },
    { symbol: '0883.HK', price: 17.56, change24h: 2.15, volume: 45000000 },
    { symbol: '0939.HK', price: 4.88, change24h: 0.41, volume: 85000000 },
    { symbol: '1398.HK', price: 4.05, change24h: 0.25, volume: 115000000 },
    { symbol: '3988.HK', price: 3.20, change24h: -0.31, volume: 95000000 },
  ];


  useEffect(() => {
    let data = [];
    switch (activeTab) {
      case 0:
        data = marketData.length > 0 ? marketData.filter(p => !p.symbol.includes('ETF')) : mockCryptoData;
        break;
      case 1:
        data = marketData.length > 0 ? marketData.filter(p => p.symbol.includes('ETF')) : mockETFData;
        break;
      case 2:
        data = mockForexData;
        break;
      case 3:
        data = mockUSStocksData;
        break;
      case 4:
        data = mockHKStocksData;
        break;
      default:
        data = marketData.length > 0 ? marketData : mockCryptoData;
    }

    // Filter out zero price coins and MATIC/TRX
    data = data.filter(item => {
      const price = parseFloat(item.price || 0);
      const symbol = item.symbol || item.pair || '';
      return price > 0 && !symbol.includes('MATIC') && !symbol.includes('TRX');
    });

    // Map symbol to pair for UI consistency and add stable sparkline data
    data = data.map(item => {
      const symbol = item.symbol || item.pair;
      
      // Initialize or reuse sparkline data to prevent flickering
      if (!sparklinesRef.current[symbol]) {
        sparklinesRef.current[symbol] = generateSparklineData(item.price);
        lastUpdateRef.current[symbol] = Date.now();
      } else {
        // Only update every 30 seconds to provide a very calm UI
        const now = Date.now();
        if (now - (lastUpdateRef.current[symbol] || 0) > 30000) {
          const currentSpark = [...sparklinesRef.current[symbol]];
          currentSpark.shift();
          currentSpark.push(item.price);
          sparklinesRef.current[symbol] = currentSpark;
          lastUpdateRef.current[symbol] = now;
        }
      }

      return {
        ...item,
        pair: symbol,
        marketCap: item.marketCap || (item.price * 1000000),
        sparkline: sparklinesRef.current[symbol]
      };
    });

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => 
        item.pair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      // Mock category logic for now
      if (selectedCategory === 'Meme') {
        data = data.filter(item => ['DOGE', 'SHIB', 'PEPE', 'WIF'].some(m => item.pair.includes(m)));
      } else if (selectedCategory === 'Layer 1') {
        data = data.filter(item => ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'APT', 'SUI', 'SEI'].some(m => item.pair.includes(m)));
      } else if (selectedCategory === 'DeFi') {
        data = data.filter(item => ['LINK', 'UNI', 'AAVE', 'INJ', 'ARB', 'OP'].some(m => item.pair.includes(m)));
      } else if (selectedCategory === 'AI') {
        data = data.filter(item => ['RENDER', 'FET', 'TAO', 'THETA', 'NEAR'].some(m => item.pair.includes(m)));
      } else if (selectedCategory === 'GameFi') {
        data = data.filter(item => ['AXS', 'MANA', 'SAND', 'ICP'].some(m => item.pair.includes(m)));
      }
    }

    // Apply sorting
    const currentConfig = { activeTab, searchTerm, selectedCategory, sortBy, sortOrder };
    const configString = JSON.stringify(currentConfig);
    const configChanged = configString !== lastConfigRef.current;
    if (configChanged) {
       lastConfigRef.current = configString;
    }

    const now = Date.now();
    let shouldResort = configChanged || (now - lastSortTimeRef.current > 3000) || (data.length !== currentOrderRef.current.length);

    if (shouldResort) {
      data.sort((a, b) => {
        if (activeTab === 0) {
          const isBtcA = a.pair?.startsWith('BTC/');
          const isBtcB = b.pair?.startsWith('BTC/');
          if (isBtcA && !isBtcB) return -1;
          if (!isBtcA && isBtcB) return 1;
          
          const isEthA = a.pair?.startsWith('ETH/');
          const isEthB = b.pair?.startsWith('ETH/');
          if (isEthA && !isEthB) return -1;
          if (!isEthA && isEthB) return 1;
        }

        let aValue, bValue;
        if (sortBy === 'volume') {
          aValue = a.volume || 0;
          bValue = b.volume || 0;
        } else if (sortBy === 'price') {
          aValue = a.price || 0;
          bValue = b.price || 0;
        } else if (sortBy === 'change') {
          aValue = a.change24h || 0;
          bValue = b.change24h || 0;
        } else if (sortBy === 'marketCap') {
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
        }
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
      currentOrderRef.current = data.map(d => d.pair);
      lastSortTimeRef.current = now;
    } else {
      const orderMap = new Map();
      currentOrderRef.current.forEach((pair, index) => {
        orderMap.set(pair, index);
      });
      data.sort((a, b) => {
        const indexA = orderMap.has(a.pair) ? orderMap.get(a.pair) : 999999;
        const indexB = orderMap.has(b.pair) ? orderMap.get(b.pair) : 999999;
        return indexA - indexB;
      });
    }

    if (activeTab === 0) {
      const btcCoin = data.find(c => c.pair?.startsWith('BTC/'));
      if (btcCoin) {
        const btsCoin = { ...btcCoin, pair: 'BTS/USDT', symbol: 'BTS' };
        data = data.filter(c => c.pair !== 'BTS/USDT');
        const insertIndex = Math.max(0, data.length - 2);
        data.splice(insertIndex, 0, btsCoin);
      }
    }

    // Show all coins
    setFilteredPairs(data);
  }, [activeTab, searchTerm, sortBy, sortOrder, marketData]);




  const handleTradeClick = (pair) => {
    navigate(`/trading/${pair.replace('/', '-')}`);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ? '▼' : '▲';
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 12, pt: 0 }}>
      {/* Top Gainers Marquee */}
      <TopGainersMarquee data={marketData} />

      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Markets
      </Typography>




      {/* Category Chips */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          {['All', 'Layer 1', 'Meme', 'DeFi', 'AI', 'GameFi'].map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                bgcolor: selectedCategory === cat ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? 'primary.contrastText' : 'text.secondary',
                fontWeight: 'bold',
                '&:hover': { bgcolor: selectedCategory === cat ? 'primary.dark' : 'rgba(255, 255, 255, 0.1)' }
              }}
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Market Stats */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Market Cap', value: marketStats.marketCap, color: '#3B82F6' },
          { label: '24h Volume', value: marketStats.volume24h, color: '#4F7CFF' },
          { label: 'BTC Dominance', value: marketStats.btcDominance, color: '#904CC2' },
        ].map((stat, index) => (
          <Grid item xs={4} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.1 }}
            >
              <Card sx={{ 
                textAlign: 'center', 
                p: 1.5,
                bgcolor: 'rgba(26,29,36,0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                boxShadow: `0 4px 16px rgba(0,0,0,0.15)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 24px ${stat.color}25`,
                  borderColor: `${stat.color}40`
                }
              }}>
                <Typography variant="caption" sx={{ color: '#8b93a6', fontWeight: 500, fontSize: '0.65rem' }}>
                  {stat.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: stat.color, fontSize: '0.9rem' }}>
                  {stat.value}
                </Typography>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontSize: '0.75rem', fontWeight: 'bold', minWidth: 'auto', px: 2 },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab} />
          ))}
        </Tabs>
      </Paper>

      {/* Sort Controls */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={() => handleSort('volume')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Vol {getSortIcon('volume')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('price')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Price {getSortIcon('price')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('change')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            24h % {getSortIcon('change')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('marketCap')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Cap {getSortIcon('marketCap')}
        </Button>
      </Box>
    )}

    {/* Market List */}
    <TableContainer component={Paper} sx={{ 
      bgcolor: 'rgba(26,29,36,0.4)', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      overflow: 'hidden'
    }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: { xs: 1, sm: 2 }, width: '35%', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Pair</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' }, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Last 24h</TableCell>
            <TableCell align="right" sx={{ pr: { xs: 1, sm: 2 }, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>24h %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPairs.map((item, index) => (
            <motion.tr 
              key={item.pair || item.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.9) }}
              style={{ cursor: 'pointer' }}
              onClick={() => activeTab === 0 && handleTradeClick(item.pair)}
            >
              <TableCell sx={{ 
                pl: { xs: 1, sm: 2 },
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.25s',
                '&:hover': { bgcolor: 'transparent' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CoinIcon symbol={item.pair || item.symbol} size={32} mr={1.5} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.pair || item.symbol}
                    </Typography>
                    {item.volume && (
                      <Typography variant="caption" sx={{ color: '#8b93a6', fontSize: '0.65rem' }}>
                        Vol: ${(item.volume / 1000000).toFixed(1)}M
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ${typeof item.price === 'number' ? item.price.toLocaleString('en-US', {
                    minimumFractionDigits: item.price < 1 ? 4 : 2,
                    maximumFractionDigits: item.price < 1 ? 4 : 2
                  }) : item.price}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Sparkline 
                  data={item.sparkline} 
                  color={item.change24h >= 0 ? '#00D395' : '#FF6B6B'} 
                  width={80} 
                  height={25} 
                />
              </TableCell>
              <TableCell align="right" sx={{ pr: { xs: 1, sm: 2 }, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Chip
                  label={`${item.change24h >= 0 ? '+' : ''}${item.change24h}%`}
                  size="small"
                  sx={{
                    bgcolor: item.change24h >= 0 ? 'rgba(0, 211, 149, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    color: item.change24h >= 0 ? '#00D395' : '#FF6B6B',
                    fontWeight: 'bold',
                    minWidth: 70,
                    border: `1px solid ${item.change24h >= 0 ? 'rgba(0,211,149,0.2)' : 'rgba(255,107,107,0.2)'}`,
                  }}
                  icon={item.change24h >= 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                />
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Hot Pairs Section */}
    {activeTab === 0 && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 800 }}>
          🔥 Hot Pairs
        </Typography>
        <Grid container spacing={1.5}>
          {filteredPairs.slice(0, 4).map((pair, index) => (
            <Grid item xs={6} key={index}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Card sx={{ 
                  bgcolor: 'rgba(26,29,36,0.5)', 
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.2), inset 0 0 12px rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.3)'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CoinIcon symbol={pair.pair || pair.symbol} size={24} mr={1} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {pair.pair}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${pair.change24h >= 0 ? '+' : ''}${pair.change24h}%`}
                        size="small"
                        sx={{
                          bgcolor: pair.change24h >= 0 ? 'rgba(0, 211, 149, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                          color: pair.change24h >= 0 ? '#00D395' : '#FF6B6B',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          border: `1px solid ${pair.change24h >= 0 ? 'rgba(0,211,149,0.2)' : 'rgba(255,107,107,0.2)'}`,
                        }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      ${typeof pair.price === 'number' ? pair.price.toLocaleString() : (pair.price || 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b93a6', fontSize: '0.65rem' }}>
                      Vol: ${(pair.volume / 1000000).toFixed(1)}M
                    </Typography>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      sx={{ 
                        mt: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        py: 0.8,
                        lineHeight: 1.4,
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        boxShadow: 'none',
                        textTransform: 'none',
                        minHeight: 32,
                        overflow: 'visible',
                        whiteSpace: 'nowrap',
                        '&:hover': { 
                          bgcolor: 'rgba(59, 130, 246, 0.25)',
                          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
                          color: '#ffffff'
                        }
                      }}
                      onClick={() => handleTradeClick(pair.pair)}
                    >
                      Trade
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </>
    )}


    {/* ETF Info Section */}
    {activeTab === 1 && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
          ETF Trading Hours
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  US Market Hours
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  09:30 - 16:00 EST
                </Typography>
              </Box>
              <Chip label="Open" color="success" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  HK Market Hours
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  09:30 - 16:00 HKT
                </Typography>
              </Box>
              <Chip label="Closed" color="default" size="small" />
            </Box>
          </CardContent>
        </Card>
      </>
    )}
  </Container>
);
};

export default MarketPage;