import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from './supabase';

export const GEOFENCE_TASK = 'you-were-here-memory-geofence';
export const NOTIFICATION_CHANNEL = 'memory-reminders';

/** iOS monitors at most 20 regions at once; Android allows 100. */
export const MAX_REGIONS = Platform.OS === 'ios' ? 20 : 100;

/** Don't re-notify for the same place more than once in this window. */
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

const COOLDOWN_KEY_PREFIX = 'memory-reminder-last:';

/**
 * Geofencing and background tasks are native-only. Guarding here keeps the web
 * bundle from touching TaskManager, which has no web implementation.
 */
export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export interface RememberedPlace {
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /** created_at of the user's most recent memory at this place. */
  lastMemoryAt: string;
  memoryCount: number;
}

/**
 * Every place where the signed-in user has left a memory, newest memory first.
 * Used both to register geofences and to caption the notification.
 */
export async function fetchRememberedPlaces(userId: string): Promise<RememberedPlace[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('place_id, created_at, places (id, name, latitude, longitude, radius_meters)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Collapse to one entry per place, keeping the newest memory's timestamp.
  const byPlace = new Map<string, RememberedPlace>();
  for (const row of data as any[]) {
    const place = row.places;
    if (!place) continue;

    const existing = byPlace.get(place.id);
    if (existing) {
      existing.memoryCount += 1;
      continue;
    }

    byPlace.set(place.id, {
      placeId: place.id,
      placeName: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMeters: place.radius_meters,
      lastMemoryAt: row.created_at,
      memoryCount: 1,
    });
  }

  return Array.from(byPlace.values());
}

/**
 * "You left a memory here 16 days ago" — the caption for the reminder.
 */
export function describeVisit(place: RememberedPlace): { title: string; body: string } {
  const age = formatDistanceToNow(new Date(place.lastMemoryAt), { addSuffix: true });
  const body =
    place.memoryCount > 1
      ? `You left ${place.memoryCount} memories here. The last one ${age}.`
      : `You left a memory here ${age}.`;

  return { title: `You were here — ${place.placeName}`, body };
}

async function isOnCooldown(placeId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_KEY_PREFIX + placeId);
    if (!raw) return false;
    return Date.now() - Number(raw) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function markNotified(placeId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(COOLDOWN_KEY_PREFIX + placeId, String(Date.now()));
  } catch {
    // A failed write only risks a duplicate reminder later; not worth surfacing.
  }
}

/**
 * Fire the reminder for a place the user just walked back into.
 * Exported so the foreground path can reuse the same cooldown and copy.
 */
export async function notifyForPlace(place: RememberedPlace): Promise<boolean> {
  if (await isOnCooldown(place.placeId)) return false;

  const { title, body } = describeVisit(place);
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { placeId: place.placeId },
    },
    trigger: null, // deliver immediately
  });

  await markNotified(place.placeId);
  return true;
}

/**
 * Background geofence handler. Must be defined at module scope so the native
 * side can find it after the app is killed and relaunched — importing this
 * module from the root layout is what registers it.
 */
if (remindersSupported) {
  TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
    if (error) return;

    const { eventType, region } = data || {};
    if (eventType !== Location.GeofencingEventType.Enter || !region?.identifier) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // The region identifier is the place id we registered it under.
      const places = await fetchRememberedPlaces(user.id);
      const place = places.find((p) => p.placeId === region.identifier);
      if (!place) return;

      await notifyForPlace(place);
    } catch {
      // A throw here is swallowed by the OS anyway; never crash the task.
    }
  });
}
