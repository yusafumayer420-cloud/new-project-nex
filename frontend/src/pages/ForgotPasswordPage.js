import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      toast.success(response.data.message);
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Reset <span style={{ color: '#3B82F6' }}>Password</span>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {submitted 
              ? 'Check your email for instructions to reset your password.' 
              : 'Enter your email address and we will send you a reset link.'}
          </Typography>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 3 }}>
          {submitted ? (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/login')}
                sx={{ mt: 2, borderColor: '#3B82F6', color: '#3B82F6' }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                id="forgot-email"
                name="email"
                autoComplete="email"
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 4 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

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
                    mb: 2,
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                      boxShadow: '0 6px 24px rgba(59, 130, 246, 0.35)',
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </motion.div>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{ color: '#3B82F6', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  Back to Login
                </Link>
              </Box>
            </form>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ForgotPasswordPage;
