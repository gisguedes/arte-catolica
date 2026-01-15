import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Auth tokens will be insecure.');
}

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (payload: Record<string, unknown>) =>
  jwt.sign(payload, JWT_SECRET || 'insecure-secret', { expiresIn: '7d' });

