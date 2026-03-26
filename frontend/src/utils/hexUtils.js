const DIRECTIONS = [
  "up",
  "down",
  "upleft",
  "upright",
  "downleft",
  "downright",
]

function normalizeOwner(owner) {
  if (owner === "P1" || owner === "PLAYER_1") return "P1"
  if (owner === "P2" || owner === "PLAYER_2") return "P2"
  return null
}

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
      const zoneOwner = zones.P1.has(key) ? "P1" : zones.P2.has(key) ? "P2" : null
      const owner = normalizeOwner(zoneOwner ?? existing.owner)
      const minion = existing.minion ?? null

      next[key] = {
        ...createEmptyCell(row, col),
        ...existing,
        row,
        col,
        owner,
        minion,
        isSpawnable: Boolean(existing.isSpawnable ?? owner),
        isOccupied: Boolean(minion),
        isBuyable: Boolean(existing.isBuyable),
        isSelected: Boolean(existing.isSelected),
      }
    }
  }

  return next
}

function getNeighborCoord(row, col, direction) {
  const isOddCol = col % 2 !== 0

  switch (direction) {
    case "up":
      return { row: row - 1, col: col }
    case "down":
      return { row: row + 1, col: col }
    case "upleft":
      return { row: isOddCol ? row : row - 1, col: col - 1 }
    case "upright":
      return { row: isOddCol ? row : row - 1, col: col + 1 }
    case "downleft":
      return { row: isOddCol ? row + 1 : row, col: col - 1 }
    case "downright":
      return { row: isOddCol ? row + 1 : row, col: col + 1 }
    default:
      return null
  }
}

export function getNeighborCoords(row, col, boardState = null) {
  const neighbors = DIRECTIONS.map((direction) => getNeighborCoord(row, col, direction)).filter(Boolean)

  if (!boardState) {
    return neighbors
  }

  return neighbors.filter(({ row: neighborRow, col: neighborCol }) =>
    Object.prototype.hasOwnProperty.call(boardState, `${neighborRow},${neighborCol}`)
  )
}

export function computeBuyableHexes(boardState, activePlayer) {
  const normalizedPlayer = normalizeOwner(activePlayer)
  const next = {}
  const ownedCells = []

  Object.values(boardState).forEach((cell) => {
    const owner = normalizeOwner(cell.owner)
    const key = `${cell.row},${cell.col}`
    const nextCell = {
      ...cell,
      owner,
      isSpawnable: Boolean(owner),
      isOccupied: Boolean(cell.minion),
      isBuyable: false,
    }

    next[key] = nextCell

    if (owner === normalizedPlayer) {
      ownedCells.push(nextCell)
    }
  })

  ownedCells.forEach((cell) => {
    getNeighborCoords(cell.row, cell.col, next).forEach(({ row, col }) => {
      const neighborKey = `${row},${col}`
      const neighbor = next[neighborKey]

      if (!neighbor) return
      if (neighbor.owner !== null) return

      next[neighborKey] = {
        ...neighbor,
        isBuyable: true,
      }
    })
  })

  return next
}
