import { cn } from "@/lib/utils"
import type { PieceColor } from "@/lib/chess/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GameInfoProps {
  currentTurn: PieceColor
  playerColor: PieceColor
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  winner?: "white" | "black" | "draw"
  isActive?: boolean
}

export function GameInfo({ currentTurn, playerColor, isCheck, isCheckmate, isStalemate, winner, isActive }: GameInfoProps) {
  const isYourTurn = currentTurn === playerColor

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-center">Game Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col max-lg:flex-row max-lg:justify-center gap-4">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium">Your Color:</span>
            <Badge variant={playerColor === "white" ? "secondary" : "default"}>
              {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium">Current Turn:</span>
            <Badge variant={isYourTurn ? "default" : "secondary"}>
              {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}
            </Badge>
          </div>
        </div>

        {isCheck && !isCheckmate && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 text-center">Check!</p>
          </div>
        )}

        {isCheckmate && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 text-center">
              Checkmate! {winner?.charAt(0).toUpperCase() + winner?.slice(1)} wins!
            </p>
          </div>
        )}

        {isStalemate && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-semibold text-center">Stalemate! Game is a draw.</p>
          </div>
        )}

        {!isCheckmate && !isStalemate && (
          <div
            className={cn(
              "p-3 rounded-lg",
              isYourTurn ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800", 
            )}
          >
            <p className="text-sm font-medium text-center">{(isYourTurn && isActive) ? "Your turn to move!" : "Waiting for opponent..."}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
