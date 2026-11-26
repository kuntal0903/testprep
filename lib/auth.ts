import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';
const COOKIE_NAME = 'exam_admin_auth';

export function getExpectedAdminSecret(): string {
  return ADMIN_SECRET;
}

export function isValidAdminSecret(providedSecret: string): boolean {
  if (!providedSecret || !ADMIN_SECRET) return false;
  return providedSecret.trim() === ADMIN_SECRET.trim();
}

// Check admin authentication from NextRequest (Headers or Cookies)
export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  // 1. Check custom Header x-admin-key or authorization
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

  // 2. Check Cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie?.value && isValidAdminSecret(sessionCookie.value)) {
      return true;
    }
  } catch (err) {
    // If called outside server action / route handler context
  }

  return false;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;