export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
export type PieceColor = "white" | "black"

export interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isEnPassant?: boolean
  isCastling?: boolean
  promotionPiece?: PieceType
}

export type Board = (ChessPiece | null)[][]

export interface GameState {
  board: Board
  currentTurn: PieceColor
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  enPassantTarget: Position | null
  moveHistory: Move[]
}
