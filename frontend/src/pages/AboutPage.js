import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  StarBorder,
  Public,
  EmojiEvents,
  LightbulbOutlined,
  SecurityOutlined,
} from '@mui/icons-material';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const values = [
    {
      title: 'Commitment to Excellence',
      text: 'Our reputation is built on diligence, transparency, and integrity. We operate with complete accountability, ensuring that every interaction reinforces our dedication to the highest standards in the financial industry. Trust is not just a value; it is the foundation of our platform.',
      icon: <StarBorder sx={{ fontSize: 40, color: '#3B82F6' }} />,
      glow: 'rgba(59, 130, 246, 0.15)'
    },
    {
      title: 'Global Market Presence',
      text: 'With a truly global footprint, our reach extends across diverse regions and markets. This international perspective allows us to navigate volatility seamlessly, offering our users access to 10+ live crypto markets with deep liquidity and real-time pricing—anytime, anywhere.',
      icon: <Public sx={{ fontSize: 40, color: '#4F7CFF' }} />,
      glow: 'rgba(79, 124, 255, 0.15)'
    },
    {
      title: 'Client Success Stories',
      text: 'We take immense pride in the success of our clients—from first-time retail traders to institutional powerhouses. Every investor receives personalized attention and a customized strategy aligned with their unique financial goals. Our client-first philosophy ensures that you are never just a number.',
      icon: <EmojiEvents sx={{ fontSize: 40, color: '#FFC107' }} />,
      glow: 'rgba(255, 193, 7, 0.15)'
    },
    {
      title: 'Innovation & Adaptability',
      text: 'The financial landscape is in constant flux, and innovation is the cornerstone of our evolution. Our forward-thinking approach keeps us ahead of the curve, leveraging cutting-edge technology such as our proprietary matching engine—capable of processing 100,000 orders per second with just 5ms latency. We adapt fast so you can trade faster.',
      icon: <LightbulbOutlined sx={{ fontSize: 40, color: '#2563EB' }} />,
      glow: 'rgba(124, 58, 237, 0.15)'
    },
    {
      title: 'Social Responsibility & Security',
      text: 'Beyond financial success, we embrace our responsibility to build a safer ecosystem. We integrate ethical governance into our decision-making, maintain a verifiable 1:1 reserve ratio to guarantee asset security, and safeguard our community with a $300 Million USDT User Protection Fund. By prioritizing transparency, security, and sustainability, we are not just building a platform—we are building a resilient financial future for all.',
      icon: <SecurityOutlined sx={{ fontSize: 40, color: '#00C853' }} />,
      glow: 'rgba(0, 200, 83, 0.15)'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8, pb: 12 }}>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        
        {/* Header Section */}
        <motion.div variants={fadeUp}>
          <Box sx={{ textAlign: 'center', mb: 8, px: { xs: 2, md: 8 } }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 3,
                background: 'linear-gradient(135deg, #3B82F6, #4F7CFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              About Us
            </Typography>
            <Typography variant="h6" sx={{ color: '#E2E8F0', mb: 3, fontWeight: 400, lineHeight: 1.6 }}>
              We are more than just a digital asset exchange—we are a global financial hub dedicated to creating greater possibilities for every trader and investor.
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', lineHeight: 1.8 }}>
              Our investment philosophy blends a profound understanding of on-chain data and market microstructure with an unwavering focus on delivering stable, sustainable returns. Grounded in rigorous fundamental analysis, we identify undervalued opportunities and dynamically adjust strategies to capture emerging trends before they go mainstream.
            </Typography>
          </Box>
        </motion.div>

        {/* Values Grid */}
        <Grid container spacing={4} justifyContent="center">
          {values.map((item, index) => (
            <Grid item xs={12} md={index < 2 ? 6 : 4} key={index}>
              <motion.div variants={fadeUp} style={{ height: '100%' }}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(17, 24, 39, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.05)',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(17, 24, 39, 0.7)',
                      borderColor: item.glow.replace('0.15', '0.4'),
                      transform: 'translateY(-4px)',
                      boxShadow: `0 10px 40px ${item.glow}`,
                    },
                  }}
                >
                  <Box sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${item.glow}, transparent)`,
                    filter: 'blur(20px)',
                  }} />
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 20px ${item.glow}`
                      }}>
                        {item.icon}
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#F8FAFC' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, flexGrow: 1 }}>
                      {item.text}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

      </motion.div>
    </Container>
  );
};

export default AboutPage;
