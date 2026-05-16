import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// Contoh setup proxy ke Auth Service (bisa kamu lengkapi dengan JWT Validation dll)
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    changeOrigin: true,
  })
);

app.use(
  '/api/travelers',
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:8082',
    changeOrigin: true,
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Gateway is running on port ${PORT}`);
});
