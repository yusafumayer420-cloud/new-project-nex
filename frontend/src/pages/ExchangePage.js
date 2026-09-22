import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { SwapVert, AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES as currencies } from '../utils/constants';

const ExchangePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState('USDT');
  const [toCurrency, setToCurrency] = useState('DOT');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});

  useEffect(() => {
    if (!socket) return;

    socket.on('priceUpdate', (prices) => {
      const priceMap = {};
      prices.forEach(p => {
        // symbol is like 'BTC/USDT'
        const base = p.symbol.split('/')[0];
        priceMap[base] = parseFloat(p.price);
      });
      priceMap['USDT'] = 1; // USDT price is always 1 against itself
      setMarketPrices(priceMap);
    });

    return () => {
      socket.off('priceUpdate');
    };
  }, []);



  // Get balance for specific currency
  const getBalance = (currency) => {
    return user?.wallet?.[currency.toLowerCase()] || 0;
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setAmount('');
  };

  const handleExchange = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > getBalance(fromCurrency)) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/wallet/exchange', {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount)
      });

      toast.success(response.data.message);
      setAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Exchange failed');
    } finally {
      setLoading(false);
    }
  };

  const getExpectedAmount = () => {
    if (!amount || isNaN(amount)) return '0.0000';
    const fromPrice = marketPrices[fromCurrency];
    const toPrice = marketPrices[toCurrency];
    if (!fromPrice || !toPrice) return 'Calculating...';

    const rate = fromPrice / toPrice;
    return (parseFloat(amount) * rate).toFixed(6);
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 14, pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
          <Typography variant="body1" sx={{ mr: 1, fontSize: '1.2rem' }}>{'<'}</Typography>
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          Exchange
        </Typography>
        <IconButton onClick={() => navigate('/exchange/history')} sx={{ color: 'white' }}>
          <AccessTime />
        </IconButton>
      </Box>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ position: 'relative' }}>
          {/* FROM CARD */}
          <Card sx={{
            bgcolor: '#1a1d24',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>From</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, bgcolor: '#0b0e14', borderRadius: '16px', p: 1 }}>
                <TextField
                  select
                  value={fromCurrency}
                  onChange={(e) => {
                    if (e.target.value === toCurrency) {
                      handleSwapCurrencies();
                    } else {
                      setFromCurrency(e.target.value);
                    }
                  }}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: { color: 'white', fontWeight: 'bold', fontSize: '1.1rem', pl: 1 }
                  }}
                  SelectProps={{
                    sx: { '& .MuiSelect-select': { pr: '36px !important' } }
                  }}
                  sx={{ minWidth: 130 }}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c.symbol} value={c.symbol}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 24,
                          height: 24,
                          minWidth: 24,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: c.color || 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {c.icon || c.symbol.charAt(0)}
                        </Box>
                        <Box sx={{ mr: 2 }}>{c.symbol}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    sx: { color: 'white', textAlign: 'right', fontSize: '1.2rem', pr: 1 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          onClick={() => setAmount(getBalance(fromCurrency).toString())}
                          sx={{ minWidth: 'auto', p: 0, color: '#3B82F6', fontWeight: 'bold' }}
                        >
                          Max
                        </Button>
                      </InputAdornment>
                    )
                  }}
                  inputProps={{ style: { textAlign: 'right' } }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Quantity Available: <span style={{ color: 'white' }}>{getBalance(fromCurrency).toLocaleString('en-US', { maximumFractionDigits: 6 })} {fromCurrency}</span>
              </Typography>
            </CardContent>
          </Card>

          {/* SWAP BUTTON */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            my: -2.5,
            position: 'relative',
            zIndex: 10,
          }}>
            <Box sx={{
              bgcolor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <IconButton onClick={handleSwapCurrencies} sx={{ color: '#4D5DFF', p: 1.5 }}>
                <SwapVert />
              </IconButton>
            </Box>
          </Box>

          {/* TO CARD */}
          <Card sx={{
            mb: 4,
            bgcolor: '#1a1d24',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>To</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#0b0e14', borderRadius: '16px', p: 1 }}>
                <TextField
                  select
                  value={toCurrency}
                  onChange={(e) => {
                    if (e.target.value === fromCurrency) {
                      handleSwapCurrencies();
                    } else {
                      setToCurrency(e.target.value);
                    }
                  }}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: { color: 'white', fontWeight: 'bold', fontSize: '1.1rem', pl: 1 }
                  }}
                  SelectProps={{
                    sx: { '& .MuiSelect-select': { pr: '36px !important' } }
                  }}
                  sx={{ minWidth: 130 }}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c.symbol} value={c.symbol}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 24,
                          height: 24,
                          minWidth: 24,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: c.color || 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {c.icon || c.symbol.charAt(0)}
                        </Box>
                        <Box sx={{ mr: 2 }}>{c.symbol}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ flexGrow: 1, textAlign: 'right', pr: 2 }}>
                  <Typography variant="h6" sx={{ color: amount ? 'white' : 'text.secondary' }}>
                    {amount ? getExpectedAmount() : '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* SUBMIT BUTTON */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleExchange}
          disabled={loading || !amount || parseFloat(amount) <= 0 || !marketPrices[fromCurrency]}
          sx={{
            py: 2,
            borderRadius: '30px',
            bgcolor: '#3B82F6',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#00bccc'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(59, 130, 246, 0.3)',
              color: 'rgba(0,0,0,0.5)'
            }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Inquiry'}
        </Button>
      </motion.div>
    </Container>
  );
};

export default ExchangePage;
