-- Popular Chennai places, with a few anonymous memories on each.
--
-- Memories here have author_id = NULL and identity_visibility = 'anonymous',
-- so they render as "Anonymous Explorer" and no user can delete them.
-- Safe to re-run: both inserts skip rows that already exist.

begin;

-- ------------------------------------------------------------------ places

insert into public.places (name, category, latitude, longitude, radius_meters)
select v.name, v.category::public.place_category, v.lat, v.lng, v.radius
from (values
  ('Marina Beach Promenade',      'Beach',              13.0500, 80.2824, 250),
  ('Kapaleeshwarar Temple',       'Landmark',           13.0337, 80.2698, 120),
  ('Ratna Cafe, Triplicane',      'Cafe',               13.0583, 80.2758,  50),
  ('Semmozhi Poonga',             'Park',               13.0569, 80.2497, 150),
  ('Besant Nagar (Elliot''s) Beach', 'Beach',           13.0002, 80.2668, 200),
  ('Express Avenue Mall',         'Shopping',           13.0587, 80.2642, 120),
  ('Valluvar Kottam',             'Tourist Attraction', 13.0524, 80.2437, 100)
) as v(name, category, lat, lng, radius)
where not exists (
  select 1 from public.places p where p.name = v.name
);

-- ---------------------------------------------------------------- memories

insert into public.memories (
  place_id, author_id, content, memory_type,
  identity_visibility, visibility, expiration_type, moderation_status, created_at
)
select
  p.id,
  null,
  m.content,
  m.memory_type::public.memory_type,
  'anonymous'::public.identity_visibility,
  'anyone'::public.memory_visibility,
  'never'::public.expiration_type,
  'approved'::public.moderation_status,
  now() - m.age
from (values
  ('Marina Beach Promenade',
   'Came here at 5am after my night shift just to watch the sun come up over the water. Worth every hour of lost sleep.',
   'memory', interval '3 days'),
  ('Marina Beach Promenade',
   'Warning: the sand gets genuinely painful by noon. Come after 4pm or bring something for your feet.',
   'warning', interval '11 days'),
  ('Marina Beach Promenade',
   'I told my best friend I was leaving Chennai for good while we sat on the third bench from the lighthouse. She cried. I did not. I regret that.',
   'confession', interval '400 days'),

  ('Kapaleeshwarar Temple',
   'My grandmother brought me here every Friday for eleven years. I still catch the smell of jasmine and camphor and think of her hand around my wrist.',
   'memory', interval '800 days'),
  ('Kapaleeshwarar Temple',
   'Go around the back during the evening. Almost nobody does, and the gopuram from that angle at dusk is something else.',
   'warning', interval '26 days'),

  ('Ratna Cafe, Triplicane',
   'Ask them for extra sambar. They will pour it over the idlis without a word, like they were waiting for you to ask.',
   'warning', interval '5 days'),
  ('Ratna Cafe, Triplicane',
   'We came here after our final exam in 2019 and swore we would meet at this table every year. We have not, once.',
   'time_capsule', interval '2200 days'),
  ('Ratna Cafe, Triplicane',
   'Is the uncle who used to work the front counter still around? He knew my order before I sat down.',
   'question', interval '19 hours'),

  ('Semmozhi Poonga',
   'Sat under the big tree near the pond and read an entire book in one afternoon. Nobody bothered me. In this city, that is a miracle.',
   'memory', interval '40 days'),
  ('Semmozhi Poonga',
   'Something is buried under the third bench along the east path. Not treasure. Just something that mattered to me once.',
   'mystery', interval '95 days'),

  ('Besant Nagar (Elliot''s) Beach',
   'Every heartbreak I have had in this city ended with a walk from the church to the water and back. This beach has heard a lot.',
   'confession', interval '150 days'),
  ('Besant Nagar (Elliot''s) Beach',
   'The sundal guy near the entrance is the best one on this whole coast. Do not skip him.',
   'memory', interval '2 days'),

  ('Express Avenue Mall',
   'Got caught in the rain outside and ended up spending four hours here with a stranger who became my closest friend.',
   'memory', interval '320 days'),
  ('Express Avenue Mall',
   'Parking on a Sunday evening is a genuine mistake. Take the metro to Government Estate and walk.',
   'warning', interval '8 days'),

  ('Valluvar Kottam',
   'Read the couplets on the walls slowly. I came for the architecture and left thinking about something my father used to say.',
   'memory', interval '60 days'),
  ('Valluvar Kottam',
   'To whoever finds this in ten years: I hope you got out of the thing you were stuck in. I hope it was worth it.',
   'time_capsule', interval '1900 days')
) as m(place_name, content, memory_type, age)
join public.places p on p.name = m.place_name
where not exists (
  select 1 from public.memories x
  where x.place_id = p.id and x.content = m.content
);

commit;
