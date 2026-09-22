import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  SwapVert,
  ArrowUpward,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
  CurrencyExchange,
  Article,
  HeadsetMic,
  VerifiedUser,
  Lock,
  Shield,
  Savings,
  SmartToy,
  SyncAlt,
  Storefront,
  Security,
  GppGood,
  CheckCircle,
  FiberManualRecord,
  AutoAwesome,
  Psychology,
  QueryStats,
  Lightbulb,
  OpenInNew,
  ArrowForward,
  Speed,
  Public,
  AccountBalance,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Sparkline from '../components/Sparkline';
import toast from 'react-hot-toast';

/* ============================
   ANIMATION VARIANTS
   ============================ */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

/* ============================
   SPARKLINE DATA GENERATOR
   ============================ */
const generateSparkData = (seedString, base, volatility = 0.02, points = 20) => {
  const data = [base];
  let seed = 12345;
  if (typeof seedString === 'string') {
    seed = seedString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  } else if (typeof seedString === 'number') {
    seed = seedString;
  }
  
  for (let i = 1; i < points; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const change = data[i - 1] * (1 + (rnd - 0.48) * volatility);
    data.push(change);
  }
  return data;
};

/* ============================
   SECTION TITLE COMPONENT
   ============================ */
const SectionTitle = ({ title, actionLabel, onAction }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
      {title}
    </Typography>
    {actionLabel && (
      <Button
        size="small"
        onClick={onAction}
        endIcon={<ArrowForward sx={{ fontSize: '14px !important' }} />}
        sx={{
          color: '#3B82F6',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.75rem',
          '&:hover': { background: 'rgba(59, 130, 246, 0.08)' },
        }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);

/* ============================
   HOME PAGE
   ============================ */
const HomePage = ({ marketData }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [marketTab, setMarketTab] = useState(0);

  const [sparkOffset, setSparkOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSparkOffset((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  /* ---- Slides ---- */
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const slides = [
    {
      title: 'Start Trading Instantly',
      subtitle: 'Dive into 10+ active crypto markets with real-time pricing and deep liquidity sourced from top-tier global exchanges.',
      cta: 'Trade Now',
      path: '/trading',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #4F7CFF 100%)',
      icon: '🚀',
    },
    {
      title: 'Zero Hidden Fees',
      subtitle: 'Enjoy fully transparent pricing with no surprises. Our straightforward fee structure ensures you keep more of your profits.',
      cta: 'View Markets',
      path: '/markets',
      gradient: 'linear-gradient(135deg, #4F7CFF 0%, #2563EB 100%)',
      icon: '💎',
    },
    {
      title: 'Bank-Grade Security',
      subtitle: 'Your funds are safeguarded with enterprise-level encryption, ensuring the highest standard of protection against evolving threats.',
      cta: 'Learn More',
      path: '/profile',
      gradient: 'linear-gradient(135deg, #00C853 0%, #3B82F6 100%)',
      icon: '🔒',
    },
    {
      title: 'Verified & Empowered',
      subtitle: 'Complete a simple KYC verification to unlock your full withdrawal limits and access all platform features seamlessly.',
      cta: 'Verify Now',
      path: '/profile',
      state: { activeTab: 2 },
      gradient: 'linear-gradient(135deg, #2563EB 0%, #4F7CFF 100%)',
      icon: '✅',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideDirection(1);
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (dir) => {
    setSlideDirection(dir);
    setSlideIndex((prev) => (prev + dir + slides.length) % slides.length);
  };

  /* ---- Quick Actions ---- */
  const quickActions = [
    { icon: <AccountBalanceWallet />, label: 'Deposit', color: '#3B82F6', path: '/funds', state: { activeTab: 0 } },
    { icon: <SwapVert />, label: 'Withdraw', color: '#4F7CFF', path: '/funds', state: { activeTab: 1 } },
    { icon: <SyncAlt />, label: 'Exchange', color: '#FFC107', path: '/exchange' },
    { icon: <CurrencyExchange />, label: 'Trade', color: '#2563EB', path: '/trading' },
    { icon: <Article />, label: 'News', color: '#FF5252', path: '/news' },
    { icon: <AccountBalance />, label: 'Portfolio', color: '#FFD700', path: '/portfolio' },
    { icon: <VerifiedUser />, label: 'KYC', color: '#FF9800', path: '/profile' },
    { icon: <HeadsetMic />, label: 'Support', color: '#94A3B8', path: '#', onClick: () => window.dispatchEvent(new Event('open-live-chat')) },
  ];

  /* ---- Trust Badges ---- */
  const trustBadges = [
    { icon: <Lock sx={{ fontSize: 14 }} />, label: '256-bit SSL' },
    { icon: <Security sx={{ fontSize: 14 }} />, label: 'Asset Insured' },
    { icon: <GppGood sx={{ fontSize: 14 }} />, label: 'Regulated' },
    { icon: <FiberManualRecord sx={{ fontSize: 8, color: '#00C853' }} />, label: 'Online' },
  ];

  /* ---- AI Features ---- */
  const aiFeatures = [
    { icon: <QueryStats sx={{ fontSize: 16 }} />, label: 'Portfolio Analysis' },
    { icon: <Psychology sx={{ fontSize: 16 }} />, label: 'Market Insights' },
    { icon: <Shield sx={{ fontSize: 16 }} />, label: 'Risk Assessment' },
    { icon: <Lightbulb sx={{ fontSize: 16 }} />, label: 'Trade Suggestions' },
  ];

  /* ---- Data ---- */
  useEffect(() => {
    if (!user || !user.wallet) {
      setBalance(0);
      return;
    }
    
    let total = user.wallet.usdt || 0;
    
    if (marketData && marketData.length > 0) {
      Object.keys(user.wallet).forEach(key => {
        if (key !== 'usdt' && typeof user.wallet[key] === 'number') {
          const coinSymbol = key.toUpperCase();
          const marketCoin = marketData.find(m => m.symbol && m.symbol.split('/')[0] === coinSymbol);
          if (marketCoin && marketCoin.price) {
            total += user.wallet[key] * marketCoin.price;
          }
        }
      });
    }
    
    setBalance(total);
  }, [user, marketData]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news');
        setNews(response.data.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  const getCoinIcon = (symbol) => {
    const base = symbol.split('/')[0].toLowerCase();
    return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${base}.svg`;
  };

  /* ---- Market filtering ---- */
  const sortedMarket = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    const validData = marketData.filter(m => m && parseFloat(m.price || 0) > 0 && !m.symbol?.includes('MATIC') && !m.symbol?.includes('TRX'));
    const sorted = [...validData];
    if (marketTab === 0) return sorted.sort((a, b) => b.change24h - a.change24h).slice(0, 10);
    if (marketTab === 1) return sorted.sort((a, b) => a.change24h - b.change24h).slice(0, 10);
    return sorted.sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 10);
  }, [marketData, marketTab]);

  const dailyPnl = useMemo(() => {
    return balance * 0.025;
  }, [balance]);

  const dailyPnlPct = 2.5;

  /* ============================
     RENDER
     ============================ */
  return (
    <>
      <BackgroundAnimation />
      <Container maxWidth="sm" sx={{ pb: 12, pt: 1.5, position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" animate="visible">

          {/* ============================
              1. HERO SECTION
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box sx={{ mb: 4, mt: 2, position: 'relative' }}>

              {/* Floating Crypto Logos */}
              <Box sx={{ position: 'absolute', top: -20, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1, opacity: 0.85, display: 'block' }}>
                {[
                  { symbol: 'btc', size: 56, top: '-5%', right: '-3%', delay: 0, duration: 4, glow: 'rgba(247, 147, 26, 0.5)' },
                  { symbol: 'eth', size: 42, top: '45%', right: '14%', delay: 1, duration: 5, glow: 'rgba(98, 126, 234, 0.5)' },
                  { symbol: 'bnb', size: 34, top: '15%', right: '34%', delay: 2, duration: 4.5, glow: 'rgba(243, 186, 47, 0.5)' },
                  { symbol: 'sol', size: 46, top: '72%', right: '-1%', delay: 0.5, duration: 5.5, glow: 'rgba(20, 241, 149, 0.5)' },
                ].map((coin, index) => (
                  <motion.div
                    key={index}
                    animate={{
                      y: [0, -18, 0],
                      rotate: [0, 8, -8, 0],
                    }}
                    transition={{
                      duration: coin.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: coin.delay
                    }}
                    style={{
                      position: 'absolute',
                      top: coin.top,
                      right: coin.right,
                      width: coin.size,
                      height: coin.size,
                      filter: `drop-shadow(0 10px 20px ${coin.glow})`
                    }}
                  >
                    <img
                      src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${coin.symbol}.svg`}
                      alt={coin.symbol}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </motion.div>
                ))}
              </Box>

              {/* Eyebrow label */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 1.5, py: 0.5, borderRadius: 99, background: 'rgba(59, 130, 246, 0.07)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <FiberManualRecord sx={{ fontSize: 7, color: '#3B82F6' }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Live Markets — 10+ Pairs
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.15,
                  mb: 1.5,
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '2rem', sm: '2.4rem' },
                }}
              >
                THE MARKET IS ALWAYS MOVING.{' '}
                <br />
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #4F7CFF 60%, #60A5FA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Stay One Step Ahead With NexVor.
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#8FA3BF',
                  mb: 3,
                  lineHeight: 1.75,
                  maxWidth: '85%',
                  fontSize: '0.92rem',
                  fontWeight: 400,
                }}
              >
                Powerful analytics, real-time insights, multi-asset trading, and a platform engineered for modern markets.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/trading')}
                    endIcon={<ArrowForward sx={{ fontSize: '16px !important' }} />}
                    sx={{
                      px: 3.5,
                      py: 1.35,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #4F7CFF 100%)',
                      color: '#05081A',
                      letterSpacing: '0.01em',
                      boxShadow: '0 4px 24px rgba(59, 130, 246, 0.3)',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #33EEFF 0%, #6B96FF 100%)',
                        boxShadow: '0 6px 32px rgba(59, 130, 246, 0.45)',
                      },
                    }}
                  >
                    Get Started
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/learn-more')}
                    sx={{
                      px: 3.5,
                      py: 1.35,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      textTransform: 'none',
                      borderColor: 'rgba(148, 163, 184, 0.25)',
                      color: '#CBD5E1',
                      backdropFilter: 'blur(8px)',
                      background: 'rgba(255,255,255,0.03)',
                      letterSpacing: '0.01em',
                      '&:hover': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        color: '#3B82F6',
                        background: 'rgba(59, 130, 246, 0.06)',
                        boxShadow: '0 0 16px rgba(59, 130, 246, 0.1)',
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </Box>

              {/* Trust badges */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {trustBadges.slice(0, 3).map((badge, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6,
                      px: 1.25,
                      py: 0.55,
                      borderRadius: '8px',
                      background: 'rgba(17, 24, 39, 0.55)',
                      border: '1px solid rgba(148, 163, 184, 0.08)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <Box sx={{ color: '#3B82F6', display: 'flex', alignItems: 'center', '& svg': { fontSize: 13 } }}>
                      {badge.icon}
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#8FA3BF', letterSpacing: '0.02em' }}>
                      {badge.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* ============================
              2. PORTFOLIO DASHBOARD CARDS
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>

              {/* Portfolio Value */}
              <Card
                onClick={() => navigate('/portfolio')}
                sx={{
                  minWidth: 160,
                  flex: 1,
                  cursor: 'pointer',
                  background: 'rgba(17, 24, 39, 0.6)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #3B82F6, #4F7CFF)',
                  },
                  '&:hover': {
                    background: 'rgba(17, 24, 39, 0.8)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: '14px !important' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccountBalanceWallet sx={{ fontSize: 12 }} /> Portfolio
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                    ${Math.floor(balance).toLocaleString('en-US')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Sparkline data={generateSparkData('portfolio', balance || 100, 0.02, 40).slice(sparkOffset % 20, (sparkOffset % 20) + 20)} color="#3B82F6" width={120} height={24} />
                  </Box>
                </CardContent>
              </Card>

              {/* 24h P&L */}
              <Card
                sx={{
                  minWidth: 130,
                  flex: 0.8,
                  background: 'rgba(17, 24, 39, 0.6)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: dailyPnl >= 0
                      ? 'linear-gradient(90deg, #00C853, #3B82F6)'
                      : 'linear-gradient(90deg, #FF5252, #FFC107)',
                  },
                  '&:hover': {
                    background: 'rgba(17, 24, 39, 0.8)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: '14px !important' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                    24h P&L
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      mt: 0.5,
                      fontSize: '1.1rem',
                      color: dailyPnl >= 0 ? '#00C853' : '#FF5252',
                    }}
                  >
                    {dailyPnl >= 0 ? '+' : '-'}${Math.abs(dailyPnl).toFixed(2)}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Sparkline 
                      data={generateSparkData('pnl', Math.abs(dailyPnl) || 10, 0.05, 40).slice(sparkOffset % 20, (sparkOffset % 20) + 20)} 
                      color={dailyPnl >= 0 ? '#00C853' : '#FF5252'} 
                      width={120} 
                      height={24} 
                    />
                  </Box>
                </CardContent>
              </Card>


            </Box>
          </motion.div>

          {/* ============================
              3. QUICK ACTIONS
              ============================ */}
          <motion.div variants={fadeUp}>
            <SectionTitle title="Quick Actions" />
            <Grid container spacing={1.25} columns={12} sx={{ mb: 3 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={3} key={index}>
                  <motion.div whileTap={{ scale: 0.92 }} whileHover={{ y: -3 }}>
                    <Box
                      onClick={() => action.onClick ? action.onClick() : navigate(action.path, { state: action.state })}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 84,
                        borderRadius: 3,
                        background: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          background: 'rgba(17, 24, 39, 0.8)',
                          borderColor: `${action.color}30`,
                          boxShadow: `0 4px 20px ${action.color}12`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${action.color}14`,
                          mb: 0.75,
                          '& svg': { fontSize: 18, color: action.color },
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.62rem',
                          color: '#94A3B8',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {action.label}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* ============================
              4. TRUST & SECURITY BAR
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 3,
                overflowX: 'auto',
                pb: 0.5,
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {trustBadges.map((badge, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    background: 'rgba(17, 24, 39, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.06)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ color: '#3B82F6', display: 'flex', alignItems: 'center' }}>
                    {badge.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 500 }}>
                    {badge.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>

          {/* ============================
              5. MARKET SECTION WITH TABS
              ============================ */}
          <motion.div variants={fadeUp}>
            <SectionTitle title="Markets" actionLabel="View All" onAction={() => navigate('/markets')} />
            <Box sx={{ mb: 1 }}>
              <Tabs
                value={marketTab}
                onChange={(e, v) => setMarketTab(v)}
                sx={{
                  minHeight: 32,
                  mb: 1.5,
                  '& .MuiTab-root': {
                    minHeight: 32,
                    py: 0.5,
                    px: 1.5,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  },
                }}
              >
                <Tab label="🔥 Top Gainers" />
                <Tab label="📉 Top Losers" />
                <Tab label="⚡ Trending" />
              </Tabs>
            </Box>

            <Card sx={{ mb: 3, background: 'rgba(17, 24, 39, 0.5)' }}>
              <CardContent sx={{ p: '8px !important' }}>
                {sortedMarket.map((coin, index) => (
                  <motion.div
                    key={coin.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Box
                      onClick={() => navigate(`/trading/${coin.symbol.replace('/', '_')}`)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.25,
                        px: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
                        borderBottom: index < sortedMarket.length - 1 ? '1px solid rgba(148, 163, 184, 0.05)' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(148, 163, 184, 0.06)',
                            width: 36,
                            height: 36,
                            border: '1px solid rgba(148, 163, 184, 0.08)',
                            p: '5px',
                          }}
                        >
                          <img
                            src={getCoinIcon(coin.symbol)}
                            alt={coin.symbol}
                            crossOrigin="anonymous"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.textContent = coin.symbol.split('/')[0].charAt(0);
                            }}
                          />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {coin.symbol.split('/')[0]}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6rem' }}>
                            {coin.symbol}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Sparkline */}
                      <Box sx={{ mx: 1.5, flexShrink: 0 }}>
                        <Sparkline
                          data={generateSparkData(coin.symbol, coin.price, 0.03, 16)}
                          color={coin.change24h >= 0 ? '#00C853' : '#FF5252'}
                          width={56}
                          height={22}
                          strokeWidth={1.2}
                        />
                      </Box>

                      <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                          ${(coin.price ?? 0) < 1 ? (coin.price ?? 0).toFixed(2) : (coin.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        <Chip
                          size="small"
                          icon={
                            coin.change24h >= 0
                              ? <ArrowUpward sx={{ fontSize: '9px !important' }} />
                              : <ArrowDownward sx={{ fontSize: '9px !important' }} />
                          }
                          label={`${Math.abs(coin.change24h ?? 0).toFixed(2)}%`}
                          sx={{
                            height: 18,
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            bgcolor: coin.change24h >= 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                            color: coin.change24h >= 0 ? '#00C853' : '#FF5252',
                            '& .MuiChip-icon': {
                              color: coin.change24h >= 0 ? '#00C853' : '#FF5252',
                              ml: '2px',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </motion.div>
                ))}
                {sortedMarket.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>Loading market data...</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================
              6. AI TRADING ASSISTANT
              ============================ */}
          <motion.div variants={fadeUp}>
            <Card
              sx={{
                mb: 3,
                background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
                border: '1px solid rgba(79, 124, 255, 0.15)',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'rgba(79, 124, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(79, 124, 255, 0.15)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => toast('AI Trading Assistant coming soon!', { icon: '🚧' })}
            >
              {/* Decorative glow */}
              <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent)',
                filter: 'blur(20px)',
              }} />

              <CardContent sx={{ p: '20px !important', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4F7CFF, #2563EB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 18, color: '#FFFFFF' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      AI Trading Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.62rem' }}>
                      Powered by advanced AI
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                  {aiFeatures.map((feat, i) => (
                    <Chip
                      key={i}
                      icon={feat.icon}
                      label={feat.label}
                      size="small"
                      sx={{
                        height: 28,
                        fontSize: '0.62rem',
                        fontWeight: 500,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        '& .MuiChip-icon': { color: '#3B82F6' },
                      }}
                    />
                  ))}
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, #4F7CFF, #2563EB)',
                    color: '#FFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.8,
                    boxShadow: '0 4px 16px rgba(79, 124, 255, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7296FF, #4F7CFF)',
                      boxShadow: '0 6px 24px rgba(79, 124, 255, 0.4)',
                    },
                  }}
                >
                  Try AI Assistant
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================
              7. PROMOTIONAL SLIDER
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box sx={{ position: 'relative', mb: 3, borderRadius: 3, overflow: 'hidden' }}>
              <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                <motion.div
                  key={slideIndex}
                  custom={slideDirection}
                  variants={{
                    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Box
                    sx={{
                      background: slides[slideIndex].gradient,
                      borderRadius: 3,
                      p: 3,
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Decorative overlay */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0, right: 0,
                      width: '50%', height: '100%',
                      background: 'radial-gradient(ellipse at 100% 0%, rgba(255,255,255,0.1), transparent 60%)',
                    }} />

                    <Box sx={{ position: 'relative' }}>
                      <Typography variant="h2" sx={{ fontSize: 32, mb: 0.5, lineHeight: 1 }}>
                        {slides[slideIndex].icon}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                        {slides[slideIndex].title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                        {slides[slideIndex].subtitle}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, position: 'relative' }}>
                      <Button
                        size="small"
                        onClick={() => navigate(slides[slideIndex].path, { state: slides[slideIndex].state })}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontWeight: 700,
                          borderRadius: 2,
                          px: 2,
                          py: 0.6,
                          fontSize: '0.72rem',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                          textTransform: 'none',
                        }}
                      >
                        {slides[slideIndex].cta} →
                      </Button>
                      {/* Pill dot indicators */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {slides.map((_, i) => (
                          <Box
                            key={i}
                            onClick={() => { setSlideDirection(i > slideIndex ? 1 : -1); setSlideIndex(i); }}
                            sx={{
                              width: i === slideIndex ? 20 : 6,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              <IconButton
                size="small"
                onClick={() => goToSlide(-1)}
                sx={{
                  position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.3)', color: '#fff', p: 0.4,
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => goToSlide(1)}
                sx={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.3)', color: '#fff', p: 0.4,
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </motion.div>

          {/* ============================
              7.5. ABOUT US / TRUST
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box sx={{ mb: 4, mt: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, textAlign: 'center', background: 'linear-gradient(135deg, #3B82F6, #4F7CFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                A Partner Worthy of Your Trust
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3, textAlign: 'center', lineHeight: 1.6, px: 2 }}>
                We combine cutting-edge technology with a customer-first philosophy to deliver a trading experience that is both powerful and secure.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card sx={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', '&:hover': { background: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(59, 130, 246, 0.2)' }, transition: 'all 0.3s' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Speed sx={{ color: '#3B82F6', fontSize: 24 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E2E8F0' }}>Industry-Leading Performance</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        Our independently developed matching engine sets the standard for speed and reliability. Capable of processing up to 100,000 orders per second with a minimum latency of just 5 milliseconds, our infrastructure ensures stable operation even during periods of extreme market volatility.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card sx={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', '&:hover': { background: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(79, 124, 255, 0.2)' }, transition: 'all 0.3s' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Public sx={{ color: '#4F7CFF', fontSize: 24 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E2E8F0' }}>Global Accessibility & Support</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        Trade seamlessly anytime, anywhere. Our platform is designed for the global market with multi-language support and a user-centric interface. We back this with a dedicated 7/24 online customer service team, ensuring professional assistance is always available when you need it.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card sx={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', '&:hover': { background: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(0, 200, 83, 0.2)' }, transition: 'all 0.3s' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <VerifiedUser sx={{ color: '#00C853', fontSize: 24 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E2E8F0' }}>Uncompromised Security & Protection</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        Your assets are our top priority. We operate with a 1:1 reserve ratio, guaranteeing that all user assets are fully held and accounted for. To provide an additional layer of defense against potential risks, we maintain a robust User Protection Fund valued at $300 Million USDT.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* ============================
              8. LATEST NEWS
              ============================ */}
          <motion.div variants={fadeUp}>
            <SectionTitle title="Latest News" actionLabel="View All" onAction={() => navigate('/news')} />

            {loadingNews ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {[1, 2, 3].map(i => (
                  <Box key={i} className="skeleton" sx={{ height: 64, borderRadius: 3 }} />
                ))}
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1.5,
                mb: 3,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { display: 'none' },
              }}>
                {news.map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flexShrink: 0, width: 220 }}
                  >
                    <Card
                      onClick={() => window.open(item.link, '_blank')}
                      sx={{
                        cursor: 'pointer',
                        background: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.07)',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          background: 'rgba(17, 24, 39, 0.75)',
                          borderColor: 'rgba(59, 130, 246, 0.2)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                        },
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {/* Image on top */}
                      {item.image ? (
                        <Box
                          sx={{
                            width: '100%',
                            height: 120,
                            backgroundImage: `url(${item.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 120,
                            flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246,0.1), rgba(79,124,255,0.15))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                          }}
                        >
                          📰
                        </Box>
                      )}

                      {/* Text on bottom */}
                      <CardContent sx={{ py: '10px !important', px: '12px !important', '&:last-child': { pb: '12px !important' }, flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
                          <Chip
                            label={item.source}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.5rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(59, 130, 246, 0.1)',
                              color: '#3B82F6',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.53rem' }}>
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            lineHeight: 1.4,
                            fontSize: '0.74rem',
                            color: '#E2E8F0',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            )}
          </motion.div>

          {/* ============================
              9. QUICK LINKS
              ============================ */}
          <motion.div variants={fadeUp}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              {[
                { label: 'FAQ', path: '/faq' },
                { label: 'About Us', path: '/about' },

              ].map((link, index) => (
                <Box
                  key={index}
                  onClick={() => navigate(link.path)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    px: 2.5,
                    background: 'rgba(17, 24, 39, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.05)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      background: 'rgba(17, 24, 39, 0.7)',
                      borderColor: 'rgba(148, 163, 184, 0.15)',
                      transform: 'translateX(4px)',
                      '& .MuiSvgIcon-root': {
                        color: '#3B82F6',
                        transform: 'translateX(2px)'
                      }
                    },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#E2E8F0', fontSize: '0.95rem' }}>
                    {link.label}
                  </Typography>
                  <ChevronRight sx={{ color: '#94A3B8', fontSize: 20, transition: 'all 0.25s ease' }} />
                </Box>
              ))}
            </Box>
          </motion.div>

          {/* ============================
              10. FOOTER SPACER
              ============================ */}
          <Box sx={{ height: 8 }} />

        </motion.div>
      </Container>
    </>
  );
};

export default HomePage;