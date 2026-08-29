-- Initial schema for "You Were Here"
-- Creates every table referenced by src/services/* and src/types/database.ts.

-- Run as one transaction so a failure leaves nothing half-created.
begin;

-- ---------------------------------------------------------------- enums

create type public.memory_type as enum (
  'memory', 'warning', 'confession', 'question', 'time_capsule', 'mystery'
);

create type public.identity_visibility as enum (
  'anonymous', 'display_name', 'username'
);

create type public.memory_visibility as enum (
  'anyone', 'friends', 'invite'
);

create type public.expiration_type as enum (
  '24h', '7d', '30d', 'never'
);

create type public.moderation_status as enum (
  'pending', 'approved', 'hidden', 'removed', 'reported'
);

create type public.place_category as enum (
  'Cafe', 'Restaurant', 'Park', 'College', 'Beach', 'Concert',
  'Tourist Attraction', 'Shopping', 'Landmark', 'Other'
);

-- ------------------------------------------------------------- profiles

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text        not null unique
                 check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- The client calls isUsernameAvailable() before the user is authenticated,
-- so profiles must be readable by anon.
alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create the profile server-side from the signUp() metadata. This removes the
-- client's dependency on having a live session at signup time.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'user_' || left(replace(new.id::text, '-', ''), 8)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'username', '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- places

create table public.places (
  id            uuid primary key default gen_random_uuid(),
  name          text                  not null,
  category      public.place_category not null default 'Other',
  latitude      double precision      not null check (latitude between -90 and 90),
  longitude     double precision      not null check (longitude between -180 and 180),
  radius_meters integer               not null default 50 check (radius_meters > 0),
  metadata      jsonb                 not null default '{}'::jsonb,
  created_at    timestamptz           not null default now()
);

create index places_category_idx on public.places (category);
create index places_coords_idx   on public.places (latitude, longitude);

alter table public.places enable row level security;

create policy "places are publicly readable"
  on public.places for select
  using (true);

-- Needed by the "+" flow: naming a spot nobody has named yet.
create policy "signed-in users can name new places"
  on public.places for insert to authenticated
  with check (true);

-- ------------------------------------------------------------- memories

create table public.memories (
  id                  uuid primary key default gen_random_uuid(),
  place_id            uuid not null references public.places (id) on delete cascade,
  author_id           uuid          references public.profiles (id) on delete set null,
  content             text not null check (char_length(content) between 1 and 500),
  memory_type         public.memory_type         not null default 'memory',
  identity_visibility public.identity_visibility not null default 'anonymous',
  visibility          public.memory_visibility   not null default 'anyone',
  expiration_type     public.expiration_type     not null default 'never',
  expires_at          timestamptz,
  moderation_status   public.moderation_status   not null default 'approved',
  created_at          timestamptz not null default now()
);

create index memories_place_created_idx on public.memories (place_id, created_at desc);
create index memories_author_idx        on public.memories (author_id);

alter table public.memories enable row level security;

-- NOTE: proximity ("you must be inside the radius") is enforced client-side in
-- memoriesService.getUnlockedMemories. It is NOT enforced here — any signed-in
-- user can read public memories directly via the API. Moving that gate server-
-- side needs an RPC that takes the caller's coordinates.
create policy "public memories are readable by signed-in users"
  on public.memories for select to authenticated
  using (
    visibility = 'anyone'
    and moderation_status in ('pending', 'approved')
    and (expires_at is null or expires_at > now())
  );

create policy "authors can read their own memories"
  on public.memories for select to authenticated
  using (auth.uid() = author_id);

create policy "users can leave memories"
  on public.memories for insert to authenticated
  with check (auth.uid() = author_id);

create policy "authors can delete their own memories"
  on public.memories for delete to authenticated
  using (auth.uid() = author_id);

-- ---------------------------------------------------- memory_reactions

create table public.memory_reactions (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references public.memories (id)  on delete cascade,
  user_id    uuid not null references public.profiles (id)  on delete cascade,
  emoji      text not null check (emoji in ('❤️', '😂', '🥲', '👀')),
  created_at timestamptz not null default now(),
  unique (memory_id, user_id, emoji)
);

create index memory_reactions_memory_idx on public.memory_reactions (memory_id);

alter table public.memory_reactions enable row level security;

create policy "reactions are readable by signed-in users"
  on public.memory_reactions for select to authenticated
  using (true);

create policy "users can add their own reactions"
  on public.memory_reactions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users can remove their own reactions"
  on public.memory_reactions for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------ memory_reports

create table public.memory_reports (
  id          uuid primary key default gen_random_uuid(),
  memory_id   uuid not null references public.memories (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  details     text,
  created_at  timestamptz not null default now(),
  unique (memory_id, reporter_id)
);

create index memory_reports_memory_idx on public.memory_reports (memory_id);

alter table public.memory_reports enable row level security;

create policy "users can file reports"
  on public.memory_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "users can read their own reports"
  on public.memory_reports for select to authenticated
  using (auth.uid() = reporter_id);

-- --------------------------------------------------------- achievements

create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  title       text not null,
  description text not null,
  icon        text not null
);

alter table public.achievements enable row level security;

create policy "achievements are publicly readable"
  on public.achievements for select
  using (true);

create table public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id)     on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "users can read their own achievements"
  on public.user_achievements for select to authenticated
  using (auth.uid() = user_id);

create policy "users can unlock their own achievements"
  on public.user_achievements for insert to authenticated
  with check (auth.uid() = user_id);

-- Codes mirror SYSTEM_ACHIEVEMENTS in src/services/achievements.ts.
insert into public.achievements (code, title, description, icon) values
  ('FIRST_STEPS',   'First Footsteps', 'Visit 1 physical location with memories',    '🗺️'),
  ('GHOST_HUNTER',  'Ghost Hunter',    'Discover a Ghost Memory (> 1 year old)',     '👻'),
  ('MEMORY_KEEPER', 'Memory Keeper',   'Leave 5 text memories for future visitors',  '✍️'),
  ('TIME_TRAVELER', 'Time Traveler',   'Discover an Ancient Memory (> 5 years old)', '🏛️'),
  ('LOCAL_LEGEND',  'Local Legend',    'Visit 10 physical places with memories',     '📍')
on conflict (code) do nothing;

commit;
