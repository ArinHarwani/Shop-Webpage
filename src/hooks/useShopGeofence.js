import { useState, useEffect, useCallback, useRef } from 'react';
import * as DS from '../services/DataService';

// Default Shop Coordinates: Fever Profile Fashion, Sardarpura, Jodhpur
const DEFAULT_SHOP_LAT = 26.279653;
const DEFAULT_SHOP_LNG = 73.010635;
const DEFAULT_RADIUS_METERS = 150; // 150m allowed radius
const RECHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Haversine distance in meters between two lat/lng coordinates
 */
export function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Custom hook to monitor customer in-store geolocation
 * States: 'checking' | 'allowed' | 'denied' | 'out_of_range' | 'unsupported' | 'error'
 */
export function useShopGeofence() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [distance, setDistance] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [coords, setCoords] = useState(null);
  const [settings, setSettings] = useState(() => DS.getSettings());

  const intervalRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Listen to admin settings updates
  useEffect(() => {
    const unsub = DS.subscribe('settings', () => {
      setSettings(DS.getSettings());
    });
    return unsub;
  }, []);

  // Determine current active shop configuration
  const shopLat = Number(settings?.shopLat ?? import.meta.env.VITE_SHOP_LAT ?? DEFAULT_SHOP_LAT);
  const shopLng = Number(settings?.shopLng ?? import.meta.env.VITE_SHOP_LNG ?? DEFAULT_SHOP_LNG);
  const radiusMeters = Number(settings?.geofenceRadius ?? import.meta.env.VITE_SHOP_RADIUS ?? DEFAULT_RADIUS_METERS);

  const checkLocation = useCallback((isExplicit = false) => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    // If this is a manual retry or initial check, show the loading state.
    // For background periodic/visibility checks, don't flash the screen if already allowed,
    // but update immediately if the check fails.
    if (isExplicit || statusRef.current !== 'allowed') {
      setStatus('checking');
    }

    // Support testing/QA override via URL params: ?mock_lat=...&mock_lng=... or ?mock_status=...
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const mockStatus = urlParams.get('mock_status');
      const mockLat = urlParams.get('mock_lat');
      const mockLng = urlParams.get('mock_lng');

      if (mockStatus) {
        setStatus(mockStatus);
        setLastChecked(new Date());
        return;
      }

      if (mockLat && mockLng) {
        const lat = parseFloat(mockLat);
        const lng = parseFloat(mockLng);
        const dist = distanceInMeters(lat, lng, shopLat, shopLng);
        setDistance(dist);
        setAccuracy(5);
        setCoords({ latitude: lat, longitude: lng });
        setLastChecked(new Date());
        if (dist <= radiusMeters) {
          setStatus('allowed');
        } else {
          setStatus('out_of_range');
        }
        return;
      }
    } catch {
      // ignore URL parsing errors in non-browser environments
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: posAccuracy } = position.coords;
        const dist = distanceInMeters(latitude, longitude, shopLat, shopLng);

        setDistance(dist);
        setAccuracy(posAccuracy);
        setCoords({ latitude, longitude });
        setLastChecked(new Date());

        if (dist <= radiusMeters) {
          setStatus('allowed');
        } else {
          setStatus('out_of_range');
        }
      },
      (err) => {
        setLastChecked(new Date());
        // err.code: 1 = permission denied, 2 = position unavailable, 3 = timeout
        if (err.code === 1) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always request a fresh GPS reading, never cached
      }
    );
  }, [shopLat, shopLng, radiusMeters]);

  useEffect(() => {
    // Initial location check on mount
    checkLocation(true);

    // Periodic re-check every 10 minutes
    intervalRef.current = setInterval(() => {
      checkLocation(false);
    }, RECHECK_INTERVAL_MS);

    // Re-check whenever the tab regains focus/visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkLocation(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkLocation]);

  return {
    status,
    lastChecked,
    distance,
    accuracy,
    coords,
    shopLat,
    shopLng,
    radiusMeters,
    recheck: () => checkLocation(true),
  };
}
