import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/responder';
import { authService } from '../services/auth.service';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: 'admin';
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return fail(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token || !authService.isTokenActive(token)) {
    return fail(res, 'Unauthorized', 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthedRequest['user'];
    req.user = payload;
    return next();
  } catch (err) {
    return fail(res, 'Unauthorized', 401);
  }
}
