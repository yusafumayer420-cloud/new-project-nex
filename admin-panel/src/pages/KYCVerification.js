import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  Download,
  HourglassEmpty,
  Security,
  VerifiedUser,
  GppBad,
  Image,
  Person,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../api';
import SecureImage from '../components/SecureImage';

const KYCVerification = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlatformUsers, setTotalPlatformUsers] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    sortBy: 'newest',
  });


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.status, activeTab]);

  const fetchKYCRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };

      if (filters.status) params.kycStatus = filters.status;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      // Handle tabs
      if (activeTab === 1) params.kycStatus = 'pending';
      if (activeTab === 2) params.kycStatus = 'unverified';
      if (activeTab === 3) params.kycStatus = 'verified';
      if (activeTab === 4) params.kycStatus = 'rejected';

      const response = await api.get('/api/admin/users', { params });
      const users = response.data.users || [];
      setKycRequests(users);
      setFilteredRequests(users);
      setTotalPages(response.data.totalPages || 1);
      setTotalPlatformUsers(response.data.totalUsers || 0);
    } catch (error) {
      toast.error('Failed to fetch KYC requests');
      console.error('Error fetching KYC requests:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, activeTab]);

  useEffect(() => {
    fetchKYCRequests();
  }, [fetchKYCRequests]);

  const filterRequests = () => {
    let filtered = [...kycRequests];

    // Document type filter (Local only as backend doesn't support it yet)
    if (filters.type) {
      filtered = filtered.filter(request => request.kycDetails?.idType === filters.type);
    }

    setFilteredRequests(filtered);
  };

  useEffect(() => {
    filterRequests();
  }, [kycRequests, filters.type]);

  const handleMenuClick = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleApprove = async () => {
    try {
      await api.put(`/api/admin/kyc/${selectedRequest._id}`, { status: 'verified' });
      toast.success(`KYC for ${selectedRequest.fullName} approved`);
      fetchKYCRequests();
      handleMenuClose();
      setViewDialog(false);
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/admin/kyc/${selectedRequest._id}`, { status: 'rejected' });
      toast.error(`KYC for ${selectedRequest.fullName} rejected`);
      fetchKYCRequests();
      handleMenuClose();
      setViewDialog(false);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const handleRequestReview = async () => {
    toast('Review requested');
    handleMenuClose();
  };

  const handleViewRequest = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'unverified': return 'info';
      case 'verified': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <HourglassEmpty />;
      case 'unverified': return <Security />;
      case 'verified': return <VerifiedUser />;
      case 'rejected': return <GppBad />;
      default: return null;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const StatsCard = ({ title, value, icon, color, subtitle }) => (
    <Card className="admin-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            KYC Verification
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and verify user identity documents
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>

        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending KYC"
            value={kycRequests.filter(r => r.kycStatus === 'pending').length.toString()}
            icon={<HourglassEmpty />}
            color="#FFC107"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Verified Users"
            value={kycRequests.filter(r => r.kycStatus === 'verified').length.toString()}
            icon={<VerifiedUser />}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Rejected"
            value={kycRequests.filter(r => r.kycStatus === 'rejected').length.toString()}
            icon={<GppBad />}
            color="#f43f5e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={totalPlatformUsers.toString()}
            icon={<Security />}
            color="#4361EE"
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, email, or user ID..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="unverified">Unverified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Document Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Passport">Passport</MenuItem>
              <MenuItem value="Driver License">Driver License</MenuItem>
              <MenuItem value="National ID">National ID</MenuItem>
              <MenuItem value="Residence Permit">Residence Permit</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </TextField>

            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 'bold' },
          }}
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Unverified" />
          <Tab label="Verified" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {/* KYC Requests Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              KYC Requests ({totalPlatformUsers})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredRequests.length === 0 ? (
            <Alert severity="info">
              No KYC requests found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Review Note</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#4361EE' }} src={request.profilePicture || undefined}>
                            {(request.fullName || request.userName || 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {request.fullName || request.userName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.kycDetails?.idType || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.kycStatus}
                          size="small"
                          color={getStatusColor(request.kycStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.kycDetails?.country || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {request.kycDetails?.reviewNote || 'No notes'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, request)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              <Typography variant="body2">
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined" 
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* KYC Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewRequest}>
          <Visibility sx={{ mr: 2 }} />
          View Documents
        </MenuItem>
        <MenuItem onClick={handleApprove}>
          <CheckCircle sx={{ mr: 2, color: '#3B82F6' }} />
          Approve KYC
        </MenuItem>
        <MenuItem onClick={handleRequestReview}>
          <Security sx={{ mr: 2, color: '#4361EE' }} />
          Request Review
        </MenuItem>
        <MenuItem onClick={handleReject}>
          <Cancel sx={{ mr: 2, color: '#f43f5e' }} />
          Reject KYC
        </MenuItem>
      </Menu>

      {/* View Documents Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              KYC Documents - {selectedRequest.fullName || selectedRequest.userName || 'User'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: '#3B82F6', width: 60, height: 60, fontSize: 24 }} src={selectedRequest.profilePicture || undefined}>
                      {(selectedRequest.fullName || selectedRequest.userName || 'U').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedRequest.fullName || selectedRequest.userName || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRequest.email} • {selectedRequest.kycDetails?.country || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={selectedRequest.kycDetails?.idType || 'N/A'} size="small" />
                        <Chip 
                          label={selectedRequest.kycStatus} 
                          size="small" 
                          color={getStatusColor(selectedRequest.kycStatus)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Submitted Documents
                  </Typography>
                  <ImageList cols={3} gap={16}>
                    <ImageListItem>
                      <SecureImage
                        src={selectedRequest.kycDocuments?.idFront}
                        alt="ID Front"
                        style={{ borderRadius: 8, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        title="ID Front"
                        subtitle="Primary document"
                      />
                    </ImageListItem>
                    <ImageListItem>
                      <SecureImage
                        src={selectedRequest.kycDocuments?.idBack}
                        alt="ID Back"
                        style={{ borderRadius: 8, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        title="ID Back"
                        subtitle="Back side"
                      />
                    </ImageListItem>
                    <ImageListItem>
                      <SecureImage
                        src={selectedRequest.kycDocuments?.selfie}
                        alt="Selfie"
                        style={{ borderRadius: 8, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        title="Selfie with ID"
                        subtitle="Face verification"
                      />
                    </ImageListItem>
                  </ImageList>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Review Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      label="Review Notes"
                      multiline
                      rows={3}
                      placeholder="Add your review notes here..."
                      defaultValue={selectedRequest.kycDetails?.reviewNote}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        label="Document Type"
                        value={selectedRequest.kycDetails?.idType || 'N/A'}
                        fullWidth
                      />
                      <TextField
                        label="Country"
                        value={selectedRequest.kycDetails?.country || 'N/A'}
                        fullWidth
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Verification Guidelines:</strong>
                    </Typography>
                    <Typography variant="caption" component="div">
                      1. Check that all documents are clear and legible<br />
                      2. Verify that the ID is not expired<br />
                      3. Ensure the selfie matches the ID photo<br />
                      4. Confirm all personal information matches<br />
                      5. Look for signs of tampering or editing
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Cancel</Button>
              <Button onClick={handleReject} color="error" variant="outlined">
                Reject
              </Button>
              <Button onClick={handleRequestReview} variant="outlined">
                Request Changes
              </Button>
              <Button onClick={handleApprove} variant="contained">
                Approve KYC
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default KYCVerification;