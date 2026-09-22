const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Get token from header
  let token = req.header('Authorization');
  
  // Handle Bearer token
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  } else if (!token) {
    // Fallback to x-auth-token
    token = req.header('x-auth-token');
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists and is not blocked
    const user = await User.findById(decoded.id).select('status isActive role');
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    req.user = decoded;
    // Attach full user info if needed, but keeping it simple for now
    req.user.role = user.role; 
    req.user.status = user.status;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
