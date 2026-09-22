import React, { useState, useEffect } from 'react';
import api from '../api';
import { CircularProgress, Box } from '@mui/material';

const SecureImage = ({ src, alt, style, className }) => {
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
      
      // If it's a public URL or data URI, just use it directly
      if (src.startsWith('data:') || src.startsWith('blob:') || !src.includes('/api/users/kyc/file/')) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        const response = await api.get(src, {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', minHeight: 100, ...style }} className={className}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !imageSrc) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', minHeight: 100, bgcolor: 'rgba(255,0,0,0.1)', color: 'error.main', ...style }} className={className}>
        Failed to load
      </Box>
    );
  }

  return <img src={imageSrc} alt={alt} style={style} className={className} loading="lazy" />;
};

export default SecureImage;
