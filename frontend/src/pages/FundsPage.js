import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Grid,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
} from '@mui/material';
import {
  AccountBalanceWallet,
  QrCode,
  ContentCopy,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
  History,
  CurrencyExchange,
  ArrowBack,
  Security,
  Close,
  KeyboardArrowRight,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

const FundsPage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (location.state && typeof location.state.activeTab === 'number') {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositCurrency, setDepositCurrency] = useState('USDT');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('USDT');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ERC20');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});
  
  // New Deposit Flow State
  const [depositStep, setDepositStep] = useState(1); // 1: Select Crypto, 2: Deposit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChain, setDepositChain] = useState('ERC20');
  const [depositVoucher, setDepositVoucher] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [configuredDepositAddress, setConfiguredDepositAddress] = useState('');
  const [depositAddressLoading, setDepositAddressLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('priceUpdate', (prices) => {
      const priceMap = {};
      prices.forEach(p => {
        priceMap[p.symbol.split('/')[0]] = parseFloat(p.price);
      });
      setMarketPrices(priceMap);
    });

    socket.on('transaction_updated', (tx) => {
      if (tx.userId === user?._id || tx.userId?._id === user?._id) {
        fetchTransactions();
        // Profile refresh is now handled globally by AuthContext
        toast(`Transaction ${tx.status}: ${tx.amount} ${tx.currency}`, { icon: 'ℹ️' });
      }
    });

    return () => {
      socket.off('priceUpdate');
      socket.off('transaction_updated');
    };
  }, [socket, user, updateUser]);

  const currencies = [
    { symbol: 'USDT', name: 'Tether', balance: user?.wallet?.usdt || 0, icon: '💵' },
    { symbol: 'USDC', name: 'USD Coin', balance: user?.wallet?.usdc || 0, icon: '💲' },
    { symbol: 'BTC', name: 'Bitcoin', balance: user?.wallet?.btc || 0, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', balance: user?.wallet?.eth || 0, icon: 'Ξ' },
  ];

  const networks = {
    'USDT': ['ERC20', 'BEP20', 'BNB'],
    'USDC': ['ERC20', 'BEP20', 'Polygon'],
    'BTC': ['Bitcoin'],
    'ETH': ['ERC20', 'BEP20'],
  };

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDepositVoucher(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async () => {
    if (!depositVoucher) {
      toast.error('Please upload a payment voucher');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('currency', depositCurrency);
      formData.append('amount', '0');
      formData.append('chain', depositChain);
      formData.append('voucher', depositVoucher);

      const response = await axios.post('/api/wallet/deposit', formData);

      toast.success(response.data.message);
      // Reset form and go back to history or step 1
      setDepositStep(1);
      setDepositAmount('');
      setDepositVoucher(null);
      setVoucherPreview(null);
      setActiveTab(2); // Go to history
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {

    if (!withdrawAmount || !withdrawAddress) {
      toast.error('Please fill all fields');
      return;
    }

    if (parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    const selectedCurrency = currencies.find(c => c.symbol === withdrawCurrency);
    if (selectedCurrency && parseFloat(withdrawAmount) > selectedCurrency.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/wallet/withdraw', {
        currency: withdrawCurrency,
        amount: parseFloat(withdrawAmount),
        address: withdrawAddress,
        network: withdrawNetwork,
      });
      
      setWithdrawAmount('');
      setWithdrawAddress('');
      
      // Refresh user data is handled by AuthContext listening to transaction_updated
      // or we can call refreshingUser() if we export it, but socket event will catch it.
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (depositStep !== 2 || !user?.canViewDepositAddress) {
      setConfiguredDepositAddress('');
      return;
    }

    const fetchDepositAddress = async () => {
      setDepositAddressLoading(true);
      try {
        const response = await axios.get('/api/wallet/deposit-address', {
          params: { currency: depositCurrency, network: depositChain }
        });
        setConfiguredDepositAddress(response.data.walletAddress || '');
      } catch {
        setConfiguredDepositAddress('');
      } finally {
        setDepositAddressLoading(false);
      }
    };

    fetchDepositAddress();
  }, [depositStep, depositCurrency, depositChain, user?.canViewDepositAddress]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'deposit': return 'success';
      case 'withdrawal': return 'error';
      case 'trade': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 14, pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Wallet
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#8b93a6', gap: 0.5 }}>
          <Security sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Secure & Verified
          </Typography>
        </Box>
      </Box>

      {/* Total Balance */}
      <Card sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, rgba(16, 18, 27, 0.95) 0%, rgba(25, 20, 35, 0.95) 100%)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(138, 43, 226, 0.4)',
        borderRadius: '24px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(138, 43, 226, 0.15)' 
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#8b93a6', fontWeight: 500 }}>
                Total Balance
              </Typography>
              {showBalance ? (
                <Visibility sx={{ fontSize: '1.2rem', color: '#8b93a6', cursor: 'pointer' }} onClick={() => setShowBalance(false)} />
              ) : (
                <VisibilityOff sx={{ fontSize: '1.2rem', color: '#8b93a6', cursor: 'pointer' }} onClick={() => setShowBalance(true)} />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: '700', color: 'white', mb: 0.5, letterSpacing: '-0.5px', fontSize: { xs: '1.75rem', sm: '2rem' } }}>
              {showBalance ? `$${Number(user?.wallet?.usdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '********'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b93a6' }}>
              {showBalance ? `≈ ${Number(user?.wallet?.usdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '********'}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 52, 
            height: 52, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
            border: '1px solid rgba(79, 124, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(79, 124, 255, 0.2)'
          }}>
            <AccountBalanceWallet sx={{ fontSize: '2rem', color: '#4F7CFF' }} />
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ display: 'flex', bgcolor: '#1a1d24', borderRadius: '32px', p: 0.5, mb: 3 }}>
        <Button 
          fullWidth
          startIcon={<ArrowDownward />}
          onClick={() => setActiveTab(0)}
          sx={{ 
            color: activeTab === 0 ? 'white' : '#8b93a6',
            bgcolor: activeTab === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: '28px',
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': { bgcolor: activeTab === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)' }
          }}
        >
          Deposit
        </Button>
        <Button 
          fullWidth
          startIcon={<ArrowUpward />}
          onClick={() => setActiveTab(1)}
          sx={{ 
            color: activeTab === 1 ? 'white' : '#8b93a6',
            bgcolor: activeTab === 1 ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: '28px',
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': { bgcolor: activeTab === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)' }
          }}
        >
          Withdraw
        </Button>
      </Box>

      {/* Deposit Tab */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {depositStep === 1 ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                  Select deposit crypto
                </Typography>
                <Button
                  size="small"
                  startIcon={<History sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => navigate('/history')}
                  sx={{
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    borderRadius: '50px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    border: '1px solid rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(59, 130, 246,0.12)', borderColor: 'rgba(59, 130, 246,0.3)', color: '#3B82F6' },
                    transition: 'all 0.2s',
                  }}
                >
                  Deposit History
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { symbol: 'USDT', name: 'USDT deposit', color: '#26A17B', icon: 'T' },
                  { symbol: 'BTC', name: 'BTC deposit', color: '#F7931A', icon: '₿' },
                  { symbol: 'ETH', name: 'ETH deposit', color: '#627EEA', icon: 'Ξ' },
                  { symbol: 'USDC', name: 'USDC Deposit', color: '#2775CA', icon: '$' },
                ].map((crypto, index) => (
                  <motion.div 
                    key={crypto.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      onClick={() => {
                        setDepositCurrency(crypto.symbol);
                        setDepositChain(networks[crypto.symbol]?.[0] || 'ERC20');
                        setDepositStep(2);
                      }}
                      sx={{ 
                        cursor: 'pointer', 
                        bgcolor: 'rgba(26,29,36,0.5)', 
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 4px 24px -2px rgba(0,0,0,0.2)',
                        borderRadius: '32px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: 'rgba(42,45,52,0.7)', 
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(59, 130, 246, 0.25), inset 0 0 16px rgba(59, 130, 246, 0.1)',
                          borderColor: 'rgba(59, 130, 246, 0.4)'
                        },
                        display: 'flex',
                        alignItems: 'center',
                        p: 2.5
                      }}
                    >
                    <Avatar sx={{ bgcolor: crypto.color, width: 44, height: 44, fontSize: 22, fontWeight: 700, mr: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      {crypto.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                        {crypto.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b93a6', fontWeight: 500 }}>
                        Deposit via crypto network
                      </Typography>
                    </Box>
                      <KeyboardArrowRight sx={{ color: '#8b93a6' }} />
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Exchange Logos Section */}
              <Box sx={{ mt: 5, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center', color: '#8b93a6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Buy Crypto via Popular Exchanges
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { name: 'Kraken', logo: 'https://www.google.com/s2/favicons?domain=kraken.com&sz=128', url: 'https://www.kraken.com' },
                    { name: 'Coinbase', logo: 'https://www.google.com/s2/favicons?domain=coinbase.com&sz=128', url: 'https://www.coinbase.com' },
                    { name: 'Cash App', logo: 'https://www.google.com/s2/favicons?domain=cash.app&sz=128', url: 'https://cash.app' },
                    { name: 'Shakepay', logo: 'https://www.google.com/s2/favicons?domain=shakepay.com&sz=128', url: 'https://shakepay.com' },
                    { name: 'Crypto.com', logo: 'https://www.google.com/s2/favicons?domain=crypto.com&sz=128', url: 'https://crypto.com' },
                    { name: 'Robinhood', logo: 'https://www.google.com/s2/favicons?domain=robinhood.com&sz=128', url: 'https://robinhood.com' },
                    { name: 'Binance', logo: 'https://www.google.com/s2/favicons?domain=binance.com&sz=128', url: 'https://www.binance.com' },
                    { name: 'Bitget', logo: 'https://www.google.com/s2/favicons?domain=bitget.com&sz=128', url: 'https://www.bitget.com' },
                  ].map((ex, index) => (
                    <Grid item xs={3} sm={3} key={ex.name}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                      >
                        <Box
                          onClick={() => window.open(ex.url, '_blank')}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          cursor: 'pointer',
                          '&:hover .icon-bg': {
                            bgcolor: '#2a2d34',
                            transform: 'translateY(-4px) scale(1.05)',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                            borderColor: 'rgba(59, 130, 246, 0.4)'
                          },
                          '&:hover .icon-text': {
                            color: '#3B82F6'
                          }
                        }}
                      >
                        <Box
                          className="icon-bg"
                          sx={{
                            width: 64,
                            height: 64,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'rgba(26,29,36,0.5)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            mb: 1.5
                          }}
                        >
                          <Box
                            component="img"
                            src={ex.logo}
                            alt={ex.name}
                            sx={{
                              width: 32,
                              height: 32,
                              objectFit: 'contain',
                              borderRadius: '20%'
                            }}
                          />
                        </Box>
                        <Typography className="icon-text" variant="caption" sx={{ color: '#7296FF', fontWeight: 600, fontSize: '0.65rem', textAlign: 'center', transition: 'all 0.2s' }}>
                          {ex.name}
                        </Typography>
                      </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => setDepositStep(1)} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                  <Typography variant="h6">Fast deposit</Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>Chain name</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  {(networks[depositCurrency] || ['ERC20']).map((chain) => (
                    <Button
                      key={chain}
                      variant={depositChain === chain ? "contained" : "outlined"}
                      onClick={() => setDepositChain(chain)}
                      sx={{ 
                        flex: 1, 
                        py: 1,
                        bgcolor: depositChain === chain ? 'white' : 'transparent',
                        color: depositChain === chain ? 'black' : 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: depositChain === chain ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      {chain}
                    </Button>
                  ))}
                </Box>

                {user?.canViewDepositAddress && depositAddressLoading ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Deposit address</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  </Box>
                ) : user?.canViewDepositAddress && configuredDepositAddress ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Deposit address</Typography>
                    <TextField
                      fullWidth
                      value={configuredDepositAddress}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => copyToClipboard(configuredDepositAddress)}>
                              <ContentCopy />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2.5,
                      borderRadius: '20px',
                      bgcolor: 'rgba(26,29,36,0.5)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 24px -2px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#3B82F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          flexShrink: 0,
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        🎧
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5, textAlign: 'left' }}
                      >
                        Please contact our support team<br />
                        to get your deposit address.
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => window.dispatchEvent(new Event('openLiveChat'))}
                      sx={{
                        py: 1.4,
                        borderRadius: '50px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        color: '#000',
                        background: '#3B82F6',
                        boxShadow: '0 0 16px rgba(59, 130, 246,0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: '#33EBFF',
                          boxShadow: '0 0 24px rgba(59, 130, 246,0.6)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      Get {depositCurrency} Deposit Address
                    </Button>

                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                      Our support team will provide you with a<br />secure and unique deposit address.
                    </Typography>
                  </Box>
                )}


                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: '140px',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    border: '2px dashed rgba(255,255,255,0.18)',
                    cursor: 'pointer',
                    mb: 3,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.07)',
                      borderColor: 'rgba(0,191,255,0.45)',
                    },
                  }}
                >
                  <input type="file" hidden accept="image/*" onChange={handleVoucherChange} />
                  {voucherPreview ? (
                    <img src={voucherPreview} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 3 }}>
                      <QrCode sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        Upload Payment Voucher
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                        Tap to select a screenshot of your payment
                      </Typography>
                    </Box>
                  )}
                </Box>


                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, textAlign: 'center', fontWeight: 'bold' }}>
                    IMPORTANT
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                    • If you have completed the deposit, please click the "I have deposited" button on the page and submit the receipt, otherwise the deposit cannot be posted.<br/>
                    • USDT deposit only supports the simple send method, and the deposit using other methods (send all) cannot be posted temporarily. Please understand.<br/>
                    • After you recharge to the above address, you need to confirm the entire network node before it can be credited.<br/>
                    • Please make sure that your computer and browser are safe to prevent information from being tampered with or leaked.
                    {!user?.canViewDepositAddress && (
                      <>
                        <br/>
                        • <strong>Deposit address provides by the customer support service.</strong>
                      </>
                    )}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleDepositSubmit}
                  disabled={loading}
                  sx={{ py: 1.5, borderRadius: '50px', bgcolor: '#4D5DFF' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Next step'}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                  Select Crypto to Withdraw
                </Typography>
                <Button
                  size="small"
                  startIcon={<History sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => navigate('/history', { state: { tab: 1 } })}
                  sx={{
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    borderRadius: '50px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    border: '1px solid rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(59, 130, 246,0.12)', borderColor: 'rgba(59, 130, 246,0.3)', color: '#3B82F6' },
                    transition: 'all 0.2s',
                  }}
                >
                  Withdraw History
                </Button>
              </Box>

              {/* Withdrawal Channel Closed Banner */}
              {user?.withdrawalEnabled === false ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 6,
                    px: 3,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(239,68,68,0.12) 100%)',
                    border: '1.5px solid rgba(244,63,94,0.35)',
                    textAlign: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(244,63,94,0.15)',
                      border: '1.5px solid rgba(244,63,94,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      mb: 1,
                    }}
                  >
                    🔒
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f43f5e', letterSpacing: '-0.3px' }}>
                    Withdrawal channel is closed.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.6 }}>
                    Withdrawals are currently unavailable for your account. Please contact support for assistance.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => window.dispatchEvent(new Event('openLiveChat'))}
                    sx={{
                      mt: 1,
                      borderColor: 'rgba(244,63,94,0.5)',
                      color: '#f43f5e',
                      borderRadius: '50px',
                      px: 3,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { borderColor: '#f43f5e', bgcolor: 'rgba(244,63,94,0.08)' }
                    }}
                  >
                    Contact Support
                  </Button>
                </Box>
              ) : (
                <>

              <TextField
                select
                fullWidth
                label="Select Currency"
                value={withdrawCurrency}
                onChange={(e) => {
                  setWithdrawCurrency(e.target.value);
                  setWithdrawNetwork(networks[e.target.value]?.[0] || 'ERC20');
                }}
                sx={{ mb: 2 }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }
                }}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.symbol} value={currency.symbol}>
                    {currency.name} ({currency.symbol}) - Balance: {Math.floor(currency.balance).toLocaleString('en-US')}
                  </MenuItem>
                ))}
              </TextField>

              {networks[withdrawCurrency] && (
                <TextField
                  select
                  fullWidth
                  label="Network"
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  sx={{ mb: 2 }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: { maxHeight: 300 }
                      }
                    }
                  }}
                >
                  {networks[withdrawCurrency].map((network) => (
                    <MenuItem key={network} value={network}>
                      {network} Network
                    </MenuItem>
                  ))}
                </TextField>
              )}
              
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={() => {
                          const currency = currencies.find(c => c.symbol === withdrawCurrency);
                          if (currency) {
                            setWithdrawAmount(currency.balance.toString());
                          }
                        }}
                      >
                        MAX
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Recipient Address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                sx={{ mb: 2 }}
                placeholder={`Enter ${withdrawCurrency} address`}
              />
              
           
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || !withdrawAddress || transactions.some(t => t.type === 'withdrawal' && t.status === 'pending')}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') ? 'Withdrawal Pending' : 'Withdraw'}
                </Button>
              </motion.div>

              {transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  You have a pending withdrawal request. Please wait for it to be processed before submitting another.
                </Typography>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white', fontWeight: 'bold' }}>
                  Withdrawal Instructions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>1:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Withdrawal processing time is 15 to 30 mins.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>2:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Funds are frozen during processing for system verification and safety.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>3:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Arrival usually within 30 minutes. Contact customer service if delayed beyond expected time.
                  </Typography>
                </Box>
              </Box>
              </>
              )}
            </CardContent>
          </Card>
        </motion.div>
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
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>Transaction Details</Typography>
          <IconButton onClick={() => setSelectedTx(null)} sx={{ color: 'white', mr: -1 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {selectedTx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: selectedTx.type === 'deposit' ? '#00D395' : '#FF6B6B' }}>
                  {selectedTx.type === 'deposit' ? '+' : '-'}{selectedTx.amount} {selectedTx.currency}
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

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Network/Chain</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{selectedTx.chain || selectedTx.network || selectedTx.metadata?.network || 'ERC20'}</Typography></Grid>

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Time</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{formatDate(selectedTx.createdAt || selectedTx.date)}</Typography></Grid>

                {(selectedTx.toAddress || selectedTx.fromAddress) && 
                 !(selectedTx.toAddress || selectedTx.fromAddress).toLowerCase().includes('admin manual') && (
                  <>
                    <Grid item xs={4}><Typography color="text.secondary" variant="body2">Address</Typography></Grid>
                    <Grid item xs={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'right', mt: 0.5 }}>
                          {selectedTx.toAddress || selectedTx.fromAddress}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(selectedTx.toAddress || selectedTx.fromAddress)} sx={{ color: 'text.secondary', p: 0.5 }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </>
                )}

                {selectedTx.transactionHash && (
                  <>
                    <Grid item xs={4}><Typography color="text.secondary" variant="body2">TxID</Typography></Grid>
                    <Grid item xs={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'right', mt: 0.5 }}>
                          {selectedTx.transactionHash}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(selectedTx.transactionHash)} sx={{ color: 'text.secondary', p: 0.5 }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit Address Dialog */}
      <Dialog 
        open={showDepositDialog} 
        onClose={() => setShowDepositDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Deposit {depositCurrency}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <QrCode sx={{ fontSize: 200, color: 'white', mb: 2 }} />
            <TextField
              fullWidth
              value={depositAddress}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyToClipboard(depositAddress)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Alert severity="warning">
              <Typography variant="caption">
                • Send only {depositCurrency} to this address<br/>
                • Minimum deposit: 10 USDT<br/>
                • Network: Tron, Ethereum, or BSC
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDepositDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default FundsPage;