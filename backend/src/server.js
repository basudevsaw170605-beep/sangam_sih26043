import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// import dns from "dns";

// dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
const corsOrigin = (origin, cb) => {
  if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
  if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
  cb(new Error(`Origin ${origin} is not allowed by CORS`));
};
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false })
);
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));
app.get('/api/health', (_, res) =>
  res.json({
    success: true,
    message: 'SangamSetu API is running',
    database: app.locals.dbConnected ? 'connected' : 'disconnected',
  })
);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
connectDB()
  .then(() => {
    app.locals.dbConnected = true;
    app.listen(process.env.PORT || 5000, () =>
      console.log(`API listening on ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
