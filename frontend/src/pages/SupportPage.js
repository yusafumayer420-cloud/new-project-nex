import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
  Dialog,
} from '@mui/material';
import {
  SupportAgent,
  Add,
  Assignment,
  CheckCircle,
  Pending,
  Error,
  Chat,
  History,
  Search,
  Refresh,
  Close,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

const SupportPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/support/tickets');
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/support/tickets', newTicket);
      setTickets([response.data, ...tickets]);
      setNewTicket({ subject: '', category: 'general', priority: 'medium', message: '' });
      setShowNewTicket(false);
      toast.success('Ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await axios.get(`/api/support/tickets/${ticketId}`);
      setSelectedTicket(response.data.ticket);
      setTicketMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      const response = await axios.post(`/api/support/tickets/${selectedTicket._id}/reply`, {
        message: replyMessage
      });
      
      setTicketMessages([...ticketMessages, response.data]);
      setReplyMessage('');
      
      // Update ticket status
      setSelectedTicket({
        ...selectedTicket,
        status: 'in_progress',
        lastMessageAt: new Date()
      });
      
      // Update in tickets list
      setTickets(tickets.map(t => 
        t._id === selectedTicket._id 
          ? { ...t, status: 'in_progress', lastMessageAt: new Date() }
          : t
      ));
      
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <Pending />;
      case 'in_progress': return <Assignment />;
      case 'resolved': return <CheckCircle />;
      case 'closed': return <History />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 0) return ticket.status !== 'closed' && ticket.status !== 'resolved';
    if (activeTab === 1) return ticket.status === 'closed' || ticket.status === 'resolved';
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Support Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get help with your account, trading, or any issues
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Tickets List */}
        <Grid item xs={12} md={4} sx={{ display: { xs: selectedTicket ? 'none' : 'block', md: 'block' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">My Tickets</Typography>
                <Box>
                  <IconButton size="small" onClick={fetchTickets} disabled={loading}>
                    <Refresh />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowNewTicket(true)}
                  >
                    New
                  </Button>
                </Box>
              </Box>

              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  mb: 2,
                  '& .MuiTab-root': { minWidth: 'auto', px: 2 }
                }}
              >
                <Tab label="Active" />
                <Tab label="Closed" />
                <Tab label="All" />
              </Tabs>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : filteredTickets.length === 0 ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  No {activeTab === 0 ? 'active' : 'closed'} tickets
                </Alert>
              ) : (
                <List sx={{ maxHeight: { xs: '60vh', md: 500 }, overflow: 'auto' }}>
                  {filteredTickets.map((ticket) => (
                    <React.Fragment key={ticket._id}>
                      <ListItem
                        button
                        selected={selectedTicket?._id === ticket._id}
                        onClick={() => fetchTicketDetails(ticket._id)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          p: 1.5,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 211, 149, 0.1)',
                            borderColor: '#00D395',
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 48 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', width: 32, height: 32 }}>
                            {getStatusIcon(ticket.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ticket.subject}
                              </Typography>
                              <Chip
                                label={ticket.priority}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                                color={getPriorityColor(ticket.priority)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" display="block">
                                {ticket.ticketId} • {ticket.category}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(ticket.updatedAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section - Hidden on mobile if ticket selected */}
          <Card sx={{ mt: 3, display: { xs: 'none', sm: 'block' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Common Questions
              </Typography>
              <List dense>
                {[
                  'How to deposit funds?',
                  'How to withdraw crypto?',
                  'How to verify my account?',
                ].map((question, index) => (
                  <ListItem key={index} button sx={{ borderRadius: 1 }}>
                    <ListItemText primary={question} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Ticket Details */}
        <Grid item xs={12} md={8} sx={{ display: { xs: selectedTicket ? 'block' : 'none', md: 'block' } }}>
          {selectedTicket ? (
            <Card sx={{ height: '100%', minHeight: { xs: '70vh', md: 600 } }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
                {/* Ticket Header */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, display: { xs: 'flex', md: 'none' } }}>
                    <Button 
                      startIcon={<Refresh sx={{ transform: 'rotate(-90deg)' }} />} 
                      onClick={() => setSelectedTicket(null)}
                      size="small"
                    >
                      Back to list
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      {selectedTicket.subject}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        size="small"
                        label={selectedTicket.status} 
                        color={getStatusColor(selectedTicket.status)} 
                      />
                      <Chip 
                        size="small"
                        label={selectedTicket.priority} 
                        color={getPriorityColor(selectedTicket.priority)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Ticket: {selectedTicket.ticketId} • {selectedTicket.category} • {formatDate(selectedTicket.createdAt)}
                  </Typography>
                  
                  {selectedTicket.assignedTo && (
                    <Alert severity="info" sx={{ mt: 2, py: 0 }}>
                      <Typography variant="caption">
                        Assigned to: {selectedTicket.assignedTo?.email || 'Support Agent'}
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Messages */}
                <Box sx={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  mb: 3, 
                  p: { xs: 1.5, sm: 2 }, 
                  bgcolor: 'rgba(0,0,0,0.15)', 
                  borderRadius: 2,
                  maxHeight: { xs: '45vh', md: '500px' }
                }}>
                  {ticketMessages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Chat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">No messages yet</Typography>
                    </Box>
                  ) : (
                    ticketMessages.map((message) => (
                      <Box
                        key={message._id}
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: message.userId?._id === (user?._id || user?.id) ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: { xs: '90%', sm: '75%' },
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: message.userId?._id === (user?._id || user?.id)
                              ? 'primary.main'
                              : 'rgba(255, 255, 255, 0.05)',
                            color: message.userId?._id === (user?._id || user?.id) ? 'white' : 'text.primary',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, opacity: 0.8 }}>
                            {message.userId?._id === (user?._id || user?.id) ? 'You' : 'Support Team'}
                          </Typography>
                          {message.attachments && message.attachments.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              {message.attachments.map((url, i) => (
                                <img 
                                  key={i} 
                                  src={url} 
                                  alt="Attachment" 
                                  style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 250, objectFit: 'contain', cursor: 'pointer' }} 
                                  onClick={() => window.open(url, '_blank')}
                                  loading="eager"
                                />
                              ))}
                            </Box>
                          )}
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{message.message}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.5, textAlign: 'right' }}>
                            {formatDate(message.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Reply Input */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <Box>
                    <TextField
                      id="support-reply"
                      name="reply"
                      autoComplete="off"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to close this ticket?')) {
                            toast.success('Ticket closed');
                          }
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim()}
                        size="small"
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '100%', minHeight: 400, display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <SupportAgent sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} opacity={0.3} />
                <Typography variant="h6" color="text.secondary">
                  Select a ticket to view details
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* New Ticket Dialog */}
      <Dialog 
        open={showNewTicket} 
        onClose={() => setShowNewTicket(false)}
        fullWidth
        maxWidth="xs"
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>New Ticket</Typography>
            <IconButton onClick={() => setShowNewTicket(false)} size="small">
              <Close />
            </IconButton>
          </Box>

          <TextField
            id="support-new-subject"
            name="subject"
            fullWidth
            label="Subject"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            sx={{ mb: 2 }}
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              id="support-new-category"
              name="category"
              select
              fullWidth
              label="Category"
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="general">General</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="trading">Trading</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </TextField>

            <TextField
              id="support-new-priority"
              name="priority"
              select
              fullWidth
              label="Priority"
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </TextField>
          </Box>

          <TextField
            id="support-new-message"
            name="message"
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={newTicket.message}
            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
            placeholder="Describe your issue..."
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateTicket}
            disabled={loading || !newTicket.subject || !newTicket.message}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Ticket'}
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
};

export default SupportPage;