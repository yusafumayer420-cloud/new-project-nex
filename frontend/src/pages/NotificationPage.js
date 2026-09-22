import React, { useContext, useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  Notifications,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle sx={{ color: '#00D395' }} />;
      case 'error': return <Error sx={{ color: '#FF6B6B' }} />;
      case 'info': return <Info sx={{ color: '#4361EE' }} />;
      case 'trend': return <TrendingUp sx={{ color: '#7209B7' }} />;
      default: return <Info />;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2, bgcolor: '#131A2E', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Notifications
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead} sx={{ color: '#00D395' }}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="small" color="error" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </Box>
      </Box>

      {/* Notifications List */}
      <Box>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Notifications sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography color="text.secondary">You have no notifications right now.</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    bgcolor: notification.read ? 'transparent' : 'rgba(0,211,149,0.05)',
                    cursor: 'pointer',
                    py: 2,
                    borderRadius: 1,
                    mb: 1
                  }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1" sx={{ fontWeight: notification.read ? 'normal' : 'bold', display: 'block', color: 'white' }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                        <Typography component="span" variant="body2" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.4)' }}>
                          {notification.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default NotificationPage;
