import React, { useState, useContext } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Home,
  ShowChart,
  AccountBalanceWallet,
  Person,
  TrendingUp,
  SwapHoriz,
  Security,
  SupportAgent,
  BarChart,
  MenuOpen,
  ExpandLess,
  ExpandMore,
  Settings,
  Notifications,
  AccountBalance,
  HelpOutline,
  PieChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState({});
  const { notifications } = useContext(AuthContext);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Markets', icon: <ShowChart />, path: '/markets' },
    { text: 'Portfolio', icon: <PieChart />, path: '/portfolio' },
    { text: 'Wallet', icon: <AccountBalanceWallet />, path: '/funds' },
    { text: 'Exchange', icon: <SwapHoriz />, path: '/exchange' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const tradingItems = [
    { text: 'Perpetual', icon: <BarChart />, path: '/trading/perpetual'},
    { text: 'Delivery', icon: <AccountBalance />, path: '/trading/delivery'},
  ];

  const otherItems = [
    { text: 'FAQ', icon: <HelpOutline />, path: '/faq' },
    { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
  ];

  const handleToggleSubmenu = (menu) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleNavigation = (item) => {
    if (item.isComingSoon) {
      toast(`${item.text} is coming soon!`, {
        icon: '🚀',
        style: {
          borderRadius: '10px',
          background: 'rgba(18, 24, 36, 0.95)',
          color: '#F8FAFC',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
      return;
    }
    navigate(item.path);
    onClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'linear-gradient(160deg, #090D16 0%, #0B0E14 60%, #121824 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#F8FAFC',
          boxShadow: '4px 0 32px rgba(0, 0, 0, 0.6)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="NexVor Logo"
            sx={{
              height: 48,
              width: 48,
              objectFit: 'cover',
              display: 'block',
              borderRadius: '50%',
              mixBlendMode: 'normal',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
            }}
          />
          <IconButton onClick={onClose} sx={{ color: '#F8FAFC' }}>
            <MenuOpen />
          </IconButton>
        </Box>

        <List>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  border: isActive(item.path) ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#3B82F6' : 'rgba(248,250,252,0.75)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: { 
                      fontWeight: isActive(item.path) ? 'bold' : 'normal',
                      color: isActive(item.path) ? '#3B82F6' : 'rgba(248,250,252,0.85)'
                    }
                  }}
                />
              </ListItem>
            </motion.div>
          ))}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

          {/* Trading Submenu */}
          <ListItem 
            button 
            onClick={() => handleToggleSubmenu('trading')}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.06)' }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(248,250,252,0.75)', minWidth: 40 }}>
              <TrendingUp />
            </ListItemIcon>
            <ListItemText primary="Trading" primaryTypographyProps={{ sx: { color: 'rgba(248,250,252,0.85)' } }} />
            {openSubmenu.trading ? <ExpandLess sx={{ color: '#3B82F6' }} /> : <ExpandMore sx={{ color: 'rgba(248,250,252,0.5)' }} />}
          </ListItem>

          <Collapse in={openSubmenu.trading} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {tradingItems.map((item) => (
                <ListItem
                  key={item.text}
                  button
                  onClick={() => handleNavigation(item)}
                  sx={{ 
                    pl: 4, 
                    mb: 0.5,
                    borderRadius: 2,
                    bgcolor: isActive(item.path) ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.06)' }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? '#3B82F6' : 'rgba(248,250,252,0.6)', minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { 
                        fontSize: '0.875rem',
                        color: isActive(item.path) ? '#3B82F6' : 'rgba(248,250,252,0.7)'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

          {/* Other Items */}
          {otherItems.map((item, index) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(248,250,252,0.65)', minWidth: 40 }}>
                  {item.text === 'Notifications' && unreadCount > 0 ? (
                    <Badge badgeContent={unreadCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ sx: { color: 'rgba(248,250,252,0.75)' } }}
                />
              </ListItem>
            </motion.div>
          ))}
        </List>

      </Box>
    </Drawer>
  );
};

export default Sidebar;