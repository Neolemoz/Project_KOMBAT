import { useMemo, useState } from "react"

function normalizeOwner(owner) {
  if (owner === "P1" || owner === "PLAYER_1") return "PLAYER_1"
  if (owner === "P2" || owner === "PLAYER_2") return "PLAYER_2"
  return null
}

function shortLabel(name) {
  return String(name || "").slice(0, 3).toUpperCase()
}

function hexPointsFlatTop(cx, cy, size) {
  const points = []

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i)
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }

  return points.join(" ")
}

function hexToPixelFlatTopOffset(row, col, size) {
  const hexHeight = Math.sqrt(3) * size
  const x = (col - 1) * (size * 1.5)
  const y = (row - 1) * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0)

  return { x, y }
}

function getHexVisualState(hex, isHovered) {
  const owner = normalizeOwner(hex.owner)

  let fill = "#d1d5db"
  if (owner === "PLAYER_1") fill = "#9cffc2"
  if (owner === "PLAYER_2") fill = "#ffa6a6"

  let stroke = "rgba(100,116,139,0.55)"
  let strokeWidth = 1.8
  let strokeDasharray
  let filter = "none"
  const opacity = 1

  if (hex.isBuyable) {
    fill = isHovered ? "#fde68a" : "#fef3c7"
    stroke = "#facc15"
    strokeWidth = 3.2
    strokeDasharray = "8 4"
    filter =
      "drop-shadow(0 0 12px rgba(250,204,21,0.75)) drop-shadow(0 0 22px rgba(245,158,11,0.28))"
  }

  if (hex.isSpawnable && owner !== null) {
    stroke = "#4ade80"
    strokeWidth = 3
    strokeDasharray = undefined
    filter = "drop-shadow(0 0 12px rgba(74,222,128,0.65))"
  }

  if (hex.isSelected) {
    stroke = "#4ade80"
    strokeWidth = 3.4
    strokeDasharray = undefined
    filter = "drop-shadow(0 0 16px rgba(74,222,128,0.85))"
  }

  if (isHovered) {
    filter =
      hex.isSelected || hex.isSpawnable
        ? "drop-shadow(0 0 16px rgba(74,222,128,0.85))"
        : hex.isBuyable
          ? "drop-shadow(0 0 14px rgba(250,204,21,0.8))"
          : "drop-shadow(0 0 10px rgba(148,163,184,0.25))"
  }

  return { fill, stroke, strokeWidth, strokeDasharray, filter, opacity }
}

export default function HexBoard({
  rows,
  cols,
  boardState,
  activePlayer,
  actionHighlight,
  buyHex,
  spawnMinion,
  size = 92,
  padding = 24,
  className = "",
}) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const resolvedActivePlayer = normalizeOwner(activePlayer)
  const hoverScale = 1.05

  function handleHexClick(hex) {
    if (hex.isBuyable) {
      buyHex?.(hex)
      return
    }

    if (hex.isOccupied) return

    if (normalizeOwner(hex.owner) === resolvedActivePlayer) {
      spawnMinion?.(hex)
    }
  }

  const layout = useMemo(() => {
    const cells = []

    for (let row = 1; row <= rows; row += 1) {
      for (let col = 1; col <= cols; col += 1) {
        const key = `${row},${col}`
        const boardCell = boardState[key]
        if (!boardCell) continue

        const { x, y } = hexToPixelFlatTopOffset(row, col, size)
        cells.push({
          ...boardCell,
          key,
          x: x + padding,
          y: y + padding,
        })
      }
    }

    if (cells.length === 0) {
      return { width: 0, height: 0, cells: [] }
    }

    const halfHeight = (Math.sqrt(3) / 2) * size
    const hoverBleed = size * (hoverScale - 1)
    const labelBleedX = 84
    const labelBleedTop = 26
    const labelBleedBottom = 28
    const glowBleed = 28
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const cell of cells) {
      minX = Math.min(minX, cell.x - size - hoverBleed)
      maxX = Math.max(maxX, cell.x + size + hoverBleed + labelBleedX)
      minY = Math.min(minY, cell.y - halfHeight - hoverBleed - labelBleedTop)
      maxY = Math.max(maxY, cell.y + halfHeight + hoverBleed + labelBleedBottom)
    }

    const margin = Math.max(28, size + glowBleed - 28)

    return {
      width: maxX - minX + margin * 2,
      height: maxY - minY + margin * 2,
      cells: cells.map((cell) => ({
        ...cell,
        x: cell.x - minX + margin,
        y: cell.y - minY + margin,
      })),
    }
  }, [boardState, cols, padding, rows, size, hoverScale])

  const renderedCells = useMemo(() => {
    return [...layout.cells].sort((left, right) => {
      const leftPriority = left.isBuyable ? 3 : left.isSelected ? 2 : left.isSpawnable ? 1 : 0
      const rightPriority = right.isBuyable ? 3 : right.isSelected ? 2 : right.isSpawnable ? 1 : 0

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.row - right.row || left.col - right.col
    })
  }, [layout.cells])

  const columnAnchors = useMemo(() => {
    return Array.from({ length: cols }, (_, index) => {
      const col = index + 1
      const anchor = layout.cells.find((cell) => cell.row === 1 && cell.col === col)
      return {
        col,
        x: anchor?.x ?? 0,
      }
    })
  }, [cols, layout.cells])

  const rowAnchors = useMemo(() => {
    return Array.from({ length: rows }, (_, index) => {
      const row = index + 1
      const anchor = layout.cells.find((cell) => cell.row === row && cell.col === 1)
      return {
        row,
        y: anchor?.y ?? 0,
      }
    })
  }, [layout.cells, rows])

  const highlightCells = useMemo(() => {
    if (!actionHighlight) return []

    const items = []
    if (actionHighlight.fromKey) items.push({ key: actionHighlight.fromKey, kind: "from" })
    if (actionHighlight.toKey) items.push({ key: actionHighlight.toKey, kind: "to" })
    if (actionHighlight.targetKey) items.push({ key: actionHighlight.targetKey, kind: "target" })
    return items
      .map((item) => ({
        ...item,
        hex: layout.cells.find((cell) => cell.key === item.key),
      }))
      .filter((item) => item.hex)
  }, [actionHighlight, layout.cells])

  return (
    <div className={`relative min-h-0 min-w-0 ${className}`}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full min-h-0 min-w-0 select-none"
      >
        <text
          x={6}
          y={18}
          fontSize="20"
          fontWeight="700"
          fill="rgba(255,255,255,0.88)"
        >
          col
        </text>

        {columnAnchors.map((item) => (
          <text
            key={`col-label-${item.col}`}
            x={item.x}
            y={18}
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="rgba(255,255,255,0.88)"
          >
            {item.col}
          </text>
        ))}

        <text
          x={0}
          y={40}
          fontSize="20"
          fontWeight="700"
          fill="rgba(255,255,255,0.88)"
        >
          row
        </text>

        {rowAnchors.map((item) => (
          <text
            key={`row-label-${item.row}`}
            x={8}
            y={item.y + 4}
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="rgba(255,255,255,0.88)"
          >
            {item.row}
          </text>
        ))}

        {renderedCells.map((hex) => {
          const isHovered = hoveredKey === hex.key
          const points = hexPointsFlatTop(hex.x, hex.y, size)
          const visual = getHexVisualState(hex, isHovered)
          return (
            <polygon
              key={`fill-${hex.key}`}
              points={points}
              fill={visual.fill}
              stroke="none"
              style={{
                opacity: visual.opacity,
                transition:
                  "transform 140ms ease, filter 160ms ease, stroke 140ms ease, fill 140ms ease, opacity 140ms ease",
              }}
            />
          )
        })}

        {renderedCells.map((hex) => {
          const isHovered = hoveredKey === hex.key
          const points = hexPointsFlatTop(hex.x, hex.y, size)
          const visual = getHexVisualState(hex, isHovered)
          const isClickable =
            !hex.isOccupied &&
            (hex.isBuyable || normalizeOwner(hex.owner) === resolvedActivePlayer)
          const transform = isHovered
            ? `translate(${hex.x} ${hex.y}) scale(${hoverScale}) translate(${-hex.x} ${-hex.y})`
            : undefined

          return (
            <g
              key={hex.key}
              style={{
                transform,
                transformOrigin: `${hex.x}px ${hex.y}px`,
                transition:
                  "transform 140ms ease, filter 160ms ease, stroke 140ms ease, fill 140ms ease, opacity 140ms ease",
              }}
            >
              <polygon
                points={points}
                fill="transparent"
                stroke={visual.stroke}
                strokeWidth={visual.strokeWidth}
                strokeDasharray={visual.strokeDasharray}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  filter: visual.filter,
                  opacity: visual.opacity,
                }}
                onMouseEnter={() => setHoveredKey(hex.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => handleHexClick(hex)}
              />

              {hex.isOccupied && hex.minion ? (
                <g style={{ pointerEvents: "none" }}>
                  <text
                    x={hex.x}
                    y={hex.y - 8}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="800"
                    fill="rgba(255,255,255,0.96)"
                  >
                    {shortLabel(hex.minion.name)}
                  </text>

                  <rect
                    x={hex.x - 24}
                    y={hex.y + 4}
                    width="48"
                    height="20"
                    rx="10"
                    fill="rgba(2,6,23,0.82)"
                    stroke="rgba(255,255,255,0.14)"
                  />

                  <text
                    x={hex.x}
                    y={hex.y + 18}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="800"
                    fill="rgba(255,255,255,0.92)"
                  >
                    {hex.minion.hp} HP
                  </text>
                </g>
              ) : null}
            </g>
          )
        })}

        {highlightCells.map(({ key, kind, hex }) => {
          const color =
            kind === "from"
              ? "rgba(250,204,21,0.95)"
              : kind === "to"
                ? "rgba(34,197,94,0.95)"
                : "rgba(248,113,113,0.95)"

          return (
            <g key={`highlight-${kind}-${key}`} style={{ pointerEvents: "none" }}>
              <circle
                cx={hex.x}
                cy={hex.y}
                r={size * 0.34}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={kind === "target" ? "6 4" : undefined}
                opacity="0.95"
              />
              <circle
                cx={hex.x}
                cy={hex.y}
                r={size * 0.18}
                fill={color}
                opacity="0.18"
              />
            </g>
          )
        })}

        {hoveredKey && (() => {
          const hovered = layout.cells.find((cell) => cell.key === hoveredKey)
          if (!hovered) return null

          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={hovered.x + 18}
                y={hovered.y - 48}
                width="152"
                height="40"
                rx="12"
                fill="rgba(2,6,23,0.78)"
                stroke="rgba(255,255,255,0.12)"
              />
              <text
                x={hovered.x + 94}
                y={hovered.y - 22}
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill="rgba(255,255,255,0.93)"
              >
                {`HEX ${hovered.row},${hovered.col}`}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
