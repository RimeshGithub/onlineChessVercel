import type { Position } from "./types"

export function positionToAlgebraic(position: Position): string {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
  return `${files[position.col]}${8 - position.row}`
}

export function algebraicToPosition(algebraic: string): Position {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
  const col = files.indexOf(algebraic[0])
  const row = 8 - Number.parseInt(algebraic[1])
  return { row, col }
}
