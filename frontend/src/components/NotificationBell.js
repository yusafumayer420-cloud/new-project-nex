import React, { useContext, useState, useEffect } from 'react';
import { Badge, IconButton } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <IconButton onClick={() => navigate('/notifications')} sx={{ color: 'white' }}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
    </motion.div>
  );
};

export default NotificationBell;