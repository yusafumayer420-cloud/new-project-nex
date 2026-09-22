import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { 
  Email, 
  ArrowBack,
  VerifiedUser,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP } = useContext(AuthContext);
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(email, otp);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setResending(true);
    const result = await resendOTP(email);
    setResending(false);

    if (result.success) {
      setTimer(60);
      setCanResend(false);
      setOtp('');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/login')}
            sx={{ color: '#3B82F6' }}
          >
            Back to login
          </Button>
        </Box>

        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                width: { xs: 40, sm: 60 }, 
                height: { xs: 40, sm: 60 }, 
                borderRadius: '50%', 
                bgcolor: 'rgba(0, 211, 149, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}
            >
              <VerifiedUser sx={{ fontSize: { xs: 24, sm: 30 }, color: '#3B82F6' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              Verify Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              We've sent a verification code to <br />
              <strong style={{ color: '#fff' }}>{email}</strong>
            </Typography>
          </Box>

          <form onSubmit={handleVerify}>
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Enter 6-digit code"
                variant="outlined"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setOtp(val);
                }}
                inputProps={{ 
                  maxLength: 6,
                  style: { 
                    textAlign: 'center', 
                    fontSize: '1.75rem', 
                    fontWeight: 'bold', 
                    letterSpacing: '10px',
                    padding: '12px'
                  } 
                }}
                autoFocus
              />
            </Box>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#050816',
                  fontWeight: 'bold',
                  py: 1.5,
                  mb: 3,
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                    boxShadow: '0 6px 24px rgba(59, 130, 246, 0.35)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
              </Button>
            </motion.div>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Didn't receive the code?
              </Typography>
              <Button
                onClick={handleResend}
                disabled={!canResend || resending}
                startIcon={resending ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                sx={{ 
                  color: canResend ? '#3B82F6' : 'text.disabled',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {canResend ? 'Resend New Code' : `Resend in ${timer}s`}
              </Button>
            </Box>
          </form>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info" variant="outlined" sx={{ borderColor: 'rgba(0, 211, 149, 0.3)', color: 'rgba(255,255,255,0.7)' }}>
            Please check your spam folder if you don't see the email in your inbox.
          </Alert>
        </Box>
      </motion.div>
    </Container>
  );
};

export default VerifyEmailPage;
