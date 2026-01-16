import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ok, fail } from '../utils/responder';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const result = await authService.login(email, password);
  if (!result.success) return fail(res, result.error, 401);
  return ok(res, result.data, 200);
}

export async function logout(req: Request, res: Response) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) authService.logout(token);
  return ok(res, { message: 'Logged out' });
}
