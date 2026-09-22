import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, Alert, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Components
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import LiveChat from './components/LiveChat';
import TradeResultModal from './components/TradeResultModal';
import { AuthContext, AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import TradingPage from './pages/TradingPage';
import FundsPage from './pages/FundsPage';
import ProfilePage from './pages/ProfilePage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import NotificationPage from './pages/NotificationPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import SupportPage from './pages/SupportPage';
import NewsPage from './pages/NewsPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ExchangePage from './pages/ExchangePage';
import ExchangeHistoryPage from './pages/ExchangeHistoryPage';
import PortfolioPage from './pages/PortfolioPage';
import LearnMorePage from './pages/LearnMorePage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';

// Theme
import darkTheme from './theme';

import socket from './socket';

const GlobalTradeResult = () => {
  const { showTradeResult, tradeResult, resultPrice, closeTradeResult } = React.useContext(AuthContext);
  return (
    <TradeResultModal
      open={showTradeResult}
      onClose={closeTradeResult}
      trade={tradeResult}
      currentPrice={resultPrice}
    />
  );
};

// ─── Gradient colour scenes ───────────────────────────────────────────────────
// Each scene defines 3 orb colours/positions + 5 glow corner colours.
// Values are interpolated linearly based on scroll progress.
const SCENES = [
  // 0 % — Electric Emerald & Royal Blue
  { o1c:'0,255,157',  o1x:18, o1y:20, o1r:420,
    o2c:'59,130,246', o2x:82, o2y:30, o2r:380,
    o3c:'139,92,246', o3x:50, o3y:85, o3r:300,
    tl:'0,255,157',   tr:'59,130,246',
    cl:'139,92,246',  cr:'59,130,246',  bc:'16,185,129' },
  // 25 % — Royal Cyber Blue & Violet
  { o1c:'59,130,246',  o1x:15, o1y:25, o1r:460,
    o2c:'139,92,246',  o2x:80, o2y:20, o2r:400,
    o3c:'0,255,157',   o3x:45, o3y:80, o3r:340,
    tl:'59,130,246',  tr:'139,92,246',
    cl:'59,130,246',  cr:'0,255,157',   bc:'139,92,246' },
  // 50 % — Deep Violet & Emerald Glow
  { o1c:'139,92,246',  o1x:12, o1y:35, o1r:450,
    o2c:'0,255,157',   o2x:85, o2y:40, o2r:420,
    o3c:'59,130,246',  o3x:55, o3y:90, o3r:320,
    tl:'139,92,246',  tr:'0,255,157',
    cl:'59,130,246',  cr:'139,92,246',  bc:'0,255,157' },
  // 75 % — Sapphire & Emerald Nebula
  { o1c:'59,130,246',  o1x:20, o1y:15, o1r:430,
    o2c:'16,185,129',  o2x:78, o2y:35, o2r:390,
    o3c:'139,92,246',  o3x:48, o3y:88, o3r:310,
    tl:'59,130,246',  tr:'16,185,129',
    cl:'139,92,246',  cr:'0,255,157',   bc:'59,130,246' },
  // 100 % — Mint Emerald Ocean
  { o1c:'0,255,157',  o1x:10, o1y:10, o1r:440,
    o2c:'16,185,129',  o2x:88, o2y:28, o2r:360,
    o3c:'59,130,246', o3x:50, o3y:92, o3r:300,
    tl:'16,185,129',   tr:'0,255,157',
    cl:'59,130,246',  cr:'16,185,129',  bc:'0,255,157' },
];

// Interpolate a numeric CSS variable value between two scenes
const lerp = (a, b, t) => a + (b - a) * t;

// Interpolate an RGB triplet string  "r,g,b"
const lerpRGB = (ca, cb, t) => {
  const [r1, g1, b1] = ca.split(',').map(Number);
  const [r2, g2, b2] = cb.split(',').map(Number);
  return `${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))}`;
};

function useScrollGradient(ref, enabled) {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const el = ref.current;
    const segments = SCENES.length - 1;

    const apply = (progress) => {
      const scaled = Math.min(progress, 1) * segments;
      const idx = Math.min(Math.floor(scaled), segments - 1);
      const t   = scaled - idx;
      const A   = SCENES[idx];
      const B   = SCENES[idx + 1];

      const rgb = (k) => lerpRGB(A[k], B[k], t);
      const num = (k) => lerp(A[k], B[k], t);

      el.style.setProperty('--g-o1c', rgb('o1c'));
      el.style.setProperty('--g-o1x', `${num('o1x').toFixed(1)}%`);
      el.style.setProperty('--g-o1y', `${num('o1y').toFixed(1)}%`);
      el.style.setProperty('--g-o1r', `${num('o1r').toFixed(0)}px`);
      el.style.setProperty('--g-o2c', rgb('o2c'));
      el.style.setProperty('--g-o2x', `${num('o2x').toFixed(1)}%`);
      el.style.setProperty('--g-o2y', `${num('o2y').toFixed(1)}%`);
      el.style.setProperty('--g-o2r', `${num('o2r').toFixed(0)}px`);
      el.style.setProperty('--g-o3c', rgb('o3c'));
      el.style.setProperty('--g-o3x', `${num('o3x').toFixed(1)}%`);
      el.style.setProperty('--g-o3y', `${num('o3y').toFixed(1)}%`);
      el.style.setProperty('--g-o3r', `${num('o3r').toFixed(0)}px`);
      el.style.setProperty('--g-tl',  rgb('tl'));
      el.style.setProperty('--g-tr',  rgb('tr'));
      el.style.setProperty('--g-cl',  rgb('cl'));
      el.style.setProperty('--g-cr',  rgb('cr'));
      el.style.setProperty('--g-bc',  rgb('bc'));
    };

    const onScroll = () => {
      const maxScroll = Math.max(
        document.body.scrollHeight - window.innerHeight, 1
      );
      apply(window.scrollY / maxScroll);
    };

    // Seed with current scroll position (handles navigation between pages)
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled, ref]);
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [marketData, setMarketData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);

    const handlePriceUpdate = (data) => setMarketData(data);
    socket.on('priceUpdate', handlePriceUpdate);
    return () => socket.off('priceUpdate', handlePriceUpdate);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider>
        <CssBaseline />
        <Router>
          <AppContent
            marketData={marketData}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent({ marketData, sidebarOpen, setSidebarOpen }) {
  const location  = useLocation();
  const { showTradeResult, user } = React.useContext(AuthContext);
  const isHomePage = location.pathname === '/';
  const gradientRef = useRef(null);

  // Attach scroll-driven gradient (disabled on homepage)
  useScrollGradient(gradientRef, !isHomePage);

  // Seed default CSS vars on mount / page change
  useEffect(() => {
    if (!gradientRef.current) return;
    const el = gradientRef.current;
    const A = SCENES[0];
    el.style.setProperty('--g-o1c', A.o1c);
    el.style.setProperty('--g-o1x', `${A.o1x}%`);
    el.style.setProperty('--g-o1y', `${A.o1y}%`);
    el.style.setProperty('--g-o1r', `${A.o1r}px`);
    el.style.setProperty('--g-o2c', A.o2c);
    el.style.setProperty('--g-o2x', `${A.o2x}%`);
    el.style.setProperty('--g-o2y', `${A.o2y}%`);
    el.style.setProperty('--g-o2r', `${A.o2r}px`);
    el.style.setProperty('--g-o3c', A.o3c);
    el.style.setProperty('--g-o3x', `${A.o3x}%`);
    el.style.setProperty('--g-o3y', `${A.o3y}%`);
    el.style.setProperty('--g-o3r', `${A.o3r}px`);
    el.style.setProperty('--g-tl',  A.tl);
    el.style.setProperty('--g-tr',  A.tr);
    el.style.setProperty('--g-cl',  A.cl);
    el.style.setProperty('--g-cr',  A.cr);
    el.style.setProperty('--g-bc',  A.bc);
  }, [location.pathname]);

  return (
    <div
      ref={gradientRef}
      className={`App ${!isHomePage ? 'premium-gradient' : ''}`}
      style={{ minHeight: '100vh' }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(18, 24, 36, 0.95)',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(16px)',
          },
        }}
      />

      {user?.status === 'frozen' && (
        <Box sx={{ width: '100%', zIndex: 9999, position: 'relative' }}>
          <Alert severity="warning" sx={{ borderRadius: 0, justifyContent: 'center' }}>
            Your account is temporarily frozen and under review.
          </Alert>
        </Box>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/welcome"             element={<WelcomePage />} />
        <Route path="/login"               element={<AuthPage />} />
        <Route path="/register"            element={<RegisterPage />} />
        <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email"        element={<VerifyEmailPage />} />

        {/* Protected Routes with Layout */}
        <Route element={
          <ProtectedRoute>
            <>
              <TopBar onMenuClick={() => setSidebarOpen(true)} />
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <Outlet />
              <LiveChat />
              <BottomNav />
            </>
          </ProtectedRoute>
        }>
          <Route path="/"                  element={<HomePage marketData={marketData} />} />
          <Route path="/markets"           element={<MarketPage marketData={marketData} />} />
          <Route path="/trading/:pair?"    element={<TradingPage socket={socket} />} />
          <Route path="/funds"             element={<FundsPage />} />
          <Route path="/history"           element={<TransactionHistoryPage />} />
          <Route path="/exchange"          element={<ExchangePage />} />
          <Route path="/exchange/history"  element={<ExchangeHistoryPage />} />
          <Route path="/portfolio"         element={<PortfolioPage />} />
          <Route path="/notifications"     element={<NotificationPage />} />
          <Route path="/profile"           element={<ProfilePage />} />
          <Route path="/support"           element={<SupportPage />} />
          <Route path="/news"              element={<NewsPage />} />
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/faq"               element={<FAQPage />} />
          <Route path="/learn-more"        element={<LearnMorePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin"   element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalTradeResult />
    </div>
  );
}

export default App;