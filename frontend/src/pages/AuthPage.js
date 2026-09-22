import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else if (result.unverified) {
      navigate('/verify-email', { state: { email: result.email } });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="NexVor Logo"
              sx={{
                height: 120,
                width: 120,
                objectFit: 'cover',
                display: 'block',
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                mixBlendMode: 'normal',
                border: '3px solid rgba(0, 120, 255, 0.5)',
                boxShadow: '0 0 24px rgba(0, 120, 255, 0.5), 0 0 48px rgba(0, 120, 255, 0.2)',
              }}
            />
          <Typography variant="body1" color="text.secondary">
            Welcome back to your trading dashboard
          </Typography>
        </Box>

        {/* Form */}
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              id="auth-email"
              autoComplete="email"
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              id="auth-password"
              autoComplete="current-password"
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    size="small"
                    sx={{
                      color: 'rgba(255,255,255,0.3)',
                      '&.Mui-checked': { color: '#3B82F6' },
                    }}
                  />
                }
                label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Remember Me</Typography>}
                sx={{ m: 0 }}
              />
              <Link
                onClick={() => navigate('/forgot-password')}
                sx={{
                  color: '#3B82F6',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
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
                Sign In
              </Button>
            </motion.div>



            {/* Switch Mode */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  onClick={() => navigate('/register')}
                  sx={{
                    color: '#3B82F6',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>

        {/* Features */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Why choose NexVor?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            {['🔒 Secure', '⚡ Fast', '💰 Low Fees', '📱 Mobile First'].map((feature, index) => (
              <Typography key={index} variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {feature}
              </Typography>
            ))}
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
};

export default AuthPage;