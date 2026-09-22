import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { CircularProgress, Box } from '@mui/material';
import { motion } from 'framer-motion';

const SecureImage = ({ src, alt, style, initial, animate, isMotion = false }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const fetchImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }
      
      // If it's a data URI, blob URI, or not an authenticated API endpoint, use it directly
      if (src.startsWith('data:') || src.startsWith('blob:') || !src.includes('/api/users/kyc/file/')) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        const response = await axios.get(src, {
          responseType: 'blob'
        });
        
        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data);
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching secure image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', ...style }}>
        <CircularProgress size={24} color="inherit" />
      </Box>
    );
  }

  if (error || !imageSrc) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', bgcolor: 'rgba(255,0,0,0.1)', color: 'error.main', fontSize: '0.8rem', ...style }}>
        Failed to load
      </Box>
    );
  }

  if (isMotion) {
    return <motion.img src={imageSrc} alt={alt} style={style} initial={initial} animate={animate} loading="eager" />;
  }

  return <img src={imageSrc} alt={alt} style={style} loading="eager" />;
};

export default SecureImage;
