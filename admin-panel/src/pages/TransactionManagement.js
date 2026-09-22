import React, { useState, useEffect, useCallback } from "react";
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
  Switch,
  FormControlLabel,
  MenuList,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Search,
  FilterList,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Download,
  AccountBalanceWallet,
  CheckCircle,
  Pending,
  Cancel,
  Visibility,
  Edit,
  Receipt,
  History,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  SwapHoriz,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from '../api';
import { io } from 'socket.io-client';

const ALLOWED_TRANSACTION_TYPES = ["deposit", "withdrawal"];
const TRANSACTIONS_PER_PAGE = 20;

const TransactionManagement = () => {
  const [socket, setSocket] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processDialog, setProcessDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [depositDialog, setDepositDialog] = useState(false);
  const [depositForm, setDepositForm] = useState({ userId: '', currency: 'USDT', amount: '' });
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    sortBy: "newest",
  });
  const [chartData, setChartData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedWalletAddress, setEditedWalletAddress] = useState("");
  const [savingWalletAddress, setSavingWalletAddress] = useState(false);
  const [depositAmountOverride, setDepositAmountOverride] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let requestType = filters.type || undefined;
      let requestStatus = filters.status || undefined;

      if (!requestType && activeTab === 1) requestType = "deposit";
      if (!requestType && activeTab === 2) requestType = "withdrawal";
      if (!requestStatus && activeTab === 3) requestStatus = "pending";
      if (!requestStatus && activeTab === 4) requestStatus = "rejected";

      const response = await api.get('/api/admin/transactions', {
        params: {
          ...filters,
          type: requestType,
          status: requestStatus,
          page: currentPage,
          limit: TRANSACTIONS_PER_PAGE,
          search: searchTerm,
        },
      });
      const txs = response.data.transactions || [];
      setTransactions(txs);
      setFilteredTransactions(txs);
      setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
      setTotalTransactions(Number(response.data.totalTransactions) || 0);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, activeTab, searchTerm]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/users', { params: { limit: 100 } });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  }, []);



  useEffect(() => {
    // Connect to socket
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('adminToken') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to transaction socket');
      newSocket.emit('join_admin');
    });

    newSocket.on('new_transaction', (transaction) => {
      toast.success(`New ${transaction.type} transaction received`);
      if (ALLOWED_TRANSACTION_TYPES.includes(transaction.type)) {
        setTransactions((prev) => [transaction, ...prev]);
        setFilteredTransactions((prev) => [transaction, ...prev]); // profound simplification, ideally should re-filter
      }
      fetchStats();
    });

    newSocket.on('transaction_updated', (updatedTx) => {
      setTransactions(prev => prev.map(tx => tx._id === updatedTx._id ? updatedTx : tx));
      setFilteredTransactions(prev => prev.map(tx => tx._id === updatedTx._id ? updatedTx : tx));
      
      if (selectedTransaction?._id === updatedTx._id) {
        setSelectedTransaction(updatedTx);
      }
      fetchStats();
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new_transaction');
      newSocket.off('transaction_updated');
      newSocket.emit('leave_admin');
      newSocket.disconnect();
    };
  }, []); // Only runs once

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      const { transactionStats } = response.data;
      
      // Process stats for chart
      const statsMap = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        statsMap[dateStr] = { day: dateStr, deposits: 0, withdrawals: 0 };
      }
      
      if (transactionStats) {
        transactionStats.forEach(stat => {
          const date = stat._id.date;
          if (statsMap[date]) {
            if (stat._id.type === 'deposit') statsMap[date].deposits = stat.total;
            if (stat._id.type === 'withdrawal') statsMap[date].withdrawals = stat.total;
          }
        });
      }
      
      setChartData(Object.values(statsMap));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load chart data');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
    fetchUsers();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.type, filters.status, activeTab, searchTerm]);

  useEffect(() => {
    let filtered = transactions.filter((tx) =>
      ALLOWED_TRANSACTION_TYPES.includes(tx.type),
    );

    if (filters.type) {
      filtered = filtered.filter((tx) => tx.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((tx) => tx.status === filters.status);
    }

    filtered.sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (filters.sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (filters.sortBy === "amount_high") {
        return b.amount - a.amount;
      } else if (filters.sortBy === "amount_low") {
        return a.amount - b.amount;
      }
      return 0;
    });

    setFilteredTransactions(filtered);
  }, [filters, activeTab, transactions]);

  const handleMenuClick = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewTransaction = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleProcessTransaction = () => {
    setDepositAmountOverride(selectedTransaction?.amount > 0 ? String(selectedTransaction.amount) : '');
    setProcessDialog(true);
    handleMenuClose();
  };

  const handleApproveWithdrawal = async () => {
    if (!selectedTransaction) return;
    // For deposits, require a valid amount
    if (selectedTransaction.type === 'deposit') {
      const amt = parseFloat(depositAmountOverride);
      if (!amt || amt <= 0) {
        toast.error('Please enter a valid deposit amount');
        return;
      }
    }
    setProcessingId(selectedTransaction._id);
    try {
      const payload = { status: 'completed' };
      if (selectedTransaction.type === 'deposit' && depositAmountOverride) {
        payload.amount = parseFloat(depositAmountOverride);
      }
      await api.put(`/api/admin/transactions/${selectedTransaction._id}`, payload);
      toast.success(selectedTransaction.type === 'deposit' ? 'Deposit approved & credited successfully' : 'Withdrawal approved successfully');
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve transaction');
    } finally {
      setProcessingId(null);
      handleMenuClose();
      setProcessDialog(false);
      setViewDialog(false);
    }
  };

  const openRejectDialog = () => {
    setRejectionReason("");
    setRejectDialog(true);
    handleMenuClose();
  };

  const handleRejectTransaction = async () => {
    if (!selectedTransaction) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessingId(selectedTransaction._id);
    try {
      await api.put(`/api/admin/transactions/${selectedTransaction._id}`, { 
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });
      toast.error(`Transaction marked as rejected`);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject transaction');
    } finally {
      setProcessingId(null);
      setRejectDialog(false);
      setViewDialog(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedTransaction) return;
    setProcessingId(selectedTransaction._id);
    try {
      await api.put(`/api/admin/transactions/${selectedTransaction._id}`, { status: 'cancelled' });
      toast(`Transaction cancelled`);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel transaction');
    } finally {
      setProcessingId(null);
      handleMenuClose();
    }
  };

  const handleAddDeposit = async () => {
    const { userId, currency, amount } = depositForm;
    if (!userId || !currency || !amount || parseFloat(amount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }
    setProcessingId('deposit');
    try {
      const response = await api.post('/api/admin/deposit', {
        userId,
        currency,
        amount: parseFloat(amount)
      });
      toast.success(response.data.message || 'Deposit added successfully');
      setDepositDialog(false);
      setDepositForm({ userId: '', currency: 'USDT', amount: '' });
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add deposit');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle />;
      case "pending":
        return <Pending />;
      case "failed":
        return <Cancel />;
      case "cancelled":
        return <Cancel />;
      default:
        return <Pending />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "deposit":
        return "success";
      case "withdrawal":
        return "warning";
      case "trade":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownward />;
      case "withdrawal":
        return <ArrowUpward />;
      case "trade":
        return <SwapHoriz />;
      default:
        return <Receipt />;
    }
  };

  const formatCurrency = (amount, currency) => {
    if (["BTC", "ETH", "SOL"].includes(currency)) {
      return `${amount} ${currency}`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getWalletAddress = (transaction) => {
    if (!transaction) return "";
    if (transaction.type === "deposit") {
      return transaction.fromAddress || transaction.walletAddress || transaction.toAddress || "";
    }
    return transaction.toAddress || transaction.walletAddress || transaction.fromAddress || "";
  };

  const handleStartEditAddress = () => {
    setEditedWalletAddress(getWalletAddress(selectedTransaction));
    setIsEditingAddress(true);
  };

  const handleCancelEditAddress = () => {
    setEditedWalletAddress(getWalletAddress(selectedTransaction));
    setIsEditingAddress(false);
  };

  const handleSaveWalletAddress = async () => {
    if (!selectedTransaction?._id) return;
    const trimmedAddress = editedWalletAddress.trim();
    if (!trimmedAddress) {
      toast.error("Wallet address cannot be empty");
      return;
    }

    setSavingWalletAddress(true);
    try {
      const response = await api.put(`/api/admin/transactions/${selectedTransaction._id}`, {
        walletAddress: trimmedAddress,
      });
      const updatedTransaction = response.data?.transaction;

      if (updatedTransaction) {
        setTransactions((prev) =>
          prev.map((tx) => (tx._id === updatedTransaction._id ? updatedTransaction : tx)),
        );
        setFilteredTransactions((prev) =>
          prev.map((tx) => (tx._id === updatedTransaction._id ? updatedTransaction : tx)),
        );
        setSelectedTransaction(updatedTransaction);
        setEditedWalletAddress(getWalletAddress(updatedTransaction));
      }

      setIsEditingAddress(false);
      toast.success("Wallet address updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wallet address");
    } finally {
      setSavingWalletAddress(false);
    }
  };

  const StatsCard = ({ title, value, icon, color, change, subtitle }) => (
    <Card className="admin-card">
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", my: 1 }}>
              {value}
            </Typography>
            {change && (
              <Typography
                variant="caption"
                sx={{ color: change >= 0 ? "#3B82F6" : "#f43f5e" }}
              >
                {change >= 0 ? "+" : ""}
                {change}% from yesterday
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {subtitle}
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Transaction Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and process all financial transactions
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<AccountBalance />}
            onClick={() => { fetchUsers(); setDepositDialog(true); }}
          >
            Add Deposit
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Deposits"
            value={`$${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}`}
            icon={<TrendingUp />}
            color="#4361EE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Withdrawals"
            value={`$${transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}`}
            icon={<TrendingDown />}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Requests"
            value={transactions.filter(t => t.status === 'pending').length.toString()}
            icon={<Refresh />}
            color="#7209B7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Volume"
            value={`$${transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}`}
            icon={<AccountBalance />}
            color="#f43f5e"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Transaction Volume (7 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      formatter={(value) => [
                        formatCurrency(value, "USDT"),
                        "Amount",
                      ]}
                    />
                    <Bar
                      dataKey="deposits"
                      fill="#3B82F6"
                      name="Deposits"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="withdrawals"
                      fill="#f43f5e"
                      name="Withdrawals"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  {
                    label: "Process Pending Withdrawals",
                    icon: "💸",
                    count: transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length,
                  },
                  { label: "Review Large Deposits", icon: "🔍", count: transactions.filter(t => t.type === 'deposit' && (t.amount || 0) >= 1000).length },
                  { label: "Check Failed Transactions", icon: "⚠️", count: transactions.filter(t => t.status === 'failed').length },
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      fullWidth
                      startIcon={<Box sx={{ fontSize: 24 }}>{action.icon}</Box>}
                      variant="outlined"
                      sx={{
                        justifyContent: "flex-start",
                        p: 2,
                        borderRadius: 2,
                        borderColor: "rgba(255,255,255,0.1)",
                        "&:hover": {
                          borderColor: "#3B82F6",
                          background: "rgba(0, 211, 149, 0.05)",
                        },
                      }}
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body2">{action.label}</Typography>
                      </Box>
                      {action.count > 0 && (
                        <Chip
                          label={action.count}
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search by user, TX ID, or hash..."
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
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="deposit">Deposit</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="amount_high">Highest Amount</MenuItem>
                <MenuItem value="amount_low">Lowest Amount</MenuItem>
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
            "& .MuiTab-root": { fontWeight: "bold" },
          }}
        >
          <Tab label="All Transactions" />
          <Tab label="Deposits" />
          <Tab label="Withdrawals" />
          <Tab label="Pending" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">
              Transactions ({totalTransactions})
            </Typography>
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredTransactions.length === 0 ? (
            <Alert severity="info">
              No transactions found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Network</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {tx._id.slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#4361EE', width: 32, height: 32 }} src={tx.userId?.profilePicture || undefined}>
                            {(tx.userId?.fullName || tx.userName || 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {tx.userId?.fullName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tx.userId?.email || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type.toUpperCase()}
                          size="small"
                          icon={tx.type === 'deposit' ? <TrendingUp /> : <TrendingDown />}
                          sx={{
                            bgcolor: (tx.type === 'deposit' ? '#4361EE' : '#3B82F6') + '20',
                            color: tx.type === 'deposit' ? '#4361EE' : '#3B82F6',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {(tx.amount || 0).toLocaleString()} {tx.currency?.toUpperCase() || 'USDT'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fee: {(tx.fee || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tx.chain || tx.network || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          size="small"
                          color={getStatusColor(tx.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(tx.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, tx)}
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

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing up to {TRANSACTIONS_PER_PAGE} per page
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={loading || currentPage <= 1}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ minWidth: 80, textAlign: "center" }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={loading || currentPage >= totalPages}
              >
                Next
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Transaction Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewTransaction}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        {(selectedTransaction?.status === "pending" &&
          (selectedTransaction?.type === "withdrawal" || selectedTransaction?.type === "deposit")) && (
            <MenuItem onClick={handleProcessTransaction}>
              <CheckCircle sx={{ mr: 2, color: "#3B82F6" }} />
              Process {selectedTransaction?.type === "withdrawal" ? "Withdrawal" : "Deposit"}
            </MenuItem>
          )}
        {selectedTransaction?.status === "pending" && (
          <MenuItem onClick={handleCancelTransaction}>
            <Cancel sx={{ mr: 2, color: "#f43f5e" }} />
            Cancel Transaction
          </MenuItem>
        )}
        {selectedTransaction?.status !== "completed" &&
          selectedTransaction?.status !== "failed" && 
          selectedTransaction?.status !== "rejected" && (
            <MenuItem onClick={openRejectDialog}>
              <Cancel sx={{ mr: 2, color: "#f43f5e" }} />
              Reject Transaction
            </MenuItem>
          )}
      </Menu>

      {/* View Transaction Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => {
          setIsEditingAddress(false);
          setViewDialog(false);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedTransaction && (
          <>
            <DialogTitle>
              Transaction Details - {selectedTransaction.id}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getTypeColor(selectedTransaction.type),
                        width: 60,
                        height: 60,
                        fontSize: 24,
                      }}
                    >
                      {getTypeIcon(selectedTransaction.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {selectedTransaction.type.toUpperCase()} -{" "}
                        {selectedTransaction.currency}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTransaction.userId?.fullName || selectedTransaction.userName || 'Unknown User'} • ID:{" "}
                        {(typeof selectedTransaction.userId === 'object' ? selectedTransaction.userId?._id : selectedTransaction.userId) || 'N/A'}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Chip
                          label={selectedTransaction.type}
                          color={getTypeColor(selectedTransaction.type)}
                          icon={getTypeIcon(selectedTransaction.type)}
                        />
                        <Chip
                          label={selectedTransaction.status}
                          color={getStatusColor(selectedTransaction.status)}
                          icon={getStatusIcon(selectedTransaction.status)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Transaction Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ "& > *": { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Amount:</strong>{" "}
                        {formatCurrency(
                          selectedTransaction.amount,
                          selectedTransaction.currency,
                        )}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Network/Chain:</strong> {selectedTransaction.chain || selectedTransaction.network || 'N/A'}
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Wallet Address:</strong>
                        </Typography>
                        {isEditingAddress ? (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              value={editedWalletAddress}
                              onChange={(e) => setEditedWalletAddress(e.target.value)}
                              placeholder="Enter wallet address"
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={handleSaveWalletAddress}
                                disabled={savingWalletAddress}
                              >
                                {savingWalletAddress ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancelEditAddress}
                                disabled={savingWalletAddress}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                lineHeight: 1.5,
                                flex: 1,
                              }}
                            >
                              {getWalletAddress(selectedTransaction) || "N/A"}
                            </Typography>
                            <Button size="small" variant="text" onClick={handleStartEditAddress}>
                              Edit
                            </Button>
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2">
                        <strong>Fee:</strong>{" "}
                        {formatCurrency(
                          selectedTransaction.fee,
                          selectedTransaction.currency,
                        )}
                      </Typography>
                      {selectedTransaction.metadata && (
                        <Typography variant="body2">
                          <strong>Pair:</strong>{" "}
                          {selectedTransaction.metadata.pair}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Timeline
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ "& > *": { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Created:</strong>{" "}
                        {formatDate(selectedTransaction.createdAt)}
                      </Typography>
                      {selectedTransaction.completedAt && (
                        <Typography variant="body2">
                          <strong>Completed:</strong>{" "}
                          {formatDate(selectedTransaction.completedAt)}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Status:</strong> {selectedTransaction.status}
                      </Typography>
                      {selectedTransaction.reason && (
                        <Typography variant="body2">
                          <strong>Reason:</strong> {selectedTransaction.reason}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {selectedTransaction.txHash &&
                  selectedTransaction.txHash !== "N/A" && (
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Blockchain Information
                      </Typography>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ wordBreak: "break-all" }}>
                          <Typography variant="body2">
                            <strong>Transaction Hash:</strong>{" "}
                            {selectedTransaction.txHash}
                          </Typography>
                          <Typography variant="body2">
                            <strong>From Address:</strong>{" "}
                            {selectedTransaction.fromAddress}
                          </Typography>
                          <Typography variant="body2">
                            <strong>To Address:</strong>{" "}
                            {selectedTransaction.toAddress}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                {selectedTransaction.status === "pending" && (
                    <Grid item xs={12}>
                      <Alert severity="warning">
                        <Typography variant="body2">
                          <strong>Action Required:</strong> This {selectedTransaction.type}
                          needs to be processed manually.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                {selectedTransaction.voucher && (
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Payment Voucher
                    </Typography>
                    <Paper sx={{ p: 1, textAlign: 'center' }}>
                      <img 
                        src={selectedTransaction.voucher} 
                        alt="Voucher" 
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }} 
                        onClick={() => window.open(selectedTransaction.voucher, '_blank')}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, cursor: 'pointer', color: 'primary.main' }} onClick={() => window.open(selectedTransaction.voucher, '_blank')}>
                        Click to view full size
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setIsEditingAddress(false);
                  setViewDialog(false);
                }}
              >
                Close
              </Button>
              {selectedTransaction.status === "pending" && (
                  <Button
                    onClick={handleProcessTransaction}
                    variant="contained"
                    color={selectedTransaction.type === 'deposit' ? 'success' : 'primary'}
                  >
                    {selectedTransaction.type === 'deposit' ? '✅ Process Deposit' : '💸 Process Withdrawal'}
                  </Button>
                )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Process Transaction Dialog */}
      <Dialog open={processDialog} onClose={() => setProcessDialog(false)} maxWidth="sm" fullWidth>
        {selectedTransaction && (
          <>
            <DialogTitle>
              {selectedTransaction.type === 'deposit' ? '✅ Process Deposit' : '💸 Process Withdrawal'} — #{selectedTransaction._id?.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogContent>
              <Alert severity={selectedTransaction.type === 'deposit' ? 'success' : 'info'} sx={{ mb: 3 }}>
                {selectedTransaction.type === 'deposit'
                  ? 'Enter the actual received amount and approve to credit the user\'s wallet.'
                  : 'Confirm that funds have been sent to the user\'s wallet before approving.'}
              </Alert>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Type:</strong> {selectedTransaction.type.toUpperCase()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>User:</strong> {selectedTransaction.userId?.fullName || 'Unknown'} ({selectedTransaction.userId?.email || 'N/A'})
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Network/Chain:</strong> {selectedTransaction.chain || selectedTransaction.network || 'N/A'}
                </Typography>
                {selectedTransaction.type === 'withdrawal' && (
                  <Typography variant="body2" gutterBottom>
                    <strong>To Address:</strong> {selectedTransaction.toAddress || 'N/A'}
                  </Typography>
                )}
                {selectedTransaction.voucher && (
                   <Box sx={{ mt: 2 }}>
                     <Typography variant="body2" gutterBottom><strong>Payment Voucher:</strong></Typography>
                     <img src={selectedTransaction.voucher} alt="Voucher Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }} onClick={() => window.open(selectedTransaction.voucher, '_blank')} />
                   </Box>
                )}
                {selectedTransaction.type === 'deposit' && (
                  <TextField
                    fullWidth
                    label="Deposit Amount (USDT)"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={depositAmountOverride}
                    onChange={(e) => setDepositAmountOverride(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProcessDialog(false)}>Cancel</Button>
              <Button onClick={() => setRejectDialog(true)} color="error" variant="outlined" disabled={processingId === selectedTransaction._id}>Reject</Button>
              <Button onClick={handleApproveWithdrawal} variant="contained" color="success" disabled={processingId === selectedTransaction._id}>
                {processingId === selectedTransaction._id ? 'Processing...' : (selectedTransaction.type === 'deposit' ? '✅ Approve & Credit' : '✅ Approve & Process')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject Transaction Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Transaction</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            Please provide a reason for rejecting this transaction. This reason will be shown to the user.
          </Alert>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="E.g., Invalid wallet address, Insufficient funds, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectTransaction}
            variant="contained"
            color="error"
            disabled={processingId === selectedTransaction?._id}
          >
            {processingId === selectedTransaction?._id ? "Processing..." : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Deposit Dialog */}
      <Dialog open={depositDialog} onClose={() => setDepositDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Manual Deposit</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>This will immediately credit the selected user's wallet balance.</Alert>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Select User</InputLabel>
            <Select
              value={depositForm.userId}
              label="Select User"
              onChange={(e) => setDepositForm({ ...depositForm, userId: e.target.value })}
            >
              {users.map(u => (
                <MenuItem key={u._id} value={u._id}>
                  {u.fullName} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={depositForm.currency}
              label="Currency"
              onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value })}
            >
              {['USDT', 'BTC', 'ETH', 'SOL'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth label="Amount" type="number" inputProps={{ min: 0, step: 0.0001 }}
            value={depositForm.amount}
            onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
            placeholder="e.g. 500"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDepositDialog(false); setDepositForm({ userId: '', currency: 'USDT', amount: '' }); }}>Cancel</Button>
          <Button
            onClick={handleAddDeposit}
            variant="contained"
            color="success"
            disabled={processingId === 'deposit'}
          >
            {processingId === 'deposit' ? 'Processing...' : 'Add Deposit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionManagement;
