import React, { useContext, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  Settings,
  Logout,
  Person,
  Security,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoHovered, setLogoHovered] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/profile#security');
    handleClose();
  };

  const handleWallet = () => {
    navigate('/funds');
    handleClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'frozen': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(11, 14, 20, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Toolbar sx={{ minHeight: 60, px: 2 }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 1.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            onClick={() => navigate('/')}
          >
            {/* Logo Circle */}
            <motion.div
              animate={{
                scale: logoHovered ? 1.08 : 1,
                rotate: logoHovered ? 360 : 0,
              }}
              transition={{ duration: logoHovered ? 0.6 : 0.3, ease: 'easeInOut' }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="NexVor Logo"
                sx={{
                  height: 44,
                  width: 44,
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50%',
                  border: logoHovered
                    ? '2px solid rgba(59, 130, 246, 0.9)'
                    : '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: logoHovered
                    ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
                    : '0 0 12px rgba(59, 130, 246, 0.25)',
                  transition: 'border 0.3s ease, box-shadow 0.3s ease',
                }}
              />
            </motion.div>

            {/* Brand Text - appears on hover */}
            <AnimatePresence>
              {logoHovered && (
                <motion.div
                  key="brand-text"
                  initial={{ opacity: 0, x: -16, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        background: 'linear-gradient(90deg, #F8FAFC 0%, #3B82F6 50%, #3B82F6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: 'none',
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      NEX<Box component="span" sx={{ color: '#3B82F6', WebkitTextFillColor: '#3B82F6' }}>VOR</Box>
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.55rem',
                        fontWeight: 500,
                        letterSpacing: '0.18em',
                        color: 'rgba(59, 130, 246, 0.8)',
                        textTransform: 'uppercase',
                        mt: '2px',
                      }}
                    >
                      Trade • Invest • Grow
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              onClick={() => window.location.reload()} 
              sx={{ 
                color: '#94A3B8',
                '&:hover': { color: '#F8FAFC' },
                transition: 'color 0.2s ease',
              }}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
            <NotificationBell />
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{ p: 0, ml: 0.5 }}
              >
                <Avatar
                  src={user?.profilePicture}
                  sx={{
                    bgcolor: '#3B82F6',
                    color: '#0B0E14',
                    width: 34,
                    height: 34,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: 'rgba(59, 130, 246, 0.8)',
                    },
                  }}
                >
                  {!user?.profilePicture && (user?.fullName?.charAt(0).toUpperCase() || 'U')}
                </Avatar>
              </IconButton>
            </motion.div>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 3,
            background: 'rgba(20, 27, 40, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#F8FAFC' }}>
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`Account: ${user?.status || 'active'}`}
              size="small"
              color={getStatusColor(user?.status || 'active')}
              sx={{ fontSize: '0.65rem', height: 22, textTransform: 'capitalize' }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <MenuItem onClick={handleProfile} sx={{ py: 1.25 }}>
          <Person sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Profile</Typography>
        </MenuItem>

        <MenuItem onClick={handleWallet} sx={{ py: 1.25 }}>
          <AccountBalanceWallet sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Wallet</Typography>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.25 }}>
          <Security sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Security</Typography>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.25 }}>
          <Settings sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: '#EF4444' }}>
          <Logout sx={{ mr: 2, fontSize: 18 }} />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default TopBar;