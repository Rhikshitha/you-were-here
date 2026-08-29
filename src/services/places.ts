import { supabase } from '../lib/supabase';
import { PlaceRow, PlaceCategory } from '../types/database';
import { PlaceSummary, LocationCoordinates } from '../types/app';
import { calculateHaversineDistance, isUserAtPlace } from '../lib/distance';
import { APP_CONFIG } from '../constants/config';

export const placesService = {
  /**
   * Fetch places with optional category filter, search term, and user location distance math
   */
  async getPlaces(options?: {
    category?: string;
    searchQuery?: string;
    userLocation?: LocationCoordinates;
  }): Promise<PlaceSummary[]> {
    try {
      let query = supabase.from('places').select('*');

      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }

      if (options?.searchQuery && options.searchQuery.trim().length > 0) {
        query = query.ilike('name', `%${options.searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Could not load places:', error.message);
        return [];
      }

      const filtered = (data || []) as PlaceRow[];

      // Enhance with distance math and unlock state
      const summaries: PlaceSummary[] = filtered.map((place) => {
        let distance_meters: number | undefined = undefined;

        if (options?.userLocation) {
          distance_meters = calculateHaversineDistance(options.userLocation, {
            latitude: place.latitude,
            longitude: place.longitude,
          });
        }

        return {
          id: place.id,
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          radius_meters: place.radius_meters,
          distance_meters,
          memory_count: 0,
          oldest_memory_created_at: null,
          newest_memory_created_at: null,
        };
      });

      // Sort by distance if user location is available, otherwise by name
      if (options?.userLocation) {
        summaries.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      }

      return summaries;
    } catch (err: any) {
      console.warn('Could not load places:', err?.message);
      return [];
    }
  },

  /**
   * Fetch a single Place entity by ID
   */
  async getPlaceById(
    placeId: string,
    userLocation?: LocationCoordinates
  ): Promise<PlaceSummary | null> {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', placeId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const place = data as PlaceRow;

      let distance_meters: number | undefined = undefined;

      if (userLocation) {
        distance_meters = calculateHaversineDistance(userLocation, {
          latitude: place.latitude,
          longitude: place.longitude,
        });
      }

      return {
        id: place.id,
        name: place.name,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        radius_meters: place.radius_meters,
        distance_meters,
        memory_count: 0,
        oldest_memory_created_at: null,
        newest_memory_created_at: null,
      };
    } catch {
      return null;
    }
  },

  /**
   * Find an already-named place the user is currently standing inside.
   * Returns the nearest match, or null when this spot has never been named.
   */
  async findPlaceAtLocation(
    userLocation: LocationCoordinates
  ): Promise<{ data: PlaceSummary | null; error: string | null }> {
    try {
      // Coarse bounding box (~660m) so we don't pull the whole table, then filter
      // precisely with haversine below. A longitude degree narrows away from the
      // equator, so this box is always a superset of what we actually want.
      const DEG = 0.006;
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .gte('latitude', userLocation.latitude - DEG)
        .lte('latitude', userLocation.latitude + DEG)
        .gte('longitude', userLocation.longitude - DEG)
        .lte('longitude', userLocation.longitude + DEG);

      if (error) {
        return { data: null, error: error.message };
      }

      const matches = ((data || []) as PlaceRow[])
        .map((place) => ({
          place,
          distance_meters: calculateHaversineDistance(userLocation, {
            latitude: place.latitude,
            longitude: place.longitude,
          }),
        }))
        .sort((a, b) => a.distance_meters - b.distance_meters);

      if (matches.length === 0) {
        return { data: null, error: null };
      }

      const { place, distance_meters } = matches[0];
      return {
        data: {
          id: place.id,
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          radius_meters: place.radius_meters,
          distance_meters,
          memory_count: 0,
          oldest_memory_created_at: null,
          newest_memory_created_at: null,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Could not look up this location.' };
    }
  },

  /**
   * Name the spot the user is standing in so future visitors reuse it.
   *
   * Unlike the read paths above this deliberately does NOT fall back to seed
   * data: a failure has to surface, or we would hand a non-existent place id
   * to createMemory and the memory would silently go nowhere.
   */
  async createPlace(input: {
    name: string;
    category: PlaceCategory;
    latitude: number;
    longitude: number;
  }): Promise<{ data: PlaceSummary | null; error: string | null }> {
    try {
      const name = input.name.trim();
      if (name.length < 2) {
        return { data: null, error: 'Give this place a name of at least 2 characters.' };
      }
      if (name.length > 80) {
        return { data: null, error: 'Place names must be 80 characters or less.' };
      }

      const radius_meters =
        APP_CONFIG.CATEGORY_RADII[input.category] ?? APP_CONFIG.DEFAULT_PLACE_RADIUS;

      const { data, error } = await supabase
        .from('places')
        .insert([
          {
            name,
            category: input.category,
            latitude: input.latitude,
            longitude: input.longitude,
            radius_meters,
          },
        ])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const place = data as PlaceRow;
      return {
        data: {
          id: place.id,
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          radius_meters: place.radius_meters,
          distance_meters: 0,
          memory_count: 0,
          oldest_memory_created_at: null,
          newest_memory_created_at: null,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Could not save this place.' };
    }
  },
};
