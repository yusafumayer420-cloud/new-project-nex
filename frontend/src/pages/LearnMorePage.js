import React from 'react';
import { Container, Typography, Box, Paper, Grid, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { CheckCircle, ShowChart, Security, Insights, ImportantDevices, Shield, Assessment, MonetizationOn, RocketLaunch } from '@mui/icons-material';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const LearnMorePage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6, color: '#e2e8f0' }}>
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #3B82F6, #4F7CFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Learn More About NexVor
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#94a3b8', mb: 3 }}>
            Trade Smarter. Trade Faster. Trade with Confidence.
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', lineHeight: 1.8, maxWidth: '800px', mx: 'auto' }}>
            NexVor is a next-generation cryptocurrency trading platform designed to provide traders with secure, reliable, and real-time access to global digital asset markets. Whether you're a beginner exploring crypto for the first time or an experienced trader managing a diverse portfolio, NexVor delivers the tools you need to succeed.
          </Typography>
        </Box>
      </motion.div>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 6 }} />

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Why Choose NexVor?
        </Typography>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, height: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Assessment sx={{ fontSize: 40, color: '#3B82F6', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Real-Time Market Data</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                Stay ahead of the market with live cryptocurrency prices, advanced charts, market depth analysis, and instant trade updates. Access accurate market information to make informed trading decisions.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, height: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
              <ShowChart sx={{ fontSize: 40, color: '#4F7CFF', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Advanced Trading Tools</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                Our platform provides professional-grade trading tools including real-time tracking, interactive charts, and analytics.
              </Typography>
              <List dense sx={{ mt: 1 }}>
                {['Real-Time Price Tracking', 'Interactive Charts', 'Market/Limit Orders', 'Trade Analytics'].map(item => (
                  <ListItem key={item} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ color: '#4F7CFF', fontSize: 16 }} /></ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'caption', color: '#cbd5e1' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, height: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Security sx={{ fontSize: 40, color: '#00C853', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Secure by Design</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                Security is at the core of everything we do. Your assets and data are protected at all times.
              </Typography>
              <List dense sx={{ mt: 1 }}>
                {['Encrypted Transmission', '2FA Protection', 'Risk Monitoring', 'Security Audits'].map(item => (
                  <ListItem key={item} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}><Shield sx={{ color: '#00C853', fontSize: 16 }} /></ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'caption', color: '#cbd5e1' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 6 }} />

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Grid container spacing={6} sx={{ mb: 6, alignItems: 'center' }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Powerful Trading Experience</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#3B82F6', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><RocketLaunch fontSize="small" /> Spot Trading</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Buy and sell cryptocurrencies instantly using our intuitive trading interface. Execute trades with speed and precision across multiple trading pairs.</Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#4F7CFF', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><MonetizationOn fontSize="small" /> Portfolio Management</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Track your investments in one place. Monitor Asset Allocation, Portfolio Performance, P&L Statistics, and Trade History.</Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#2563EB', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><Insights fontSize="small" /> Market Insights</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Access comprehensive market analytics including Top Gainers, Losers, Trending Assets, and Trading Activity.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Platform Benefits</Typography>
              <List>
                {['Real-Time Market Data', 'Fast Trade Execution', 'Secure User Accounts', 'Advanced Trading Interface', 'Portfolio Tracking', 'Responsive Web Experience', 'Continuous Platform Improvements', 'Dedicated Customer Support'].map((benefit, i) => (
                  <ListItem key={i} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><CheckCircle color="primary" /></ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 6 }} />

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Box sx={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)', p: 6, borderRadius: 4, border: '1px solid rgba(79, 124, 255, 0.2)' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Start Your Trading Journey Today</Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 4, maxWidth: '700px', mx: 'auto' }}>
            Join thousands of traders who trust NexVor for their cryptocurrency trading needs. Create your account, explore the markets, and take control of your financial future with a platform built for performance, security, and growth.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#3B82F6' }}>
            Trade Smarter. Grow Faster. Welcome to NexVor.
          </Typography>
        </Box>
      </motion.div>

    </Container>
  );
};

export default LearnMorePage;
