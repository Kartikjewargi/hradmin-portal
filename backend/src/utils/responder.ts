import { Response } from 'express';

interface SuccessPayload<T> {
  success: true;
  data: T;
}

interface ErrorPayload {
  success: false;
  error: string;
}

export function ok<T>(res: Response, data: T, status = 200) {
  const payload: SuccessPayload<T> = { success: true, data };
  return res.status(status).json(payload);
}

export function fail(res: Response, message: string, status = 400) {
  const payload: ErrorPayload = { success: false, error: message };
  return res.status(status).json(payload);
}
