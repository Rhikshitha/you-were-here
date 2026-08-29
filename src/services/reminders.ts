import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { calculateHaversineDistance } from '../lib/distance';
import { LocationCoordinates } from '../types/app';
import {
  GEOFENCE_TASK,
  MAX_REGIONS,
  NOTIFICATION_CHANNEL,
  RememberedPlace,
  fetchRememberedPlaces,
  notifyForPlace,
  remindersSupported,
} from '../lib/memoryGeofence';

export interface ReminderStatus {
  supported: boolean;
  active: boolean;
  /** Places currently being monitored. */
  watching: number;
  /** Set when we could not start, explaining which permission is missing. */
  error: string | null;
}

export const remindersService = {
  /**
   * Ask for everything the reminders need. Background ("Always") location is
   * the one users must grant from Settings on iOS — foreground alone is not
   * enough for geofencing to fire while the app is closed.
   */
  async requestPermissions(): Promise<{ granted: boolean; error: string | null }> {
    if (!remindersSupported) {
      return { granted: false, error: 'Location reminders only work on iOS and Android.' };
    }

    // Android 13+ won't show the notification prompt without a channel first.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
        name: 'Memory reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const notif = await Notifications.requestPermissionsAsync();
    if (!notif.granted) {
      return { granted: false, error: 'Notifications are turned off, so reminders cannot appear.' };
    }

    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      return { granted: false, error: 'Location access is needed to notice when you pass by.' };
    }

    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      return {
        granted: false,
        error:
          'Reminders need "Always" location access to work while the app is closed. Enable it in Settings.',
      };
    }

    return { granted: true, error: null };
  },

  /**
   * Register a geofence around every place the user has left a memory at.
   *
   * iOS caps monitoring at 20 regions, so when the user has more places than
   * that we keep the ones nearest to them and drop the rest. The caller is told
   * how many are actually being watched so this is never silently misleading.
   */
  async start(
    userId: string,
    userLocation?: LocationCoordinates | null
  ): Promise<ReminderStatus> {
    if (!remindersSupported) {
      return {
        supported: false,
        active: false,
        watching: 0,
        error: 'Location reminders only work on iOS and Android.',
      };
    }

    const places = await fetchRememberedPlaces(userId);
    if (places.length === 0) {
      await this.stop();
      return { supported: true, active: false, watching: 0, error: null };
    }

    const selected = selectClosest(places, userLocation, MAX_REGIONS);

    try {
      await Location.startGeofencingAsync(
        GEOFENCE_TASK,
        selected.map((place) => ({
          identifier: place.placeId,
          latitude: place.latitude,
          longitude: place.longitude,
          radius: place.radiusMeters,
          notifyOnEnter: true,
          notifyOnExit: false,
        }))
      );
    } catch (err: any) {
      return {
        supported: true,
        active: false,
        watching: 0,
        error: err?.message || 'Could not start location reminders.',
      };
    }

    return { supported: true, active: true, watching: selected.length, error: null };
  },

  async stop(): Promise<void> {
    if (!remindersSupported) return;
    try {
      if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
      }
    } catch {
      // Nothing registered, or already torn down.
    }
  },

  async isActive(): Promise<boolean> {
    if (!remindersSupported) return false;
    try {
      return await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    } catch {
      return false;
    }
  },

  /**
   * Foreground equivalent of the geofence, for the case the OS geofence has not
   * fired yet (or the user is beyond the region cap). Safe to call on every
   * location update — notifyForPlace applies the same cooldown.
   */
  async checkOnLocation(userId: string, userLocation: LocationCoordinates): Promise<void> {
    if (!remindersSupported) return;

    const places = await fetchRememberedPlaces(userId);
    for (const place of places) {
      const distance = calculateHaversineDistance(userLocation, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      if (distance <= place.radiusMeters) {
        await notifyForPlace(place);
      }
    }
  },
};

/**
 * Keep the `limit` places nearest the user. Without a location fix we cannot
 * rank by distance, so fall back to the natural order (newest memory first).
 */
function selectClosest(
  places: RememberedPlace[],
  userLocation: LocationCoordinates | null | undefined,
  limit: number
): RememberedPlace[] {
  if (places.length <= limit) return places;
  if (!userLocation) return places.slice(0, limit);

  return [...places]
    .sort(
      (a, b) =>
        calculateHaversineDistance(userLocation, { latitude: a.latitude, longitude: a.longitude }) -
        calculateHaversineDistance(userLocation, { latitude: b.latitude, longitude: b.longitude })
    )
    .slice(0, limit);
}
