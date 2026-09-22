import React, { createContext, useState, useEffect, useRef } from 'react';

import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import socket from '../socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!localStorage.getItem('token'));
  
  const userRef = useRef(user);
  const priceRef = useRef(70000);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // -- Trade Result States (with Persistence) --
  const [showTradeResult, setShowTradeResult] = useState(() => {
    return localStorage.getItem('pendingTradeResult') !== null;
  });
  const [tradeResult, setTradeResult] = useState(() => {
    const saved = localStorage.getItem('pendingTradeResult');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [resultPrice, setResultPrice] = useState(() => {
    return localStorage.getItem('pendingResultPrice') || null;
  });
  const [currentBtcPrice, setCurrentBtcPrice] = useState(70000); 
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  useEffect(() => {
    priceRef.current = currentBtcPrice;
  }, [currentBtcPrice]);

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);


  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setLoading(false); // Set loading to false after user data is refreshed
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, clear token and user, and set loading to false
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Handle Socket Room Joining & Reconnection
  useEffect(() => {
    if (user?._id) {
      const handleConnect = () => {
        console.log('Socket connected/reconnected, joining user room:', user._id);
        socket.emit('join_user', user._id);
      };

      if (socket.connected) {
        handleConnect();
      }

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.emit('leave_user', user._id);
      };
    }
  }, [user?._id]);

  const triggerTradeResult = (trade, price) => {
    if (!trade) return;
    setTradeResult(trade);
    setResultPrice(price || priceRef.current || trade.price);
    setShowTradeResult(true);
    localStorage.setItem('pendingTradeResult', JSON.stringify(trade));
    localStorage.setItem('pendingResultPrice', String(price || priceRef.current || trade.price));
  };

  useEffect(() => {
    // Global real-time listeners

    const handleBalanceUpdate = () => {
      console.log('Balance update received');
      refreshUser();
    };

    const handleTransactionUpdate = (data) => {
      console.log('Transaction update received');
      refreshUser();
      if (data && data.status) {
        handleNotification({
          title: 'Transaction Updated',
          message: `Your ${data.type} of ${data.amount} ${data.currency} is now ${data.status}`,
          type: data.status === 'completed' ? 'success' : (data.status === 'rejected' ? 'error' : 'info')
        });
      }
    };

    const handlePriceUpdate = (prices) => {
      const btcPrice = prices.find(p => p.symbol === 'BTC/USDT');
      if (btcPrice) {
        setCurrentBtcPrice(parseFloat(btcPrice.price));
      }
    };

    const handleTradeUpdate = (updated) => {
      console.log('Trade update received!', updated);
      refreshUser();

      // Handle Delivery Trade Result Popups Globally
      const updatedUserId = String(updated.userId?._id || updated.userId || '');
      const currentUserId = String(userRef.current?._id || '');

      if (updated.tradeMode === 'delivery' && (updated.status === 'completed' || updated.status === 'cancelled')) {
        if (!currentUserId || updatedUserId === currentUserId) {
          triggerTradeResult(updated);
        }
      }
    };

    const handleNotification = (data) => {
      const newNotif = {
        id: Date.now(),
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        time: 'Just now',
        read: false,
        ...data
      };
      setNotifications(prev => [newNotif, ...prev]);
    };

    socket.on('order_placed', handleNotification);
    socket.on('transaction_requested', handleNotification);
    socket.on('custom_notification', handleNotification);
    socket.on('new_chat_message', (data) => {
      if (data.sender === 'admin' || data.senderRole === 'admin') {
        handleNotification({
          title: 'New Message',
          message: data.message,
          type: 'info'
        });
      }
    });

    socket.on('balance_updated', handleBalanceUpdate);
    socket.on('transaction_updated', handleTransactionUpdate);
    socket.on('priceUpdate', handlePriceUpdate);
    socket.on('trade_updated', handleTradeUpdate);
    socket.on('withdrawal_status_changed', refreshUser);

    return () => {
      socket.off('order_placed', handleNotification);
      socket.off('transaction_requested', handleNotification);
      socket.off('custom_notification', handleNotification);
      socket.off('new_chat_message');
      socket.off('balance_updated', handleBalanceUpdate);
      socket.off('transaction_updated', handleTransactionUpdate);
      socket.off('priceUpdate', handlePriceUpdate);
      socket.off('trade_updated', handleTradeUpdate);
      socket.off('withdrawal_status_changed', refreshUser);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      socket.emit('join_user', user._id);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const isUnverified = error.response?.status === 403 && error.response?.data?.isVerified === false;
      
      if (isUnverified) {
        toast.error(message);
        return { success: false, unverified: true, email: error.response.data.email };
      }

      toast.error(message);
      return { success: false };
    }
  };

  const register = async (email, password, fullName, referralCode) => {
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        fullName,
        referralCode
      });

      const { token, user } = response.data;
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        socket.emit('join_user', user._id);
      }

      toast.success(response.data.message || 'Registration successful!');
      return { success: true, email };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await axios.post('/api/auth/verify-otp', { email, otp });
      const { token, user, message } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      socket.emit('join_user', user._id);
      
      toast.success(message || 'Email verified successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      return { success: false };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      toast.success(response.data.message || 'OTP resent successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (user) {
      socket.emit('leave_user', user._id);
    }
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      verifyOTP,
      resendOTP,
      logout,
      updateUser,
      refreshUser,
      loading,
      showTradeResult,
      tradeResult,
      resultPrice,
      triggerTradeResult,
      closeTradeResult: () => {
        setShowTradeResult(false);
        localStorage.removeItem('pendingTradeResult');
        localStorage.removeItem('pendingResultPrice');
      },
      notifications,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </AuthContext.Provider>
  );
};