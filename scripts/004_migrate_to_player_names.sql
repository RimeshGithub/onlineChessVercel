-- Drop all existing RLS policies first
DROP POLICY IF EXISTS "games_select_policy" ON public.games;
DROP POLICY IF EXISTS "games_insert_policy" ON public.games;
DROP POLICY IF EXISTS "games_update_policy" ON public.games;
DROP POLICY IF EXISTS "moves_select_policy" ON public.moves;
DROP POLICY IF EXISTS "moves_insert_policy" ON public.moves;

-- Disable RLS on both tables
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves DISABLE ROW LEVEL SECURITY;

-- Drop foreign key constraint on moves table
ALTER TABLE public.moves DROP CONSTRAINT IF EXISTS moves_game_id_fkey;

-- Modify games table
ALTER TABLE public.games 
  DROP COLUMN IF EXISTS white_player_id,
  DROP COLUMN IF EXISTS black_player_id,
  ADD COLUMN IF NOT EXISTS white_player_name TEXT,
  ADD COLUMN IF NOT EXISTS black_player_name TEXT;

-- Modify moves table
ALTER TABLE public.moves
  DROP COLUMN IF EXISTS player_id,
  ADD COLUMN IF NOT EXISTS player_name TEXT;

-- Re-add foreign key constraint
ALTER TABLE public.moves 
  ADD CONSTRAINT moves_game_id_fkey 
  FOREIGN KEY (game_id) 
  REFERENCES public.games(id) 
  ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(game_status);
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON public.moves(game_id);
