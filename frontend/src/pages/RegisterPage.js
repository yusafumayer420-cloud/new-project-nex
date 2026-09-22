import React, { useState, useContext } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Link,
  IconButton, InputAdornment, CircularProgress
} from '@mui/material';
import {
  Visibility, VisibilityOff, Person, Email, Lock, ArrowBack
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',

    termsAccepted: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must accept the Terms of Service');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await register(formData.email, formData.password, formData.fullName, '');
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/login')} sx={{ color: 'text.secondary' }}>
            <ArrowBack />
          </IconButton>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold">Create Account</Typography>
          <Typography variant="body2" color="text.secondary">Fill in your details to get started</Typography>
        </Box>

        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, background: 'rgba(25, 30, 45, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleRegisterSubmit}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Full Name</Typography>
              <TextField fullWidth name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Email</Typography>
              <TextField fullWidth type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Password</Typography>
              <TextField fullWidth type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Confirm Password</Typography>
              <TextField fullWidth type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} style={{ marginRight: '10px' }} />
              <Typography variant="body2" color="text.secondary">
                I agree to the <Link sx={{ color: '#3B82F6' }}>Terms of Service</Link> and <Link sx={{ color: '#3B82F6' }}>Privacy Policy</Link>
              </Typography>
            </Box>

            <Button fullWidth type="submit" variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#050816', fontWeight: 'bold', py: 1.5, mb: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Already have an account? <Link onClick={() => navigate('/login')} sx={{ color: '#3B82F6', cursor: 'pointer', fontWeight: 'bold' }}>Sign In</Link>
            </Typography>
          </form>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;
