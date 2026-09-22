import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button, TextField, InputAdornment, IconButton,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar,
  Badge, Tooltip, Tabs, Tab, Alert, LinearProgress, FormControlLabel, Switch,
  FormControl, InputLabel, Select
} from '@mui/material';
import { io } from 'socket.io-client';
import {
  People, SwapVert, Search, FilterList, MoreVert, PersonAdd, Edit, Delete, Block,
  CheckCircle, Cancel, Visibility, Download, Refresh, Email, Phone, AccountBalanceWallet,
  TrendingUp, Security, ChatBubble, Notifications, MoneyOff, AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';

const UserManagement = () => {
  const socketRef = useRef(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [users, setUsers] = useState([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalPlatformUsers, setTotalPlatformUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusData, setStatusData] = useState({ status: 'active', reason: '' });
  const [editDialog, setEditDialog] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'info' });


  // Initialize socket connection and listen for user status updates
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    // Connect to the /chat namespace with admin auth token
    socketRef.current = io(
      (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000') + '/chat',
      { auth: { token } }
    );

    socketRef.current.on('connect', () => {
      console.log('Admin connected to /chat namespace for user status');
      // Request current user status list
      socketRef.current.emit('get_user_status');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    const handleStatus = (list) => {
      const map = {};
      list.forEach(item => {
        map[item.userId] = { ip: item.ip, online: item.online };
      });
      setUserStatuses(map);
    };

    socketRef.current.on('user_status', handleStatus);

    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_user_status');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.off('user_status', handleStatus);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    kycStatus: '',
    deliveryTradeEnabled: true,
    canViewDepositAddress: false,
    score: 0,
    level: 1,
    password: '',
    usdtAddition: 0,
    usdtSubtraction: 0,
    wallet: {
      usdt: 0
    }
  });
  const [filters, setFilters] = useState({
    status: '',
    kyc: '',
    sortBy: 'newest',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };

      // Add status filters from dropdown
      if (filters.status) params.status = filters.status;
      if (filters.kyc) params.kycStatus = filters.kyc;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      // Override with tab filters if selected
      if (activeTab === 1) params.status = 'active';
      if (activeTab === 2) params.status = 'suspended';
      if (activeTab === 3) params.kycStatus = 'pending';

      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalUsersCount(response.data.totalUsersCount || 0);
      setTotalPlatformUsers(response.data.totalUsers || 0);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab]);

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
    setEditData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      kycStatus: user.kycStatus || 'unverified',
      deliveryTradeEnabled: user.deliveryTradeEnabled !== undefined ? user.deliveryTradeEnabled : true,
      canViewDepositAddress: user.canViewDepositAddress || false,
      score: user.score || 0,
      level: user.level || 1,
      password: '',
      usdtAddition: 0,
      usdtSubtraction: 0,
      wallet: {
        usdt: user.wallet?.usdt || 0,
      }
    });
    setStatusData({
      status: user.status || 'active',
      reason: user.statusReason || ''
    });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewUser = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleEditUser = () => {
    setEditDialog(true);
    handleMenuClose();
  };

  const handleOpenNotification = () => {
    setNotificationData({ title: '', message: '', type: 'info' });
    setNotificationDialog(true);
    handleMenuClose();
  };

  const handleSendNotification = async () => {
    try {
      await api.post(`/api/admin/users/${selectedUser._id}/notify`, notificationData);
      toast.success('Notification sent successfully');
      setNotificationDialog(false);
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const payload = { ...editData };
      
      const currentUsdt = selectedUser.wallet?.usdt || 0;
      const addition = Number(payload.usdtAddition) || 0;
      const subtraction = Number(payload.usdtSubtraction) || 0;
      
      payload.wallet = { 
        ...payload.wallet, 
        usdt: currentUsdt + addition - subtraction
      };
      
      delete payload.usdtAddition;
      delete payload.usdtSubtraction;

      if (!payload.password) {
        delete payload.password;
      }
      await api.put(`/api/admin/users/${selectedUser._id}`, payload);
      toast.success('User updated successfully');
      setEditDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm(`Are you sure you want to delete user ${selectedUser.fullName}?`)) {
      try {
        await api.delete(`/api/admin/users/${selectedUser._id}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
    handleMenuClose();
  };

  const handleToggleWithdrawal = async () => {
    handleMenuClose();
    const isCurrentlyEnabled = selectedUser.withdrawalEnabled !== false;
    const action = isCurrentlyEnabled ? 'close' : 'open';
    if (!window.confirm(`Are you sure you want to ${action} withdrawal for ${selectedUser.fullName}?`)) return;
    try {
      const response = await api.put(`/api/admin/users/${selectedUser._id}/toggle-withdrawal`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to toggle withdrawal status');
    }
  };

  const handleStatusChange = async () => {
    try {
      await api.put(`/api/admin/users/${selectedUser._id}/status`, statusData);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Action failed');
    }
    setStatusDialog(false);
  };

  const handleVerifyKYC = async () => {
    try {
      await api.put(`/api/admin/kyc/${selectedUser._id}`, { status: 'verified' });
      toast.success('KYC verified');
      
      // Update local state immediately
      setUsers(prevUsers => prevUsers.map(u => 
        u._id === selectedUser._id ? { ...u, kycStatus: 'verified' } : u
      ));
      
      handleMenuClose();
    } catch (error) {
      toast.error('Failed to verify KYC');
    }
  };

  const getStatusColor = (user) => {
    if (user.status === 'blocked') return 'error'; // Blocked
    if (user.status === 'frozen') return 'warning'; // Frozen
    return 'success'; // Active
  };

  const getStatusLabel = (user) => {
    return user.status || 'active';
  };

  const getKYCColor = (status) => {
    switch(status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'unverified': return 'info';
      default: return 'default';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`;
  };

  const getUserBalance = (user) => {
    return user.wallet?.usdt || 0;
  };

  const formatIpAddress = (ip) => {
    if (!ip) return '-';
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return 'Localhost';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    return ip;
  };

  const StatsCard = ({ title, value, icon, color, change }) => (
    <Card className="admin-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                my: 1,
                wordBreak: 'break-word',
                fontSize: String(value).length > 12 ? '1.5rem' : '2.125rem'
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 40, flexShrink: 0, display: 'flex' }}>{icon}</Box>
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
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all user accounts and permissions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={totalPlatformUsers}
            icon={<People />}
            color="#4361EE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Suspended Accounts"
            value={users.filter(u => u.isBanned).length}
            icon={<Block />}
            color="#f43f5e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="KYC Verified"
            value={users.filter(u => u.kycStatus === 'verified').length}
            icon={<Security />}
            color="#7209B7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Balance"
            value={formatCurrency(users.reduce((sum, u) => sum + getUserBalance(u), 0))}
            icon={<AccountBalanceWallet />}
            color="#3B82F6"
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search users by name, email, or phone..."
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

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="KYC Status"
              value={filters.kyc}
              onChange={(e) => setFilters({ ...filters, kyc: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="balance">Highest Balance</MenuItem>
              <MenuItem value="trades">Most Trades</MenuItem>
            </TextField>

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
          <Tab label="All Users" />
          <Tab label="Active" />
          <Tab label="Suspended" />
          <Tab label="KYC Pending" />
        </Tabs>
      </Paper>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Users ({totalUsersCount})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {users.length === 0 ? (
            <Alert severity="info">
              No users found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>KYC</TableCell>
                    <TableCell>Delivery Trade</TableCell>
                    <TableCell>Withdraw</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Trades</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user._id}
                      hover
                      sx={user.isBanned ? { bgcolor: 'rgba(244,63,94,0.07)', '&:hover': { bgcolor: 'rgba(244,63,94,0.12)' } } : {}}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{ bgcolor: user.isBanned ? '#f43f5e' : '#3B82F6', opacity: user.isBanned ? 0.75 : 1 }}
                            src={user.profilePicture}
                          >
                            {getInitials(user.fullName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: user.isBanned ? '#f43f5e' : 'inherit' }}>
                              {user.fullName || 'N/A'}
                              {user.isBanned && (
                                <Chip label="SUSPENDED" size="small" color="error" sx={{ ml: 1, fontSize: '0.55rem', height: 16, fontWeight: 'bold' }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user._id.substring(user._id.length - 6)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="small" />
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone fontSize="small" />
                            {user.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatIpAddress(userStatuses[user._id]?.ip || user.lastIpAddress)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            label={userStatuses[user._id]?.online ? 'Online' : 'Offline'}
                            size="small"
                            color={userStatuses[user._id]?.online ? 'success' : 'default'}
                          />
                          <Chip
                            label={user.isBanned ? 'Suspended' : 'Active'}
                            size="small"
                            color={user.isBanned ? 'error' : 'success'}
                            icon={user.isBanned ? <Block sx={{ fontSize: '12px !important' }} /> : <CheckCircle sx={{ fontSize: '12px !important' }} />}
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.kycStatus}
                          size="small"
                          color={getKYCColor(user.kycStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<SwapVert sx={{ fontSize: 14 }} />}
                          label={user.deliveryTradeEnabled !== false ? 'WIN' : 'LOSS'}
                          size="small"
                          color={user.deliveryTradeEnabled !== false ? 'success' : 'error'}
                          sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.withdrawalEnabled !== false ? 'Open' : 'Closed'}
                          size="small"
                          color={user.withdrawalEnabled !== false ? 'default' : 'error'}
                          sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(getUserBalance(user))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.tradingStats?.totalTrades || 0}
                        </Typography>
                        <Typography variant="caption" color={(user.tradingStats?.profitLoss || 0) >= 0 ? '#3B82F6' : '#f43f5e'}>
                          {formatCurrency(user.tradingStats?.profitLoss || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, user)}
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

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              <Typography variant="body2">
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined" 
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditUser}>
          <Edit sx={{ mr: 2 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleOpenNotification}>
          <Notifications sx={{ mr: 2 }} />
          Send Notification
        </MenuItem>

        <MenuItem onClick={handleVerifyKYC}>
          <CheckCircle sx={{ mr: 2 }} />
          Verify KYC
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog(true); handleMenuClose(); }}>
          <Block sx={{ mr: 2 }} />
          Change Status
        </MenuItem>
        <MenuItem
          onClick={handleToggleWithdrawal}
          sx={{ color: selectedUser?.withdrawalEnabled !== false ? '#f97316' : '#22c55e' }}
        >
          {selectedUser?.withdrawalEnabled !== false ? (
            <MoneyOff sx={{ mr: 2 }} />
          ) : (
            <AttachMoney sx={{ mr: 2 }} />
          )}
          {selectedUser?.withdrawalEnabled !== false ? 'Close Withdraw' : 'Open Withdraw'}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: '#f43f5e' }}>
          <Delete sx={{ mr: 2 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* View User Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              User Details: {selectedUser.fullName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#3B82F6', width: 80, height: 80, fontSize: 32 }} src={selectedUser.profilePicture}>
                      {getInitials(selectedUser.fullName)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.fullName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        User ID: {selectedUser._id}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={getStatusLabel(selectedUser)} color={getStatusColor(selectedUser)} />
                        <Chip label={selectedUser.kycStatus} color={getKYCColor(selectedUser.kycStatus)} />
                        <Chip label={selectedUser.role} color="primary" />
                        <Chip label={userStatuses[selectedUser._id]?.online ? 'Online' : 'Offline'} color={userStatuses[selectedUser._id]?.online ? 'success' : 'default'} />
                        <Box sx={{ mt: 1 }}>{formatIpAddress(userStatuses[selectedUser._id]?.ip || selectedUser.lastIpAddress)}</Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contact Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedUser.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Password:</strong> <span style={{ fontFamily: 'monospace', color: '#4361EE', fontWeight: 'bold' }}>{selectedUser.plainPassword || '********'}</span>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Account Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Join Date:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Trades:</strong> {selectedUser.tradingStats?.totalTrades || 0}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Profit/Loss:</strong> 
                        <span style={{ color: (selectedUser.tradingStats?.profitLoss || 0) >= 0 ? '#3B82F6' : '#f43f5e', marginLeft: 8 }}>
                          {formatCurrency(selectedUser.tradingStats?.profitLoss || 0)}
                        </span>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Wallet Balance
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {formatCurrency(getUserBalance(selectedUser))}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                      <Chip label={`USDT: ${selectedUser.wallet?.usdt || 0}`} variant="outlined" size="small" />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              <Button variant="contained" onClick={handleEditUser}>
                Edit User
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User: {selectedUser?.fullName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={editData.fullName}
              onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <TextField
              label="New Password"
              fullWidth
              type="password"
              placeholder="Leave blank to keep unchanged"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Score"
                fullWidth
                type="number"
                value={editData.score}
                onChange={(e) => setEditData({ ...editData, score: Number(e.target.value) })}
              />
              <TextField
                label="Level"
                fullWidth
                type="number"
                value={editData.level}
                onChange={(e) => setEditData({ ...editData, level: Number(e.target.value) })}
              />
            </Box>
            <TextField
              select
              label="KYC Status"
              fullWidth
              value={editData.kycStatus}
              onChange={(e) => setEditData({ ...editData, kycStatus: e.target.value })}
            >
              <MenuItem value="unverified">Unverified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={editData.deliveryTradeEnabled}
                  onChange={(e) => setEditData({ ...editData, deliveryTradeEnabled: e.target.checked })}
                  color={editData.deliveryTradeEnabled ? 'success' : 'error'}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SwapVert sx={{ fontSize: 16, color: editData.deliveryTradeEnabled ? '#3B82F6' : '#f43f5e' }} />
                  <Typography variant="body2" sx={{ color: editData.deliveryTradeEnabled ? '#3B82F6' : '#f43f5e', fontWeight: 'bold' }}>
                    Delivery Trade Control: {editData.deliveryTradeEnabled ? 'Force Win' : 'Force Loss'}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editData.canViewDepositAddress}
                  onChange={(e) => setEditData({ ...editData, canViewDepositAddress: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountBalanceWallet sx={{ fontSize: 16, color: editData.canViewDepositAddress ? '#00D395' : '#8b93a6' }} />
                  <Typography variant="body2" sx={{ color: editData.canViewDepositAddress ? '#00D395' : '#8b93a6', fontWeight: 'bold' }}>
                    Deposit Address Visibility: {editData.canViewDepositAddress ? 'Allowed' : 'Hidden'}
                  </Typography>
                </Box>
              }
            />
            
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="USDT Addition"
                    type="number"
                    fullWidth
                    value={editData.usdtAddition === 0 ? '' : editData.usdtAddition}
                    onChange={(e) => setEditData({ ...editData, usdtAddition: e.target.value ? parseFloat(e.target.value) : 0 })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="USDT Subtraction"
                    type="number"
                    fullWidth
                    value={editData.usdtSubtraction === 0 ? '' : editData.usdtSubtraction}
                    onChange={(e) => setEditData({ ...editData, usdtSubtraction: e.target.value ? parseFloat(e.target.value) : 0 })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Total USDT Balance"
                    type="number"
                    fullWidth
                    disabled
                    value={((selectedUser?.wallet?.usdt || 0) + (parseFloat(editData.usdtAddition) || 0) - (parseFloat(editData.usdtSubtraction) || 0))}
                  />
                </Grid>
              </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog
        open={notificationDialog}
        onClose={() => setNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Notification to {selectedUser?.fullName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Notification Title"
              fullWidth
              value={notificationData.title}
              onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={notificationData.message}
              onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
            />
            <TextField
              select
              label="Notification Type"
              fullWidth
              value={notificationData.type}
              onChange={(e) => setNotificationData({ ...notificationData, type: e.target.value })}
            >
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendNotification} disabled={!notificationData.title || !notificationData.message}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Change User Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusData.status}
              label="Status"
              onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="frozen">Frozen</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Reason (Optional)"
            fullWidth
            multiline
            rows={2}
            value={statusData.reason}
            onChange={(e) => setStatusData({ ...statusData, reason: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary">Update Status</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;