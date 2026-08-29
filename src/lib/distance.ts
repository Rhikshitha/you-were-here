import { LocationCoordinates } from '../types/app';

/**
 * Calculates the great-circle distance between two geographic points using the Haversine formula.
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371000; // Earth's mean radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if user location is physically within a Place's unlock radius.
 */
export function isUserAtPlace(
  userLocation: LocationCoordinates,
  placeLocation: LocationCoordinates,
  radiusMeters: number
): boolean {
  const distance = calculateHaversineDistance(userLocation, placeLocation);
  return distance <= radiusMeters;
}

/**
 * Formats a numeric distance in meters into human-readable string (e.g. "45m", "1.2km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
