import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, TextField,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Alert, LinearProgress, Switch, FormControlLabel, Tooltip,
} from '@mui/material';
import {
  Add, Edit, Delete, AccountBalanceWallet, Refresh, ContentCopy, CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';

const EMPTY_FORM = {
  coin: '',
  network: '',
  walletAddress: '',
  keywords: '',
  isActive: true,
};

const DepositAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/deposit-addresses');
      setAddresses(res.data);
    } catch {
      toast.error('Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setDialog({ open: true, mode: 'add', data: null });
  };

  const openEdit = (addr) => {
    setForm({
      coin: addr.coin,
      network: addr.network,
      walletAddress: addr.walletAddress,
      keywords: (addr.keywords || []).join(', '),
      isActive: addr.isActive,
    });
    setDialog({ open: true, mode: 'edit', data: addr });
  };

  const handleClose = () => setDialog({ open: false, mode: 'add', data: null });

  const handleSave = async () => {
    if (!form.coin || !form.network || !form.walletAddress) {
      toast.error('Coin, Network and Wallet Address are required');
      return;
    }

    const payload = {
      coin: form.coin.trim().toUpperCase(),
      network: form.network.trim(),
      walletAddress: form.walletAddress.trim(),
      keywords: form.keywords
        ? form.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
        : [],
      isActive: form.isActive,
    };

    try {
      if (dialog.mode === 'add') {
        await api.post('/api/deposit-addresses', payload);
        toast.success('Deposit address added!');
      } else {
        await api.put(`/api/deposit-addresses/${dialog.data._id}`, payload);
        toast.success('Deposit address updated!');
      }
      fetchAddresses();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id, coin, network) => {
    if (!window.confirm(`Delete ${coin} (${network}) address?`)) return;
    try {
      await api.delete(`/api/deposit-addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleToggleActive = async (addr) => {
    try {
      await api.put(`/api/deposit-addresses/${addr._id}`, { isActive: !addr.isActive });
      fetchAddresses();
      toast.success(`${addr.coin} (${addr.network}) ${!addr.isActive ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Address copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Deposit Addresses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage crypto wallet addresses shown to users in Live Chat
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchAddresses} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
            Add Address
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {addresses.length === 0 && !loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert severity="info" icon={<AccountBalanceWallet />}>
            No deposit addresses configured yet. Click "Add Address" to get started.
          </Alert>
        </motion.div>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Coin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Network</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Wallet Address</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Keywords</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {addresses.map((addr) => (
                    <TableRow key={addr._id} hover>
                      <TableCell>
                        <Chip
                          label={addr.coin}
                          size="small"
                          sx={{ fontWeight: 'bold', bgcolor: 'rgba(139,92,246,0.15)', color: '#3B82F6' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {addr.network}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              bgcolor: 'rgba(255,255,255,0.05)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              maxWidth: 220,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {addr.walletAddress}
                          </Typography>
                          <Tooltip title={copiedId === addr._id ? 'Copied!' : 'Copy address'}>
                            <IconButton size="small" onClick={() => handleCopy(addr.walletAddress, addr._id)}>
                              {copiedId === addr._id
                                ? <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
                                : <ContentCopy sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                          {(addr.keywords || []).slice(0, 3).map((kw, i) => (
                            <Chip key={i} label={kw} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
                          ))}
                          {(addr.keywords || []).length > 3 && (
                            <Chip label={`+${addr.keywords.length - 3}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={addr.isActive}
                          onChange={() => handleToggleActive(addr)}
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(addr)} sx={{ color: '#3B82F6' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(addr._id, addr.coin, addr.network)} sx={{ color: '#f43f5e' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialog.open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'add' ? 'Add Deposit Address' : 'Edit Deposit Address'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                label="Coin (e.g. BTC)"
                fullWidth
                value={form.coin}
                onChange={e => setForm({ ...form, coin: e.target.value.toUpperCase() })}
                placeholder="USDT"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Network (e.g. BEP20 / BNB)"
                fullWidth
                value={form.network}
                onChange={e => setForm({ ...form, network: e.target.value })}
                placeholder="BEP20"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Wallet Address"
                fullWidth
                value={form.walletAddress}
                onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                placeholder="0x..."
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Keywords (comma separated)"
                fullWidth
                value={form.keywords}
                onChange={e => setForm({ ...form, keywords: e.target.value })}
                placeholder="usdt bep20, bnb, bep20 address"
                helperText="These keywords trigger the auto-reply in Live Chat when a user types them"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    color="success"
                  />
                }
                label={`Address is ${form.isActive ? 'Active' : 'Disabled'}`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {dialog.mode === 'add' ? 'Add Address' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepositAddresses;
