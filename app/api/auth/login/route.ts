import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminSecret, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secretKey } = body;

    if (!isValidAdminSecret(secretKey)) {
      return NextResponse.json(
        { error: 'Invalid admin secret key' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: secretKey.trim(),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
