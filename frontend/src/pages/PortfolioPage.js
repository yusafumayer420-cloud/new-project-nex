import React, { useContext, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { ArrowBack, AccountBalanceWallet } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import socket from '../socket';
import { CURRENCIES } from '../utils/constants';

const getCoinColor = (symbol) => {
  const colors = {
    USDT: '#26A17B',
    BTC: '#F7931A',
    ETH: '#627EEA',
    SOL: '#14F195',
    DOT: '#E6007A',
    BNB: '#F3BA2F',
    ADA: '#0033AD',
    XRP: '#23292F',
    DOGE: '#C2A633'
  };
  return colors[symbol] || '#4361EE';
};

const PortfolioPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [marketPrices, setMarketPrices] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (prices) => {
      const priceMap = {};
      prices.forEach(p => {
        priceMap[p.symbol.split('/')[0]] = parseFloat(p.price);
      });
      setMarketPrices(priceMap);
    };

    socket.on('priceUpdate', handlePriceUpdate);

    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, []);

  const wallet = user?.wallet || {};
  
  const coins = CURRENCIES.map(c => {
    const balance = user?.wallet?.[c.symbol.toLowerCase()] || 0;
    return {
      symbol: c.symbol,
      balance: Number(balance),
      icon: c.icon,
      color: c.color
    };
  }).sort((a, b) => {
    if (a.symbol === 'USDT') return -1;
    if (b.symbol === 'USDT') return 1;
    return b.balance - a.balance;
  });

  const totalUSDT = coins.reduce((acc, curr) => {
    if (curr.symbol === 'USDT') return acc + curr.balance;
    const price = marketPrices[curr.symbol] || 0;
    return acc + (curr.balance * price);
  }, 0);

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2, bgcolor: '#131A2E', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          My Portfolio
        </Typography>
      </Box>

      {/* Summary Card */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, rgba(79,124,255,0.85) 0%, rgba(144,76,194,0.85) 100%)', 
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '24px',
        color: 'white'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, mb: 1, display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWallet sx={{ fontSize: 18, mr: 1 }} /> USDT Balance
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: '800', mb: 1, letterSpacing: '-1px' }}>
            {totalUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Available for trading and withdrawal
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Available Assets
      </Typography>

      <List sx={{ p: 0 }}>
        {coins.map((coin, index) => (
          <motion.div
            key={coin.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <ListItem 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.03)', 
                mb: 1.5, 
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                px: 2,
                py: 2
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: coin.color || getCoinColor(coin.symbol), width: 40, height: 40, fontWeight: 'bold', fontSize: '1rem' }}>
                  {coin.icon || coin.symbol.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {coin.symbol}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Crypto Asset
                  </Typography>
                }
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {coin.balance > 0 ? coin.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                </Typography>
              </Box>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Container>
  );
};

export default PortfolioPage;
