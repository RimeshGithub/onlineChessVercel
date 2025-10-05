-- Drop existing RLS policies
drop policy if exists "Users can view games they are part of" on public.games;
drop policy if exists "Users can create games" on public.games;
drop policy if exists "Players can update their games" on public.games;
drop policy if exists "Users can view moves from their games" on public.moves;
drop policy if exists "Players can insert moves in their games" on public.moves;

-- Disable RLS (since we're not using authentication anymore)
alter table public.games disable row level security;
alter table public.moves disable row level security;

-- Drop foreign key constraints to auth.users
alter table public.games drop constraint if exists games_white_player_id_fkey;
alter table public.games drop constraint if exists games_black_player_id_fkey;
alter table public.moves drop constraint if exists moves_player_id_fkey;

-- Modify games table to use player names instead of user IDs
alter table public.games 
  alter column white_player_id type text,
  alter column black_player_id type text;

-- Rename columns to be more descriptive
alter table public.games rename column white_player_id to white_player_name;
alter table public.games rename column black_player_id to black_player_name;

-- Modify moves table to use player names
alter table public.moves 
  alter column player_id type text;

alter table public.moves rename column player_id to player_name;

-- Update indexes
drop index if exists games_white_player_idx;
drop index if exists games_black_player_idx;

create index if not exists games_white_player_name_idx on public.games(white_player_name);
create index if not exists games_black_player_name_idx on public.games(black_player_name);
