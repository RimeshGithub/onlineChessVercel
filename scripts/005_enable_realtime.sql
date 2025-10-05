-- Enable real-time replication for the games table
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- Enable real-time replication for the moves table
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;

-- Verify real-time is enabled (this will show in the query results)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
