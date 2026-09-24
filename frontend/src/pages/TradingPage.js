import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Slider,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Timeline,
  CancelOutlined,
  AccountBalanceWallet,
  AccessTime,
  EmojiEvents,
  History,
  CandlestickChart,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import TradeResultModal from '../components/TradeResultModal';
import TradingChart from '../components/TradingChart';


// ---------------------------------------------------------------------------
// Delivery contract time slots definition
// ---------------------------------------------------------------------------
const DELIVERY_SLOTS = [
  { seconds: 60, label: '60s', profit: 30, minAmount: 0 },
  { seconds: 120, label: '120s', profit: 50, minAmount: 0 },
  { seconds: 180, label: '180s', profit: 60, minAmount: 0 },
  { seconds: 240, label: '240s', profit: 70, minAmount: 0 },
  { seconds: 300, label: '300s', profit: 80, minAmount: 0 },
];

// ---------------------------------------------------------------------------
// CountdownTimer component
// ---------------------------------------------------------------------------
const CountdownTimer = ({ expiresAt, onExpired }) => {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.ceil((end - now) / 1000));
    setRemaining(diff);
    setTotal(diff + 1);

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpired && onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Time remaining</Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: remaining < 10 ? '#FF3366' : '#3B82F6' }}>
          {mins > 0 ? `${mins}m ` : ''}{secs}s
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: remaining < 10 ? '#FF3366' : '#3B82F6',
          }
        }}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// DeliveryOrderBook component (matches screenshot style)
// ---------------------------------------------------------------------------
const DeliveryOrderBook = ({ orderBook, price }) => {
  // Calculate max amount for depth bars
  const maxAmount = Math.max(
    ...orderBook.asks.map(a => a.total || a.amount || 0),
    ...orderBook.bids.map(b => b.total || b.amount || 0),
    1
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Price</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Number</Typography>
      </Box>

      {/* Asks (Sells) - Red */}
      <Box sx={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px', mb: 1 }}>
        {orderBook.asks.slice(0, 7).map((ask, i) => (
          <Box key={i} sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', px: 1, py: '2px', cursor: 'pointer' }}>
            <Box sx={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: `${((ask.total || ask.amount) / maxAmount) * 100}%`,
              bgcolor: 'rgba(255, 51, 102, 0.15)',
              zIndex: 0,
              transition: 'width 0.3s'
            }} />
            <Typography variant="caption" sx={{ color: '#FF3366', fontWeight: 'bold', zIndex: 1, fontSize: '0.75rem' }}>
              {Number(ask._id || ask.price).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#fff', zIndex: 1, fontSize: '0.75rem' }}>
              {Number(ask.total || ask.amount).toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Current Price Middle Section */}
      <Box sx={{ py: 2, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', my: 1 }}>
        <Typography variant="h6" sx={{ color: '#FF3366', fontWeight: 'bold', lineHeight: 1 }}>
          {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          ≈ {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </Typography>
      </Box>

      {/* Bids (Buys) - Green */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {orderBook.bids.slice(0, 7).map((bid, i) => (
          <Box key={i} sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', px: 1, py: '2px', cursor: 'pointer' }}>
            <Box sx={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: `${((bid.total || bid.amount) / maxAmount) * 100}%`,
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              zIndex: 0,
              transition: 'width 0.3s'
            }} />
            <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 'bold', zIndex: 1, fontSize: '0.75rem' }}>
              {Number(bid._id || bid.price).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#fff', zIndex: 1, fontSize: '0.75rem' }}>
              {Number(bid.total || bid.amount).toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// DeliveryTab component
// ---------------------------------------------------------------------------
const DeliveryTab = ({ price, socket, user, orderBook, currentPair }) => {
  const { triggerTradeResult } = useContext(AuthContext);
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [positionsTab, setPositionsTab] = useState(0); // 0=hold, 1=history
  const [activeTrades, setActiveTrades] = useState([]);
  const [historyTrades, setHistoryTrades] = useState([]);
  const [selectedHistoryTrade, setSelectedHistoryHistoryTrade] = useState(null);
  const previousActiveRef = useRef([]);

  const fetchDeliveryTrades = useCallback(async () => {
    try {
      const res = await axios.get('/api/trading/delivery-trades');
      const newActive = res.data.active || [];
      const newHistory = res.data.history || [];

      // If a trade that was active is now finished, show trade result
      if (previousActiveRef.current.length > 0) {
        for (const prevTrade of previousActiveRef.current) {
          const finishedTrade = newHistory.find(h => String(h._id) === String(prevTrade._id));
          if (finishedTrade && triggerTradeResult) {
            triggerTradeResult(finishedTrade);
          }
        }
      }

      previousActiveRef.current = newActive;
      setActiveTrades(newActive);
      setHistoryTrades(newHistory);
    } catch (e) {
      console.error('Delivery trades fetch error', e);
    }
  }, [triggerTradeResult]);

  useEffect(() => {
    fetchDeliveryTrades();
  }, [fetchDeliveryTrades]);

  useEffect(() => {
    if (!socket) return;

    const handleTradeUpdate = (updated) => {
      const updatedUserId = String(updated.userId?._id || updated.userId || '');
      const currentUserId = String(user?._id || '');

      if (updated.tradeMode === 'delivery' && (!currentUserId || updatedUserId === currentUserId)) {
        fetchDeliveryTrades();
        if ((updated.status === 'completed' || updated.status === 'cancelled') && triggerTradeResult) {
          triggerTradeResult(updated);
        }
      }
    };

    const handleBalanceUpdate = () => {
      fetchDeliveryTrades();
    };

    socket.on('trade_updated', handleTradeUpdate);
    socket.on('balance_updated', handleBalanceUpdate);

    return () => {
      socket.off('trade_updated', handleTradeUpdate);
      socket.off('balance_updated', handleBalanceUpdate);
    };
  }, [socket, user, fetchDeliveryTrades, triggerTradeResult]);


  const handleTrade = async (side) => {
    const amtNum = parseFloat(amount);
    if (!user) { toast.error('Please login to trade'); return; }
    if (!amount || isNaN(amtNum) || amtNum <= 0) { toast.error('Enter a valid amount'); return; }
    if (amtNum > (user?.wallet?.usdt || 0)) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/trading/delivery-order', {
        pair: currentPair,
        type: side, // 'long' or 'short'
        deliverySeconds: selectedSlot.seconds,
        price: parseFloat(price),
        amount: amtNum,
      });
      toast.success(`${side === 'long' ? 'Buy Long' : 'Buy Short'} order placed! Expires in ${selectedSlot.label}`);
      setAmount('');
      fetchDeliveryTrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={1}>
        {/* Left Side: Order Form */}
        <Grid item xs={7.5}>


          {/* Delivery Time Slots */}
          <Paper sx={{ p: 1.5, mb: 1, background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold', letterSpacing: 1 }}>
              DELIVERY TIME
            </Typography>

            {/* Column headers */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5, pr: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Profit %</Typography>
            </Box>

            <Grid container spacing={1}>
              {DELIVERY_SLOTS.map((slot) => {
                const isSelected = selectedSlot.seconds === slot.seconds;
                return (
                  <Grid item xs={6} key={slot.seconds}>
                    <Box
                      onClick={() => setSelectedSlot(slot)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 0.5,
                        px: 1,
                        py: 1,
                        borderRadius: 1.5,
                        border: `1px solid ${isSelected ? '#4F7CFF' : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? 'rgba(79, 124, 255,0.2)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': {
                          border: '1px solid rgba(79, 124, 255,0.5)',
                          background: 'rgba(79, 124, 255,0.1)',
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#fff' : 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {slot.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {slot.profit}%
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Amount input */}
          <Paper sx={{ p: 1.5, mb: 1, background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)' }}>
            <TextField
              id="delivery-amount"
              name="deliveryAmount"
              autoComplete="off"
              fullWidth
              label="Amount (USDT)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              sx={{ mb: 1.5 }}
              inputProps={{ min: 0, step: '10' }}
              helperText={`Profit: +${selectedSlot.profit}% | Timer: ${selectedSlot.label}`}
            />





            {/* Buy Long /Sell Short */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={() => handleTrade('long')}
                  sx={{
                    bgcolor: '#3B82F6',
                    color: '#000',
                    fontWeight: 'bold',
                    py: 1.5,
                    fontSize: '0.9rem',
                    '&:hover': { bgcolor: '#00B3CC' },
                    '&:disabled': { bgcolor: 'rgba(59, 130, 246,0.3)' },
                    borderRadius: 2,
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp fontSize="small" />
                      Buy Long
                    </Box>
                  )}
                </Button>
              </motion.div>

              <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled={loading}
                  onClick={() => handleTrade('short')}
                  sx={{
                    bgcolor: '#131a2e',
                    color: '#FF3366',
                    border: '1px solid #FF3366',
                    fontWeight: 'bold',
                    py: 1.5,
                    fontSize: '0.9rem',
                    '&:hover': { bgcolor: 'rgba(255,51,102,0.1)', border: '1px solid #FF3366' },
                    '&:disabled': { borderColor: 'rgba(255,51,102,0.3)', color: 'rgba(255,51,102,0.3)' },
                    borderRadius: 2,
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingDown fontSize="small" />
                      Sell Short
                    </Box>
                  )}
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Order Book */}
        <Grid item xs={4.5}>
          <Paper sx={{ p: 1, height: '100%', background: 'rgba(17, 24, 39, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)' }}>
            <DeliveryOrderBook orderBook={orderBook} price={price} />
          </Paper>
        </Grid>
      </Grid>

      {/* Hold / Historical Positions */}
      <Box>
        <Tabs
          value={positionsTab}
          onChange={(e, v) => setPositionsTab(v)}
          variant="fullWidth"
          sx={{
            mb: 1,
            '& .MuiTab-root': {
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              minWidth: 'auto',
              px: { xs: 1, sm: 2 }
            }
          }}
        >

          <Tab label={`Hold position (${activeTrades.length})`} icon={<AccessTime sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label={`Historical position`} icon={<History sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>

        {positionsTab === 0 && (

          <Card>
            {activeTrades.length === 0 ? (
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <AccessTime sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">You currently have no positions.</Typography>
                <Typography variant="caption" color="text.secondary">Place a delivery order to open a position</Typography>
              </CardContent>
            ) : (
              <Box sx={{ p: 1 }}>
                {activeTrades.map((trade) => (
                  <Paper
                    key={trade._id}
                    sx={{ p: 2, mb: 1, border: '1px solid rgba(148, 163, 184, 0.05)', background: 'rgba(17, 24, 39, 0.4)' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trade.pair}</Typography>
                          <Chip
                            label={trade.type === 'long' ? 'LONG' : 'SHORT'}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              bgcolor: trade.type === 'long' ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)',
                              color: trade.type === 'long' ? '#3B82F6' : '#FF3366',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Entry: ${trade.price.toLocaleString()} • Amount: {trade.total.toFixed(2)} USDT
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="#3B82F6" sx={{ fontWeight: 'bold' }}>
                          +{trade.profitPercent}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Est. +{(trade.total * trade.profitPercent / 100).toFixed(2)} USDT
                        </Typography>
                      </Box>
                    </Box>
                    <CountdownTimer
                      expiresAt={trade.expiresAt}
                      onExpired={fetchDeliveryTrades}
                    />
                  </Paper>
                ))}
              </Box>
            )}
          </Card>
        )}

        {positionsTab === 1 && (

          <Card>
            {historyTrades.length === 0 ? (
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <EmojiEvents sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No historical positions yet.</Typography>
              </CardContent>
            ) : (
              <Box sx={{ p: 1 }}>
                {historyTrades.map((trade) => (
                  <Paper
                    key={trade._id}
                    onClick={() => triggerTradeResult ? triggerTradeResult(trade) : setSelectedHistoryHistoryTrade(trade)}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      border: '1px solid rgba(148, 163, 184, 0.05)',
                      background: 'rgba(17, 24, 39, 0.4)',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trade.pair}</Typography>
                          <Chip
                            label={trade.type === 'long' ? 'LONG' : 'SHORT'}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              height: '18px',
                              bgcolor: trade.type === 'long' ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)',
                              color: trade.type === 'long' ? '#3B82F6' : '#FF3366',
                            }}
                          />
                          <Chip
                            label={trade.outcome?.toUpperCase() || 'N/A'}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              height: '18px',
                              bgcolor: trade.outcome === 'win' ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)',
                              color: trade.outcome === 'win' ? '#3B82F6' : '#FF3366',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(trade.createdAt).toLocaleDateString()} • {trade.deliverySeconds}s
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            color: trade.outcome === 'win' ? '#3B82F6' : '#FF3366',
                          }}
                        >
                          {trade.outcome === 'win'
                            ? `+${trade.profitAmount?.toFixed(2)}`
                            : `-${trade.total?.toFixed(2)}`}
                          <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>USDT</Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Amt: {trade.total?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Card>
        )}
      </Box>

    </Box>
  );
};



// ---------------------------------------------------------------------------
// Main TradingPage
// ---------------------------------------------------------------------------
const TradingPage = ({ socket }) => {
  const { user } = useContext(AuthContext);
  const { pair } = useParams();
  const navigate = useNavigate();

  const currentPair = (pair && pair !== 'delivery' && pair !== 'perpetual') ? pair.replace(/[-_]/g, '/') : 'BTC/USDT';

  const [activeTab, setActiveTab] = useState(pair === 'delivery' ? 2 : pair === 'perpetual' ? 1 : 0);

  useEffect(() => {
    if (pair === 'delivery') {
      setActiveTab(2);
    } else if (pair === 'perpetual') {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [pair]);

  const handleTabChange = (e, v) => {
    setActiveTab(v);
  };

  const [positionsTab, setPositionsTab] = useState(0);
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(70587.31);
  const [leverage, setLeverage] = useState(1);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);

  const [positions, setPositions] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [showChart, setShowChart] = useState(false);

  const fetchMyTrades = async () => {
    try {
      const response = await axios.get('/api/trading/my-trades');
      setPositions(response.data.positions || []);
      setOpenOrders(response.data.openOrders || []);
      setClosedPositions(response.data.closedPositions || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  // Trades are fetched on mount

  const fetchOrderBookAndTrades = useCallback(async () => {
    try {
      const obRes = await axios.get(`/api/trading/orderbook/${currentPair.replace('/', '_')}`);
      setOrderBook(obRes.data);
      const rtRes = await axios.get(`/api/trading/matches/${currentPair.replace('/', '_')}`);
      setRecentTrades(rtRes.data);
    } catch (err) {}
  }, [currentPair]);

  const [realOrderBook, setRealOrderBook] = useState({ bids: [], asks: [] });
  const realOrderBookRef = useRef({ bids: [], asks: [] });

  useEffect(() => {
    realOrderBookRef.current = realOrderBook;
  }, [realOrderBook]);

  useEffect(() => {
    fetchMyTrades();
    fetchOrderBookAndTrades();

    const handlePriceUpdate = (prices) => {
      setLivePrices(prev => {
        const newPrices = { ...prev };
        prices.forEach(p => {
          newPrices[p.symbol] = parseFloat(p.price);
        });
        return newPrices;
      });

      const btcPrice = prices.find(p => p.symbol === currentPair);
      if (btcPrice) {
        const livePrice = parseFloat(btcPrice.price);
        setPrice(livePrice);

        // Generate fake market depth based on live price
        const generateFakeLevels = (basePrice, isAsk) => {
          return Array.from({ length: 15 }).map((_, i) => {
            const spread = basePrice * (0.0005 * (i + 1));
            return {
              _id: isAsk ? basePrice + spread : basePrice - spread,
              total: parseFloat((Math.random() * (i + 1)).toFixed(4))
            };
          });
        };

        const fakeBids = generateFakeLevels(livePrice, false);
        const fakeAsks = generateFakeLevels(livePrice, true).reverse();

        setOrderBook({
          bids: realOrderBookRef.current.bids.length > 0 ? realOrderBookRef.current.bids : fakeBids,
          asks: realOrderBookRef.current.asks.length > 0 ? realOrderBookRef.current.asks : fakeAsks
        });
      }
    };

    const handleTradeUpdate = (updatedTrade) => {
      if (updatedTrade.tradeMode !== 'delivery' &&
        (updatedTrade.userId === user?._id || updatedTrade.userId?._id === user?._id)) {
        fetchMyTrades();
        if (updatedTrade.status === 'cancelled' && updatedTrade.orderType === 'market') {
          toast.error('Market order cancelled (No liquidity)');
        } else if (updatedTrade.status === 'completed') {
          toast.success('Trade executed!');
        }
      }
    };

    const handleOrderBookUpdate = (data) => {
      setRealOrderBook(data);
      if (data.bids.length > 0 || data.asks.length > 0) {
        setOrderBook(data);
      }
    };

    const handleRecentTradesUpdate = (newTrades) => {
      setRecentTrades(prev => [...newTrades, ...prev].slice(0, 50));
    };

    socket.on('priceUpdate', handlePriceUpdate);
    socket.on('trade_updated', handleTradeUpdate);
    socket.on(`orderbook_${currentPair}`, handleOrderBookUpdate);
    socket.on(`recent_trades_${currentPair}`, handleRecentTradesUpdate);

    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
      socket.off('trade_updated', handleTradeUpdate);
      socket.off(`orderbook_${currentPair}`, handleOrderBookUpdate);
      socket.off(`recent_trades_${currentPair}`, handleRecentTradesUpdate);
    };
  }, [socket, user, currentPair, fetchOrderBookAndTrades]);


  const handlePlaceOrder = async () => {
    if (!user) { toast.error('Please login to trade'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }

    setLoading(true);
    try {
      await axios.post('/api/trading/order', {
        pair: currentPair,
        type: activeTab === 0 ? side : (side === 'buy' ? 'long' : 'short'),
        orderType,
        price: parseFloat(price),
        amount: parseFloat(amount),
        leverage: activeTab === 1 ? leverage : 1
      });

      toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed!`);
      setAmount('');
      fetchMyTrades();
      // fetchWalletBalance(); // Handled by AuthContext
    } catch (error) {
      toast.error(error.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await axios.post(`/api/trading/order/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchMyTrades();
      // fetchWalletBalance(); // Handled by AuthContext
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleClosePosition = async (pos) => {
    const currentP = livePrices[pos.pair] || price;
    setClosingId(pos._id);
    try {
      await axios.post(`/api/trading/order/${pos._id}/close`, { price: currentP });
      toast.success('Position closed');
      fetchMyTrades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  };

  const handleSetPercent = (pct) => {
    const maxBtc = ((user?.wallet?.usdt || 0) / price) * pct;
    setAmount(maxBtc.toFixed(2));
  };

  const total = parseFloat(price) * parseFloat(amount || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#3B82F6';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#FF3366';
      default: return '#aaa';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 16, pt: 2 }}>
      {/* Pair Header */}
      <Paper sx={{ mb: 1, p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{currentPair}</Typography>
            <Tooltip title={showChart ? 'Hide Chart' : 'Show Chart'}>
              <IconButton
                size="small"
                onClick={() => setShowChart(v => !v)}
                sx={{
                  p: '5px',
                  borderRadius: 1.5,
                  bgcolor: showChart ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${showChart ? 'rgba(59, 130, 246,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  color: showChart ? '#3B82F6' : '#6b7280',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246,0.18)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246,0.5)',
                  },
                }}
              >
                <CandlestickChart sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color={price >= 70587 ? '#3B82F6' : '#FF3366'}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography component="span" variant="caption" color={price >= 70587 ? '#3B82F6' : '#FF3366'}>
              {price >= 70587 ? '▲ +0.94%' : '▼ -0.94%'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Wallet Balance Banner */}
      <Paper sx={{ mb: 1, p: 1, display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(59, 130, 246,0.08)', border: '1px solid rgba(59, 130, 246,0.2)' }}>
        <AccountBalanceWallet sx={{ color: '#3B82F6', fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">Available:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3B82F6' }}>
          ${Math.floor(user?.wallet?.usdt || 0).toLocaleString('en-US')} USDT
        </Typography>
      </Paper>

      {/* ── Professional Trading Chart (toggleable) ──────────────── */}
      {showChart && (
        <Box
          sx={{
            mb: 1,
            animation: 'slideDown 0.25s ease-out',
            '@keyframes slideDown': {
              from: { opacity: 0, transform: 'translateY(-8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <TradingChart
            socket={socket}
            defaultPair={currentPair}
          />
        </Box>
      )}

      {/* Trading Mode Tabs */}
      <Paper sx={{ mb: 1 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 'bold' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="Spot" icon={<ShowChart />} iconPosition="start" />
          <Tab label="Perpetual" icon={<Timeline />} iconPosition="start" />
          <Tab
            label="Delivery contract"
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(255,51,102,0.2), rgba(255,51,102,0.1))',
                borderRadius: 1,
                color: '#FF3366',
              },
            }}
          />
        </Tabs>
      </Paper>

      {/* ------------------------------------------------------------------ */}
      {/* DELIVERY CONTRACT TAB                                               */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 2 && (
        <DeliveryTab
          price={price}
          socket={socket}
          user={user}
          orderBook={orderBook}
          currentPair={currentPair}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SPOT & PERPETUAL TABS                                               */}
      {/* ------------------------------------------------------------------ */}
      {(activeTab === 0 || activeTab === 1) && (
        <>
          <Grid container spacing={1}>
            {/* Order Form */}
            <Grid item xs={8}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {/* Buy/Sell Toggle */}
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Button
                      fullWidth variant={side === 'buy' ? 'contained' : 'outlined'}
                      sx={{ mr: 1, bgcolor: side === 'buy' ? '#3B82F6' : 'transparent', borderColor: '#3B82F6', color: side === 'buy' ? 'white' : '#3B82F6', fontWeight: 'bold' }}
                      onClick={() => setSide('buy')}
                    >{activeTab === 0 ? 'Buy' : 'Buy/Long'}</Button>
                    <Button
                      fullWidth variant={side === 'sell' ? 'contained' : 'outlined'}
                      sx={{ bgcolor: side === 'sell' ? '#FF3366' : 'transparent', borderColor: '#FF3366', color: side === 'sell' ? 'white' : '#FF3366', fontWeight: 'bold' }}
                      onClick={() => setSide('sell')}
                    >{activeTab === 0 ? 'Sell' : 'Sell/Short'}</Button>
                  </Box>

                  {/* Order Type */}
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {['market', 'limit'].map(type => (
                      <Chip
                        key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}
                        onClick={() => setOrderType(type)}
                        variant={orderType === type ? 'filled' : 'outlined'}
                        sx={{ mr: 1 }}
                        color={orderType === type ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>

                  {/* Leverage (Only for Perpetual) */}
                  {activeTab === 1 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Leverage: {leverage}x</Typography>
                      <Slider value={leverage} onChange={(e, v) => setLeverage(v)} min={1} max={100}
                        marks={[{ value: 1, label: '1x' }, { value: 25, label: '25x' }, { value: 50, label: '50x' }, { value: 100, label: '100x' }]}
                      />
                    </Box>
                  )}

                  {/* Price Input */}
                  {orderType === 'limit' && (
                    <TextField id="limit-price" name="limitPrice" autoComplete="off" fullWidth label="Price (USDT)" type="number" value={price}
                      onChange={(e) => setPrice(e.target.value)} sx={{ mb: 2 }} size="small"
                    />
                  )}

                  {/* Amount Input */}
                  <TextField
                    id="order-amount" name="orderAmount" autoComplete="off"
                    fullWidth label={`Amount (${currentPair.split('/')[0]})`} type="number"
                    value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ mb: 1 }} size="small"
                  />


                  {/* Total */}
                  <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Place Order */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button fullWidth variant="contained" size="large"
                      sx={{ bgcolor: side === 'buy' ? '#3B82F6' : '#FF3366', fontWeight: 'bold', py: 1.5 }}
                      onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : (side === 'buy' ? 'Place Buy Order' : 'Place Sell Order')}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Book */}
            <Grid item xs={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>Order Book</Typography>

                  {/* Asks */}
                  {orderBook.asks.slice(-7).map((ask, index) => {
                    const askPrice = parseFloat(ask._id || ask.price);
                    return (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, p: 0.5, bgcolor: 'rgba(255,51,102,0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" color="#FF3366">{askPrice.toFixed(price < 10 ? 4 : price < 1000 ? 2 : 0)}</Typography>
                      <Typography variant="caption">{Number(ask.total || ask.amount).toFixed(2)}</Typography>
                    </Box>
                  )})}

                  {/* Mid Price */}
                  <Box sx={{ textAlign: 'center', my: 1, py: 0.5, borderY: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>${price.toLocaleString()}</Typography>
                  </Box>

                  {/* Bids */}
                  {orderBook.bids.slice(0, 7).map((bid, index) => {
                    const bidPrice = parseFloat(bid._id || bid.price);
                    return (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, p: 0.5, bgcolor: 'rgba(59, 130, 246,0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" color="#3B82F6">{bidPrice.toFixed(price < 10 ? 4 : price < 1000 ? 2 : 0)}</Typography>
                      <Typography variant="caption">{Number(bid.total || bid.amount).toFixed(2)}</Typography>
                    </Box>
                  )})}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Positions & Open Orders */}
          <Box sx={{ mt: 2 }}>
            {(() => {
              const filteredPositions = positions.filter(p => p.tradeMode === (activeTab === 0 ? 'spot' : 'perpetual'));
              const filteredOpenOrders = openOrders.filter(o => o.tradeMode === (activeTab === 0 ? 'spot' : 'perpetual'));
              const filteredClosed = closedPositions.filter(c => c.tradeMode === (activeTab === 0 ? 'spot' : 'perpetual'));
              
              return (
                <>
                  <Tabs value={positionsTab} onChange={(e, v) => setPositionsTab(v)} variant="fullWidth" sx={{ mb: 1 }}>
                    <Tab label={activeTab === 0 ? `Trade History (${filteredPositions.length})` : `Positions (${filteredPositions.length})`} />
                    <Tab label={`Open Orders (${filteredOpenOrders.length})`} />
                    {activeTab === 1 && <Tab label={`Closed (${filteredClosed.length})`} />}
                  </Tabs>

                  {positionsTab === 0 && (
                    <Card>
                      {filteredPositions.length === 0 ? (
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">{activeTab === 0 ? 'No completed trades yet' : 'No completed positions yet'}</Typography>
                          <Typography variant="caption" color="text.secondary">Place an order to see it here</Typography>
                        </CardContent>
                      ) : (
                        <TableContainer sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                          <Table size="small" sx={{ '& .MuiTableCell-root': { px: {xs: 0.5, sm: 1}, whiteSpace: 'nowrap' } }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Pair</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>{activeTab === 0 ? 'Price' : 'Total'}</TableCell>
                                {activeTab === 0 && <TableCell>Status</TableCell>}
                                {activeTab === 1 && <TableCell>PnL</TableCell>}
                                {activeTab === 1 && <TableCell>Action</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredPositions.map((pos) => {
                                const currentP = livePrices[pos.pair] || pos.price;
                                let pnl = 0;
                                if (pos.type === 'long') pnl = (currentP - pos.price) * pos.amount;
                                if (pos.type === 'short') pnl = (pos.price - currentP) * pos.amount;

                                return (
                                <TableRow key={pos._id}>
                                  <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{pos.pair}</Typography></TableCell>
                                  <TableCell>
                                    <Chip label={pos.type.toUpperCase()} size="small"
                                      sx={{ fontSize: '0.65rem', bgcolor: (pos.type === 'long' || pos.type === 'buy') ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)', color: (pos.type === 'long' || pos.type === 'buy') ? '#3B82F6' : '#FF3366' }}
                                    />
                                  </TableCell>
                                  <TableCell><Typography variant="caption">{pos.amount}</Typography></TableCell>
                                  <TableCell><Typography variant="caption">${(activeTab === 0 ? pos.averagePrice || pos.price : pos.total).toLocaleString()}</Typography></TableCell>
                                  {activeTab === 0 && (
                                    <TableCell>
                                      <Typography variant="caption" color={pos.status === 'completed' ? '#10B981' : '#EF4444'}>
                                        {pos.status.charAt(0).toUpperCase() + pos.status.slice(1)}
                                      </Typography>
                                    </TableCell>
                                  )}
                                  {activeTab === 1 && (
                                    <TableCell>
                                      <Typography variant="caption" color={pnl >= 0 ? '#3B82F6' : '#FF3366'}>
                                        {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                      </Typography>
                                    </TableCell>
                                  )}
                                  {activeTab === 1 && (
                                    <TableCell>
                                      <Button size="small" variant="outlined" color="error" 
                                        onClick={() => handleClosePosition(pos)} 
                                        disabled={closingId === pos._id}
                                        sx={{ py: 0, px: 1, minWidth: 0, fontSize: '0.65rem' }}
                                      >
                                        {closingId === pos._id ? <CircularProgress size={10} color="inherit" /> : 'Close'}
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Card>
                  )}

                  {/* Closed Positions (Perpetual Only) */}
                  {positionsTab === 2 && activeTab === 1 && (
                    <Card>
                      {filteredClosed.length === 0 ? (
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No closed positions</Typography>
                        </CardContent>
                      ) : (
                        <TableContainer sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                          <Table size="small" sx={{ '& .MuiTableCell-root': { px: {xs: 0.5, sm: 1}, whiteSpace: 'nowrap' } }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Pair</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Entry</TableCell>
                                <TableCell>Close</TableCell>
                                <TableCell>PnL</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredClosed.map((pos) => (
                                <TableRow key={pos._id}>
                                  <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{pos.pair}</Typography></TableCell>
                                  <TableCell>
                                    <Chip label={pos.type.toUpperCase()} size="small"
                                      sx={{ fontSize: '0.65rem', bgcolor: (pos.type === 'long' || pos.type === 'buy') ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)', color: (pos.type === 'long' || pos.type === 'buy') ? '#3B82F6' : '#FF3366' }}
                                    />
                                  </TableCell>
                                  <TableCell><Typography variant="caption">{pos.amount}</Typography></TableCell>
                                  <TableCell><Typography variant="caption">${pos.price.toLocaleString()}</Typography></TableCell>
                                  <TableCell><Typography variant="caption">${pos.closePrice?.toLocaleString()}</Typography></TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color={pos.pnl >= 0 ? '#3B82F6' : '#FF3366'}>
                                      {pos.pnl >= 0 ? '+' : '-'}${Math.abs(pos.pnl || 0).toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Card>
                  )}

                  {/* Open Orders */}
                  {positionsTab === 1 && (
                    <Card>
                      {filteredOpenOrders.length === 0 ? (
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No open orders</Typography>
                          <Typography variant="caption" color="text.secondary">Place a limit order to see it here</Typography>
                        </CardContent>
                      ) : (
                        <TableContainer sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                          <Table size="small" sx={{ '& .MuiTableCell-root': { px: {xs: 0.5, sm: 1}, whiteSpace: 'nowrap' } }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Pair</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Limit Price</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Cancel</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredOpenOrders.map((order) => (
                                <TableRow key={order._id}>
                                  <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{order.pair}</Typography></TableCell>
                                  <TableCell>
                                    <Chip label={order.type.toUpperCase()} size="small"
                                      sx={{ fontSize: '0.65rem', bgcolor: (order.type === 'long' || order.type === 'buy') ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,51,102,0.15)', color: (order.type === 'long' || order.type === 'buy') ? '#3B82F6' : '#FF3366' }}
                                    />
                                  </TableCell>
                                  <TableCell><Typography variant="caption">{order.amount}</Typography></TableCell>
                                  <TableCell><Typography variant="caption">${order.price.toLocaleString()}</Typography></TableCell>
                                  <TableCell><Typography variant="caption">${order.total.toLocaleString()}</Typography></TableCell>
                                  <TableCell>
                                    <Tooltip title="Cancel Order">
                                      <IconButton size="small" color="error"
                                        onClick={() => handleCancelOrder(order._id)}
                                        disabled={cancellingId === order._id}
                                      >
                                        {cancellingId === order._id ? <CircularProgress size={16} /> : <CancelOutlined fontSize="small" />}
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Card>
                  )}
                </>
              );
            })()}
          </Box>
        </>
      )}
    </Container>
  );
};

export default TradingPage;