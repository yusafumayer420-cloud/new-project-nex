import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #07090E 0%, #0B0E14 60%, #121824 100%)',
        color: '#F8FAFC',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ color: '#3B82F6', mb: 3 }}
        />
      </motion.div>
      <Box
        component="img"
        src="/logo.png"
        alt="NexVor Logo"
        sx={{
          height: 80,
          width: 80,
          objectFit: 'cover',
          display: 'block',
          mt: 2,
          borderRadius: '50%',
          mixBlendMode: 'normal',
          border: '2px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;