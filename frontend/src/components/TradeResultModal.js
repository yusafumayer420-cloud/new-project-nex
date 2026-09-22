import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TradeResultModal = ({ open, onClose, trade, currentPrice }) => {
  if (!trade) return null;

  const isWin = trade.outcome === 'win';
  const direction = trade.type === 'long' ? 'Buy Long' : 'Buy Short';
  const directionColor = trade.type === 'long' ? '#10B981' : '#EF4444';

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose();
        }
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      sx={{ zIndex: 99999 }}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20, 27, 40, 0.95)',
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 4,
          overflow: 'hidden',
          color: '#F8FAFC',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', p: 3 }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { color: '#F8FAFC' },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 4 }}>
            {trade.pair || 'Crypto'} Delivery
          </Typography>

          {/* Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Purchase price</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {Number(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>


            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Direction</Typography>
              <Typography sx={{ fontWeight: 'bold', color: directionColor }}>
                {direction}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Amount</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {trade.amount}USDT
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Delivery time</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {trade.deliverySeconds}s
              </Typography>
            </Box>
          </Box>

          {/* Result Message */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: isWin ? '#10B981' : '#EF4444' }}>
              {isWin ? `+${Number(trade.profitAmount || 0).toFixed(2)} USDT` : `-${Number(trade.total || 0).toFixed(2)} USDT`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isWin ? 'Trade outcome: Win' : 'Trade outcome: Loss'}
            </Typography>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: '#3B82F6',
                color: '#0B0E14',
                borderRadius: 3,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': { bgcolor: '#2563EB' }
              }}
            >
              Close
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                color: '#F8FAFC',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TradeResultModal;
