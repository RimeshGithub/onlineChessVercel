import type { ChessPiece as ChessPieceType } from "@/lib/chess/types"

interface ChessPieceProps {
  piece: ChessPieceType
  size?: number
}

const pieceSymbols: Record<string, string> = {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  }

export function ChessPiece({ piece, size = 48 }: ChessPieceProps) {
  const symbol = pieceSymbols[piece.type]

  return (
    <div className="flex items-center justify-center select-none md:text-6xl max-md:text-5xl max-sm:text-4xl max-xs:text-3xl" style={{ fontFamily: "serif", color: piece.color === "black" ? "#222" : "#eee", textShadow: piece.color === "white" ? "0px 2px 4px rgba(0,0,0,0.5)" : "0px 2px 4px rgba(255,255,255,0.5)" }}>
      {symbol}
    </div>
  )
}
