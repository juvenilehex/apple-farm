'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Region {
  name: string;
  lat: number;
  lng: number;
  // suitability score per decade: 2020, 2030, 2040, 2050, 2060, 2070
  scores: number[];
}

// Korean apple-growing regions with climate change suitability projection
const regions: Region[] = [
  { name: '대구', lat: 35.87, lng: 128.6, scores: [90, 75, 55, 35, 20, 10] },
  { name: '경산', lat: 35.82, lng: 128.74, scores: [88, 72, 52, 32, 18, 8] },
  { name: '영천', lat: 35.97, lng: 128.94, scores: [85, 70, 50, 30, 15, 8] },
  { name: '청송', lat: 36.44, lng: 129.06, scores: [92, 88, 78, 65, 50, 38] },
  { name: '영주', lat: 36.81, lng: 128.74, scores: [88, 85, 78, 68, 55, 42] },
  { name: '안동', lat: 36.57, lng: 128.73, scores: [90, 82, 70, 55, 40, 28] },
  { name: '충주', lat: 36.99, lng: 127.93, scores: [85, 88, 85, 75, 60, 48] },
  { name: '제천', lat: 37.13, lng: 128.19, scores: [80, 85, 85, 78, 65, 52] },
  { name: '예산', lat: 36.68, lng: 126.85, scores: [78, 82, 78, 65, 50, 38] },
  { name: '거창', lat: 35.69, lng: 127.91, scores: [82, 78, 65, 50, 35, 22] },
  { name: '장수', lat: 35.65, lng: 127.52, scores: [75, 78, 72, 60, 45, 32] },
  { name: '원주', lat: 37.34, lng: 127.95, scores: [60, 72, 82, 85, 78, 65] },
  { name: '춘천', lat: 37.88, lng: 127.73, scores: [40, 55, 70, 82, 85, 80] },
  { name: '양구', lat: 38.11, lng: 127.99, scores: [25, 42, 60, 75, 85, 82] },
  { name: '철원', lat: 38.15, lng: 127.31, scores: [20, 38, 55, 72, 82, 80] },
  { name: '포천', lat: 37.89, lng: 127.2, scores: [45, 58, 72, 82, 82, 75] },
  { name: '의성', lat: 36.35, lng: 128.69, scores: [90, 85, 72, 58, 42, 28] },
  { name: '문경', lat: 36.59, lng: 128.19, scores: [85, 85, 80, 70, 55, 42] },
  { name: '홍천', lat: 37.69, lng: 127.89, scores: [50, 62, 75, 83, 82, 72] },
];

function getColor(score: number): string {
  if (score >= 80) return '#16a34a';      // green - optimal
  if (score >= 60) return '#65a30d';      // lime - good
  if (score >= 40) return '#eab308';      // yellow - marginal
  if (score >= 20) return '#f97316';      // orange - poor
  return '#ef4444';                        // red - unsuitable
}

function getLabel(score: number): string {
  if (score >= 80) return '최적';
  if (score >= 60) return '양호';
  if (score >= 40) return '한계';
  if (score >= 20) return '부적합';
  return '재배 불가';
}

export default function ClimateMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [yearIndex, setYearIndex] = useState(0);
  const decades = [2020, 2030, 2040, 2050, 2060, 2070];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [36.5, 128.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 12,
      minZoom: 6,
    }).addTo(map);

    // Add region markers
    regions.forEach((region) => {
      const score = region.scores[0];
      const marker = L.circleMarker([region.lat, region.lng], {
        radius: 14,
        fillColor: getColor(score),
        fillOpacity: 0.8,
        color: '#fff',
        weight: 2,
      }).addTo(map);

      marker.bindTooltip(
        `<strong>${region.name}</strong><br/>적합도: ${score}점 (${getLabel(score)})`,
        { direction: 'top', offset: [0, -10] }
      );

      markersRef.current.push(marker);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Update markers when year changes
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const region = regions[i];
      const score = region.scores[yearIndex];
      marker.setStyle({
        fillColor: getColor(score),
      });
      marker.setTooltipContent(
        `<strong>${region.name}</strong><br/>적합도: ${score}점 (${getLabel(score)})`
      );
    });
  }, [yearIndex]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="rounded-lg overflow-hidden" style={{ height: '420px', border: '1px solid var(--border-default)' }} />

      {/* Year Slider */}
      <div className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
            {decades[yearIndex]}년대
          </span>
          <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            연도를 이동하여 변화를 확인하세요
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={decades.length - 1}
          value={yearIndex}
          onChange={(e) => setYearIndex(parseInt(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--accent)' }}
        />
        <div className="flex justify-between mt-1">
          {decades.map((d) => (
            <span key={d} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: '최적 (80+)', color: '#16a34a' },
          { label: '양호 (60-79)', color: '#65a30d' },
          { label: '한계 (40-59)', color: '#eab308' },
          { label: '부적합 (20-39)', color: '#f97316' },
          { label: '재배 불가 (<20)', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: item.color }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Key Insight */}
      <div className="rounded-lg p-3" style={{ background: 'var(--status-warning-bg)', border: '1px solid rgba(168, 136, 96, 0.3)' }}>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          {yearIndex <= 1
            ? '현재 대구·경북 지역이 주산지이나, 기온 상승으로 적합도가 점차 감소합니다.'
            : yearIndex <= 3
            ? '충북·강원 남부 지역이 새로운 최적지로 부상하고 있습니다. 대구·경북은 고온 피해가 우려됩니다.'
            : '강원도가 사과 주산지로 전환됩니다. 기존 남부 지역은 아열대 과수로 전환이 필요합니다.'}
        </p>
      </div>
    </div>
  );
}
