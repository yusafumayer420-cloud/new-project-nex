import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, Tooltip,
  MenuItem,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Flash as FlashIcon,
  QuickreplyOutlined, ContentCopy,
} from '@mui/icons-material';
import { BoltOutlined } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';

const CATEGORIES = ['general', 'deposit', 'withdrawal', 'trading', 'kyc', 'technical', 'greeting', 'closing'];

const categoryColor = (cat) => {
  const map = { general: 'default', deposit: 'success', withdrawal: 'warning', trading: 'info', kyc: 'secondary', technical: 'error', greeting: 'primary', closing: 'default' };
  return map[cat] || 'default';
};

const QuickReplies = () => {
  const [replies, setReplies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', shortcut: '', category: 'general' });

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/quick-replies');
      setReplies(res.data);
    } catch {
      toast.error('Failed to load quick replies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReplies(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      replies.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        (r.shortcut || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q)
      )
    );
  }, [search, replies]);

  const openCreate = () => {
    setEditingReply(null);
    setForm({ title: '', message: '', shortcut: '', category: 'general' });
    setDialogOpen(true);
  };

  const openEdit = (reply) => {
    setEditingReply(reply);
    setForm({ title: reply.title, message: reply.message, shortcut: reply.shortcut || '', category: reply.category || 'general' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      if (editingReply) {
        const res = await api.put(`/api/admin/quick-replies/${editingReply._id}`, form);
        setReplies(prev => prev.map(r => r._id === editingReply._id ? res.data : r));
        toast.success('Quick reply updated');
      } else {
        const res = await api.post('/api/admin/quick-replies', form);
        setReplies(prev => [res.data, ...prev]);
        toast.success('Quick reply created');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/quick-replies/${editingReply._id}`);
      setReplies(prev => prev.filter(r => r._id !== editingReply._id));
      toast.success('Quick reply deleted');
      setDeleteDialog(false);
      setEditingReply(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied to clipboard');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Quick Replies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage canned responses for faster support. Type <strong>/</strong> in chat to use them.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
        >
          Add Reply
        </Button>
      </Box>

      {/* Stats bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const count = replies.filter(r => (r.category || 'general') === cat).length;
          if (count === 0) return null;
          return (
            <Chip
              key={cat}
              label={`${cat}: ${count}`}
              color={categoryColor(cat)}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          );
        })}
        <Chip label={`Total: ${replies.length}`} size="small" sx={{ fontWeight: 700 }} />
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            fullWidth
            placeholder="Search by title, message, shortcut, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Loading...</Typography>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <BoltOutlined sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
              <Typography color="text.secondary">
                {search ? 'No matching quick replies found.' : 'No quick replies yet. Click "Add Reply" to create one.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Title / Shortcut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Message Preview</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Used</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {filtered.map((reply) => (
                      <motion.tr
                        key={reply._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        component="tr"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{reply.title}</Typography>
                          {reply.shortcut && (
                            <Chip
                              label={`/${reply.shortcut}`}
                              size="small"
                              sx={{ mt: 0.5, bgcolor: 'rgba(139,92,246,0.15)', color: '#60A5FA', fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 340 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ whiteSpace: 'pre-line', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                          >
                            {reply.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reply.category || 'general'}
                            color={categoryColor(reply.category || 'general')}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: reply.usageCount > 0 ? '#60A5FA' : 'text.secondary' }}>
                            {reply.usageCount}×
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Copy message">
                            <IconButton size="small" onClick={() => handleCopy(reply.message)}>
                              <ContentCopy sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(reply)} sx={{ color: '#3B82F6' }}>
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              sx={{ color: '#f43f5e' }}
                              onClick={() => { setEditingReply(reply); setDeleteDialog(true); }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoltOutlined sx={{ color: '#3B82F6' }} />
            {editingReply ? 'Edit Quick Reply' : 'New Quick Reply'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Title *"
            fullWidth
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Deposit Instructions"
            helperText="A short name shown in the picker"
          />
          <TextField
            label="Shortcut (optional)"
            fullWidth
            value={form.shortcut}
            onChange={e => setForm({ ...form, shortcut: e.target.value.replace(/\s/g, '').toLowerCase() })}
            placeholder="e.g. deposit (type /deposit to find)"
            InputProps={{ startAdornment: <InputAdornment position="start">/</InputAdornment> }}
          />
          <TextField
            label="Category"
            select
            fullWidth
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map(c => (
              <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Message *"
            fullWidth
            multiline
            rows={5}
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Type the full reply message here..."
            helperText={`${form.message.length} characters`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}>
            {editingReply ? 'Save Changes' : 'Create Reply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Quick Reply?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{editingReply?.title}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickReplies;
