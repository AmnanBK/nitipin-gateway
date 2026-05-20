import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Define public routes (no JWT required)
  const publicRoutes = [
    '/auth/login',
    '/auth/register/traveler',
    '/auth/register/buyer',
    '/auth/refresh',
    '/health',
  ];

  // Check if current path is a public route
  // We use startsWith to handle routes like /api/products (GET is public, but POST might not be)
  // Actually, for simplicity in Gateway, we can just whitelist the auth routes.
  const isPublic = publicRoutes.some((route) => req.path === route || req.path.startsWith(route));

  // Special case: GET /api/products and GET /api/countries are public
  if (req.method === 'GET' && (req.path.startsWith('/products') || req.path.startsWith('/countries'))) {
    return next();
  }

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jastip_super_secret_key_2024') as any;

    // Inject user information into headers for downstream services
    // Use string values for headers
    if (decoded.userId || decoded.id) {
      req.headers['x-user-id'] = String(decoded.userId || decoded.id);
    }
    if (decoded.role) {
      req.headers['x-user-role'] = String(decoded.role);
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid or expired token',
    });
  }
};
