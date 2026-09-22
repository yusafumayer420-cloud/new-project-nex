import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  OpenInNew,
  AccessTime,
  Newspaper,
  AutoAwesome
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

/* ============================
   ANIMATION VARIANTS
   ============================ */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const response = await axios.get('/api/news');
      setNews(response.data);
      if (showToast) toast.success('News updated');
    } catch (error) {
      console.error('Failed to fetch news:', error);
      toast.error('Failed to update news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pb: 8, pt: { xs: 3, md: 6 } }}>
      <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        
        {/* Header */}
        <motion.div variants={fadeUp}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ 
                p: { xs: 1, sm: 1.5 }, 
                borderRadius: { xs: 2, sm: 3 }, 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(79, 124, 255, 0.2))',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
              }}>
                <Newspaper sx={{ color: '#3B82F6', fontSize: { xs: 24, sm: 28 } }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '1.4rem', sm: '2rem', md: '2.125rem' },
                  background: 'linear-gradient(135deg, #3B82F6, #4F7CFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Market Intel
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Latest updates and breaking news in crypto
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => fetchNews(true)} 
              disabled={refreshing} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(17, 24, 39, 0.5)', 
                border: '1px solid rgba(148, 163, 184, 0.1)',
                '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.8)' },
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 }
              }}
            >
              <Refresh className={refreshing ? 'spin-animation' : ''} sx={{ color: '#3B82F6', fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Box>
        </motion.div>

        {/* News List */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <AnimatePresence>
            {news.map((item, index) => {
              const isCoinDesk = item.source === 'CoinDesk';
              const accentColor = isCoinDesk ? '#3B82F6' : '#4F7CFF';
              const glowColor = isCoinDesk ? 'rgba(59, 130, 246, 0.15)' : 'rgba(79, 124, 255, 0.15)';

              return (
                <Grid item xs={12} key={item.id || index}>
                  <motion.div variants={fadeUp} style={{ height: '100%' }}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ height: '100%' }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%',
                          background: 'rgba(17, 24, 39, 0.4)', 
                          border: '1px solid rgba(148, 163, 184, 0.05)',
                          borderRadius: 4,
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(17, 24, 39, 0.7)',
                            borderColor: accentColor,
                            boxShadow: `0 8px 32px ${glowColor}`,
                          }
                        }}
                      >
                        {/* Image on top */}
                        {item.image ? (
                          <Box
                            sx={{
                              width: '100%',
                              height: 180,
                              backgroundImage: `url(${item.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 180,
                              flexShrink: 0,
                              background: `linear-gradient(135deg, ${accentColor}18, rgba(17,24,39,0.8))`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '3.5rem',
                            }}
                          >
                            📰
                          </Box>
                        )}

                        {/* Decorative glow */}
                        <Box sx={{
                          position: 'absolute',
                          top: -30,
                          right: -30,
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          background: `radial-gradient(circle, ${glowColor}, transparent)`,
                          filter: 'blur(20px)',
                          zIndex: 0
                        }} />

                        <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, position: 'relative', zIndex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip 
                              icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />}
                              label={item.source} 
                              size="small" 
                              sx={{ 
                                bgcolor: `${accentColor}1A`,
                                color: accentColor,
                                border: `1px solid ${accentColor}33`,
                                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                fontWeight: 700,
                                height: { xs: 22, sm: 24 }
                              }} 
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: { xs: 12, sm: 14 }, color: '#94A3B8' }} />
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                {formatDate(item.date)}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.4, color: '#F8FAFC', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                            {item.title}
                          </Typography>

                          <Typography variant="body2" sx={{ 
                            color: '#94A3B8', 
                            mb: 3, 
                            lineHeight: { xs: 1.5, sm: 1.6 },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            display: '-webkit-box', 
                            WebkitLineClamp: 3, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            flexGrow: 1 
                          }}>
                            {item.summary}
                          </Typography>

                          <Button
                            fullWidth
                            variant="contained"
                            endIcon={<OpenInNew sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              background: 'rgba(255, 255, 255, 0.03)',
                              color: accentColor,
                              border: `1px solid rgba(255, 255, 255, 0.05)`,
                              fontWeight: 600,
                              py: { xs: 0.8, sm: 1 },
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              borderRadius: 2,
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                background: `${accentColor}1A`,
                                borderColor: `${accentColor}4D`,
                                boxShadow: 'none'
                              }
                            }}
                          >
                            Read Full Article
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>

        {news.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Newspaper sx={{ fontSize: 64, color: '#94A3B8', opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600 }}>No News Available</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>Check back later for market updates.</Typography>
          </Box>
        )}

      </motion.div>

      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .spin-animation {
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}
      </style>
    </Container>
  );
};

export default NewsPage;
