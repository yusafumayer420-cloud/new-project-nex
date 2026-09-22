import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp } from '@mui/icons-material';

const TopGainersMarquee = ({ data = [] }) => {
  const gainers = [...data]
    .filter(item => parseFloat(item.price || 0) > 0 && !item.symbol?.includes('MATIC') && !item.symbol?.includes('TRX'))
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 5)
    .map(item => ({
      symbol: item.symbol || item.pair,
      change: `${item.change24h >= 0 ? '+' : ''}${item.change24h}%`
    }));

  if (gainers.length === 0) return null;

  return (
    <Box sx={{ 
      width: '100%', 
      overflow: 'hidden', 
      bgcolor: 'rgba(0, 211, 149, 0.05)', 
      py: 0.5,
      mb: 2,
      borderBottom: '1px solid rgba(0, 211, 149, 0.1)',
      display: 'flex',
      alignItems: 'center'
    }}>
      
      <Box 
        component={motion.div}
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        sx={{ display: 'flex', whiteSpace: 'nowrap' }}
      >
        {[...gainers, ...gainers].map((item, index) => (
          <Box key={index} sx={{ display: 'flex', ml: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 0.5 }}>{item.symbol}</Typography>
            <Typography variant="caption" sx={{ color: '#00D395', fontWeight: 'bold' }}>{item.change}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TopGainersMarquee;
