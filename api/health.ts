export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
