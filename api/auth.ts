export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const expectedPassword = process.env.APP_PASSWORD || 'Abcd@1234';

  if (!password || password !== expectedPassword) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieFlags = [
    `auth_token=${encodeURIComponent(expectedPassword)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${60 * 60 * 24 * 7}`,
    isProduction ? 'Secure' : ''
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieFlags);
  return res.status(200).json({ success: true });
}
