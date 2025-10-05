# Realtime Multiplayer Chess Game

A fully-featured chess game with real-time multiplayer synchronization built with Next.js and Supabase.

## Features

- **Full Chess Implementation**: Complete chess rules including castling, en passant, pawn promotion, check, checkmate, and stalemate detection
- **Real-time Multiplayer**: Moves sync instantly between players using Supabase real-time subscriptions
- **No Authentication Required**: Players simply enter a display name to play
- **Intuitive UI**: Clean, modern interface with move highlighting and game status indicators
- **Move History**: Track all moves made during the game

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from Project Settings > API
3. Create a `.env.local` file and add your credentials:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### 3. Run Database Migrations

Execute the SQL scripts in order from the `scripts/` folder in your Supabase SQL Editor:

1. `001_create_chess_tables.sql` - Creates the initial database schema
2. `004_migrate_to_player_names.sql` - Updates schema to use player names
3. `005_enable_realtime.sql` - Enables real-time synchronization

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to start playing!

## How to Play

1. Enter your display name on the home page
2. Click "Create New Game" to start a game as White
3. Share the game URL with a friend
4. Your friend enters their name and clicks "Join Game" to play as Black
5. Make moves by clicking on pieces and then clicking on valid destination squares

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Supabase** - Real-time database and synchronization
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Home page with game lobby
│   └── chess/[gameId]/       # Chess game page
├── components/
│   └── chess/                # Chess-specific components
├── lib/
│   ├── chess/                # Chess game logic and validation
│   └── supabase/             # Supabase client configuration
└── scripts/                  # Database migration scripts
\`\`\`

## License

MIT
