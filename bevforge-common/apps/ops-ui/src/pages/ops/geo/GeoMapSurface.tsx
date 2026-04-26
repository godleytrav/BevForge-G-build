import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Package, Truck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeoPoint } from './map-data';
import { trackGoogleMapScriptLoad } from './google-api-usage';

export type GeoMarkerType = 'lead' | 'prospect' | 'customer' | 'delivery-stop' | 'truck';
export type GeoLineStatus = 'planned' | 'active' | 'completed';

export interface GeoMarker {
  id: string;
  type: GeoMarkerType;
  title: string;
  subtitle?: string;
  status?: string;
  point: GeoPoint;
}

export interface GeoPolyline {
  id: string;
  points: GeoPoint[];
  status: GeoLineStatus;
}

export interface GeoMapClickPoint extends GeoPoint {
  placeId?: string;
}

interface GeoMapSurfaceProps {
  markers: GeoMarker[];
  polylines?: GeoPolyline[];
  selectedMarkerId?: string;
  onMarkerSelect?: (markerId: string) => void;
  onMapClick?: (point: GeoMapClickPoint) => void;
  className?: string;
  heightClassName?: string;
}

interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  latSpan: number;
  lngSpan: number;
}

interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: Record<string, unknown>) => any;
      Marker: new (options: Record<string, unknown>) => any;
      Polyline: new (options: Record<string, unknown>) => any;
      LatLngBounds: new () => {
        extend: (point: { lat: number; lng: number }) => void;
      };
      SymbolPath: {
        CIRCLE: unknown;
      };
      event: {
        clearInstanceListeners: (instance: any) => void;
      };
    };
  };
}

const GOOGLE_MAPS_SCRIPT_ID = 'bevforge-ops-google-maps-sdk';
const DEFAULT_CENTER: GeoPoint = { lat: 38.5816, lng: -121.4944 };

let googleMapsLoadPromise: Promise<void> | null = null;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const markerToneByType: Record<GeoMarkerType, string> = {
  lead: 'bg-amber-500/90 border-amber-200 text-amber-50',
  prospect: 'bg-violet-500/90 border-violet-200 text-violet-50',
  customer: 'bg-cyan-500/90 border-cyan-100 text-cyan-50',
  'delivery-stop': 'bg-emerald-500/90 border-emerald-100 text-emerald-50',
  truck: 'bg-sky-500/90 border-sky-100 text-sky-50',
};

const lineToneByStatus: Record<GeoLineStatus, string> = {
  planned: '#f59e0b',
  active: '#22d3ee',
  completed: '#22c55e',
};

const markerColorByType: Record<GeoMarkerType, string> = {
  lead: '#f59e0b',
  prospect: '#8b5cf6',
  customer: '#06b6d4',
  'delivery-stop': '#22c55e',
  truck: '#38bdf8',
};

const markerIconByType: Record<GeoMarkerType, typeof MapPin> = {
  lead: Users,
  prospect: MapPin,
  customer: Users,
  'delivery-stop': Package,
  truck: Truck,
};

const buildBounds = (markers: GeoMarker[], polylines: GeoPolyline[]): GeoBounds => {
  const points: GeoPoint[] = [
    ...markers.map((marker) => marker.point),
    ...polylines.flatMap((line) => line.points),
  ];

  if (points.length === 0) {
    return {
      minLat: 38.2,
      maxLat: 39.2,
      minLng: -121.9,
      maxLng: -120.6,
      latSpan: 1.0,
      lngSpan: 1.3,
    };
  }

  const minLatRaw = Math.min(...points.map((point) => point.lat));
  const maxLatRaw = Math.max(...points.map((point) => point.lat));
  const minLngRaw = Math.min(...points.map((point) => point.lng));
  const maxLngRaw = Math.max(...points.map((point) => point.lng));

  const latSpan = Math.max(0.08, maxLatRaw - minLatRaw);
  const lngSpan = Math.max(0.08, maxLngRaw - minLngRaw);
  const latPadding = latSpan * 0.15;
  const lngPadding = lngSpan * 0.15;

  const minLat = minLatRaw - latPadding;
  const maxLat = maxLatRaw + latPadding;
  const minLng = minLngRaw - lngPadding;
  const maxLng = maxLngRaw + lngPadding;

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    latSpan: maxLat - minLat,
    lngSpan: maxLng - minLng,
  };
};

const getGoogleMapsApiKey = (): string => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
};

const loadGoogleMapsApi = async (apiKey: string): Promise<void> => {
  const googleWindow = window as GoogleMapsWindow;
  if (googleWindow.google?.maps) {
    return;
  }

  if (googleMapsLoadPromise) {
    await googleMapsLoadPromise;
    return;
  }

  googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    // Guardrail: load only core Maps JS here. Do not include `libraries=places` by default.
    // Places Search/Details should be invoked only via explicit user actions in CRM flows.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    trackGoogleMapScriptLoad('geo-map-surface-script-inserted');

    script.onload = () => {
      const loaded = (window as GoogleMapsWindow).google?.maps;
      if (loaded) {
        resolve();
      } else {
        reject(new Error('Google Maps loaded without maps object.'));
      }
    };

    script.onerror = () => reject(new Error('Unable to load Google Maps JavaScript API.'));
    document.head.appendChild(script);
  });

  await googleMapsLoadPromise;
};

export function GeoMapSurface({
  markers,
  polylines = [],
  selectedMarkerId,
  onMarkerSelect,
  onMapClick,
  className,
  heightClassName = 'h-[500px]',
}: GeoMapSurfaceProps) {
  const googleMapContainerRef = useRef<HTMLDivElement | null>(null);
  const fallbackContainerRef = useRef<HTMLDivElement | null>(null);

  const googleMapRef = useRef<any>(null);
  const googleMarkersRef = useRef<any[]>([]);
  const googlePolylinesRef = useRef<any[]>([]);
  const googleMapClickListenerRef = useRef<any>(null);

  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);

  const googleApiKey = getGoogleMapsApiKey();
  const useGoogleMaps = googleApiKey.length > 0;

  const fallbackBounds = useMemo(() => buildBounds(markers, polylines), [markers, polylines]);

  const projectFallbackPoint = (point: GeoPoint): { x: number; y: number } => {
    const x = ((point.lng - fallbackBounds.minLng) / fallbackBounds.lngSpan) * 100;
    const y = ((fallbackBounds.maxLat - point.lat) / fallbackBounds.latSpan) * 100;
    return {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    };
  };

  useEffect(() => {
    if (!useGoogleMaps) {
      setGoogleReady(false);
      setGoogleLoadError(null);
      return;
    }

    let cancelled = false;

    loadGoogleMapsApi(googleApiKey)
      .then(() => {
        if (!cancelled) {
          setGoogleReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGoogleLoadError(error instanceof Error ? error.message : 'Failed to initialize Google Maps.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleApiKey, useGoogleMaps]);

  useEffect(() => {
    if (!useGoogleMaps || !googleReady || !googleMapContainerRef.current) {
      return;
    }

    const googleMaps = (window as GoogleMapsWindow).google?.maps;
    if (!googleMaps) {
      return;
    }

    if (!googleMapRef.current) {
      googleMapRef.current = new googleMaps.Map(googleMapContainerRef.current, {
        center: markers[0]?.point ?? DEFAULT_CENTER,
        zoom: markers.length > 0 ? 10 : 8,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    const map = googleMapRef.current;

    if (googleMapClickListenerRef.current) {
      googleMaps.event.clearInstanceListeners(googleMapClickListenerRef.current);
    }

    if (onMapClick) {
      googleMapClickListenerRef.current = map.addListener('click', (event: any) => {
        const lat = event?.latLng?.lat?.();
        const lng = event?.latLng?.lng?.();
        const placeId = typeof event?.placeId === 'string' ? event.placeId : undefined;

        // When a Google POI is clicked, preserve place id for explicit CRM import.
        if (placeId && typeof event?.stop === 'function') {
          event.stop();
        }

        if (typeof lat === 'number' && typeof lng === 'number') {
          onMapClick({ lat, lng, placeId });
        }
      });
    }

    return () => {
      if (googleMapClickListenerRef.current) {
        googleMaps.event.clearInstanceListeners(googleMapClickListenerRef.current);
      }
    };
  }, [useGoogleMaps, googleReady, markers, onMapClick]);

  useEffect(() => {
    if (!useGoogleMaps || !googleReady || !googleMapRef.current) {
      return;
    }

    const googleMaps = (window as GoogleMapsWindow).google?.maps;
    if (!googleMaps) {
      return;
    }

    const map = googleMapRef.current;

    googleMarkersRef.current.forEach((marker) => marker.setMap(null));
    googlePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    googleMarkersRef.current = [];
    googlePolylinesRef.current = [];

    const bounds = new googleMaps.LatLngBounds();
    let hasBounds = false;

    polylines.forEach((line) => {
      if (line.points.length < 2) {
        return;
      }

      const path = line.points.map((point) => ({ lat: point.lat, lng: point.lng }));
      const polyline = new googleMaps.Polyline({
        map,
        path,
        geodesic: true,
        strokeColor: lineToneByStatus[line.status],
        strokeOpacity: 0.95,
        strokeWeight: line.status === 'planned' ? 2 : 3,
        icons:
          line.status === 'planned'
            ? [
                {
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                  offset: '0',
                  repeat: '16px',
                },
              ]
            : undefined,
      });

      googlePolylinesRef.current.push(polyline);
      line.points.forEach((point) => {
        bounds.extend({ lat: point.lat, lng: point.lng });
        hasBounds = true;
      });
    });

    markers.forEach((marker) => {
      const isSelected = marker.id === selectedMarkerId;
      const instance = new googleMaps.Marker({
        map,
        position: marker.point,
        title: marker.subtitle ? `${marker.title} - ${marker.subtitle}` : marker.title,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: isSelected ? 8 : 6.5,
          fillColor: markerColorByType[marker.type],
          fillOpacity: 1,
          strokeColor: isSelected ? '#f8fafc' : '#0f172a',
          strokeOpacity: 1,
          strokeWeight: isSelected ? 2 : 1,
        },
      });

      instance.addListener('click', () => {
        onMarkerSelect?.(marker.id);
      });

      googleMarkersRef.current.push(instance);
      bounds.extend({ lat: marker.point.lat, lng: marker.point.lng });
      hasBounds = true;
    });

    if (hasBounds) {
      map.fitBounds(bounds, 48);
    } else {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(8);
    }
  }, [markers, polylines, selectedMarkerId, onMarkerSelect, useGoogleMaps, googleReady]);

  useEffect(() => {
    return () => {
      googleMarkersRef.current.forEach((marker) => marker.setMap(null));
      googlePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      googleMarkersRef.current = [];
      googlePolylinesRef.current = [];
      googleMapRef.current = null;
    };
  }, []);

  const handleFallbackMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick || !fallbackContainerRef.current) {
      return;
    }

    const rect = fallbackContainerRef.current.getBoundingClientRect();
    const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    onMapClick({
      lat: fallbackBounds.maxLat - yRatio * fallbackBounds.latSpan,
      lng: fallbackBounds.minLng + xRatio * fallbackBounds.lngSpan,
    });
  };

  const renderFallbackSurface = () => {
    return (
      <div
        ref={fallbackContainerRef}
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-cyan-700/45',
          'bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.18),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.24),transparent_55%),linear-gradient(145deg,rgba(2,6,23,0.96),rgba(8,47,73,0.8))]',
          heightClassName,
          className
        )}
        onClick={handleFallbackMapClick}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.08)_1px,transparent_1px)] bg-[size:38px_38px]" />

        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
          {polylines.map((line) => {
            if (line.points.length < 2) {
              return null;
            }
            const points = line.points.map((point) => {
              const projected = projectFallbackPoint(point);
              return `${projected.x},${projected.y}`;
            });
            return (
              <polyline
                key={line.id}
                points={points.join(' ')}
                fill="none"
                stroke={lineToneByStatus[line.status]}
                strokeWidth={0.65}
                strokeDasharray={line.status === 'planned' ? '2.2 2.2' : undefined}
                opacity={0.95}
              />
            );
          })}
        </svg>

        {markers.map((marker) => {
          const projected = projectFallbackPoint(marker.point);
          const isSelected = selectedMarkerId === marker.id;
          const Icon = markerIconByType[marker.type];

          return (
            <button
              type="button"
              key={marker.id}
              onClick={(event) => {
                event.stopPropagation();
                onMarkerSelect?.(marker.id);
              }}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border p-1.5 shadow-sm transition',
                markerToneByType[marker.type],
                isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
              )}
              style={{ left: `${projected.x}%`, top: `${projected.y}%` }}
              aria-label={marker.title}
              title={marker.subtitle ? `${marker.title} - ${marker.subtitle}` : marker.title}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}

        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-cyan-700/60 bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-cyan-100/90">
          {googleLoadError
            ? 'Google Maps unavailable - fallback map'
            : 'Fallback map - add VITE_GOOGLE_MAPS_API_KEY'}
        </div>
      </div>
    );
  };

  if (!useGoogleMaps || googleLoadError) {
    return renderFallbackSurface();
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-cyan-700/45 bg-slate-950/70',
        heightClassName,
        className
      )}
    >
      <div ref={googleMapContainerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-cyan-700/60 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-cyan-100/90">
        Google Maps
      </div>
    </div>
  );
}
