import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import Box from '@mui/material/Box';

// Components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import KYCVerification from './pages/KYCVerification';
import TradingManagement from './pages/TradingManagement';
import TransactionManagement from './pages/TransactionManagement';
import SupportManagement from './pages/SupportManagement';
import SystemSettings from './pages/SystemSettings';
import AdminLogin from './pages/AdminLogin';
import NotificationsPage from './pages/NotificationsPage';
import DepositAddresses from './pages/DepositAddresses';
import QuickReplies from './pages/QuickReplies';

// Context
import { AdminAuthProvider } from './context/AdminAuthContext';

// Theme
const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    secondary: {
      main: '#f43f5e',
      light: '#FF8989',
      dark: '#e11d48',
    },
    background: {
      default: '#0a0f1d',
      paper: '#111827',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ThemeProvider theme={adminTheme}>
      <AdminAuthProvider>
        <CssBaseline />
        <Router>
          <div className="admin-app">
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            
            <Routes>
              <Route path="/login" element={<AdminLogin />} />
              
              <Route path="/*" element={
                <ProtectedRoute>
                  <>
                    <AdminHeader 
                      onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
                      sidebarOpen={sidebarOpen}
                    />
                    <AdminSidebar 
                      open={sidebarOpen} 
                      onClose={() => setSidebarOpen(false)}
                      isMobile={isMobile}
                    />
                    <Box
                      sx={{
                        ml: sidebarOpen && !isMobile ? '280px' : 0,
                        transition: 'margin-left 0.3s ease',
                        pt: '64px',
                        minHeight: '100vh',
                        backgroundColor: '#0a0f1d',
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/dashboard" element={<AdminDashboard />} />
                          <Route path="/users" element={<UserManagement />} />
                          <Route path="/kyc" element={<KYCVerification />} />
                          <Route path="/trading" element={<TradingManagement />} />
                          <Route path="/transactions" element={<TransactionManagement />} />
                          <Route path="/support" element={<SupportManagement />} />
                          <Route path="/settings" element={<SystemSettings />} />
                          <Route path="/notifications" element={<NotificationsPage />} />
                          <Route path="/deposit-addresses" element={<DepositAddresses />} />
                          <Route path="/quick-replies" element={<QuickReplies />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Box>
                    </Box>
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AdminAuthProvider>
    </ThemeProvider>
  );
};

export default App;