export const HEX_DIRECTIONS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [1, -1],
]

function createEmptyCell(row, col) {
  return {
    row,
    col,
    isSpawnable: false,
    isBuyable: false,
    isOccupied: false,
    isSelected: false,
    owner: null,
    minion: null,
  }
}

export function getInitialSpawnZones() {
  return {
    P1: new Set(["1,1", "1,2", "1,3", "2,1", "2,2"]),
    P2: new Set(["8,8", "8,7", "8,6", "7,8", "7,7"]),
  }
}

export function createInitialBoardState(rows = 8, cols = 8, existingBoard = {}) {
  const zones = getInitialSpawnZones()
  const next = {}

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      const key = `${row},${col}`
      const existing = existingBoard[key] ?? {}
      const owner = zones.P1.has(key) ? "P1" : zones.P2.has(key) ? "P2" : existing.owner ?? null
      const minion = existing.minion ?? null

      next[key] = {
        ...createEmptyCell(row, col),
        owner,
        isSpawnable: Boolean(owner),
        minion,
        isOccupied: Boolean(minion),
      }
    }
  }

  return next
}

export function getNeighborCoords(row, col) {
  return HEX_DIRECTIONS.map(([rowDelta, colDelta]) => ({
    row: row + rowDelta,
    col: col + colDelta,
  }))
}

export function computeBuyableHexes(boardState, activePlayer) {
  const next = {}

  Object.values(boardState).forEach((cell) => {
    const key = `${cell.row},${cell.col}`
    next[key] = {
      ...cell,
      isSelected: false,
      isOccupied: Boolean(cell.minion),
      isBuyable: false,
    }
  })

  Object.values(next).forEach((cell) => {
    if (cell.isSpawnable || cell.isOccupied) return

    const hasSpawnableNeighbor = getNeighborCoords(cell.row, cell.col).some(({ row, col }) => {
      const neighbor = next[`${row},${col}`]
      return neighbor && neighbor.isSpawnable && neighbor.owner === activePlayer
    })

    if (hasSpawnableNeighbor) {
      next[`${cell.row},${cell.col}`] = {
        ...cell,
        isBuyable: true,
      }
    }
  })

  return next
}
