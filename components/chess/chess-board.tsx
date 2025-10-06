"use client"

import { useState, useEffect } from "react"
import type { Board, Position, PieceColor } from "@/lib/chess/types"
import { ChessPiece } from "./chess-piece"
import { wouldMoveResultInCheck, getValidMovesForPiece } from "@/lib/chess/move-validation"
import { cn } from "@/lib/utils"

interface ChessBoardProps {
  board: Board
  currentTurn: PieceColor
  playerColor: PieceColor
  onMove: (from: Position, to: Position) => void
  isGameOver: boolean
}

export function ChessBoard({ board, currentTurn, playerColor, onMove, isGameOver }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])

  useEffect(() => {
    if (selectedSquare) {
      const piece = board[selectedSquare.row][selectedSquare.col]
      if (piece && piece.color === currentTurn) {
        const moves = getValidMovesForPiece(board, selectedSquare, null)
        const safeMoves = moves.filter((move) => !wouldMoveResultInCheck(board, selectedSquare, move, currentTurn))
        setValidMoves(safeMoves)
      } else {
        setValidMoves([])
      }
    } else {
      setValidMoves([])
    }
  }, [selectedSquare, board, currentTurn])

  const handleSquareClick = (row: number, col: number) => {
    if (isGameOver || currentTurn !== playerColor) return

    const position = { row, col }
    const piece = board[row][col]

    if (selectedSquare) {
      // Try to make a move
      const isValid = validMoves.some((move) => move.row === row && move.col === col)

      if (isValid) {
        onMove(selectedSquare, position)
        setSelectedSquare(null)
        setValidMoves([])
      } else if (piece && piece.color === currentTurn) {
        // Select a different piece
        setSelectedSquare(position)
      } else {
        // Deselect
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (piece && piece.color === currentTurn) {
      // Select a piece
      setSelectedSquare(position)
    }
  }

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col
  }

  const isValidMoveSquare = (row: number, col: number) => {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  const isEnemyPiece = (row: number, col: number) => {
    const piece = board[row][col]
    return piece && piece.color !== playerColor
  }

  const isLightSquare = (row: number, col: number) => {
    return (row + col) % 2 === 0
  }

  // Flip board if playing as black
  const displayBoard = playerColor === "black" ? [...board].reverse().map((row) => [...row].reverse()) : board

  const getActualPosition = (displayRow: number, displayCol: number): Position => {
    if (playerColor === "black") {
      return { row: 7 - displayRow, col: 7 - displayCol }
    }
    return { row: displayRow, col: displayCol }
  }

  return (
    <div className="inline-block border-8 border-amber-900 rounded-lg overflow-hidden shadow-2xl">
      <div className="grid grid-cols-8 gap-0">
        {displayBoard.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const actualPos = getActualPosition(rowIndex, colIndex)
            const isLight = isLightSquare(actualPos.row, actualPos.col)
            const isSelected = isSquareSelected(actualPos.row, actualPos.col)
            const isValidMove = isValidMoveSquare(actualPos.row, actualPos.col)

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(actualPos.row, actualPos.col)}
                disabled={isGameOver}
                className={cn(
                  "md:w-20 md:h-20 max-md:w-16 max-md:h-16 max-sm:w-9 max-sm:h-9 flex items-center justify-center relative transition-colors",
                  isLight ? "bg-amber-300" : "bg-amber-600",
                  isSelected && "ring-2 sm:ring-4 md:ring-6 ring-green-500 ring-inset",
                  isValidMove && !isEnemyPiece(actualPos.row, actualPos.col) && "after:absolute after:w-4 after:h-4 md:after:w-8 md:after:h-8 after:rounded-full after:bg-green-500/80",
                  isValidMove && isEnemyPiece(actualPos.row, actualPos.col) && "ring-2 sm:ring-4 md:ring-6 ring-red-600 ring-inset",
                  !isGameOver && currentTurn === playerColor && "hover:brightness-95 cursor-pointer",
                  (isGameOver || currentTurn !== playerColor) && "cursor-not-allowed",
                )}
              >
                {piece && <ChessPiece piece={piece} size={55} />}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
