import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid,
  Alert
} from '@mui/material';
import { ArrowBack, Close, ContentCopy } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 0);
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
      setTransactions(response.data);
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

  const filteredTransactions = transactions.filter(tx => 
    activeTab === 0 ? tx.type === 'deposit' : tx.type === 'withdrawal'
  );

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
          History
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: '44px',
            bgcolor: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            p: 0.5,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '1rem', minHeight: '36px', borderRadius: 1.5 },
            '& .Mui-selected': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
            '& .MuiTabs-indicator': { display: 'none' }
          }}
        >
          <Tab label="Deposit" />
          <Tab label="Withdraw" />
        </Tabs>
      </Box>

      {/* Transactions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredTransactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No transactions found</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTransactions.map((tx) => {
            const isWithdrawal = tx.type === 'withdrawal';
            const statusColor = tx.status === 'completed' ? '#00D395' : tx.status === 'pending' ? '#FFB703' : '#FF6B6B';
            const statusBg = tx.status === 'completed' ? 'rgba(0, 211, 149, 0.1)' : tx.status === 'pending' ? 'rgba(255, 183, 3, 0.1)' : 'rgba(255, 107, 107, 0.1)';
            
            return (
              <Box key={tx._id || tx.id} sx={{ bgcolor: 'rgba(25, 30, 45, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, p: 2.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {/* Top Row: Icon, Amount/ID, Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ 
                      width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isWithdrawal ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 211, 149, 0.1)',
                      color: isWithdrawal ? '#FF6B6B' : '#00D395'
                    }}>
                      <Typography variant="h5" sx={{ lineHeight: 1 }}>{isWithdrawal ? '↑' : '↓'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: '900', color: 'white' }}>
                        ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        #{tx.transactionHash ? tx.transactionHash.substring(0, 8).toUpperCase() : (tx._id || tx.id).substring(0, 8).toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={tx.status.toUpperCase()} 
                    size="small" 
                    sx={{ bgcolor: statusBg, color: statusColor, fontWeight: 'bold', fontSize: '0.7rem', borderRadius: 1 }} 
                  />
                </Box>

                {/* Details Grid */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>Method</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>{tx.chain || tx.network || tx.metadata?.network || tx.currency || 'ERC20'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>Requested</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>{formatDate(tx.createdAt || tx.date)}</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>Address</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', color: 'white', fontSize: '0.85rem' }}>
                    {tx.toAddress || tx.fromAddress || 'N/A'}
                  </Typography>
                </Box>

                {tx.status === 'completed' && (
                  <Grid container spacing={2} sx={{ mb: tx.rejectionReason ? 2 : 0 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>Processed</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>{formatDate(tx.updatedAt || tx.createdAt || tx.date)}</Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Rejection Banner */}
                {tx.status === 'rejected' && tx.rejectionReason && (
                  <Box sx={{ bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', p: 2, borderRadius: 2, mt: 1, border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                    <Typography variant="body2">
                      {tx.rejectionReason}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default TransactionHistoryPage;
