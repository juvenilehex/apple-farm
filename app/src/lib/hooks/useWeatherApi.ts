'use client';

import { useState, useEffect, useRef } from 'react';
import { getMockWeather, getMockForecast, type WeatherData, type WeatherForecast } from '@/data/weather';
import { fetchCurrentWeather, fetchForecast, type WeatherCurrent, type ForecastItem } from '@/lib/api';
import type { AppleRegion } from '@/data/regions';

/** 백엔드 응답(snake_case) → 프론트엔드 WeatherData로 변환 */
function mapWeatherCurrent(res: WeatherCurrent): WeatherData {
  return {
    regionId: res.region_id,
    date: res.date,
    temperature: res.temperature,
    humidity: res.humidity,
    rainfall: res.rainfall,
    wind: res.wind,
    sky: res.sky as WeatherData['sky'],
    alerts: res.alerts,
  };
}

/** 백엔드 예보 응답 → 프론트엔드 WeatherForecast로 변환 */
function mapForecast(regionId: string, items: ForecastItem[]): WeatherForecast {
  return {
    regionId,
    forecasts: items.map((f) => ({
      date: f.date,
      tempMin: f.temp_min,
      tempMax: f.temp_max,
      sky: f.sky as WeatherForecast['forecasts'][0]['sky'],
      rainfall: f.rainfall,
      pop: f.pop,
    })),
  };
}

export function useWeatherApi(region: AppleRegion) {
  const [weather, setWeather] = useState<WeatherData>(() => getMockWeather(region.id));
  const [forecast, setForecast] = useState<WeatherForecast>(() => getMockForecast(region.id));
  const [source, setSource] = useState<'backend' | 'mock'>('mock');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function load() {
      const { nx, ny } = region.weatherGrid;
      setLoading(true);

      try {
        const [weatherRes, forecastRes] = await Promise.all([
          fetchCurrentWeather(region.id, nx, ny),
          fetchForecast(region.id, nx, ny),
        ]);
        if (!cancelled) {
          setWeather(mapWeatherCurrent(weatherRes));
          setForecast(mapForecast(region.id, forecastRes.forecasts));
          setSource('backend');
        }
      } catch {
        if (!cancelled) {
          setWeather(getMockWeather(region.id));
          setForecast(getMockForecast(region.id));
          setSource('mock');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [region.id, region.weatherGrid]);

  return { weather, forecast, source, loading };
}
