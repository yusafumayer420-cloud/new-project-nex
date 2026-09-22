import React, { useEffect, useRef } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward,
  Lock,
  FlashOn,
  MonetizationOn,
  HeadsetMic,
} from '@mui/icons-material';

const WelcomePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246,${p.alpha})`;
        ctx.fill();
      });
      animFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  const cards = [
    {
      icon: <LoginIcon sx={{ fontSize: 32 }} />,
      title: 'Sign In',
      desc: 'Access your existing account',
      path: '/login',
      gradient: 'linear-gradient(135deg, rgba(0,180,220,0.18) 0%, rgba(59, 130, 246,0.08) 100%)',
      border: 'rgba(59, 130, 246,0.35)',
      glow: 'rgba(59, 130, 246,0.18)',
      iconColor: '#3B82F6',
    },
    {
      icon: <PersonAddIcon sx={{ fontSize: 32 }} />,
      title: 'Sign Up',
      desc: 'Create a new account',
      path: '/register',
      gradient: 'linear-gradient(135deg, rgba(100,60,220,0.22) 0%, rgba(139,92,246,0.10) 100%)',
      border: 'rgba(139,92,246,0.45)',
      glow: 'rgba(139,92,246,0.20)',
      iconColor: '#60A5FA',
    },
  ];

  const features = [
    { icon: <Lock sx={{ fontSize: 18 }} />, label: 'Secure', sub: '256-bit SSL' },
    { icon: <FlashOn sx={{ fontSize: 18 }} />, label: 'Fast', sub: 'Lightning Fast' },
    { icon: <MonetizationOn sx={{ fontSize: 18 }} />, label: 'Low Fees', sub: 'Best Rates' },
    { icon: <HeadsetMic sx={{ fontSize: 18 }} />, label: '24/7 Support', sub: 'Live Support' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#070B14',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Background orbs */}
      <Box sx={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute', bottom: '10%', right: '-10%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, py: 4 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <Box sx={{ mx: 'auto', mb: 1, display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="NexVor Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '50%', boxShadow: '0 0 25px rgba(0, 140, 255, 0.6), inset 0 0 10px rgba(0, 140, 255, 0.4)' }} />
          </Box>
          <Typography sx={{ fontSize: '0.6rem', letterSpacing: 3, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', mb: 0.3 }}>
            NexVor
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', letterSpacing: 1.5, color: 'rgba(59, 130, 246,0.4)', textTransform: 'uppercase' }}>
            TRADE · INVEST · GROW
          </Typography>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 1.5 }}>
            Trade.{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#3B82F6,#4F7CFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Invest.
            </Box>{' '}
            Grow.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 280, mx: 'auto' }}>
            Join thousands of traders on the most secure and powerful platform.
          </Typography>
        </motion.div>

        {/* Sign In / Sign Up Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              style={{ flex: 1 }}
              onClick={() => navigate(card.path)}
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2.5,
                  borderRadius: 3,
                  background: card.gradient,
                  border: `1.5px solid ${card.border}`,
                  boxShadow: `0 8px 32px ${card.glow}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(12px)',
                  '&:hover': {
                    boxShadow: `0 12px 40px ${card.glow}, 0 0 0 1px ${card.border}`,
                  },
                }}
              >
                <Box sx={{ color: card.iconColor, mb: 1.5 }}>{card.icon}</Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 0.5, color: '#fff' }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 2, lineHeight: 1.4 }}>
                  {card.desc}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: card.iconColor, mt: 'auto' }}>
                  <ArrowForward sx={{ fontSize: 18 }} />
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Feature Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 1,
              p: 2,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {features.map((f) => (
              <Box key={f.label} sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'rgba(59, 130, 246,0.7)', mb: 0.8 }}>{f.icon}</Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
                  {f.label}
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                  {f.sub}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>

      </Container>
    </Box>
  );
};

export default WelcomePage;
