import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AccountBalanceWallet,
  Security,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Refresh,
  Download,
  BarChart,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUsers: 0,
    verifiedUsers: 0,
    totalTrades: 0,
    completedTrades: 0,
    totalVolume: 0,
    todayTrades: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });

  const [signupData, setSignupData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/stats');
      const data = response.data;
      setStats(data);
      
      // Update signup chart data
      if (data.signups) {
        setSignupData(data.signups.map(s => ({
          day: s._id,
          users: s.count
        })));
      }

      // Use real recent activities
      if (data.recentActivities) {
        setRecentActivities(data.recentActivities.map(act => ({
          ...act,
          time: new Date(act.time).toLocaleString()
        })));
      }

    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      change: `Total Registered`,
      icon: <People sx={{ fontSize: 40, color: '#4361EE' }} />,
      color: '#4361EE',
      progress: 100,
    },
    {
      title: 'Total Volume',
      value: `$${(stats.totalVolume || 0).toLocaleString()}`,
      change: `Today: ${stats.todayTrades || 0}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 40, color: '#3B82F6' }} />,
      color: '#3B82F6',
      progress: 60,
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades?.toLocaleString() || '0',
      change: `${stats.completedTrades || 0} Completed`,
      icon: <TrendingUp sx={{ fontSize: 40, color: '#7209B7' }} />,
      color: '#7209B7',
      progress: stats.totalTrades ? (stats.completedTrades / stats.totalTrades) * 100 : 0,
    },
    {
      title: 'KYC Verified',
      value: stats.verifiedUsers?.toLocaleString() || '0',
      change: `${((stats.verifiedUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% Ratio`,
      icon: <Security sx={{ fontSize: 40, color: '#f43f5e' }} />,
      color: '#f43f5e',
      progress: stats.totalUsers ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0,
    },
  ];

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your platform today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>

        </Box>
      </Box>



      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="admin-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {stat.change}
                      </Typography>
                    </Box>
                    {stat.icon}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stat.progress} 
                    sx={{ 
                      bgcolor: `${stat.color}20`,
                      height: 6,
                      borderRadius: 3,
                      '& .MuiLinearProgress-bar': { 
                        bgcolor: stat.color,
                        borderRadius: 3,
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Volume Chart */}
        <Grid item xs={12}>
          <Card className="admin-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Trading Volume Overview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip icon={<Timeline />} label="Volume" size="small" />
                  <Chip icon={<People />} label="Users" size="small" variant="outlined" />
                </Box>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#4361EE" 
                      strokeWidth={2}
                      dot={{ fill: '#4361EE', r: 4 }}
                      activeDot={{ r: 6, fill: '#4361EE' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12}>
          <Card className="admin-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Activities
                </Typography>
                <Button size="small">View All</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }}>
                              {activity.user.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {activity.user}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{activity.action}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {activity.amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status}
                            size="small"
                            color={getStatusColor(activity.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;