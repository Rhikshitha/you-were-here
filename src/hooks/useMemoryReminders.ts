import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { remindersService, ReminderStatus } from '../services/reminders';
import { remindersSupported } from '../lib/memoryGeofence';

const PREF_KEY = 'memory-reminders-enabled';

/**
 * Owns the "remind me when I pass by a place I left a memory" opt-in:
 * persists the preference, re-registers geofences on launch, and keeps the
 * registered regions fresh as the user moves (iOS only watches 20 at a time).
 */
export function useMemoryReminders() {
  const { user } = useAuth();
  const { location } = useLocation();

  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [busy, setBusy] = useState(false);

  // Restore the preference and re-arm geofencing after a cold start.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!remindersSupported || !user) {
        setEnabled(false);
        return;
      }

      const stored = await AsyncStorage.getItem(PREF_KEY);
      if (cancelled) return;

      if (stored !== 'true') {
        setEnabled(false);
        return;
      }

      setEnabled(true);
      const next = await remindersService.start(user.id, location);
      if (!cancelled) setStatus(next);
    })();

    return () => {
      cancelled = true;
    };
    // `location` deliberately omitted: re-registering on every fix is handled
    // by the effect below, which only runs once reminders are already on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // As the user moves, the nearest-20 set changes on iOS. Re-register so the
  // regions being watched stay the ones they are actually near.
  useEffect(() => {
    if (!enabled || !user || !location) return;

    let cancelled = false;
    (async () => {
      const next = await remindersService.start(user.id, location);
      if (!cancelled) setStatus(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user, location]);

  const toggle = useCallback(
    async (next: boolean) => {
      if (!user) return;
      setBusy(true);

      try {
        if (!next) {
          await remindersService.stop();
          await AsyncStorage.setItem(PREF_KEY, 'false');
          setEnabled(false);
          setStatus({ supported: remindersSupported, active: false, watching: 0, error: null });
          return;
        }

        const { granted, error } = await remindersService.requestPermissions();
        if (!granted) {
          setStatus({ supported: remindersSupported, active: false, watching: 0, error });
          setEnabled(false);
          await AsyncStorage.setItem(PREF_KEY, 'false');
          return;
        }

        const result = await remindersService.start(user.id, location);
        setStatus(result);
        setEnabled(result.active);
        await AsyncStorage.setItem(PREF_KEY, result.active ? 'true' : 'false');
      } finally {
        setBusy(false);
      }
    },
    [user, location]
  );

  return { supported: remindersSupported, enabled, status, busy, toggle };
}
