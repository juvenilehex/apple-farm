import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variety = searchParams.get('variety') || '';
  const grade = searchParams.get('grade') || '';

  try {
    const params = new URLSearchParams();
    if (variety) params.set('variety', variety);
    if (grade) params.set('grade', grade);
    const res = await fetch(
      `${BACKEND_URL}/api/price/daily?${params}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json({ source: 'backend', data });
  } catch {
    // Fallback: demo data
    const today = new Date().toISOString().slice(0, 10);
    return NextResponse.json({
      source: 'demo',
      data: [
        { date: today, variety: '후지', grade: '특', market: '가락시장', price: 8500, unit: '원/kg', change: 1.2 },
        { date: today, variety: '후지', grade: '상', market: '가락시장', price: 6800, unit: '원/kg', change: -0.5 },
        { date: today, variety: '홍로', grade: '특', market: '가락시장', price: 9200, unit: '원/kg', change: 2.1 },
        { date: today, variety: '감홍', grade: '특', market: '가락시장', price: 12000, unit: '원/kg', change: 0.8 },
      ],
    });
  }
}
