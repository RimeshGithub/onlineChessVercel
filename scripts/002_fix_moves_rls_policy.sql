-- Drop the existing insert policy for moves
drop policy if exists "Players can insert moves in their games" on public.moves;

-- Create a more permissive policy that allows players to insert moves
-- This checks if the player_id matches the authenticated user AND
-- the user is part of the game (either white or black player)
create policy "Players can insert moves in their games"
  on public.moves for insert
  with check (
    auth.uid() = player_id
    and exists (
      select 1 from public.games
      where games.id = moves.game_id
      and (games.white_player_id = auth.uid() or games.black_player_id = auth.uid())
    )
  );
