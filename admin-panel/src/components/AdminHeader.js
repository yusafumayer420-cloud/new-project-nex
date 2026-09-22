import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Search,
  Refresh,
  Person,
  Settings,
  Help,
  DarkMode,
  LightMode,
  Dashboard,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import io from 'socket.io-client';
import api from '../api';

const AdminHeader = ({ onMenuClick, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.emit('join_admin');

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed'));
    });

    return () => {
      socket.emit('leave_admin');
      socket.disconnect();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/admin/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const [darkMode, setDarkMode] = useState(true);

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/users': 'User Management',
    '/kyc': 'KYC Verification',
    '/trading': 'Trading Management',
    '/transactions': 'Transaction Management',
    '/support': 'Support Center',

    '/settings': 'System Settings',
  };

  const getPageTitle = () => {
    const path = location.pathname;
    return pageTitles[path] || 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const paths = path.split('/').filter(p => p);
    
    if (paths.length === 0) return [{ label: 'Dashboard', path: '/' }];
    
    return paths.map((p, index) => {
      const fullPath = '/' + paths.slice(0, index + 1).join('/');
      return {
        label: pageTitles[fullPath] || p.charAt(0).toUpperCase() + p.slice(1),
        path: fullPath,
      };
    });
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/admin/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      await api.put(`/api/admin/notifications/${id}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
      
      const notification = notifications.find(n => n._id === id);
      if (notification) {
        switch(notification.type) {
          case 'kyc': navigate('/kyc'); break;
          case 'withdrawal': navigate('/transactions'); break;
          case 'deposit': navigate('/transactions'); break;
          case 'user': navigate('/users'); break;
          case 'support': navigate('/support'); break;
          default: break;
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
    handleNotificationsClose();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    const counts = {
      total: unread.length,
      kyc: unread.filter(n => n.type === 'kyc').length,
      transactions: unread.filter(n => ['withdrawal', 'deposit'].includes(n.type)).length,
      users: unread.filter(n => n.type === 'user').length,
      support: unread.filter(n => n.type === 'support').length,
      trading: unread.filter(n => ['trade', 'trading'].includes(n.type)).length,
    };
    window.dispatchEvent(new CustomEvent('unreadNotificationsChange', { detail: counts }));
  }, [notifications]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
    // Implement theme toggle logic
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        background: 'rgba(10, 15, 29, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: 'width 0.3s ease, margin-left 0.3s ease',
        ...(sidebarOpen && {
          width: 'calc(100% - 280px)',
          ml: '280px',
        }),
      }}
    >
      <Toolbar>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {getPageTitle()}
            </Typography>
            <Breadcrumbs 
              separator="›" 
              sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}
            >
              <Link 
                color="inherit" 
                onClick={() => navigate('/dashboard')}
                sx={{ cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
              >
                Admin
              </Link>
              {getBreadcrumbs().map((crumb, index) => (
                <Link
                  key={index}
                  color="inherit"
                  onClick={() => navigate(crumb.path)}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { color: '#3B82F6' },
                    color: index === getBreadcrumbs().length - 1 ? '#3B82F6' : 'inherit',
                    fontWeight: index === getBreadcrumbs().length - 1 ? 'bold' : 'normal',
                  }}
                >
                  {crumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <TextField
            placeholder="Search users, transactions, tickets..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              width: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.05)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
          {/* Refresh Button */}
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <IconButton color="inherit" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </motion.div>


          {/* Notifications */}
          <IconButton 
            color="inherit" 
            onClick={handleNotificationsClick}
            sx={{ position: 'relative' }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <IconButton onClick={handleProfileMenu} sx={{ p: 0, ml: 1 }}>
              <Avatar
                sx={{
                  bgcolor: '#3B82F6',
                  width: 36,
                  height: 36,
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {admin?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </motion.div>

          {/* System Status */}
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: 'rgba(0, 211, 149, 0.1)',
              color: '#3B82F6',
              border: '1px solid rgba(0, 211, 149, 0.3)',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 400,
            background: 'linear-gradient(135deg, #1e293b 0%, #0F172A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification._id)}
                sx={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  bgcolor: notification.read ? 'transparent' : 'rgba(0, 211, 149, 0.05)',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(notification.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <Button size="small" fullWidth onClick={() => navigate('/settings/notifications')}>
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            background: 'linear-gradient(135deg, #1e293b 0%, #0F172A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {admin?.name || 'Admin User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {admin?.email || 'admin@NexVor.com'}
          </Typography>
        </Box>

        <MenuItem onClick={() => { navigate('/settings/profile'); handleProfileMenuClose(); }}>
          <Person sx={{ mr: 2, fontSize: 20 }} />
          My Profile
        </MenuItem>

        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
          <Settings sx={{ mr: 2, fontSize: 20 }} />
          Settings
        </MenuItem>

        <MenuItem onClick={() => { handleProfileMenuClose(); }}>
          <Help sx={{ mr: 2, fontSize: 20 }} />
          Help & Support
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default AdminHeader;