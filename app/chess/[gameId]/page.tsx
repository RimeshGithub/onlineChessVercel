"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChessBoard } from "@/components/chess/chess-board"
import { GameInfo } from "@/components/chess/game-info"
import type { Board, Position, PieceColor } from "@/lib/chess/types"
import { isKingInCheck, isCheckmate, isStalemate } from "@/lib/chess/move-validation"
import { positionToAlgebraic } from "@/lib/chess/notation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GameData {
  id: string
  white_player_name: string
  black_player_name: string | null
  current_turn: PieceColor
  board_state: Board
  game_status: string
  winner?: "white" | "black" | "draw"
  quit_by?: string
}

export default function ChessGamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params
  const router = useRouter()
  const [game, setGame] = useState<GameData | null>(null)
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckState, setIsCheckState] = useState(false)
  const [isCheckmateState, setIsCheckmateState] = useState(false)
  const [isStalemateState, setIsStalemateState] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem("chess_player_name")
    if (storedName) {
      console.log("[v0] Player name set:", storedName)
      setPlayerName(storedName)
    } else {
      console.log("[v0] No player name found, redirecting to home")
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (!game || !playerName) return

    console.log(
      "[v0] Determining player color - playerName:",
      playerName,
      "white:",
      game.white_player_name,
      "black:",
      game.black_player_name,
    )

    if (playerName === game.white_player_name) {
      console.log("[v0] Player is WHITE")
      setPlayerColor("white")
    } else if (playerName === game.black_player_name) {
      console.log("[v0] Player is BLACK")
      setPlayerColor("black")
    } else {
      console.log("[v0] Player is spectator")
      setPlayerColor("white") // Default to white view for spectators
    }
  }, [game, playerName])

  useEffect(() => {
    if (!playerName) return

    const supabase = createClient()

    const fetchGame = async () => {
      console.log("[v0] Fetching game:", gameId)
      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

      if (error) {
        console.error("[v0] Error fetching game:", error)
        return
      }

      if (data) {
        console.log("[v0] Game fetched:", data)
        setGame(data as GameData)

        const board = data.board_state as Board
        const currentTurn = data.current_turn as PieceColor

        setIsCheckState(isKingInCheck(board, currentTurn))
        setIsCheckmateState(isCheckmate(board, currentTurn))
        setIsStalemateState(isStalemate(board, currentTurn))

        setLoading(false)
      }
    }

    fetchGame()

    const pollInterval = setInterval(fetchGame, 2000)

    // Subscribe to game updates
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("[v0] Game updated via subscription:", payload.new)
          const newGame = payload.new as GameData
          setGame(newGame)

          const board = newGame.board_state as Board
          const currentTurn = newGame.current_turn as PieceColor

          setIsCheckState(isKingInCheck(board, currentTurn))
          setIsCheckmateState(isCheckmate(board, currentTurn))
          setIsStalemateState(isStalemate(board, currentTurn))
        },
      )
      .subscribe()

    const handleBeforeUnload = async () => {
      if (game && game.game_status === "active") {
        await handleQuitGame(true)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [gameId, playerName, game])

  const handleMove = async (from: Position, to: Position) => {
    if (!game || !playerName) return

    // Players can now play both sides if they want to test

    if (game.current_turn !== playerColor) {
      console.log("[v0] Cannot make move - not your turn")
      return
    }

    const supabase = createClient()

    console.log("[v0] Player making move:", playerName, "Game ID:", gameId)

    const board = game.board_state as Board
    const piece = board[from.row][from.col]

    if (!piece) return

    // Create new board with move
    const newBoard = board.map((row) => [...row])
    const capturedPiece = newBoard[to.row][to.col]
    newBoard[to.row][to.col] = newBoard[from.row][from.col]
    newBoard[from.row][from.col] = null

    // Check for pawn promotion
    if (piece.type === "pawn" && (to.row === 0 || to.row === 7)) {
      newBoard[to.row][to.col] = { ...piece, type: "queen" }
    }

    const nextTurn: PieceColor = game.current_turn === "white" ? "black" : "white"
    const isNextCheck = isKingInCheck(newBoard, nextTurn)
    const isNextCheckmate = isCheckmate(newBoard, nextTurn)
    const isNextStalemate = isStalemate(newBoard, nextTurn)

    let gameStatus = "active"
    let winner: "white" | "black" | "draw" | undefined

    if (isNextCheckmate) {
      gameStatus = "checkmate"
      winner = game.current_turn
    } else if (isNextStalemate) {
      gameStatus = "stalemate"
      winner = "draw"
    }

    console.log("[v0] Making move:", { from, to, nextTurn, gameStatus })

    // Update game in database
    const { error: gameError } = await supabase
      .from("games")
      .update({
        board_state: newBoard,
        current_turn: nextTurn,
        game_status: gameStatus,
        winner: winner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)

    if (gameError) {
      console.error("[v0] Error updating game:", gameError)
      return
    }

    console.log("[v0] Attempting to insert move:", {
      game_id: gameId,
      player_name: playerName,
    })

    // Record move
    const { error: moveError } = await supabase.from("moves").insert({
      game_id: gameId,
      player_name: playerName,
      move_notation: `${positionToAlgebraic(from)}-${positionToAlgebraic(to)}`,
      from_square: positionToAlgebraic(from),
      to_square: positionToAlgebraic(to),
      piece: piece.type,
      captured_piece: capturedPiece?.type,
      is_check: isNextCheck,
      is_checkmate: isNextCheckmate,
    })

    if (moveError) {
      console.error("[v0] Error recording move:", moveError)
      console.error("[v0] Move error details:", {
        message: moveError.message,
        details: moveError.details,
        hint: moveError.hint,
        code: moveError.code,
      })
    } else {
      console.log("[v0] Move recorded successfully")
    }

    if (gameStatus !== "active") {
      console.log("[v0] Game ended, deleting game data in 3 seconds...")
      setTimeout(async () => {
        await deleteGameData()
      }, 3000)
    }
  }

  const handleQuitGame = async (isDisconnect = false) => {
    if (!game || !playerName) return

    const supabase = createClient()
    const opponent = playerName === game.white_player_name ? "black" : "white"

    console.log("[v0] Player quitting game:", playerName, "Disconnect:", isDisconnect)

    const { error } = await supabase
      .from("games")
      .update({
        game_status: "resigned",
        winner: opponent,
        quit_by: playerName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)

    if (error) {
      console.error("[v0] Error quitting game:", error)
      return
    }

    console.log("[v0] Deleting game data after quit...")
    await deleteGameData()

    if (!isDisconnect) {
      router.push("/")
    }
  }

  const deleteGameData = async () => {
    if (!game) return

    const supabase = createClient()

    console.log("[v0] Deleting game data for game:", gameId)

    // Delete moves first (foreign key constraint)
    const { error: movesError } = await supabase.from("moves").delete().eq("game_id", gameId)

    if (movesError) {
      console.error("[v0] Error deleting moves:", movesError)
      return
    }

    console.log("[v0] Moves deleted successfully")

    // Delete game
    const { error: gameError } = await supabase.from("games").delete().eq("id", gameId)

    if (gameError) {
      console.error("[v0] Error deleting game:", gameError)
      return
    }

    console.log("[v0] Game deleted successfully")

    // Redirect to lobby after deletion
    setTimeout(() => {
      router.push("/")
    }, 1000)
  }

  const isGameOver = game?.game_status !== "active" && game?.game_status !== "waiting"

  const canMove = game?.game_status === "active" && !isGameOver

  const getGameOverMessage = () => {
    if (!game) return null

    if (game.game_status === "resigned") {
      const quitter = game.quit_by
      const isPlayerQuitter = quitter === playerName

      if (isPlayerQuitter) {
        return {
          title: "You quit the game!",
          description: "You have forfeited the match.",
          variant: "destructive" as const,
        }
      } else {
        return {
          title: "Your Opponent quited the game!",
          description: `${quitter} has left the game. You win!`,
          variant: "default" as const,
        }
      }
    }

    if (game.game_status === "checkmate") {
      const isWinner = game.winner === playerColor
      return {
        title: isWinner ? "Checkmate! You win!" : "Checkmate! You lose!",
        description: isWinner ? "Congratulations on your victory!" : "Better luck next time!",
        variant: (isWinner ? "default" : "destructive") as const,
      }
    }

    if (game.game_status === "stalemate") {
      return {
        title: "Stalemate!",
        description: "The game is a draw.",
        variant: "default" as const,
      }
    }

    return null
  }

  if (loading || !game || !playerColor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  const gameOverMessage = getGameOverMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 max-lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-16 justify-center items-center gap-8">
          <div className="text-center space-y-2 flex items-center flex-col">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Online Chess</h1>
            {game.game_status === "waiting" ? (
              <p className="text-slate-300">Waiting for opponent...</p>
            ) : (
              <div className="space-y-1">
                <p className="text-slate-300">
                  <span className="font-semibold text-white">{game.white_player_name}</span> (White) vs{" "}
                  <span className="font-semibold text-white">{game.black_player_name}</span> (Black)
                </p>
                <p className="text-slate-400 text-sm">You are playing as {playerColor}</p>
              </div>
            )}

            {gameOverMessage && (
              <div
                className={`w-full max-w-2xl p-6 rounded-lg border-2 ${
                  gameOverMessage.variant === "destructive"
                    ? "bg-red-950/50 border-red-500"
                    : "bg-green-950/50 border-green-500"
                }`}
              >
                <h2 className="text-2xl font-bold text-white mb-2">{gameOverMessage.title}</h2>
                <p className="text-slate-300">{gameOverMessage.description}</p>
              </div>
            )}

            <div className="w-full lg:w-80 space-y-4 mt-5">
              <GameInfo
                currentTurn={game.current_turn}
                playerColor={playerColor}
                isCheck={isCheckState}
                isCheckmate={isCheckmateState}
                isStalemate={isStalemateState}
                winner={game.winner}
                isActive={game.game_status === "active"}
              />

              {game.game_status === "active" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Quit Game
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to quit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Quitting will forfeit the game and your opponent will win. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleQuitGame(false)}>Quit Game</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {game.game_status !== "active" && (
                <Button onClick={async () => {router.push("/"); await deleteGameData()}} variant="outline" className="w-full hover:bg-gray-200">
                  Back to Lobby
                </Button>     
              )}
            </div>
          </div>
          <ChessBoard
            board={game.board_state as Board}
            currentTurn={game.current_turn}
            playerColor={playerColor}
            onMove={handleMove}
            isGameOver={!canMove}
          />   
        </div>
      </div>
    </div>
  )
}
