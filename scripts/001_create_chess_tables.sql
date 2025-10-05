-- Create games table to store chess game state
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  white_player_id uuid references auth.users(id) on delete cascade,
  black_player_id uuid references auth.users(id) on delete cascade,
  current_turn text not null default 'white' check (current_turn in ('white', 'black')),
  board_state jsonb not null,
  game_status text not null default 'waiting' check (game_status in ('waiting', 'active', 'checkmate', 'stalemate', 'draw', 'resigned')),
  winner text check (winner in ('white', 'black', 'draw')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create moves table to store move history
create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  player_id uuid references auth.users(id) on delete cascade,
  move_notation text not null,
  from_square text not null,
  to_square text not null,
  piece text not null,
  captured_piece text,
  is_check boolean default false,
  is_checkmate boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.games enable row level security;
alter table public.moves enable row level security;

-- RLS Policies for games table
create policy "Users can view games they are part of"
  on public.games for select
  using (
    auth.uid() = white_player_id or 
    auth.uid() = black_player_id or
    game_status = 'waiting'
  );

create policy "Users can create games"
  on public.games for insert
  with check (auth.uid() = white_player_id or auth.uid() = black_player_id);

create policy "Players can update their games"
  on public.games for update
  using (auth.uid() = white_player_id or auth.uid() = black_player_id);

-- RLS Policies for moves table
create policy "Users can view moves from their games"
  on public.moves for select
  using (
    exists (
      select 1 from public.games
      where games.id = moves.game_id
      and (games.white_player_id = auth.uid() or games.black_player_id = auth.uid())
    )
  );

create policy "Players can insert moves in their games"
  on public.moves for insert
  with check (
    exists (
      select 1 from public.games
      where games.id = moves.game_id
      and (games.white_player_id = auth.uid() or games.black_player_id = auth.uid())
    )
  );

-- Create indexes for better performance
create index if not exists games_white_player_idx on public.games(white_player_id);
create index if not exists games_black_player_idx on public.games(black_player_id);
create index if not exists games_status_idx on public.games(game_status);
create index if not exists moves_game_id_idx on public.moves(game_id);
