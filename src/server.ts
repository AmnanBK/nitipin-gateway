import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { rateLimit } from 'express-rate-limit';
import { authMiddleware } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 1. CORS
app.use(cors());

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use(limiter);

// 3. Health Check (Public)
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

// 4. JWT Validation Middleware (Applied to all /api routes)
app.use('/api', authMiddleware);

// 5. Proxy Routes

// Auth Service
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    changeOrigin: true,
  })
);

// User Service (Travelers, Buyers, Countries)
const userProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:8082',
  changeOrigin: true,
  pathRewrite: (path, req: any) => req.originalUrl || path,
});

app.use('/api/travelers', userProxy);
app.use('/api/buyers', userProxy);
app.use('/api/countries', userProxy);

// Product-Order Service (All other /api routes)
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8083',
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Gateway is running on port ${PORT}`);
});
