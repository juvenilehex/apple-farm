'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import type { DesignConfig, DesignResult } from '@/app/design/page';

const CACHE_KEY = 'farm-design-cache';

interface FarmMapProps {
  config: DesignConfig;
  onResult: (result: DesignResult) => void;
  onPolygonChange: (coords: [number, number][] | null) => void;
}

type MapMode = 'idle' | 'drawing' | 'road' | 'parcel';

interface DesignCache {
  polygonCoords: [number, number][] | null;
  roads: [number, number][][];
  mapCenter: [number, number];
  mapZoom: number;
}

function saveCache(data: DesignCache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function loadCache(): DesignCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function FarmMap({ config, onResult, onPolygonChange }: FarmMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Polygon drawing
  const drawPointsRef = useRef<[number, number][]>([]);
  const drawMarkersRef = useRef<L.CircleMarker[]>([]);
  const drawLineRef = useRef<L.Polyline | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const polygonCoordsRef = useRef<[number, number][] | null>(null);

  // Roads
  const roadsRef = useRef<[number, number][][]>([]);
  const roadLayersRef = useRef<L.LayerGroup | null>(null);
  const currentRoadPointsRef = useRef<[number, number][]>([]);
  const currentRoadMarkersRef = useRef<L.CircleMarker[]>([]);
  const currentRoadLineRef = useRef<L.Polyline | null>(null);

  // Trees
  const treeLayersRef = useRef<L.LayerGroup | null>(null);

  // Setback layer
  const setbackLayerRef = useRef<L.Polygon | null>(null);

  // Satellite layer
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // Event cleanup
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

  // State
  const [mode, setMode] = useState<MapMode>('idle');
  const [pointCount, setPointCount] = useState(0);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [roadCount, setRoadCount] = useState(0);
  const [roadPointCount, setRoadPointCount] = useState(0);
  const [satOpacity, setSatOpacity] = useState(0);
  const [showSatControl, setShowSatControl] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parcel loading
  const [parcelLoading, setParcelLoading] = useState(false);

  // Track init done to prevent double-restore
  const initDone = useRef(false);

  // ─── Persist state to sessionStorage ───
  const persistState = useCallback(() => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    saveCache({
      polygonCoords: polygonCoordsRef.current,
      roads: roadsRef.current,
      mapCenter: [center.lat, center.lng],
      mapZoom: mapRef.current.getZoom(),
    });
  }, []);

  // ─── Initialize map ───
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const cached = loadCache();
    const center: [number, number] = cached?.mapCenter || [36.5, 128.7];
    const zoom = cached?.mapZoom || 13;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      doubleClickZoom: false,
    });

    // Base map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Satellite layer (ESRI World Imagery - free)
    satelliteLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; ESRI', maxZoom: 19, opacity: 0 }
    ).addTo(map);

    treeLayersRef.current = L.layerGroup().addTo(map);
    roadLayersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Save position on move
    map.on('moveend', () => persistState());

    // Restore cached design
    if (cached?.polygonCoords && cached.polygonCoords.length >= 3 && !initDone.current) {
      initDone.current = true;
      const coords = cached.polygonCoords;
      drawPointsRef.current = coords;
      polygonCoordsRef.current = coords;
      onPolygonChange(coords);

      polygonLayerRef.current = L.polygon(coords, {
        color: '#dc2626', fillColor: '#fecaca', fillOpacity: 0.2, weight: 2,
      }).addTo(map);

      if (cached.roads && cached.roads.length > 0) {
        roadsRef.current = cached.roads;
        setRoadCount(cached.roads.length);
      }

      setHasPolygon(true);
      // designOrchard will be triggered by the hasPolygon useEffect
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Update satellite opacity ───
  useEffect(() => {
    if (satelliteLayerRef.current) {
      satelliteLayerRef.current.setOpacity(satOpacity / 100);
    }
  }, [satOpacity]);

  // ─── Address search (Nominatim - free, no API key) ───
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=kr`,
        { headers: { 'Accept-Language': 'ko' } }
      );
      const data = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAddress(value), 400);
  };

  const goToLocation = (lat: string, lon: string, name: string) => {
    if (!mapRef.current) return;
    mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 17);
    setSearchQuery(name.split(',')[0]);
    setShowResults(false);
  };

  // ─── Cleanup active listeners ───
  const cleanupListeners = useCallback(() => {
    if (!mapRef.current) return;
    if (clickHandlerRef.current) {
      mapRef.current.off('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }
    mapRef.current.getContainer().style.cursor = '';
  }, []);

  // ─── Polygon drawing ───
  const startDrawing = () => {
    if (!mapRef.current) return;
    cleanupListeners();
    clearAll();
    setMode('drawing');
    setPointCount(0);
    drawPointsRef.current = [];
    mapRef.current.getContainer().style.cursor = 'crosshair';

    const handler = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      drawPointsRef.current.push([lat, lng]);
      setPointCount(drawPointsRef.current.length);

      const marker = L.circleMarker([lat, lng], {
        radius: 6, color: '#dc2626', fillColor: '#ef4444', fillOpacity: 1, weight: 2,
      }).addTo(mapRef.current!);
      drawMarkersRef.current.push(marker);

      if (drawLineRef.current) drawLineRef.current.remove();
      if (drawPointsRef.current.length > 1) {
        drawLineRef.current = L.polyline(
          [...drawPointsRef.current, drawPointsRef.current[0]],
          { color: '#dc2626', weight: 2, dashArray: '5,5' }
        ).addTo(mapRef.current!);
      }
    };
    clickHandlerRef.current = handler;
    mapRef.current.on('click', handler);
  };

  const undoLastPoint = () => {
    if (drawPointsRef.current.length === 0) return;
    drawPointsRef.current.pop();
    setPointCount(drawPointsRef.current.length);

    const m = drawMarkersRef.current.pop();
    if (m) m.remove();

    if (drawLineRef.current) drawLineRef.current.remove();
    drawLineRef.current = null;
    if (drawPointsRef.current.length > 1) {
      drawLineRef.current = L.polyline(
        [...drawPointsRef.current, drawPointsRef.current[0]],
        { color: '#dc2626', weight: 2, dashArray: '5,5' }
      ).addTo(mapRef.current!);
    }
  };

  const finishPolygon = () => {
    if (!mapRef.current || drawPointsRef.current.length < 3) return;
    cleanupListeners();

    drawMarkersRef.current.forEach((m) => m.remove());
    drawMarkersRef.current = [];
    if (drawLineRef.current) { drawLineRef.current.remove(); drawLineRef.current = null; }

    const coords = drawPointsRef.current;
    polygonCoordsRef.current = coords;
    onPolygonChange(coords);

    polygonLayerRef.current = L.polygon(coords, {
      color: '#dc2626', fillColor: '#fecaca', fillOpacity: 0.2, weight: 2,
    }).addTo(mapRef.current);

    setMode('idle');
    setHasPolygon(true);
    mapRef.current.fitBounds(polygonLayerRef.current.getBounds(), { padding: [50, 50] });
    persistState();
    setTimeout(() => designOrchard(), 100);
  };

  const cancelDrawing = () => {
    cleanupListeners();
    drawMarkersRef.current.forEach((m) => m.remove());
    drawMarkersRef.current = [];
    if (drawLineRef.current) { drawLineRef.current.remove(); drawLineRef.current = null; }
    drawPointsRef.current = [];
    setPointCount(0);
    setMode('idle');
  };

  // ─── Road drawing ───
  const startRoadDrawing = () => {
    if (!mapRef.current || !hasPolygon) return;
    cleanupListeners();
    setMode('road');
    setRoadPointCount(0);
    currentRoadPointsRef.current = [];
    mapRef.current.getContainer().style.cursor = 'crosshair';

    const handler = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      currentRoadPointsRef.current.push([lat, lng]);
      setRoadPointCount(currentRoadPointsRef.current.length);

      const marker = L.circleMarker([lat, lng], {
        radius: 5, color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 1, weight: 2,
      }).addTo(mapRef.current!);
      currentRoadMarkersRef.current.push(marker);

      if (currentRoadLineRef.current) currentRoadLineRef.current.remove();
      if (currentRoadPointsRef.current.length > 1) {
        currentRoadLineRef.current = L.polyline(currentRoadPointsRef.current, {
          color: '#f59e0b', weight: 3, dashArray: '8,4',
        }).addTo(mapRef.current!);
      }
    };
    clickHandlerRef.current = handler;
    mapRef.current.on('click', handler);
  };

  const finishRoad = () => {
    if (!mapRef.current || currentRoadPointsRef.current.length < 2) return;
    cleanupListeners();

    currentRoadMarkersRef.current.forEach((m) => m.remove());
    currentRoadMarkersRef.current = [];
    if (currentRoadLineRef.current) { currentRoadLineRef.current.remove(); currentRoadLineRef.current = null; }

    roadsRef.current.push([...currentRoadPointsRef.current]);
    currentRoadPointsRef.current = [];
    setRoadPointCount(0);
    setRoadCount(roadsRef.current.length);
    setMode('idle');

    renderRoads();
    persistState();
    setTimeout(() => designOrchard(), 100);
  };

  const cancelRoad = () => {
    cleanupListeners();
    currentRoadMarkersRef.current.forEach((m) => m.remove());
    currentRoadMarkersRef.current = [];
    if (currentRoadLineRef.current) { currentRoadLineRef.current.remove(); currentRoadLineRef.current = null; }
    currentRoadPointsRef.current = [];
    setRoadPointCount(0);
    setMode('idle');
  };

  const deleteLastRoad = () => {
    if (roadsRef.current.length === 0) return;
    roadsRef.current.pop();
    setRoadCount(roadsRef.current.length);
    renderRoads();
    persistState();
    setTimeout(() => designOrchard(), 100);
  };

  const renderRoads = useCallback(() => {
    if (!roadLayersRef.current) return;
    roadLayersRef.current.clearLayers();

    roadsRef.current.forEach((road) => {
      L.polyline(road, { color: '#78716c', weight: 1, opacity: 0.6 })
        .addTo(roadLayersRef.current!);

      try {
        const line = turf.lineString(road.map(([lat, lng]) => [lng, lat]));
        const buffer = turf.buffer(line, (config.roadWidth / 2) / 1000, { units: 'kilometers' });
        if (buffer) {
          const ring = buffer.geometry.coordinates[0] as [number, number][];
          const coords = ring.map((pos) => [pos[1], pos[0]] as [number, number]);
          L.polygon(coords, {
            color: '#78716c', fillColor: '#a8a29e', fillOpacity: 0.3, weight: 1, dashArray: '3,3',
          }).addTo(roadLayersRef.current!);
        }
      } catch { /* ignore */ }
    });
  }, [config.roadWidth]);

  // ─── Design orchard ───
  const designOrchard = useCallback(() => {
    if (!polygonCoordsRef.current || polygonCoordsRef.current.length < 3) return;
    if (!treeLayersRef.current) return;
    treeLayersRef.current.clearLayers();

    const coords = polygonCoordsRef.current;
    const ring = [...coords, coords[0]];
    const farmPolygon = turf.polygon([ring.map(([lat, lng]) => [lng, lat])]);
    const areaM2 = Math.round(turf.area(farmPolygon));
    const areaPyeong = Math.round(areaM2 * 0.3025);

    // Setback buffer: use config distance or fallback 2m
    const setbackKm = config.setbackEnabled
      ? -(config.setbackDistance / 1000)
      : -0.002;

    let plantArea: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    try {
      const buffered = turf.buffer(farmPolygon, setbackKm, { units: 'kilometers' });
      plantArea = (buffered || farmPolygon) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    } catch {
      plantArea = farmPolygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    }

    // Render setback zone visualization
    if (setbackLayerRef.current) {
      setbackLayerRef.current.remove();
      setbackLayerRef.current = null;
    }
    if (config.setbackEnabled && mapRef.current) {
      try {
        const outerRing = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
        const innerBuf = turf.buffer(farmPolygon, setbackKm, { units: 'kilometers' });
        if (innerBuf) {
          const innerCoords = (innerBuf.geometry as GeoJSON.Polygon).coordinates[0] as [number, number][];
          const outerLatLng = outerRing.map(([lng, lat]) => [lat, lng] as [number, number]);
          const innerLatLng = innerCoords.map(([lng, lat]) => [lat, lng] as [number, number]);
          setbackLayerRef.current = L.polygon(
            [outerLatLng, innerLatLng],
            { color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.15, weight: 1, dashArray: '4,4' }
          ).addTo(mapRef.current);
        }
      } catch { /* ignore setback viz errors */ }
    }

    let roadAreaM2 = 0;
    roadsRef.current.forEach((road) => {
      try {
        const line = turf.lineString(road.map(([lat, lng]) => [lng, lat]));
        const roadBuffer = turf.buffer(line, (config.roadWidth / 2) / 1000, { units: 'kilometers' });
        if (roadBuffer) {
          roadAreaM2 += Math.round(turf.area(roadBuffer));
          const diff = turf.difference(turf.featureCollection([
            plantArea as GeoJSON.Feature<GeoJSON.Polygon>,
            roadBuffer as GeoJSON.Feature<GeoJSON.Polygon>,
          ]));
          if (diff) plantArea = diff as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
        }
      } catch { /* ignore */ }
    });

    const plantableAreaM2 = Math.max(0, Math.round(turf.area(plantArea)));

    const centroid = turf.centroid(farmPolygon);
    const [cLng, cLat] = centroid.geometry.coordinates;
    const bbox = turf.bbox(farmPolygon);
    const diagonal = turf.distance(
      turf.point([bbox[0], bbox[1]]),
      turf.point([bbox[2], bbox[3]]),
      { units: 'meters' }
    );

    const angleRad = ((config.rowAngle || 0) * Math.PI) / 180;
    const maxSteps = Math.ceil(diagonal / Math.min(config.rowSpacing, config.treeSpacing)) + 2;
    const cosLat = Math.cos(cLat * Math.PI / 180);

    const points: GeoJSON.Feature<GeoJSON.Point>[] = [];
    for (let r = -maxSteps; r <= maxSteps; r++) {
      for (let t = -maxSteps; t <= maxSteps; t++) {
        const localX = r * config.rowSpacing;
        const localY = t * config.treeSpacing;
        const rotX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
        const rotY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);
        const lng = cLng + rotX / (111320 * cosLat);
        const lat = cLat + rotY / 111320;
        points.push(turf.point([lng, lat]));
      }
    }

    const fc = turf.featureCollection(points);
    const treesInFarm = turf.pointsWithinPolygon(fc, plantArea);
    const treeCount = treesInFarm.features.length;

    treesInFarm.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      L.circleMarker([lat, lng], {
        radius: 3, color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.8, weight: 1,
      }).addTo(treeLayersRef.current!);
    });

    renderRoads();

    onResult({
      treeCount,
      areaM2,
      areaPyeong,
      roadAreaM2,
      plantableAreaM2,
      estimatedYield: `${Math.round(treeCount * 30)}~${Math.round(treeCount * 45)}kg (성목 기준)`,
      treesGeoJson: treesInFarm,
    });
  }, [config, onResult, renderRoads]);

  useEffect(() => {
    if (hasPolygon) {
      designOrchard();
    }
  }, [config, hasPolygon, designOrchard]);

  // ─── Load parcel from backend ───
  const loadParcel = useCallback(async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setParcelLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/land/parcel?lat=${center.lat}&lng=${center.lng}`);
      if (!res.ok) throw new Error('parcel fetch failed');
      const data = await res.json();
      if (!data.coordinates || data.coordinates.length < 3) throw new Error('no coordinates');

      // Clear existing polygon
      if (polygonLayerRef.current) { polygonLayerRef.current.remove(); polygonLayerRef.current = null; }
      treeLayersRef.current?.clearLayers();
      roadLayersRef.current?.clearLayers();
      if (setbackLayerRef.current) { setbackLayerRef.current.remove(); setbackLayerRef.current = null; }
      roadsRef.current = [];
      setRoadCount(0);

      // coordinates come as [[lng, lat], ...] from GeoJSON
      const coords: [number, number][] = data.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );

      drawPointsRef.current = coords;
      polygonCoordsRef.current = coords;
      onPolygonChange(coords);

      polygonLayerRef.current = L.polygon(coords, {
        color: '#dc2626', fillColor: '#fecaca', fillOpacity: 0.2, weight: 2,
      }).addTo(mapRef.current!);

      setHasPolygon(true);
      mapRef.current!.fitBounds(polygonLayerRef.current.getBounds(), { padding: [50, 50] });
      persistState();
      setTimeout(() => designOrchard(), 100);
    } catch {
      alert('지번 경계를 불러올 수 없습니다. 지도 중앙을 농지 위로 이동해 주세요.');
    } finally {
      setParcelLoading(false);
    }
  }, [onPolygonChange, persistState, designOrchard]);

  // ─── Clear all ───
  const clearAll = () => {
    if (!mapRef.current) return;
    cleanupListeners();

    if (polygonLayerRef.current) { polygonLayerRef.current.remove(); polygonLayerRef.current = null; }
    if (setbackLayerRef.current) { setbackLayerRef.current.remove(); setbackLayerRef.current = null; }
    treeLayersRef.current?.clearLayers();
    roadLayersRef.current?.clearLayers();

    drawMarkersRef.current.forEach((m) => m.remove());
    drawMarkersRef.current = [];
    if (drawLineRef.current) { drawLineRef.current.remove(); drawLineRef.current = null; }

    drawPointsRef.current = [];
    polygonCoordsRef.current = null;
    roadsRef.current = [];
    currentRoadPointsRef.current = [];
    onPolygonChange(null);
    setHasPolygon(false);
    setRoadCount(0);
    setRoadPointCount(0);
    setPointCount(0);
    setMode('idle');
    sessionStorage.removeItem(CACHE_KEY);
  };

  // ─── Demo ───
  const loadDemo = () => {
    if (!mapRef.current) return;
    clearAll();

    const demoCoords: [number, number][] = [
      [36.5700, 128.7300], [36.5705, 128.7320],
      [36.5695, 128.7325], [36.5690, 128.7310], [36.5692, 128.7295],
    ];
    const demoRoad: [number, number][] = [
      [36.5698, 128.7298], [36.5697, 128.7318],
    ];

    drawPointsRef.current = demoCoords;
    polygonCoordsRef.current = demoCoords;
    onPolygonChange(demoCoords);

    polygonLayerRef.current = L.polygon(demoCoords, {
      color: '#dc2626', fillColor: '#fecaca', fillOpacity: 0.2, weight: 2,
    }).addTo(mapRef.current);

    roadsRef.current = [demoRoad];
    setRoadCount(1);
    setHasPolygon(true);
    mapRef.current.fitBounds(polygonLayerRef.current.getBounds(), { padding: [50, 50] });
    persistState();
    setTimeout(() => designOrchard(), 100);
  };

  // ─── Render ───
  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Search bar */}
      <div className="absolute top-3 left-3 z-[1000] w-[260px]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="주소 검색 (예: 안동시 풍산읍)"
            className="w-full rounded-lg border px-3 py-2.5 pr-8 text-sm shadow-lg outline-none"
            style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        {showResults && searchResults.length > 0 && (
          <div className="mt-1 rounded-lg border shadow-xl overflow-hidden"
            style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
            {searchResults.map((r, i) => (
              <button key={i}
                onClick={() => goToLocation(r.lat, r.lon, r.display_name)}
                className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--surface-tertiary)] border-b last:border-b-0"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                {r.display_name.split(',').slice(0, 3).join(', ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Satellite toggle */}
      <div className="absolute top-3 left-[280px] z-[1000]">
        <button
          onClick={() => setShowSatControl(!showSatControl)}
          className="rounded-lg border px-3 py-2.5 text-xs font-medium shadow-lg transition-colors"
          style={{
            background: satOpacity > 0 ? 'var(--accent)' : 'var(--surface-primary)',
            color: satOpacity > 0 ? 'white' : 'var(--text-secondary)',
            borderColor: 'var(--border-default)',
          }}>
          위성
        </button>
        {showSatControl && (
          <div className="mt-1 rounded-lg border shadow-xl p-3 w-[160px]"
            style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>위성사진</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{satOpacity}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={satOpacity}
              onChange={(e) => setSatOpacity(parseInt(e.target.value))}
              className="w-full" style={{ accentColor: 'var(--accent)' }} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>지도</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>위성</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {mode === 'idle' && (
          <>
            <button onClick={startDrawing}
              className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm text-white transition-colors"
              style={{ background: '#dc2626' }}>
              밭 그리기
            </button>
            <button onClick={loadParcel} disabled={parcelLoading}
              className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm text-white transition-colors disabled:opacity-50"
              style={{ background: '#2563eb' }}>
              {parcelLoading ? '불러오는 중...' : '지번 불러오기'}
            </button>
            {hasPolygon && (
              <button onClick={startRoadDrawing}
                className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm text-white transition-colors"
                style={{ background: '#f59e0b' }}>
                도로 그리기
              </button>
            )}
            <button onClick={loadDemo}
              className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm text-white transition-colors"
              style={{ background: '#6366f1' }}>
              예시 보기
            </button>
            {hasPolygon && (
              <>
                {roadCount > 0 && (
                  <button onClick={deleteLastRoad}
                    className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm transition-colors"
                    style={{ background: 'var(--surface-primary)', color: 'var(--status-warning)', border: '1px solid var(--border-default)' }}>
                    마지막 도로 삭제
                  </button>
                )}
                <button onClick={clearAll}
                  className="px-4 py-2.5 rounded-lg shadow-lg font-semibold text-sm transition-colors"
                  style={{ background: 'var(--surface-primary)', color: 'var(--status-danger)', border: '1px solid var(--border-default)' }}>
                  전체 초기화
                </button>
              </>
            )}
          </>
        )}

        {mode === 'drawing' && (
          <div className="rounded-xl shadow-lg p-4 text-sm space-y-3" style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)' }}>
            <p className="font-bold" style={{ color: '#dc2626' }}>밭 경계 그리기</p>
            <p style={{ color: 'var(--text-secondary)' }}>지도를 클릭하여 꼭짓점을 추가하세요</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                style={{ background: pointCount >= 3 ? '#16a34a' : '#dc2626' }}>
                {pointCount}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/ 최소 3점</span>
            </div>
            <div className="flex gap-2">
              <button onClick={undoLastPoint} disabled={pointCount === 0}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{ background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                되돌리기
              </button>
              <button onClick={cancelDrawing}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'var(--surface-tertiary)', color: 'var(--status-danger)' }}>
                취소
              </button>
            </div>
            <button onClick={finishPolygon} disabled={pointCount < 3}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-30"
              style={{ background: '#16a34a' }}>
              완료
            </button>
          </div>
        )}

        {mode === 'road' && (
          <div className="rounded-xl shadow-lg p-4 text-sm space-y-3" style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)' }}>
            <p className="font-bold" style={{ color: '#f59e0b' }}>도로 그리기</p>
            <p style={{ color: 'var(--text-secondary)' }}>도로 경로를 클릭하세요</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                style={{ background: roadPointCount >= 2 ? '#16a34a' : '#f59e0b' }}>
                {roadPointCount}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/ 최소 2점 · 폭 {config.roadWidth}m</span>
            </div>
            <div className="flex gap-2">
              <button onClick={cancelRoad}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'var(--surface-tertiary)', color: 'var(--status-danger)' }}>
                취소
              </button>
              <button onClick={finishRoad} disabled={roadPointCount < 2}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-30"
                style={{ background: '#f59e0b' }}>
                완료
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {hasPolygon && mode === 'idle' && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl shadow-lg p-3 text-xs space-y-1.5"
          style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#fecaca', border: '1.5px solid #dc2626' }} />
            <span style={{ color: 'var(--text-secondary)' }}>밭 경계</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#22c55e', border: '1.5px solid #16a34a' }} />
            <span style={{ color: 'var(--text-secondary)' }}>나무 ({config.rowAngle}°)</span>
          </div>
          {config.setbackEnabled && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: '#fbbf24', border: '1.5px dashed #f59e0b' }} />
              <span style={{ color: 'var(--text-secondary)' }}>이격 ({config.setbackDistance}m)</span>
            </div>
          )}
          {roadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: '#a8a29e', border: '1.5px solid #78716c' }} />
              <span style={{ color: 'var(--text-secondary)' }}>도로 ×{roadCount} ({config.roadWidth}m)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
