import React, { useEffect, useRef, useState } from 'react';
import { PlaceSummary, LocationCoordinates } from '../../types/app';
import { COLORS } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';

export interface PlacesMapProps {
  places: PlaceSummary[];
  userLocation?: LocationCoordinates | null;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceSummary) => void;
  style?: any;
}

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let leafletPromise: Promise<any> | null = null;

/**
 * Load Leaflet from the CDN once per page. react-native-maps has no usable web
 * build, so the web map is plain Leaflet against the same OSM tiles the native
 * map uses.
 */
function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).L));
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

export const PlacesMap: React.FC<PlacesMapProps> = ({
  places,
  userLocation,
  selectedPlaceId,
  onSelectPlace,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<any>(null);
  // Centre on the user only once, so later fixes don't yank the map away from
  // wherever they have panned to.
  const didCentreRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  // Assigning mapRef doesn't re-render, so effects that need the map would
  // never re-run after Leaflet finishes loading. This flag re-triggers them.
  const [ready, setReady] = useState(false);

  // `onSelectPlace` is read through a ref so marker handlers never go stale
  // without tearing down and rebuilding every marker.
  const selectRef = useRef(onSelectPlace);
  selectRef.current = onSelectPlace;

  // Create the map once. Effects don't run during static rendering, so the
  // export-time prerender never touches `document`.
  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !L || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, { attributionControl: true }).setView(
          [
            userLocation?.latitude ?? APP_CONFIG.DEFAULT_MAP_REGION.latitude,
            userLocation?.longitude ?? APP_CONFIG.DEFAULT_MAP_REGION.longitude,
          ],
          13
        );

        L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
        mapRef.current = map;
        setError(null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the map.');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
        userMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The map is built before the first GPS fix lands, so centre on the user as
  // soon as one arrives.
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    const map = mapRef.current;
    if (!L || !map || !userLocation) return;

    if (!didCentreRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], 15);
      didCentreRef.current = true;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      userMarkerRef.current = L.circleMarker(
        [userLocation.latitude, userLocation.longitude],
        { radius: 7, color: '#ffffff', weight: 2, fillColor: COLORS.primary, fillOpacity: 1 }
      )
        .addTo(map)
        .bindPopup('You are here');
    }
  }, [userLocation, ready]);

  // Sync markers whenever the filtered place list changes.
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    const map = mapRef.current;
    if (!L || !map) return;

    for (const marker of Object.values(markersRef.current)) {
      map.removeLayer(marker);
    }
    markersRef.current = {};

    for (const place of places) {
      const marker = L.marker([place.latitude, place.longitude])
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br/>${place.category}`);
      marker.on('click', () => selectRef.current?.(place));
      markersRef.current[place.id] = marker;
    }
  }, [places, ready]);

  // Recentre when a place is picked from the list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceId) return;

    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place) return;

    map.setView([place.latitude, place.longitude], 16);
    markersRef.current[selectedPlaceId]?.openPopup();
  }, [selectedPlaceId, places, ready]);

  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceElevated,
        ...flat,
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textMuted,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
