require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Trust proxy for production (Heroku, AWS, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(compression());

// ---------- CORS Configuration (must come before rate limiters) ----------
const rawFrontendUrl = process.env.FRONTEND_URL;
const rawAdminUrl = process.env.ADMIN_URL;

// Start with hardcoded fallback origins (you can keep or remove)
let allowedOrigins = [
  'https://nexvor.com',
  'https://www.nexvor.com',
  'https://admin.nexvor.com',
  'https://www.admin.nexvor.com',
  'https://api.nexvor.com'
];

// Helper to add an origin and optionally its www variant
const addOriginWithWww = (origin) => {
  if (!origin) return;
  allowedOrigins.push(origin);
  // Add www version if it's a production HTTPS origin without www
  if (origin.startsWith('https://') && !origin.includes('www.') && !origin.includes('localhost')) {
    const wwwOrigin = origin.replace(/^https:\/\//, 'https://www.');
    allowedOrigins.push(wwwOrigin);
  }
};

// Process frontend URLs (comma‑separated)
if (rawFrontendUrl) {
  rawFrontendUrl.split(',').map(s => s.trim()).forEach(addOriginWithWww);
}

// Process admin URLs (comma‑separated)
if (rawAdminUrl) {
  rawAdminUrl.split(',').map(s => s.trim()).forEach(addOriginWithWww);
}

// Fallback for development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
}

// Remove duplicates (just in case)
allowedOrigins = [...new Set(allowedOrigins)];

// Log the allowed origins for debugging (remove after testing)
console.log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
  optionsSuccessStatus: 200
};

// Manual CORS header middleware — hard fallback to guarantee headers are set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,Accept,Origin,Cache-Control');
  }
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Apply CORS middleware for Express routes
app.use(cors(corsOptions));

// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));
// ----------------------------------------

// ===================== RATE LIMITERS =====================

const createLimiter = (windowMs, max) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    skip: (req) => {
      // Don't rate limit Socket.IO polling
      if (req.path.startsWith('/socket.io')) return true;

      // Don't rate limit OPTIONS requests
      if (req.method === 'OPTIONS') return true;

      return false;
    },

    handler: (req, res) => {
      console.error("========== RATE LIMITED ==========");
      console.error("Time :", new Date().toISOString());
      console.error("IP   :", req.ip);
      console.error("URL  :", req.originalUrl);
      console.error("==================================");

      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
      });
    }
  });

const loginLimiter = createLimiter(
  15 * 60 * 1000,
  Number(process.env.LOGIN_RATE_LIMIT || 20)
);

const adminLimiter = createLimiter(
  15 * 60 * 1000,
  Number(process.env.ADMIN_RATE_LIMIT || 5000)
);

const apiLimiter = createLimiter(
  15 * 60 * 1000,
  Number(process.env.PUBLIC_RATE_LIMIT || 5000)
);

const marketLimiter = createLimiter(
  60 * 1000,
  Number(process.env.MARKET_RATE_LIMIT || 5000)
);

// Apply limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/market', marketLimiter);

// Apply general limiter to all remaining API routes
app.use('/api', (req, res, next) => {
  if (
    req.path === '/auth/login' ||
    req.path.startsWith('/market')
  ) {
    return next();
  }

  apiLimiter(req, res, next);
});

// =========================================================
// ----------------------------------------

// Socket.IO with the same allowed origins
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to our router
app.set('io', io);

// After initializing socket.io
const chatSocket = require('./sockets/chat')(io);
const { startPriceFeed } = require('./utils/priceFeed');
startPriceFeed(io);

// Body Parser Middleware – MUST come before any route that needs req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
const path = require('path');
// Profile pictures: public (they're user avatars shown in the app)
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Chat attachments: public (they're shared in support chats)
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/kyc', 'uploads/chat'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// KYC documents: NOT served statically - served via authenticated endpoint in users.js

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('Successfully connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Socket.io for real-time data
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_admin', () => {
    socket.join('admin');
  });

  socket.on('leave_admin', () => {
    socket.leave('admin');
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('leave_user', (userId) => {
    socket.leave(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/market', require('./routes/market'));
app.use('/api/news', require('./routes/news'));
// Add chat routes
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/notifications', require('./routes/notifications'));
app.use('/api/deposit-addresses', require('./routes/depositAddresses'));

// Error Handling Middleware
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});