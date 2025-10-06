"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createInitialBoard } from "@/lib/chess/initial-board"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Users, Clock, Gamepad2, Edit } from "lucide-react"

interface Game {
  id: string
  white_player_name: string
  black_player_name: string | null
  game_status: string
  created_at: string
}

export default function HomePage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [nameSet, setNameSet] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const storedName = localStorage.getItem("chess_player_name")
    if (storedName) {
      setPlayerName(storedName)
      setNameSet(true)
    }

    const supabase = createClient()

    // Fetch available games
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("game_status", "waiting")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching games:", error)
      } else {
        setGames(data as Game[])
      }
      setLoading(false)
    }

    fetchGames()

    // Subscribe to new games
    const channel = supabase
      .channel("games")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "games",
        },
        (payload) => {
          const newGame = payload.new as Game
          if (newGame.game_status === "waiting") {
            setGames((prev) => [newGame, ...prev])
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
        },
        (payload) => {
          const updatedGame = payload.new as Game
          if (updatedGame.game_status !== "waiting") {
            setGames((prev) => prev.filter((g) => g.id !== updatedGame.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  // Filter games based on white player's name
  const filteredGames = games.filter((game) =>
    game.white_player_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSetName = () => {
    if (playerName.trim().length < 2) {
      alert("Please enter a name with at least 2 characters")
      return
    }
    localStorage.setItem("chess_player_name", playerName.trim())
    setNameSet(true)
  }

  const createGame = async () => {
    if (!playerName) return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("games")
      .insert({
        white_player_name: playerName,
        board_state: createInitialBoard(),
        current_turn: "white",
        game_status: "waiting",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating game:", error)
      setCreating(false)
      return
    }

    router.push(`/chess/${data.id}`)
  }

  const joinGame = async (gameId: string) => {
    if (!playerName) return

    const supabase = createClient()

    const { error } = await supabase
      .from("games")
      .update({
        black_player_name: playerName,
        game_status: "active",
      })
      .eq("id", gameId)

    if (error) {
      console.error("[v0] Error joining game:", error)
      return
    }

    router.push(`/chess/${gameId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!nameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-4xl text-center">Online Chess</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="playerName" className="text-white">Name: </Label>
              <Input
                id="playerName"
                placeholder="Enter your display name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                maxLength={20}
              />
            </div>
            <Button onClick={handleSetName} className="w-full text-slate-300 border-slate-600 hover:bg-slate-700" size="lg">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-500 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl max-md:mt-8 font-bold text-white">Online Chess</h1>
          <div className="flex items-center justify-center space-x-2 mt-10">
            <p className="text-xl text-slate-300">
              Playing as <span className="font-semibold text-white">{playerName}</span>
            </p>
            <Button
              size="sm"
              onClick={() => {
                setPlayerName(localStorage.getItem("chess_player_name") || "")
                localStorage.removeItem("chess_player_name")
                setNameSet(false)
              }}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" /> 
              Create New Game
            </CardTitle>
            <CardDescription className="text-slate-400">
              Start a new chess game and wait for an opponent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createGame} disabled={creating} size="lg" className="w-full text-slate-300 border-slate-600 hover:bg-slate-700">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Games
            </CardTitle>
            <CardDescription className="text-slate-400">Join a game waiting for players</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search bar */}
            <Input
              type="text"
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            {filteredGames.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No games available. Create one to get started!
              </p>
            ) : (
              <div className="space-y-3 mt-3 max-h-120 overflow-auto">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex flex-col gap-2">
                      <p className="text-white">
                        Game by <span className="font-bold">{game.white_player_name}</span>
                      </p>
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="h-4 w-4" />
                        {getTimeAgo(new Date(game.created_at).getTime())}
                      </div>
                    </div>
                    <Button
                      onClick={() => joinGame(game.id)}
                      disabled={game.white_player_name === playerName}
                      className="text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      {game.white_player_name === playerName
                        ? "Your Game"
                        : "Join Game"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
