import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
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
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Person,
  CheckCircle,
  Cancel,
  Security,
  TrendingUp,
  AccountBalanceWallet,
  Edit,
  Delete,
  Refresh,
  Search,
  FilterList,
  BarChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import SecureImage from '../components/SecureImage';

const AdminPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedKycUser, setSelectedKycUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openKycDialog, setOpenKycDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    totalVolume: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersRes = await axios.get('/api/admin/users');
      setUsers(usersRes.data);

      // Fetch stats
      const statsRes = await axios.get('/api/admin/stats');
      setStats(statsRes.data);

      // Fetch KYC requests
      const kycRes = await axios.get('/api/admin/kyc/pending');
      // Backend returns array of users directly
      setKycRequests(Array.isArray(kycRes.data) ? kycRes.data : kycRes.data.users || []);

      // Fetch recent trades
      const tradesRes = await axios.get('/api/admin/trades?limit=10');
      setTrades(tradesRes.data.trades);

    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async (userId) => {
    try {
      await axios.put(`/api/admin/kyc/${userId}`, { status: 'verified' });
      toast.success('KYC approved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleRejectKYC = async (userId) => {
    try {
      await axios.put(`/api/admin/kyc/${userId}`, { status: 'rejected' });
      toast.success('KYC rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      await axios.post(`/api/admin/users/${userId}/${action}`);
      toast.success(`User ${action}ed successfully`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getKYCColor = (status) => {
    switch(status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'unverified': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography>You don't have permission to access the admin panel.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user.fullName}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: '#4361EE' }} />
                  <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h4">{stats.totalUsers.toLocaleString()}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ mt: 1, bgcolor: 'rgba(67, 97, 238, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4361EE' } }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 1, color: '#00D395' }} />
                  <Typography variant="h6">KYC Pending</Typography>
                </Box>
                <Typography variant="h4">{kycRequests.length}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={30} 
                  sx={{ mt: 1, bgcolor: 'rgba(0, 211, 149, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#00D395' } }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: '#7209B7' }} />
                  <Typography variant="h6">Today's Trades</Typography>
                </Box>
                <Typography variant="h4">{stats.totalTrades.toLocaleString()}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={45} 
                  sx={{ mt: 1, bgcolor: 'rgba(114, 9, 183, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#7209B7' } }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceWallet sx={{ mr: 1, color: '#FF6B6B' }} />
                  <Typography variant="h6">Total Volume</Typography>
                </Box>
                <Typography variant="h4">${(stats.totalVolume / 1000000).toFixed(1)}M</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={60} 
                  sx={{ mt: 1, bgcolor: 'rgba(255, 107, 107, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#FF6B6B' } }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          id="admin-search-users"
          name="search"
          autoComplete="off"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Box>
          <Button startIcon={<Refresh />} onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
          <Button startIcon={<FilterList />} sx={{ ml: 1 }}>
            Filters
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 'bold' },
          }}
        >
          <Tab label="Users" />
          <Tab label="KYC Requests" />
          <Tab label="Trades" />
          <Tab label="Transactions" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      {/* Users Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Management ({filteredUsers.length} users)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>KYC Status</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#00D395', width: 32, height: 32 }}>
                            {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {user.fullName || 'No Name'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user._id.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.kycStatus}
                          color={getKYCColor(user.kycStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        ${Math.floor(user.wallet?.usdt || 0).toLocaleString('en-US')}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => setSelectedUser(user)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedKycUser(user);
                            setOpenKycDialog(true);
                          }}
                        >
                          <Security fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleUserAction(user._id, 'disable')}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* KYC Requests Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              KYC Verification Requests ({kycRequests.length})
            </Typography>
            {kycRequests.length === 0 ? (
              <Alert severity="info">
                No pending KYC requests
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Documents</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kycRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#00D395', width: 32, height: 32 }}>
                              {request.fullName?.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {request.fullName || 'Unknown User'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => {
                              setSelectedKycUser(request);
                              setOpenKycDialog(true);
                            }}
                          >
                            View Docs
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Chip label={request.kycStatus} color={getKYCColor(request.kycStatus)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApproveKYC(request._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleRejectKYC(request._id)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trades Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Trades
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Pair</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.userId?.email?.split('@')[0] || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={trade.pair} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type}
                          size="small"
                          color={trade.type === 'buy' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>${trade.price.toLocaleString()}</TableCell>
                      <TableCell>{trade.amount.toFixed(2)}</TableCell>
                      <TableCell>${trade.total.toLocaleString()}</TableCell>
                      <TableCell>
                        {new Date(trade.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog 
        open={!!selectedUser} 
        onClose={() => setSelectedUser(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              User Details: {selectedUser.fullName || selectedUser.email}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Basic Information</Typography>
                  <Paper sx={{ p: 2, mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Email:</strong> {selectedUser.email}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Full Name:</strong> {selectedUser.fullName || 'Not set'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Phone:</strong> {selectedUser.phone || 'Not set'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>KYC:</strong> 
                          <Chip label={selectedUser.kycStatus} size="small" color={getKYCColor(selectedUser.kycStatus)} sx={{ ml: 1 }} />
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Wallet Balance</Typography>
                  <Paper sx={{ p: 2, mt: 1 }}>
                    <Grid container spacing={2}>
                      {Object.entries(selectedUser.wallet || {}).map(([currency, balance]) => (
                        <Grid item xs={6} sm={3} key={currency}>
                          <Typography variant="body2">
                            <strong>{currency.toUpperCase()}:</strong> {Math.floor(balance).toLocaleString('en-US')}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Trading Statistics</Typography>
                  <Paper sx={{ p: 2, mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Total Trades:</strong> {selectedUser.tradingStats?.totalTrades || 0}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>P&L:</strong> 
                          <span style={{ color: (selectedUser.tradingStats?.profitLoss || 0) >= 0 ? '#00D395' : '#FF6B6B' }}>
                            ${selectedUser.tradingStats?.profitLoss || 0}
                          </span>
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Win Rate:</strong> {selectedUser.tradingStats?.winRate || 0}%</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedUser(null)}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  // Handle user actions
                  setSelectedUser(null);
                }}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* KYC Documents Dialog */}
      <Dialog
        open={openKycDialog}
        onClose={() => setOpenKycDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          KYC Documents: {selectedKycUser?.fullName || selectedKycUser?.email}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>ID Front</Typography>
              <Paper variant="outlined" sx={{ height: 250, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedKycUser?.kycDocuments?.idFront ? (
                  <SecureImage 
                    src={selectedKycUser.kycDocuments.idFront} 
                    alt="ID Front" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                ) : (
                  <Typography color="text.secondary">Not uploaded</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>ID Back</Typography>
              <Paper variant="outlined" sx={{ height: 250, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedKycUser?.kycDocuments?.idBack ? (
                  <SecureImage 
                    src={selectedKycUser.kycDocuments.idBack} 
                    alt="ID Back" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                ) : (
                  <Typography color="text.secondary">Not uploaded</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Selfie</Typography>
              <Paper variant="outlined" sx={{ height: 250, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedKycUser?.kycDocuments?.selfie ? (
                  <SecureImage 
                    src={selectedKycUser.kycDocuments.selfie} 
                    alt="Selfie" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                ) : (
                  <Typography color="text.secondary">Not uploaded</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKycDialog(false)}>Close</Button>
          {selectedKycUser?.kycStatus === 'pending' && (
            <>
              <Button color="error" variant="outlined" onClick={() => { handleRejectKYC(selectedKycUser._id); setOpenKycDialog(false); }}>
                Reject
              </Button>
              <Button color="success" variant="contained" onClick={() => { handleApproveKYC(selectedKycUser._id); setOpenKycDialog(false); }}>
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;