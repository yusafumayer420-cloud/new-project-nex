import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Grid
} from '@mui/material';
import { ArrowBack, Close, ContentCopy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const ExchangeHistoryPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/wallet/transactions');
      const exchangeTxs = response.data.filter(tx => tx.type === 'exchange');
      setTransactions(exchangeTxs);
    } catch (error) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour12: false });
    return `${month}-${day}-${year} ${time}`;
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2, bgcolor: '#131A2E', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Exchange History
        </Typography>
      </Box>

      {/* Transactions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No exchange transactions found</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {transactions.filter(tx => tx.amount < 0).map((tx) => {
            const toCurrency = tx.metadata?.toCurrency;
            const convertedAmount = tx.metadata?.convertedAmount;
            
            return (
            <ListItem 
              key={tx._id || tx.id} 
              onClick={() => setSelectedTx(tx)}
              sx={{ 
                px: 2, 
                py: 1.5, 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
              }}
            >
              <ListItemText
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
                primary={
                  <Typography variant="body1" sx={{ fontWeight: '500' }}>
                    {tx.currency} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>→</span> {toCurrency}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatDate(tx.createdAt || tx.date)}
                  </Typography>
                }
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: '500', color: '#FF6B6B' }}>
                  {tx.amount} {tx.currency}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '500', color: '#00D395' }}>
                  +{convertedAmount} {toCurrency}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                  <Box 
                    sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: tx.status === 'completed' ? '#00D395' : tx.status === 'pending' ? '#FFB703' : '#FF6B6B' 
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}
                  >
                    {tx.status === 'completed' ? 'Success' : tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          )})}
        </List>
      )}

      {/* Transaction Details Dialog */}
      <Dialog 
        open={Boolean(selectedTx)} 
        onClose={() => setSelectedTx(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#1E293B',
            color: 'white',
            borderRadius: 16
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>Exchange Details</Typography>
          <IconButton onClick={() => setSelectedTx(null)} sx={{ color: 'white', mr: -1 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {selectedTx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: selectedTx.amount > 0 ? '#00D395' : '#FF6B6B' }}>
                  {selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount} {selectedTx.currency}
                </Typography>
                <Chip 
                  label={selectedTx.status.toUpperCase()} 
                  size="small" 
                  sx={{ 
                    mt: 1.5, 
                    fontWeight: 'bold',
                    px: 1,
                    bgcolor: selectedTx.status === 'completed' ? 'rgba(0, 211, 149, 0.1)' : selectedTx.status === 'pending' ? 'rgba(255, 183, 3, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    color: selectedTx.status === 'completed' ? '#00D395' : selectedTx.status === 'pending' ? '#FFB703' : '#FF6B6B'
                  }} 
                />
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Type</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right', textTransform: 'capitalize' }}>{selectedTx.type}</Typography></Grid>

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Exchange Pair</Typography></Grid>
                <Grid item xs={7}>
                  <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {selectedTx.currency} → {selectedTx.metadata?.toCurrency}
                  </Typography>
                </Grid>

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Time</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{formatDate(selectedTx.createdAt || selectedTx.date)}</Typography></Grid>
                
                {selectedTx.metadata?.exchangeRate && (
                  <>
                    <Grid item xs={5}><Typography color="text.secondary" variant="body2">Exchange Rate</Typography></Grid>
                    <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{Number(selectedTx.metadata.exchangeRate).toFixed(6)}</Typography></Grid>
                  </>
                )}

                {selectedTx.amount < 0 && selectedTx.metadata?.toCurrency && (
                  <>
                    <Grid item xs={5}><Typography color="text.secondary" variant="body2">Swapped To</Typography></Grid>
                    <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{selectedTx.metadata.convertedAmount} {selectedTx.metadata.toCurrency}</Typography></Grid>
                  </>
                )}

                {selectedTx.amount > 0 && selectedTx.metadata?.fromCurrency && (
                  <>
                    <Grid item xs={5}><Typography color="text.secondary" variant="body2">Swapped From</Typography></Grid>
                    <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{selectedTx.metadata.originalAmount} {selectedTx.metadata.fromCurrency}</Typography></Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ExchangeHistoryPage;
