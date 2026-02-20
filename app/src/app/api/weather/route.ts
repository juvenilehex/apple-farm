import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get('region_id') || 'cheongsong';
  const nx = searchParams.get('nx') || '89';
  const ny = searchParams.get('ny') || '91';

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/weather/current?region_id=${regionId}&nx=${nx}&ny=${ny}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json({ source: 'backend', ...data });
  } catch {
    // Fallback: demo data
    const now = new Date();
    return NextResponse.json({
      source: 'demo',
      region_id: regionId,
      date: now.toISOString().slice(0, 10).replace(/-/g, ''),
      temperature: { min: 2, max: 12, current: 7.5 },
      humidity: 55,
      rainfall: 0,
      wind: 2.3,
      sky: 'clear',
      alerts: [],
    });
  }
}
