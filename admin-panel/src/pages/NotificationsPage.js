import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  DoneAll,
  Delete,
  Person,
  Info,
  Report,
  AccountBalanceWallet,
  CheckCircle,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/admin/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/admin/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleAction = (notification) => {
    handleMarkAsRead(notification._id);
    switch (notification.type) {
      case 'kyc': navigate('/kyc'); break;
      case 'withdrawal': navigate('/transactions'); break;
      case 'deposit': navigate('/transactions'); break;
      case 'user': navigate('/users'); break;
      case 'support': navigate('/support'); break;
      default: break;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'kyc': return <CheckCircle color="success" />;
      case 'withdrawal': return <AccountBalanceWallet color="error" />;
      case 'deposit': return <AccountBalanceWallet color="success" />;
      case 'user': return <Person color="primary" />;
      case 'support': return <Info color="warning" />;
      case 'system': return <Report color="error" />;
      default: return <Notifications />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with system activities and user requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DoneAll />}
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.read)}
        >
          Mark all as read
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Notifications sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">No Notifications</Typography>
          <Typography color="text.secondary">You're all caught up!</Typography>
        </Paper>
      ) : (
        <Card className="admin-card">
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    py: 2,
                    bgcolor: notification.read ? 'transparent' : 'rgba(0, 211, 149, 0.05)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' }
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleAction(notification)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(notification._id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 50 }}>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? '500' : 'bold' }}>
                          {notification.title}
                        </Typography>
                        <Chip label={notification.type.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                        {!notification.read && <Chip label="NEW" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ my: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default NotificationsPage;
