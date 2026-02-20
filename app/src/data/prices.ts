export interface PriceData {
  date: string;
  variety: string;
  grade: '특' | '상' | '보통';
  market: string;
  price: number; // 원/kg
  unit: string;
  change: number; // % change from yesterday
}

export interface PriceTrend {
  variety: string;
  data: { date: string; price: number }[];
}

// 주요 사과 품종별 기준 가격 (원/kg, 특등급)
const basePrices: Record<string, number> = {
  '후지': 5500,
  '홍로': 6000,
  '감홍': 8000,
  '아리수': 5000,
  '쓰가루': 4500,
  '시나노골드': 6500,
  '루비에스': 7000,
  '양광': 4000,
};

const gradeMultiplier: Record<string, number> = {
  '특': 1.0,
  '상': 0.8,
  '보통': 0.6,
};

const markets = [
  '서울 가락시장',
  '대구 북부시장',
  '부산 엄궁시장',
  '대전 오정시장',
  '광주 각화시장',
  '안동 경매장',
];

export function getMockPrices(): PriceData[] {
  const today = new Date().toISOString().split('T')[0];
  const prices: PriceData[] = [];

  for (const [variety, basePrice] of Object.entries(basePrices)) {
    for (const grade of ['특', '상', '보통'] as const) {
      for (const market of markets.slice(0, 3)) { // 주요 3개 시장만
        const variance = (Math.random() - 0.5) * 0.2; // ±10%
        const price = Math.round(basePrice * gradeMultiplier[grade] * (1 + variance) / 100) * 100;
        const change = Math.round((Math.random() - 0.45) * 10 * 10) / 10; // slightly positive bias

        prices.push({
          date: today,
          variety,
          grade,
          market,
          price,
          unit: '원/kg',
          change,
        });
      }
    }
  }

  return prices;
}

export function getMockPriceTrend(variety: string, days: number = 30): PriceTrend {
  const basePrice = basePrices[variety] || 5000;
  const data: { date: string; price: number }[] = [];
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyChange = (Math.random() - 0.48) * 300; // slight upward bias
    currentPrice = Math.max(currentPrice + dailyChange, basePrice * 0.5);
    currentPrice = Math.min(currentPrice, basePrice * 1.5);

    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice / 100) * 100,
    });
  }

  return { variety, data };
}

export function getVarietyNames(): string[] {
  return Object.keys(basePrices);
}
