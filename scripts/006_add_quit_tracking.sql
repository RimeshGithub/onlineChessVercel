-- Add quit_by column to track which player quit the game
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS quit_by text;

-- Add comment to explain the column
COMMENT ON COLUMN public.games.quit_by IS 'Name of the player who quit or disconnected from the game';
