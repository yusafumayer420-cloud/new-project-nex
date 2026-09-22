import React, { useState, useContext, useEffect } from 'react';
import {
  Box, Typography, Avatar, IconButton, Grid, Paper,
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, Button, CircularProgress, Chip, Tabs, Tab
} from '@mui/material';
import {
  ContentCopy, Security, Lock, Receipt, SupervisorAccount,
  Language, SupportAgent, VerifiedUser, CardMembership,
  SwapHoriz, AttachMoney, AccountBalanceWallet, HelpOutline, Info,
  KeyboardArrowRight, Visibility, VisibilityOff, HeadsetMic, Logout,
  CameraAlt, CheckCircle, Pending, Upload, ArrowForward, History, Person, Email, Phone, Close, Error, EmojiEvents, FormatListNumbered
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import BackgroundAnimation from '../components/BackgroundAnimation';
import SecureImage from '../components/SecureImage';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Dialog states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [showProfilePicPreview, setShowProfilePicPreview] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => JSON.parse(localStorage.getItem('appLanguage') || '{"code":"en","name":"English","flag":"🇺🇸","native":"English"}'));
  const [languageSearch, setLanguageSearch] = useState('');

  // Form states
  const [editing, setEditing] = useState(true); // always editing in dialog
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({ idFront: false, idBack: false, selfie: false });
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [docTypeChoice, setDocTypeChoice] = useState('id'); // 'id' or 'driving'

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', country: '', address: '', city: '', zipCode: '',
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [kycDocuments, setKycDocuments] = useState({ idFront: null, idBack: null, selfie: null });

  const [transactions, setTransactions] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [trades, setTrades] = useState([]);
  const [activitySubTab, setActivitySubTab] = useState(0);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '', email: user.email || '', phone: user.phone || '',
        country: user.country || '', address: user.address || '', city: user.city || '', zipCode: user.zipCode || '',
      });
      setVerificationStatus(user.kycStatus || 'unverified');
      setKycDocuments(user.kycDocuments || {});
    }
    fetchTransactions();
    fetchSecurityLogs();
    fetchTrades();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data.slice(0, 20));
    } catch (error) { console.error('Failed to fetch transactions'); }
  };

  const fetchSecurityLogs = async () => {
    try {
      const response = await axios.get('/api/users/security-logs');
      setSecurityLogs(response.data.slice(0, 10));
    } catch (error) { console.error('Failed to fetch security logs'); }
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get('/api/trading/my-trades');
      const allTrades = [...response.data.positions, ...response.data.openOrders];
      allTrades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTrades(allTrades.slice(0, 10));
    } catch (error) { console.error('Failed to fetch trades'); }
  };

  const formatDevice = (device) => {
    if (!device) return 'Unknown Device';
    if (device.includes('Windows')) return 'Windows PC';
    if (device.includes('iPhone')) return 'iPhone';
    if (device.includes('Android')) return 'Android Device';
    if (device.includes('Macintosh')) return 'MacBook';
    if (device.includes('Linux')) return 'Linux PC';
    return 'Web Browser';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required'); return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long'); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    try {
      await axios.post('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      toast.success('Password changed successfully');
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('/api/users/profile', formData);
      updateUser(response.data.user);
      setShowEditProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) { toast.error('Failed to update profile'); }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Profile picture must be less than 50MB'); return; }
    setUploading(true);
    try {
      const formPic = new FormData();
      formPic.append('profile', file);
      await axios.post('/api/users/profile-picture', formPic);
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleKYCUpload = async (documentType, file) => {
    if (!file) return;
    if (verificationStatus === 'verified') {
      toast.error('Your account is already verified.'); return;
    }
    setUploading(true);
    setUploadingDoc(prev => ({ ...prev, [documentType]: true }));
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('type', documentType);
      formDataUpload.append('document', file);
      const response = await axios.post('/api/users/kyc/upload', formDataUpload, { timeout: 120000 });
      setKycDocuments(prev => ({ ...prev, [documentType]: response.data.url || URL.createObjectURL(file) }));
      setVerificationStatus(response.data.status);
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      setUploadingDoc(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleFileSelect = (documentType, event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) {
      if (file.size > 50 * 1024 * 1024) { toast.error('File size must be less than 50MB'); return; }
      handleKYCUpload(documentType, file);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const sharedDialogProps = {
    fullWidth: true,
    PaperProps: { sx: { background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: '#fff', maxHeight: '90vh' } }
  };

  const textFieldStyles = {
    mb: 2,
    '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
    '& .MuiInputLabel-root': { color: '#8b93a6' }
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', bgcolor: '#0b0e14', color: '#fff', pb: 10, pt: { xs: 2, md: 4 } }}>
      <BackgroundAnimation />

      <Box sx={{ maxWidth: '600px', mx: 'auto', position: 'relative', zIndex: 1 }}>
        {/* Header Profile Section */}
        <Box sx={{ px: 3, pt: 2, pb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.profilePicture}
              sx={{ width: 72, height: 72, bgcolor: '#1a1d24', border: '2px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 0 15px rgba(59, 130, 246,0.2)', cursor: 'pointer' }}
              onClick={() => setShowProfilePicPreview(true)}
            >
              {!user?.profilePicture && (user?.fullName?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <label htmlFor="profile-pic-upload">
              <input accept="image/*" id="profile-pic-upload" type="file" style={{ display: 'none' }} onChange={handleProfilePictureUpload} disabled={uploading} />
              <IconButton
                component="span" disabled={uploading}
                sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: '#3B82F6', color: '#0b0e14', width: 28, height: 28, '&:hover': { bgcolor: '#33FFB3' } }}
              >
                {uploading ? <CircularProgress size={14} sx={{ color: '#0b0e14' }} /> : <CameraAlt sx={{ fontSize: 14 }} />}
              </IconButton>
            </label>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user?.fullName || 'User'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#8b93a6' }}>ID: {user?.id || user?._id || '26261694'}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(user?.id || user?._id || '26261694')} sx={{ color: '#8b93a6', p: 0.5 }}>
                <ContentCopy sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {user?.createdAt && (
              <Typography variant="caption" sx={{ color: '#8b93a6', display: 'block', mt: 0.2 }}>
                Joined: {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Score and Level Section */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, bgcolor: 'rgba(26,29,36,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#fff' }}>
                <Avatar sx={{ bgcolor: '#ffb300', width: 48, height: 48 }}>
                  <EmojiEvents sx={{ color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b93a6', letterSpacing: 1 }}>SCORE</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{user?.score || 0}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, bgcolor: 'rgba(26,29,36,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#fff' }}>
                <Avatar sx={{ bgcolor: '#ff6d00', width: 48, height: 48 }}>
                  <FormatListNumbered sx={{ color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b93a6', letterSpacing: 1 }}>LEVEL</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{user?.level || 1}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Top Action Bar */}
        <Grid container sx={{ px: 2, mb: 3 }} spacing={1}>
          {[
            { icon: <Security />, label: 'Security logs', action: () => setShowSecurityLogs(true) },
            { icon: <Lock />, label: 'Change Password', action: () => setShowChangePassword(true) },
            { icon: <Receipt />, label: 'Record', action: () => navigate('/history') },
            { icon: <SupervisorAccount />, label: 'Referral Program', action: () => setShowReferral(true) },
          ].map((item, index) => (
            <Grid item xs={3} key={index} sx={{ textAlign: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <IconButton
                  onClick={item.action}
                  sx={{
                    bgcolor: 'rgba(26,29,36,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#fff', mb: 1,
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(42,45,52,0.7)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgba(59, 130, 246, 0.4)'
                    },
                    width: 56, height: 56, borderRadius: 3
                  }}
                >
                  {item.icon}
                </IconButton>
                <Typography variant="caption" display="block" sx={{ color: '#8b93a6', fontSize: '0.7rem', lineHeight: 1.1 }}>{item.label}</Typography>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Vertical List Items */}
        <Box sx={{ px: 2 }}>
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              { icon: <Language />, label: 'Language', value: selectedLanguage.flag + ' ' + selectedLanguage.name, action: () => setShowLanguage(true) },
              { icon: <SupportAgent />, label: 'Online service', action: () => window.dispatchEvent(new Event('open-live-chat')) },
              { icon: <VerifiedUser />, label: 'Account Status', value: (user?.status || 'active').charAt(0).toUpperCase() + (user?.status || 'active').slice(1), valueColor: user?.status === 'frozen' ? '#ff9800' : (user?.status === 'blocked' ? '#f43f5e' : '#3B82F6'), hideArrow: true },
              { icon: <VerifiedUser />, label: 'KYC Verification', value: verificationStatus === 'verified' ? 'Verified' : 'Unverified', valueColor: verificationStatus === 'verified' ? '#3B82F6' : '#8b93a6', action: () => setShowKYC(true) },
              { icon: <AccountBalanceWallet />, label: 'Personal Information', action: () => setShowEditProfile(true) },
              { icon: <HelpOutline />, label: 'FAQ', action: () => navigate('/faq') },
              { icon: <Info />, label: 'About Us', action: () => navigate('/about') },
              { icon: <Logout />, label: 'Logout', action: () => { logout(); navigate('/welcome'); } }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'rgba(26,29,36,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(42,45,52,0.7)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 28px rgba(59, 130, 246, 0.2), inset 0 0 12px rgba(59, 130, 246, 0.05)',
                      borderColor: 'rgba(59, 130, 246, 0.35)'
                    }
                  }}
                  onClick={item.action}
                >
                  <ListItem sx={{ py: 2, px: 2.5 }}>
                    <ListItemIcon sx={{
                      minWidth: 44,
                      color: '#3B82F6',
                      '& .MuiSvgIcon-root': {
                        filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))',
                        transition: 'all 0.3s'
                      }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 600 }} />
                    {item.value && (
                      <Typography variant="body2" sx={{ color: item.valueColor, mr: 1, fontWeight: 700 }}>{item.value}</Typography>
                    )}
                    {!item.hideArrow && <KeyboardArrowRight sx={{ color: '#8b93a6', fontSize: 20, transition: 'all 0.3s' }} />}
                  </ListItem>
                </Paper>
              </motion.div>
            ))}
          </List>
        </Box>

      </Box>

      {/* ----------------- DIALOGS ----------------- */}

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onClose={() => setShowChangePassword(false)} maxWidth="xs" {...sharedDialogProps}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Change Password
          <IconButton onClick={() => setShowChangePassword(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <TextField margin="dense" fullWidth label="Current Password" type={showPassword.current ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} sx={textFieldStyles} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton sx={{ color: '#8b93a6' }} onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}>{showPassword.current ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
          <TextField margin="dense" fullWidth label="New Password" type={showPassword.new ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} sx={textFieldStyles} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton sx={{ color: '#8b93a6' }} onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>{showPassword.new ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
          <TextField margin="dense" fullWidth label="Confirm Password" type={showPassword.confirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} sx={textFieldStyles} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton sx={{ color: '#8b93a6' }} onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>{showPassword.confirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" fullWidth onClick={handleChangePassword} sx={{ borderRadius: 2, bgcolor: '#3B82F6', color: '#0b0e14', fontWeight: 700, '&:hover': { bgcolor: '#33FFB3' } }}>Update Password</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onClose={() => setShowEditProfile(false)} maxWidth="sm" {...sharedDialogProps}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Personal Information
          <IconButton onClick={() => setShowEditProfile(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} sx={textFieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#8b93a6' }} /></InputAdornment> }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={formData.email} disabled sx={textFieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#8b93a6' }} /></InputAdornment> }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} sx={textFieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#8b93a6' }} /></InputAdornment> }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} sx={textFieldStyles} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} sx={textFieldStyles} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} sx={textFieldStyles} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="ZIP Code" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} sx={textFieldStyles} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" fullWidth onClick={handleSaveProfile} sx={{ borderRadius: 2, bgcolor: '#3B82F6', color: '#0b0e14', fontWeight: 700, '&:hover': { bgcolor: '#33FFB3' } }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* KYC / Verification Dialog */}
      <Dialog open={showKYC} onClose={() => setShowKYC(false)} maxWidth="md" {...sharedDialogProps}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Identity Verification
          <IconButton onClick={() => setShowKYC(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <Box sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, background: verificationStatus === 'verified' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
            {verificationStatus === 'verified' ? <CheckCircle sx={{ color: '#00C853', fontSize: 28 }} /> : <Upload sx={{ color: '#3B82F6', fontSize: 28 }} />}
            <Typography variant="body2" sx={{ color: verificationStatus === 'verified' ? '#00C853' : '#3B82F6', fontWeight: 600 }}>
              {verificationStatus === 'verified' ? 'Your identity has been verified. You can now access all features.' : verificationStatus === 'pending' ? 'Your documents are under review. This usually takes 1-2 business days.' : 'Please upload your identity documents to verify your account.'}
            </Typography>
          </Box>
          <Grid container spacing={2}>
              {/* Document Type Selector */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#fff' }}>Select Document Type</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[
                    { value: 'id', label: '🪪 National ID' },
                    { value: 'driving', label: '🚗 Driver\'s License' },
                  ].map(opt => (
                    <Box
                      key={opt.value}
                      onClick={() => setDocTypeChoice(opt.value)}
                      sx={{
                        flex: 1, py: 1.2, px: 1, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
                        border: docTypeChoice === opt.value ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.12)',
                        bgcolor: docTypeChoice === opt.value ? 'rgba(59, 130, 246,0.08)' : 'rgba(255,255,255,0.03)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: docTypeChoice === opt.value ? 700 : 400, color: docTypeChoice === opt.value ? '#3B82F6' : '#8b93a6' }}>
                        {opt.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

            {['idFront', 'idBack', 'selfie'].map((docType) => {
              const labels = {
                idFront: docTypeChoice === 'driving' ? "Driver's License Front" : 'ID Front',
                idBack: docTypeChoice === 'driving' ? "Driver's License Back" : 'ID Back',
                selfie: 'Selfie'
              };
              const docUrl = kycDocuments[docType];
              return (
                <Grid item xs={12} sm={4} key={docType}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#fff' }}>{labels[docType]}</Typography>
                    <Box sx={{ height: 120, mb: 2, borderRadius: 2, border: docUrl ? 'none' : '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {docUrl ? <SecureImage src={docUrl} alt={docType} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload sx={{ fontSize: 32, color: 'rgba(255,255,255,0.3)' }} />}
                    </Box>
                    <input type="file" accept="image/*" id={docType} style={{ display: 'none' }} onChange={(e) => handleFileSelect(docType, e)} disabled={verificationStatus === 'verified' || uploading} />
                    <label htmlFor={docType}>
                      <Button component="span" variant={docUrl ? "outlined" : "contained"} fullWidth disabled={uploadingDoc[docType] || verificationStatus === 'verified'} sx={{ borderRadius: 2, py: 0.5, borderColor: docUrl ? 'rgba(59, 130, 246, 0.3)' : 'transparent', bgcolor: docUrl ? 'transparent' : 'rgba(255,255,255,0.1)', color: docUrl && verificationStatus !== 'verified' ? '#3B82F6' : '#fff' }}>
                        {uploadingDoc[docType] ? 'Uploading...' : docUrl ? (verificationStatus === 'verified' ? 'Verified' : 'Change') : 'Upload'}
                      </Button>
                    </label>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Activity / Transactions Dialog */}
      <Dialog open={showActivity} onClose={() => setShowActivity(false)} maxWidth="sm" {...sharedDialogProps}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Activity Record
          <IconButton onClick={() => setShowActivity(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Tabs value={activitySubTab} onChange={(e, v) => setActivitySubTab(v)} variant="fullWidth" sx={{ '& .MuiTabs-indicator': { backgroundColor: '#3B82F6' }, '& .MuiTab-root': { color: '#8b93a6', '&.Mui-selected': { color: '#3B82F6' } } }}>
            <Tab label="Transactions" />
            <Tab label="Trades" />
          </Tabs>
          <List disablePadding>
            {activitySubTab === 0 && (
              transactions.filter(tx => tx.type !== 'trade').length === 0 ? <Box sx={{ p: 4, textAlign: 'center', color: '#8b93a6' }}>No transactions found</Box> :
                transactions.filter(tx => tx.type !== 'trade').slice(0, 10).map((tx, i) => (
                  <ListItem key={i} divider sx={{ borderColor: 'rgba(255,255,255,0.05)', py: 2 }}>
                    <ListItemIcon><Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tx.type === 'deposit' ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)' }}>{tx.type === 'deposit' ? <ArrowForward sx={{ color: '#00C853', transform: 'rotate(90deg)', fontSize: 20 }} /> : <ArrowForward sx={{ color: '#FF5252', transform: 'rotate(-90deg)', fontSize: 20 }} />}</Box></ListItemIcon>
                    <ListItemText primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.currency}</Typography>} secondary={<Typography variant="caption" sx={{ color: '#8b93a6' }}>{formatDate(tx.createdAt || tx.date)}</Typography>} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: tx.type === 'deposit' ? '#00C853' : '#FF5252' }}>{tx.type === 'deposit' ? '+' : '-'}{tx.amount}</Typography>
                      <Chip label={tx.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, background: tx.status === 'completed' ? 'rgba(0,200,83,0.1)' : 'rgba(255,193,7,0.1)', color: tx.status === 'completed' ? '#00C853' : '#FFC107' }} />
                    </Box>
                  </ListItem>
                ))
            )}
            {activitySubTab === 1 && (
              [...trades, ...transactions.filter(tx => tx.type === 'trade')].length === 0 ? <Box sx={{ p: 4, textAlign: 'center', color: '#8b93a6' }}>No trades found</Box> :
                [...trades, ...transactions.filter(tx => tx.type === 'trade')].slice(0, 10).map((trade, i) => (
                  <ListItem key={i} divider sx={{ borderColor: 'rgba(255,255,255,0.05)', py: 2 }}>
                    <ListItemIcon><Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79, 124, 255, 0.1)' }}><History sx={{ color: '#4F7CFF', fontSize: 20 }} /></Box></ListItemIcon>
                    <ListItemText primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>{trade.pair || 'Trade'}</Typography>} secondary={<Typography variant="caption" sx={{ color: '#8b93a6' }}>{formatDate(trade.createdAt || trade.date)}</Typography>} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>{trade.amount} {trade.currency || 'USDT'}</Typography>
                      <Chip label={trade.status || 'completed'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, background: 'rgba(0,200,83,0.1)', color: '#00C853' }} />
                    </Box>
                  </ListItem>
                ))
            )}
          </List>
        </DialogContent>
      </Dialog>

      {/* Security Logs Dialog */}
      <Dialog open={showSecurityLogs} onClose={() => setShowSecurityLogs(false)} maxWidth="sm" {...sharedDialogProps}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Security Logs
          <IconButton onClick={() => setShowSecurityLogs(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, borderColor: 'rgba(255,255,255,0.1)' }}>
          {securityLogs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#8b93a6' }}>No security logs found.</Box>
          ) : (
            <List disablePadding>
              {securityLogs.map((log, i) => (
                <ListItem key={i} divider sx={{ borderColor: 'rgba(255,255,255,0.05)', py: 2 }}>
                  <ListItemIcon><Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: log.status === 'success' ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)' }}>{log.status === 'success' ? <CheckCircle sx={{ color: '#00C853', fontSize: 20 }} /> : <Error sx={{ color: '#FF5252', fontSize: 20 }} />}</Box></ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>{log.action.replace('_', ' ').toUpperCase()}</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#8b93a6' }}>{formatDevice(log.device)}</Typography>}
                  />
                  <Typography variant="caption" sx={{ color: '#8b93a6' }}>{formatDate(log.createdAt)}</Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Picture Preview Dialog */}
      <Dialog open={showProfilePicPreview} onClose={() => setShowProfilePicPreview(false)} maxWidth="sm" fullWidth {...sharedDialogProps}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={() => setShowProfilePicPreview(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, pt: 0 }}>
          {user?.profilePicture ? (
            <Box
              component="img"
              src={user?.profilePicture}
              alt="Profile Preview"
              sx={{ width: '100%', maxWidth: '300px', height: 'auto', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 0 30px rgba(59, 130, 246,0.3)' }}
            />
          ) : (
            <Avatar
              sx={{ width: 300, height: 300, bgcolor: '#1a1d24', border: '4px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 0 30px rgba(59, 130, 246,0.3)', fontSize: '8rem' }}
            >
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          )}
        </DialogContent>
      </Dialog>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguage} onClose={() => { setShowLanguage(false); setLanguageSearch(''); }} maxWidth="xs" {...sharedDialogProps}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>Select Language</Typography>
          <IconButton onClick={() => { setShowLanguage(false); setLanguageSearch(''); }} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search language..."
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }, '& input': { color: '#fff' } }}
          />
          <Box sx={{ maxHeight: 380, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
            {[
              { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
              { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
              { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
              { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
              { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
              { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
              { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
              { code: 'pt', name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
              { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
              { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어' },
              { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
              { code: 'tr', name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
              { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
              { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt' },
              { code: 'th', name: 'Thai', flag: '🇹🇭', native: 'ภาษาไทย' },
              { code: 'id', name: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia' },
              { code: 'pl', name: 'Polish', flag: '🇵🇱', native: 'Polski' },
              { code: 'nl', name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' },
              { code: 'sv', name: 'Swedish', flag: '🇸🇪', native: 'Svenska' },
              { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', native: 'Українська' },
            ].filter(l => l.name.toLowerCase().includes(languageSearch.toLowerCase()) || l.native.toLowerCase().includes(languageSearch.toLowerCase())).map((lang) => (
              <Box
                key={lang.code}
                onClick={() => {
                  setSelectedLanguage(lang);
                  localStorage.setItem('appLanguage', JSON.stringify(lang));
                  setShowLanguage(false);
                  setLanguageSearch('');
                  
                  // Use fast Google Translate switching (no page reload)
                  const switched = window.switchGoogleTranslateLanguage
                    ? window.switchGoogleTranslateLanguage(lang.code)
                    : false;
                  
                  if (!switched) {
                    // Fallback: set cookie and reload only if instant switch failed
                    const langCode = lang.code === 'zh' ? 'zh-CN' : lang.code;
                    if (lang.code === 'en') {
                      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
                    } else {
                      document.cookie = `googtrans=/en/${langCode}; path=/`;
                      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
                    }
                    window.location.reload();
                  }
                  
                  toast.success(`Language changed to ${lang.name}`, { icon: lang.flag });
                }}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 2, py: 1.5, borderRadius: '12px', cursor: 'pointer', mb: 0.5,
                  bgcolor: selectedLanguage.code === lang.code ? 'rgba(59, 130, 246,0.08)' : 'transparent',
                  border: selectedLanguage.code === lang.code ? '1px solid rgba(59, 130, 246,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{lang.flag}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: selectedLanguage.code === lang.code ? '#3B82F6' : '#fff', fontSize: '0.9rem' }}>{lang.name}</Typography>
                    <Typography sx={{ color: '#8b93a6', fontSize: '0.75rem' }}>{lang.native}</Typography>
                  </Box>
                </Box>
                {selectedLanguage.code === lang.code && (
                  <CheckCircle sx={{ color: '#3B82F6', fontSize: 20 }} />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Referral Program Dialog */}
      <Dialog open={showReferral} onClose={() => setShowReferral(false)} maxWidth="sm" fullWidth {...sharedDialogProps}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>Referral Program</Typography>
          <IconButton onClick={() => setShowReferral(false)} size="small" sx={{ color: '#8b93a6' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 4, textAlign: 'center' }}>
          <SupervisorAccount sx={{ fontSize: 64, color: '#3B82F6', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Invite Friends, Earn Crypto</Typography>
          <Typography variant="body2" sx={{ color: '#8b93a6', mb: 4 }}>
            Share your unique referral link and invite friends to join our platform.
          </Typography>

          <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: '#8b93a6', display: 'block', mb: 1, textAlign: 'left' }}>Your Referral Link</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}/register?ref=${user?.referralCode || ''}`}
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, color: '#fff' }
                }}
              />
              <Button 
                variant="contained" 
                onClick={() => copyToClipboard(`${window.location.origin}/register?ref=${user?.referralCode || ''}`)}
                sx={{ bgcolor: '#3B82F6', color: '#0b0e14', fontWeight: 'bold', borderRadius: 2, minWidth: '100px', '&:hover': { bgcolor: '#33FFB3' } }}
              >
                COPY
              </Button>
            </Box>
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
