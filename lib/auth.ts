import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const HARDCODED_EMAIL = 'karim@noas.uk';
const HARDCODED_PASSWORD = '12345678';

export async function login(email: string, password: string) {
  // Check hardcoded credentials
  if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
    // Create JWT token valid for 3 days
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('3d')
      .sign(secret);

    // Set cookie
    (await cookies()).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 3, // 3 days
      path: '/',
    });

    return { success: true };
  }

  return { success: false, error: 'Invalid credentials' };
}

export async function logout() {
  (await cookies()).delete('auth-token');
}

export async function getSession() {
  const token = (await cookies()).get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function changePassword(newPassword: string) {
  // In a real app, you'd update the database
  // For now, we'll just return success since password is hardcoded
  // You can manually update the constant in this file
  return { 
    success: false, 
    error: 'Password is hardcoded. Update HARDCODED_PASSWORD in lib/auth.ts to change it.' 
  };
}
