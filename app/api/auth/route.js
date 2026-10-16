import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;
    const expectedPassword = process.env.APP_PASSWORD;

    if (!expectedPassword) {
      console.error('APP_PASSWORD is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server authentication configuration missing' },
        { status: 500 }
      );
    }

    // Verify submitted password against process.env.APP_PASSWORD
    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Await cookies() in Next.js 15+ App Router, with backwards compatibility
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Set HTTP-only, secure cookie named auth_token with maxAge of 7 days
    cookieStore.set('auth_token', expectedPassword, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 7, // 7 days (604800 seconds)
      path: '/',
      sameSite: 'strict',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling /api/auth request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
