export interface WeatherData {
  regionId: string;
  date: string;
  temperature: { min: number; max: number; current: number };
  humidity: number;
  rainfall: number;
  wind: number;
  sky: 'clear' | 'cloudy' | 'overcast' | 'rain' | 'snow';
  alerts: string[];
}

export interface WeatherForecast {
  regionId: string;
  forecasts: {
    date: string;
    tempMin: number;
    tempMax: number;
    sky: 'clear' | 'cloudy' | 'overcast' | 'rain' | 'snow';
    rainfall: number;
    pop: number;
  }[];
}

export interface MonthlyClimate {
  month: number;
  avgTemp: number;
  avgTempMin: number;
  avgTempMax: number;
  avgRainfall: number;
  rainyDays: number;
  sunshine: number;
}

export interface YearComparison {
  metric: string;
  thisYear: number;
  lastYear: number;
  average: number; // 30-year normal (평년)
  unit: string;
}

export interface WeeklySummary {
  weekLabel: string;
  avgTemp: number;
  totalRainfall: number;
  avgHumidity: number;
  dominantSky: string;
  farmingTip: string;
}

export const skyLabels: Record<string, string> = {
  clear: '맑음', cloudy: '구름많음', overcast: '흐림', rain: '비', snow: '눈',
};

export const skyEmoji: Record<string, string> = {
  clear: '☀️', cloudy: '⛅', overcast: '☁️', rain: '🌧️', snow: '❄️',
};

// 30-year normal climate data per region (평년값)
const normalClimate: Record<string, MonthlyClimate[]> = {
  default: [
    { month: 1, avgTemp: -3.5, avgTempMin: -8.5, avgTempMax: 2.0, avgRainfall: 23, rainyDays: 7, sunshine: 170 },
    { month: 2, avgTemp: -1.0, avgTempMin: -6.5, avgTempMax: 5.0, avgRainfall: 28, rainyDays: 6, sunshine: 175 },
    { month: 3, avgTemp: 5.5, avgTempMin: 0.0, avgTempMax: 12.0, avgRainfall: 42, rainyDays: 8, sunshine: 200 },
    { month: 4, avgTemp: 12.5, avgTempMin: 5.5, avgTempMax: 19.5, avgRainfall: 65, rainyDays: 9, sunshine: 215 },
    { month: 5, avgTemp: 18.0, avgTempMin: 11.0, avgTempMax: 25.0, avgRainfall: 85, rainyDays: 9, sunshine: 230 },
    { month: 6, avgTemp: 22.5, avgTempMin: 16.5, avgTempMax: 28.5, avgRainfall: 145, rainyDays: 11, sunshine: 190 },
    { month: 7, avgTemp: 25.5, avgTempMin: 21.0, avgTempMax: 30.5, avgRainfall: 290, rainyDays: 16, sunshine: 140 },
    { month: 8, avgTemp: 25.5, avgTempMin: 21.0, avgTempMax: 31.0, avgRainfall: 260, rainyDays: 14, sunshine: 170 },
    { month: 9, avgTemp: 20.0, avgTempMin: 14.5, avgTempMax: 26.0, avgRainfall: 130, rainyDays: 10, sunshine: 190 },
    { month: 10, avgTemp: 13.0, avgTempMin: 6.5, avgTempMax: 20.5, avgRainfall: 45, rainyDays: 6, sunshine: 205 },
    { month: 11, avgTemp: 5.5, avgTempMin: 0.0, avgTempMax: 12.0, avgRainfall: 38, rainyDays: 8, sunshine: 170 },
    { month: 12, avgTemp: -1.5, avgTempMin: -7.0, avgTempMax: 3.5, avgRainfall: 22, rainyDays: 7, sunshine: 165 },
  ],
};

export function getNormalClimate(regionId: string): MonthlyClimate[] {
  return normalClimate[regionId] || normalClimate['default'];
}

export function getMockWeather(regionId: string): WeatherData {
  const now = new Date();
  const month = now.getMonth() + 1;
  const climate = getNormalClimate(regionId);
  const monthClimate = climate[month - 1];

  const variance = Math.random() * 4 - 2;
  const tempMin = Math.round(monthClimate.avgTempMin + variance);
  const tempMax = Math.round(monthClimate.avgTempMax + variance);
  const current = Math.round((tempMin + tempMax) / 2 + (Math.random() - 0.5) * 4);

  const skies: WeatherData['sky'][] = ['clear', 'cloudy', 'overcast', 'rain'];
  const skyIdx = month >= 6 && month <= 8 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3);

  return {
    regionId,
    date: now.toISOString().split('T')[0],
    temperature: { min: tempMin, max: tempMax, current },
    humidity: Math.round(50 + Math.random() * 30),
    rainfall: skies[skyIdx] === 'rain' ? Math.round(Math.random() * 30) : 0,
    wind: Math.round(1 + Math.random() * 5),
    sky: skies[skyIdx],
    alerts: getWeatherAlerts(month, { min: tempMin, max: tempMax }),
  };
}

function getWeatherAlerts(month: number, temp: { min: number; max: number }): string[] {
  const alerts: string[] = [];
  if (month === 4 && temp.min < 0) alerts.push('서리 주의: 개화기 냉해 위험. 연소법·살수법 준비.');
  if (month >= 6 && month <= 7) alerts.push('장마철: 탄저병·겹무늬썩음병 방제 강화 필요.');
  if (month >= 7 && month <= 9 && temp.max > 33) alerts.push('폭염 주의: 과실 일소 위험. 관수 실시.');
  if (month >= 9 && month <= 10) alerts.push('태풍 시즌: 낙과 방지 점검. 방풍망·지지대 확인.');
  if ((month >= 11 || month <= 2) && temp.min < -15) alerts.push('한파 경보: 동해 방지 긴급 조치 필요.');
  return alerts;
}

export function getMockForecast(regionId: string): WeatherForecast {
  const now = new Date();
  const month = now.getMonth() + 1;
  const climate = getNormalClimate(regionId);
  const monthClimate = climate[month - 1];
  const forecasts = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const v = Math.random() * 6 - 3;
    const tempMin = Math.round(monthClimate.avgTempMin + v);
    const tempMax = Math.round(monthClimate.avgTempMax + v);
    const skies: WeatherForecast['forecasts'][0]['sky'][] = ['clear', 'cloudy', 'overcast', 'rain'];
    const skyIdx = Math.floor(Math.random() * 4);
    const pop = skies[skyIdx] === 'rain' ? 60 + Math.round(Math.random() * 30) : Math.round(Math.random() * 30);

    forecasts.push({
      date: date.toISOString().split('T')[0],
      tempMin, tempMax,
      sky: skies[skyIdx],
      rainfall: skies[skyIdx] === 'rain' ? Math.round(Math.random() * 20) : 0,
      pop,
    });
  }

  return { regionId, forecasts };
}

export function getYearComparison(regionId: string): YearComparison[] {
  const month = new Date().getMonth() + 1;
  const climate = getNormalClimate(regionId);
  const normal = climate[month - 1];
  const thisYearVariance = (Math.random() - 0.3) * 3; // slight warming bias
  const lastYearVariance = (Math.random() - 0.5) * 2;

  return [
    {
      metric: '평균 기온',
      thisYear: Math.round((normal.avgTemp + thisYearVariance) * 10) / 10,
      lastYear: Math.round((normal.avgTemp + lastYearVariance) * 10) / 10,
      average: normal.avgTemp,
      unit: '°C',
    },
    {
      metric: '최저 기온',
      thisYear: Math.round((normal.avgTempMin + thisYearVariance) * 10) / 10,
      lastYear: Math.round((normal.avgTempMin + lastYearVariance) * 10) / 10,
      average: normal.avgTempMin,
      unit: '°C',
    },
    {
      metric: '최고 기온',
      thisYear: Math.round((normal.avgTempMax + thisYearVariance) * 10) / 10,
      lastYear: Math.round((normal.avgTempMax + lastYearVariance) * 10) / 10,
      average: normal.avgTempMax,
      unit: '°C',
    },
    {
      metric: '강수량',
      thisYear: Math.round(normal.avgRainfall * (0.7 + Math.random() * 0.6)),
      lastYear: Math.round(normal.avgRainfall * (0.7 + Math.random() * 0.6)),
      average: normal.avgRainfall,
      unit: 'mm',
    },
    {
      metric: '강수일수',
      thisYear: Math.round(normal.rainyDays * (0.7 + Math.random() * 0.6)),
      lastYear: Math.round(normal.rainyDays * (0.7 + Math.random() * 0.6)),
      average: normal.rainyDays,
      unit: '일',
    },
    {
      metric: '일조시간',
      thisYear: Math.round(normal.sunshine * (0.8 + Math.random() * 0.4)),
      lastYear: Math.round(normal.sunshine * (0.8 + Math.random() * 0.4)),
      average: normal.sunshine,
      unit: '시간',
    },
  ];
}

export function getWeeklySummaries(regionId: string): WeeklySummary[] {
  const month = new Date().getMonth() + 1;
  const climate = getNormalClimate(regionId);
  const normal = climate[month - 1];

  const tips: Record<number, string[]> = {
    1: ['전정 작업에 적합한 날씨를 선택하세요.', '동해 방지 점검일로 활용하세요.'],
    2: ['기계유유제 살포 적기를 확인하세요.', '발아 전 전정 마무리에 집중하세요.'],
    3: ['기비 시용 후 토양수분 확인하세요.', '발아 상태를 매일 관찰하세요.'],
    4: ['개화 시기를 정확히 파악하세요.', '서리 예보에 특히 주의하세요.'],
    5: ['적과 작업 진행 상황을 점검하세요.', '방제 간격 10~14일을 지키세요.'],
    6: ['장마 전 마지막 방제를 완료하세요.', '배수로 사전 점검이 필요합니다.'],
    7: ['비 그친 직후 방제하세요.', '병해 발생 여부를 매일 확인하세요.'],
    8: ['조생종 수확 적기를 놓치지 마세요.', '반사필름 설치를 서두르세요.'],
    9: ['추석 출하 일정을 확정하세요.', '착색 관리에 집중하세요.'],
    10: ['수확 인력을 사전 확보하세요.', '저장고 온습도를 매일 점검하세요.'],
    11: ['서리 전 수확 완료가 목표입니다.', 'CA저장 조건을 정확히 설정하세요.'],
    12: ['설 출하 물량을 확정하세요.', '내년 계획을 수립하세요.'],
  };

  const weekTips = tips[month] || ['기상 변화에 주의하세요.'];

  return [
    { weekLabel: '이번 주', avgTemp: Math.round((normal.avgTemp + (Math.random() - 0.3) * 3) * 10) / 10, totalRainfall: Math.round(normal.avgRainfall / 4 * (0.5 + Math.random())), avgHumidity: Math.round(55 + Math.random() * 25), dominantSky: Math.random() > 0.4 ? '맑음' : '흐림', farmingTip: weekTips[0] },
    { weekLabel: '지난 주', avgTemp: Math.round((normal.avgTemp + (Math.random() - 0.5) * 3) * 10) / 10, totalRainfall: Math.round(normal.avgRainfall / 4 * (0.5 + Math.random())), avgHumidity: Math.round(55 + Math.random() * 25), dominantSky: Math.random() > 0.5 ? '맑음' : '비', farmingTip: weekTips[1] || weekTips[0] },
    { weekLabel: '2주 전', avgTemp: Math.round((normal.avgTemp + (Math.random() - 0.5) * 3) * 10) / 10, totalRainfall: Math.round(normal.avgRainfall / 4 * (0.5 + Math.random())), avgHumidity: Math.round(55 + Math.random() * 25), dominantSky: Math.random() > 0.5 ? '구름많음' : '맑음', farmingTip: '' },
    { weekLabel: '3주 전', avgTemp: Math.round((normal.avgTemp + (Math.random() - 0.5) * 3) * 10) / 10, totalRainfall: Math.round(normal.avgRainfall / 4 * (0.5 + Math.random())), avgHumidity: Math.round(55 + Math.random() * 25), dominantSky: Math.random() > 0.3 ? '맑음' : '흐림', farmingTip: '' },
  ];
}

export function getConditionalTips(weather: WeatherData, month: number): string[] {
  const tips: string[] = [];

  // Temperature-based tips
  if (weather.temperature.max > 33) {
    tips.push('고온(33°C+): 과실 일소 위험. 오전 중 관수하고 차광막 설치를 검토하세요.');
  }
  if (weather.temperature.max > 30 && month >= 7 && month <= 8) {
    tips.push('고온기: 수확 2주 전부터 관수를 중단하면 당도가 향상됩니다.');
  }
  if (weather.temperature.min < -2 && month === 4) {
    tips.push('냉해 위험: 개화기 영하 기온은 착과에 치명적. 연소법·살수법을 즉시 가동하세요.');
  }
  if (weather.temperature.min < -15) {
    tips.push('극한 한파: 주간부·주지 동해 위험. 보온재 확인하고 젊은 나무 보호 조치.');
  }
  if (weather.temperature.max - weather.temperature.min > 15 && month >= 9 && month <= 10) {
    tips.push(`일교차 ${weather.temperature.max - weather.temperature.min}°C: 착색에 아주 유리한 조건! 반사필름 효과가 극대화됩니다.`);
  }

  // Humidity-based tips
  if (weather.humidity > 80) {
    tips.push('고습도(80%+): 탄저병·겹무늬썩음병 감염 위험 높음. 통풍 관리와 방제를 강화하세요.');
  }
  if (weather.humidity < 40 && month >= 3 && month <= 5) {
    tips.push('저습도: 건조한 날씨는 진딧물 발생에 유리합니다. 해충 관찰을 강화하세요.');
  }

  // Rainfall-based tips
  if (weather.sky === 'rain') {
    tips.push('비 오는 날: 방제 작업 불가. 비 그친 후 12시간 이내 방제를 실시하세요.');
    if (month >= 6 && month <= 8) {
      tips.push('장마·집중호우기: 과수원 배수로 막힘 여부를 점검하세요.');
    }
  }
  if (weather.sky === 'clear') {
    tips.push('맑은 날: 방제·전정·적과 등 야외 작업에 최적 조건입니다.');
    if (month >= 8 && month <= 10) {
      tips.push('맑은 날 + 착색기: 반사필름 효과가 가장 좋은 날입니다.');
    }
  }

  // Wind-based tips
  if (weather.wind > 7) {
    tips.push(`강풍(${weather.wind}m/s): 약제 살포 자제. 방풍망과 지지대를 점검하세요.`);
  }

  // Seasonal general tips
  if (tips.length === 0) {
    const seasonalDefaults: Record<number, string> = {
      1: '전정에 집중할 시기. 맑고 기온이 0°C 이상인 날을 골라 작업하세요.',
      2: '발아 전까지 전정을 마무리하세요. 기계유유제 살포 적기 확인.',
      3: '기비 시용 적기입니다. 토양검정 결과를 확인하세요.',
      4: '개화 상황을 매일 관찰하세요. 인공수분 준비.',
      5: '적과가 대과 생산의 핵심. 과감하게 솎아내세요.',
      6: '장마 전 방제를 빈틈없이 완료하세요.',
      7: '비 그치면 즉시 방제. 과수원 순찰을 강화하세요.',
      8: '조생종 적기 수확, 중만생종 착색 관리.',
      9: '추석 출하 관리와 후지 착색에 집중.',
      10: '수확기입니다. 품질 관리와 저장 준비를 병행하세요.',
      11: '서리 전 수확 완료. 저장 관리 시작.',
      12: '설 출하 준비. 내년 계획 수립.',
    };
    tips.push(seasonalDefaults[month] || '기상 변화를 주시하세요.');
  }

  return tips;
}
