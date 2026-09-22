import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  BarChart,
  Timeline,
  AccountBalance,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Visibility,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { io } from 'socket.io-client';

const TradingManagement = () => {
  const [socket, setSocket] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editOutcome, setEditOutcome] = useState('win');
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    pair: '',
    type: '',
    status: '',
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [marketSettings, setMarketSettings] = useState({
    tradingEnabled: true,
    maintenanceMode: false,
    maxLeverage: 100,
    fundingRate: 0.01,
    takerFee: 0.1,
    makerFee: 0.05,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/settings');
      setMarketSettings(prev => ({ ...prev, tradingEnabled: response.data.tradingEnabled ?? true }));
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  }, []);

  const [chartData, setChartData] = useState([]);

  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'];

  const processTradeData = useCallback((trade) => {
    let pnl = 0;
    let pnlPercentage = 0;
    let duration = '-';

    if (trade.tradeMode === 'delivery') {
      if (trade.status === 'completed') {
        if (trade.outcome === 'win') {
          pnl = trade.profitAmount || 0;
          pnlPercentage = trade.profitPercent || 0;
        } else if (trade.outcome === 'loss') {
          pnl = -(trade.total || 0);
          pnlPercentage = -100;
        }
      }
      if (trade.deliverySeconds) {
        duration = `${trade.deliverySeconds}s`;
      }
    } else {
      pnl = trade.pnl || 0;
      pnlPercentage = trade.pnlPercentage || 0;
      duration = trade.duration || (trade.tradeMode ? trade.tradeMode.toUpperCase() : '-');
    }

    return {
      ...trade,
      pnl,
      pnlPercentage,
      duration,
    };
  }, []);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/trades', { 
        params: {
          ...filters,
          search: searchTerm,
          limit: 10000,
          page: 1
        } 
      });
      const processed = (response.data.trades || []).map(processTradeData);
      setTrades(processed);
      setFilteredTrades(processed);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, processTradeData]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/stats');
      const { tradeStats24h } = response.data;
      
      // Process stats for chart (last 24 hours)
      const data = [];
      const now = new Date();
      const currentHour = now.getHours();
      
      // Initialize map for 24 hours
      const statsMap = {};
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(currentHour - i);
        const hour = d.getHours();
        const date = d.toISOString().split('T')[0]; // Simple date key
        const key = `${date}-${hour}`;
        
        statsMap[key] = {
          hour: `${hour}:00`,
          volume: 0,
          trades: 0,
          fees: 0
        };
        data.push(statsMap[key]); // Preserve order
      }
      
      if (tradeStats24h) {
        tradeStats24h.forEach(stat => {
           const key = `${stat._id.date}-${stat._id.hour}`;
           // We need to match precise date/hour. 
           // Our map keys are approximate if date changes. 
           // Let's simplify: just map received stats to nearest hour in our list?
           // Actually, exact match is better.
           
           // If we find the key in our initialized map, update it
           if (statsMap[key]) {
             statsMap[key].volume = stat.volume;
             statsMap[key].trades = stat.count;
             statsMap[key].fees = stat.fees;
           }
        });
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const filterTrades = useCallback(() => {
    let filtered = [...trades];
    if (filters.pair) filtered = filtered.filter(trade => trade.pair === filters.pair);
    if (filters.type) filtered = filtered.filter(trade => trade.type === filters.type);
    if (filters.status) filtered = filtered.filter(trade => trade.status === filters.status);
    if (activeTab === 1) filtered = filtered.filter(t => t.status === 'pending');
    if (activeTab === 2) filtered = filtered.filter(t => t.status === 'completed');
    if (activeTab === 3) filtered = filtered.filter(t => t.type === 'long' || t.type === 'buy');
    if (activeTab === 4) filtered = filtered.filter(t => t.type === 'short' || t.type === 'sell');
    filtered.sort((a, b) => {
      if (filters.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (filters.sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (filters.sortBy === 'pnl_high') return (b.pnl || 0) - (a.pnl || 0);
      if (filters.sortBy === 'pnl_low') return (a.pnl || 0) - (b.pnl || 0);
      if (filters.sortBy === 'volume') return (b.total || 0) - (a.total || 0);
      return 0;
    });
    setFilteredTrades(filtered);
    setCurrentPage(1); // reset to page 1 whenever filters change
  }, [trades, filters, activeTab]);



  useEffect(() => {
    // Connect to socket
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('adminToken') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to trading socket');
      newSocket.emit('join_admin');
    });

    newSocket.on('new_trade', (trade) => {
      toast.success(`New ${trade.type} trade placed`);
      setTrades(prev => [processTradeData(trade), ...prev]);
      fetchStats();
    });

    newSocket.on('trade_updated', (updatedTrade) => {
      const processed = processTradeData(updatedTrade);
      setTrades(prev => prev.map(t => t._id === processed._id ? processed : t));
      setSelectedTrade(prev => (prev?._id === processed._id ? processed : prev));
      fetchStats();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [fetchStats, processTradeData]);

  useEffect(() => {
    fetchTrades();
    fetchStats();
    fetchSettings();
  }, [fetchTrades, fetchStats, fetchSettings]);

  useEffect(() => {
    filterTrades();
  }, [filterTrades]);

  const handleMenuClick = (event, trade) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewTrade = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleCloseTrade = async () => {
    if (!selectedTrade) return;
    setProcessingId(selectedTrade._id);
    try {
      await api.put(`/api/trading/order/${selectedTrade._id}/status`, { status: 'completed' });
      toast.success(`Trade closed successfully`);
      fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close trade');
    } finally {
      setProcessingId(null);
      handleMenuClose();
    }
  };

  const handleCancelTrade = async () => {
    if (!selectedTrade) return;
    setProcessingId(selectedTrade._id);
    try {
      await api.put(`/api/trading/order/${selectedTrade._id}/status`, { status: 'cancelled' });
      toast.success(`Trade cancelled`);
      fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel trade');
    } finally {
      setProcessingId(null);
      handleMenuClose();
    }
  };

  const handleEditTrade = () => {
    if (selectedTrade) {
      setEditOutcome(selectedTrade.outcome || 'win');
      setEditDialog(true);
    }
    handleMenuClose();
  };

  const handleSaveEditTrade = async () => {
    if (!selectedTrade) return;
    setProcessingId(selectedTrade._id);
    try {
      await api.put(`/api/trading/order/${selectedTrade._id}/outcome`, { outcome: editOutcome });
      toast.success(`Trade updated successfully`);
      fetchTrades();
      setEditDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit trade');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    return type === 'long' ? 'success' : 'error';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCrypto = (amount) => {
    return amount.toFixed(4);
  };

  const calculateTotalVolume = () => {
    return trades.reduce((sum, trade) => sum + (trade.amount * trade.entryPrice), 0);
  };

  const calculateTotalFees = () => {
    return trades.reduce((sum, trade) => sum + (trade.amount * trade.entryPrice * 0.001), 0);
  };

  const handleSettingChange = async (key, value) => {
    try {
      if (key === 'tradingEnabled') {
        await api.put('/api/admin/settings', { tradingEnabled: value });
      }
      setMarketSettings(prev => ({ ...prev, [key]: value }));
      toast.success(`Global Trading Outcome set to ${value ? 'WIN' : 'LOSS'}`);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const StatsCard = ({ title, value, icon, color, change }) => (
    <Card className="admin-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
              {value}
            </Typography>
            {change && (
              <Typography variant="caption" sx={{ color: change >= 0 ? '#3B82F6' : '#f43f5e' }}>
                {change >= 0 ? '+' : ''}{change}% from yesterday
              </Typography>
            )}
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Trading Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage all trading activity
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Trades"
            value={trades.length.toLocaleString()}
            icon={<Timeline />}
            color="#4361EE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Volume"
            value={`$${trades.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}`}
            icon={<AccountBalance />}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Trades"
            value={trades.filter(t => t.status === 'active').length.toString()}
            icon={<PlayArrow />}
            color="#7209B7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Fees"
            value={`$${trades.reduce((sum, t) => sum + (t.fee || 0), 0).toLocaleString()}`}
            icon={<BarChart />}
            color="#f43f5e"
          />
        </Grid>
      </Grid>

      {/* Trading Volume Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            24-Hour Trading Volume
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                  formatter={(value) => [formatCurrency(value), 'Volume']}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>



      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search trades by user, ID, or pair..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Pair</InputLabel>
              <Select
                value={filters.pair}
                label="Pair"
                onChange={(e) => setFilters({ ...filters, pair: e.target.value })}
              >
                <MenuItem value="">All Pairs</MenuItem>
                {pairs.map(pair => (
                  <MenuItem key={pair} value={pair}>{pair}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="long">Long</MenuItem>
                <MenuItem value="short">Short</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="pnl_high">Highest PnL</MenuItem>
                <MenuItem value="pnl_low">Lowest PnL</MenuItem>
                <MenuItem value="volume">Largest Volume</MenuItem>
              </Select>
            </FormControl>

            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 'bold' },
          }}
        >
          <Tab label="All Trades" />
          <Tab label="Open Positions" />
          <Tab label="Closed Trades" />
          <Tab label="Long Positions" />
          <Tab label="Short Positions" />
        </Tabs>
      </Paper>

      {/* Trades Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Trade History ({filteredTrades.length})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredTrades.length === 0 ? (
            <Alert severity="info">
              No trades found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trade ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Pair</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Profit/Loss</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Date / Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((trade) => (
                    <TableRow key={trade._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trade._id.slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }} src={trade.userId?.profilePicture || undefined}>
                            {(trade.userId?.fullName || trade.userName || 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trade.userId?.fullName || trade.userName || 'Unknown'}</Typography>
                            <Typography variant="caption" color="text.secondary">{trade.userId?.email || ''}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trade.pair}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: getTypeColor(trade.type) + '20',
                            color: getTypeColor(trade.type),
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: (trade.pnl || 0) >= 0 ? '#3B82F6' : '#f43f5e',
                            fontWeight: 'bold',
                          }}
                        >
                          {(trade.pnl || 0).toLocaleString()} ({(trade.pnlPercentage || 0).toFixed(2)}%)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.status}
                          size="small"
                          color={getStatusColor(trade.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {trade.createdAt ? new Date(trade.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, trade)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination Bar */}
          {filteredTrades.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Showing up to
                </Typography>
                <FormControl size="small">
                  <Select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    sx={{ fontSize: '0.75rem', height: 28, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
                  >
                    {[10, 20, 50, 100].map(n => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  per page
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  sx={{
                    fontSize: '0.7rem',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 0,
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: currentPage === 1 ? 'text.disabled' : 'text.primary',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  PREVIOUS
                </Button>

                <Typography variant="caption" sx={{ fontWeight: 700, px: 1, color: 'text.primary' }}>
                  Page {currentPage} of {Math.max(1, Math.ceil(filteredTrades.length / pageSize))}
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={currentPage >= Math.ceil(filteredTrades.length / pageSize)}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTrades.length / pageSize), p + 1))}
                  sx={{
                    fontSize: '0.7rem',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 0,
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: currentPage >= Math.ceil(filteredTrades.length / pageSize) ? 'text.disabled' : 'text.primary',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  NEXT
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Trade Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewTrade}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        {selectedTrade?.status === 'pending' && (
          <MenuItem onClick={handleCloseTrade} disabled={processingId === selectedTrade?._id}>
            <Stop sx={{ mr: 2 }} />
            {processingId === selectedTrade?._id ? 'Closing...' : 'Close Trade'}
          </MenuItem>
        )}
        {selectedTrade?.status === 'pending' && (
          <MenuItem onClick={handleCancelTrade} disabled={processingId === selectedTrade?._id}>
            <Cancel sx={{ mr: 2 }} />
            {processingId === selectedTrade?._id ? 'Cancelling...' : 'Cancel Trade'}
          </MenuItem>
        )}
        <MenuItem onClick={handleEditTrade}>
          <Edit sx={{ mr: 2 }} />
          Edit Trade
        </MenuItem>
      </Menu>

      {/* View Trade Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTrade && (
          <>
            <DialogTitle>
              Trade Details - {selectedTrade.id}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#3B82F6', width: 60, height: 60, fontSize: 24 }}>
                      {(selectedTrade.userId?.fullName || selectedTrade.userName || 'U').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedTrade.userId?.fullName || selectedTrade.userName || 'Unknown'}
                      </Typography>
                       <Typography variant="body2" color="text.secondary">
                         User ID: {(typeof selectedTrade.userId === 'object' ? selectedTrade.userId?._id : selectedTrade.userId) || 'N/A'}
                       </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={selectedTrade.type.toUpperCase()} 
                          color={getTypeColor(selectedTrade.type)}
                        />
                        <Chip 
                          label={selectedTrade.status} 
                          color={getStatusColor(selectedTrade.status)}
                        />
                        <Chip label={`${selectedTrade.leverage}x`} />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Trade Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Pair:</strong> {selectedTrade.pair}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Entry Price:</strong> {formatCurrency(selectedTrade.entryPrice)}
                      </Typography>
                      {selectedTrade.exitPrice && (
                        <Typography variant="body2">
                          <strong>Exit Price:</strong> {formatCurrency(selectedTrade.exitPrice)}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Amount:</strong> {formatCrypto(selectedTrade.amount)} ({selectedTrade.pair.split('/')[0]})
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Value:</strong> {formatCurrency(selectedTrade.amount * selectedTrade.entryPrice)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Performance
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>P&L:</strong> 
                        <span style={{ 
                          color: selectedTrade.pnl >= 0 ? '#3B82F6' : '#f43f5e',
                          marginLeft: 8,
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(selectedTrade.pnl || 0)}
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        <strong>P&L Percentage:</strong> 
                        <span style={{ 
                          color: selectedTrade.pnlPercentage >= 0 ? '#3B82F6' : '#f43f5e',
                          marginLeft: 8
                        }}>
                          {selectedTrade.pnlPercentage?.toFixed(2)}%
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        <strong>Opened:</strong> {new Date(selectedTrade.openedAt).toLocaleString()}
                      </Typography>
                      {selectedTrade.closedAt && (
                        <Typography variant="body2">
                          <strong>Closed:</strong> {new Date(selectedTrade.closedAt).toLocaleString()}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Duration:</strong> {selectedTrade.duration}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity={selectedTrade.status === 'open' ? 'info' : 'success'}>
                    <Typography variant="body2">
                      <strong>Trade Status:</strong> {selectedTrade.status.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {selectedTrade.status === 'open' 
                        ? 'This position is currently open and active.' 
                        : 'This trade has been completed and closed.'}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              {selectedTrade.status === 'open' && (
                <Button onClick={handleCloseTrade} variant="contained" color="primary">
                  Close Trade
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Trade Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Trade Outcome</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Outcome</InputLabel>
              <Select
                value={editOutcome}
                label="Outcome"
                onChange={(e) => setEditOutcome(e.target.value)}
              >
                <MenuItem value="win">Win</MenuItem>
                <MenuItem value="loss">Loss</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEditTrade} 
            variant="contained" 
            color="primary"
            disabled={processingId === selectedTrade?._id}
          >
            {processingId === selectedTrade?._id ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingManagement;