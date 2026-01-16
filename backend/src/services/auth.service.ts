import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const activeTokens = new Set<string>();

function login(email: string, password: string) {
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return Promise.resolve({ success: false as const, error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: 'admin', role: 'admin', email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  activeTokens.add(token);
  return Promise.resolve({ success: true as const, data: { token } });
}

function logout(token: string) {
  activeTokens.delete(token);
}

function isTokenActive(token: string) {
  return activeTokens.has(token);
}

export const authService = {
  login,
  logout,
  isTokenActive,
};
