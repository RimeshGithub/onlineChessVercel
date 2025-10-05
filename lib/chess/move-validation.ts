import type { Board, Position, PieceColor } from "./types"

export function isValidMove(board: Board, from: Position, to: Position, enPassantTarget: Position | null): boolean {
  const piece = board[from.row][from.col]
  if (!piece) return false

  const targetPiece = board[to.row][to.col]

  // Can't capture own pieces
  if (targetPiece && targetPiece.color === piece.color) return false

  // Check if move is valid for piece type
  const validMoves = getValidMovesForPiece(board, from, enPassantTarget)
  return validMoves.some((move) => move.row === to.row && move.col === to.col)
}

export function getValidMovesForPiece(board: Board, position: Position, enPassantTarget: Position | null): Position[] {
  const piece = board[position.row][position.col]
  if (!piece) return []

  switch (piece.type) {
    case "pawn":
      return getPawnMoves(board, position, enPassantTarget)
    case "rook":
      return getRookMoves(board, position)
    case "knight":
      return getKnightMoves(board, position)
    case "bishop":
      return getBishopMoves(board, position)
    case "queen":
      return getQueenMoves(board, position)
    case "king":
      return getKingMoves(board, position)
    default:
      return []
  }
}

function getPawnMoves(board: Board, position: Position, enPassantTarget: Position | null): Position[] {
  const moves: Position[] = []
  const piece = board[position.row][position.col]!
  const direction = piece.color === "white" ? -1 : 1
  const startRow = piece.color === "white" ? 6 : 1

  // Forward move
  const forwardRow = position.row + direction
  if (forwardRow >= 0 && forwardRow < 8 && !board[forwardRow][position.col]) {
    moves.push({ row: forwardRow, col: position.col })

    // Double move from start
    if (position.row === startRow) {
      const doubleRow = position.row + direction * 2
      if (!board[doubleRow][position.col]) {
        moves.push({ row: doubleRow, col: position.col })
      }
    }
  }

  // Captures
  for (const colOffset of [-1, 1]) {
    const newCol = position.col + colOffset
    if (newCol >= 0 && newCol < 8 && forwardRow >= 0 && forwardRow < 8) {
      const targetPiece = board[forwardRow][newCol]
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push({ row: forwardRow, col: newCol })
      }

      // En passant
      if (enPassantTarget && enPassantTarget.row === forwardRow && enPassantTarget.col === newCol) {
        moves.push({ row: forwardRow, col: newCol })
      }
    }
  }

  return moves
}

function getRookMoves(board: Board, position: Position): Position[] {
  return getSlidingMoves(board, position, [
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: 1, col: 0 },
    { row: -1, col: 0 },
  ])
}

function getBishopMoves(board: Board, position: Position): Position[] {
  return getSlidingMoves(board, position, [
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 },
  ])
}

function getQueenMoves(board: Board, position: Position): Position[] {
  return getSlidingMoves(board, position, [
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 },
  ])
}

function getSlidingMoves(board: Board, position: Position, directions: Position[]): Position[] {
  const moves: Position[] = []
  const piece = board[position.row][position.col]!

  for (const dir of directions) {
    let row = position.row + dir.row
    let col = position.col + dir.col

    while (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const targetPiece = board[row][col]

      if (!targetPiece) {
        moves.push({ row, col })
      } else {
        if (targetPiece.color !== piece.color) {
          moves.push({ row, col })
        }
        break
      }

      row += dir.row
      col += dir.col
    }
  }

  return moves
}

function getKnightMoves(board: Board, position: Position): Position[] {
  const moves: Position[] = []
  const piece = board[position.row][position.col]!
  const offsets = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ]

  for (const offset of offsets) {
    const row = position.row + offset.row
    const col = position.col + offset.col

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const targetPiece = board[row][col]
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push({ row, col })
      }
    }
  }

  return moves
}

function getKingMoves(board: Board, position: Position): Position[] {
  const moves: Position[] = []
  const piece = board[position.row][position.col]!

  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) continue

      const row = position.row + rowOffset
      const col = position.col + colOffset

      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const targetPiece = board[row][col]
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ row, col })
        }
      }
    }
  }

  // Castling logic would go here
  return moves
}

export function isKingInCheck(board: Board, kingColor: PieceColor): boolean {
  // Find king position
  let kingPos: Position | null = null
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type === "king" && piece.color === kingColor) {
        kingPos = { row, col }
        break
      }
    }
    if (kingPos) break
  }

  if (!kingPos) return false

  // Check if any opponent piece can attack the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color !== kingColor) {
        const moves = getValidMovesForPiece(board, { row, col }, null)
        if (moves.some((move) => move.row === kingPos!.row && move.col === kingPos!.col)) {
          return true
        }
      }
    }
  }

  return false
}

export function wouldMoveResultInCheck(board: Board, from: Position, to: Position, playerColor: PieceColor): boolean {
  // Create a copy of the board
  const boardCopy = board.map((row) => [...row])

  // Make the move
  boardCopy[to.row][to.col] = boardCopy[from.row][from.col]
  boardCopy[from.row][from.col] = null

  // Check if king is in check
  return isKingInCheck(boardCopy, playerColor)
}

export function isCheckmate(board: Board, playerColor: PieceColor): boolean {
  if (!isKingInCheck(board, playerColor)) return false

  // Check if any move can get out of check
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === playerColor) {
        const moves = getValidMovesForPiece(board, { row, col }, null)
        for (const move of moves) {
          if (!wouldMoveResultInCheck(board, { row, col }, move, playerColor)) {
            return false
          }
        }
      }
    }
  }

  return true
}

export function isStalemate(board: Board, playerColor: PieceColor): boolean {
  if (isKingInCheck(board, playerColor)) return false

  // Check if player has any valid moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === playerColor) {
        const moves = getValidMovesForPiece(board, { row, col }, null)
        for (const move of moves) {
          if (!wouldMoveResultInCheck(board, { row, col }, move, playerColor)) {
            return false
          }
        }
      }
    }
  }

  return true
}
