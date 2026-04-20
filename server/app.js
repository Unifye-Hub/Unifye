const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const passport = require('./config/passport');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const groupRoutes = require('./routes/groupRoutes');
const friendRoutes = require('./routes/friendRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
app.set('trust proxy', 1); // Trust Render's reverse proxy for express-rate-limit

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 5000, // Increased for development
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Compress all responses
app.use(compression());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Implement CORS
const allowedOrigins = [
  'https://unifye.in',
  'https://www.unifye.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://unifye.vercel.app' // Vercel preview domain fallback
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For Vercel preview deployments, we might want to allow preview domains
      if (origin && origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new AppError('Not allowed by CORS', 403));
      }
    }
  },
  credentials: true
}));

// 2) ROUTES
app.use('/auth', googleAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
// Note: /api/events/:id/register mapped via eventRoutes
app.use('/api/organizers/:id/reviews', reviewRoutes);
// Note: review creation via POST /api/events/:id/review mapped via eventRoutes -> reviewRoutes (using mergeParams)
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
