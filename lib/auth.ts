import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'Sudip990';
const COOKIE_NAME = 'exam_admin_auth';

export function getExpectedAdminSecret(): string {
  return ADMIN_SECRET;
}

export function isValidAdminSecret(providedSecret: string): boolean {
  if (!providedSecret) return false;
  return providedSecret.trim() === ADMIN_SECRET.trim();
}

export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && isValidAdminSecret(headerKey)) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (isValidAdminSecret(token)) {
      return true;
    }
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie?.value && isValidAdminSecret(sessionCookie.value)) {
      return true;
    }
  } catch (err) {}

  return false;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;