import { supabase } from '../lib/supabase';
import { PlaceRow, PlaceCategory } from '../types/database';
import { PlaceSummary, LocationCoordinates } from '../types/app';
import { calculateHaversineDistance, isUserAtPlace } from '../lib/distance';
import { APP_CONFIG } from '../constants/config';

// Chennai, India Seed Places to ground the app in authentic local spots
export const SEED_PLACES: PlaceSummary[] = [
  {
    id: 'seed-cafe-1',
    name: 'Ratna Cafe, Triplicane',
    category: 'Cafe',
    latitude: 13.0583,
    longitude: 80.2758,
    radius_meters: 50,
    memory_count: 18,
    oldest_memory_created_at: new Date(Date.now() - 1460 * 86400000).toISOString(), // 4 years ago
    newest_memory_created_at: new Date(Date.now() - 11 * 60000).toISOString(),       // 11 mins ago
  },
  {
    id: 'seed-beach-1',
    name: 'Marina Beach Promenade',
    category: 'Beach',
    latitude: 13.0500,
    longitude: 80.2824,
    radius_meters: 150,
    memory_count: 28,
    oldest_memory_created_at: new Date(Date.now() - 820 * 86400000).toISOString(),  // > 2 yrs ago
    newest_memory_created_at: new Date(Date.now() - 2 * 3600000).toISOString(),     // 2 hrs ago
  },
  {
    id: 'seed-college-1',
    name: 'IIT Madras Quadrangle',
    category: 'College',
    latitude: 12.9915,
    longitude: 80.2337,
    radius_meters: 200,
    memory_count: 42,
    oldest_memory_created_at: new Date(Date.now() - 2190 * 86400000).toISOString(), // 6 years ago
    newest_memory_created_at: new Date(Date.now() - 45 * 60000).toISOString(),       // 45 mins ago
  },
  {
    id: 'seed-landmark-1',
    name: 'Santhome Cathedral Basilica',
    category: 'Landmark',
    latitude: 13.0337,
    longitude: 80.2785,
    radius_meters: 100,
    memory_count: 15,
    oldest_memory_created_at: new Date(Date.now() - 730 * 86400000).toISOString(),  // 2 years ago
    newest_memory_created_at: new Date(Date.now() - 5 * 3600000).toISOString(),     // 5 hrs ago
  },
  {
    id: 'seed-park-1',
    name: 'Semmozhi Poonga',
    category: 'Park',
    latitude: 13.0508,
    longitude: 80.2492,
    radius_meters: 100,
    memory_count: 12,
    oldest_memory_created_at: new Date(Date.now() - 392 * 86400000).toISOString(),  // > 1 yr ago
    newest_memory_created_at: new Date(Date.now() - 1 * 3600000).toISOString(),     // 1 hr ago
  },
  {
    id: 'seed-shopping-1',
    name: 'Express Avenue Mall',
    category: 'Shopping',
    latitude: 13.0587,
    longitude: 80.2642,
    radius_meters: 150,
    memory_count: 24,
    oldest_memory_created_at: new Date(Date.now() - 365 * 86400000).toISOString(),  // 1 year ago
    newest_memory_created_at: new Date(Date.now() - 15 * 60000).toISOString(),      // 15 mins ago
  },
];

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

      let rawPlaces: PlaceRow[] = [];
      if (error || !data || data.length === 0) {
        // Fallback to development seed data if Supabase table is empty/unreachable
        rawPlaces = SEED_PLACES as unknown as PlaceRow[];
      } else {
        rawPlaces = data as PlaceRow[];
      }

      // Filter by category / search if using fallback seed data
      let filtered = rawPlaces;
      if (options?.category && options.category !== 'All') {
        filtered = filtered.filter((p) => p.category === options.category);
      }
      if (options?.searchQuery && options.searchQuery.trim().length > 0) {
        const q = options.searchQuery.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
      }

      // Enhance with distance math and unlock state
      const summaries: PlaceSummary[] = filtered.map((place) => {
        let distance_meters: number | undefined = undefined;

        if (options?.userLocation) {
          distance_meters = calculateHaversineDistance(options.userLocation, {
            latitude: place.latitude,
            longitude: place.longitude,
          });
        }

        const seedMatch = SEED_PLACES.find((s) => s.id === place.id);

        return {
          id: place.id,
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          radius_meters: place.radius_meters,
          distance_meters,
          memory_count: seedMatch ? seedMatch.memory_count : 0,
          oldest_memory_created_at: seedMatch ? seedMatch.oldest_memory_created_at : null,
          newest_memory_created_at: seedMatch ? seedMatch.newest_memory_created_at : null,
        };
      });

      // Sort by distance if user location is available, otherwise by name
      if (options?.userLocation) {
        summaries.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      }

      return summaries;
    } catch {
      return SEED_PLACES;
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

      let place: PlaceRow | null = null;
      if (error || !data) {
        const seedMatch = SEED_PLACES.find((s) => s.id === placeId);
        if (seedMatch) return seedMatch;
        return null;
      }

      place = data as PlaceRow;

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
      const seedMatch = SEED_PLACES.find((s) => s.id === placeId);
      return seedMatch || null;
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
