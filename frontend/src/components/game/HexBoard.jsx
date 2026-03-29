import { useMemo, useState } from "react"

function normalizeOwner(owner) {
  if (owner === "P1" || owner === "PLAYER_1") return "PLAYER_1"
  if (owner === "P2" || owner === "PLAYER_2") return "PLAYER_2"
  return null
}

function shortLabel(name) {
  return String(name || "").slice(0, 3).toUpperCase()
}

function resolveMinionOwner(hex) {
  if (hex?.minion?.ownerId === 1 || hex?.minion?.owner === "P1") return "PLAYER_1"
  if (hex?.minion?.ownerId === 2 || hex?.minion?.owner === "P2") return "PLAYER_2"
  return normalizeOwner(hex?.owner)
}

function hexPointsFlatTop(cx, cy, size) {
  const points = []

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i)
    const x = Math.round((cx + size * Math.cos(angle)) * 2) / 2
    const y = Math.round((cy + size * Math.sin(angle)) * 2) / 2
    points.push(`${x},${y}`)
  }

  return points.join(" ")
}

function hexToPixelFlatTopOffset(row, col, size, gap = 0) {
  const hexHeight = Math.sqrt(3) * size
  const horizontalStep = size * 1.5 + gap
  const verticalStep = hexHeight + gap
  const x = (col - 1) * horizontalStep
  const y = (row - 1) * verticalStep + (col % 2 === 1 ? verticalStep / 2 : 0)

  return { x, y }
}

function getHexVisualState(hex, isHovered) {
  const owner = normalizeOwner(hex.owner)

  let fillId = "hex-gradient-neutral"
  if (owner === "PLAYER_1") fillId = "hex-gradient-p1"
  if (owner === "PLAYER_2") fillId = "hex-gradient-p2"

  let stroke = "rgba(142, 162, 196, 0.8)"
  let strokeWidth = 2.4
  let strokeDasharray
  let filter = "url(#hex-glow-neutral)"
  let overlayFill = "rgba(255,255,255,0.06)"
  const opacity = 1

  if (hex.isBuyable) {
    fillId = "hex-gradient-buyable"
    stroke = "rgba(250,204,21,0.95)"
    strokeWidth = 3
    strokeDasharray = "8 4"
    filter = "url(#hex-glow-buyable)"
    overlayFill = isHovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.1)"
  }

  if (hex.isSpawnable && owner !== null) {
    stroke = "rgba(125,211,252,0.92)"
    strokeWidth = 3
    strokeDasharray = undefined
    filter = owner === "PLAYER_1" ? "url(#hex-glow-p1)" : "url(#hex-glow-p2)"
  }

  if (hex.isSelected) {
    fillId = owner === "PLAYER_2" ? "hex-gradient-p2" : owner === "PLAYER_1" ? "hex-gradient-p1" : fillId
    stroke = "rgba(255,214,102,0.98)"
    strokeWidth = 4
    strokeDasharray = undefined
    filter = "url(#hex-glow-selected)"
    overlayFill = "rgba(255,245,200,0.14)"
  }

  if (isHovered) {
    filter = hex.isSelected
      ? "url(#hex-glow-selected)"
      : owner === "PLAYER_1"
        ? "url(#hex-glow-p1-strong)"
        : owner === "PLAYER_2"
          ? "url(#hex-glow-p2-strong)"
          : hex.isBuyable
            ? "url(#hex-glow-buyable-strong)"
            : "url(#hex-glow-hover)"
    strokeWidth += 0.4
    overlayFill = "rgba(255,255,255,0.16)"
  }

  return { fillId, stroke, strokeWidth, strokeDasharray, filter, opacity, overlayFill }
}

export default function HexBoard({
  rows,
  cols,
  boardState,
  activePlayer,
  actionHighlight,
  buyHex,
  spawnMinion,
  size = 96,
  gap = 10,
  padding = 24,
  className = "",
}) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const resolvedActivePlayer = normalizeOwner(activePlayer)
  const hoverScale = 1.05
  const axisFontSize = Math.max(24, size * 0.42)
  const axisTextProps = {
    fontSize: axisFontSize,
    fontWeight: "700",
    fill: "rgba(255,255,255,0.9)",
    fontFamily: '"Cinzel", "Times New Roman", serif',
    letterSpacing: "0.08em",
    dominantBaseline: "middle",
  }

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

        const { x, y } = hexToPixelFlatTopOffset(row, col, size, gap)
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
    const labelBleedLeft = 124
    const labelBleedRight = 40
    const labelBleedTop = 6
    const labelBleedBottom = 8
    const glowBleed = 28
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const cell of cells) {
      minX = Math.min(minX, cell.x - size - hoverBleed - labelBleedLeft)
      maxX = Math.max(maxX, cell.x + size + hoverBleed + labelBleedRight)
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
  }, [boardState, cols, gap, padding, rows, size, hoverScale])

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
  const firstColumnX = columnAnchors[0]?.x ?? 0
  const firstRowY = rowAnchors[0]?.y ?? 0
  const boardTopY = useMemo(() => {
    if (layout.cells.length === 0) return 0
    const halfHeight = (Math.sqrt(3) / 2) * size
    return layout.cells.reduce((minY, cell) => Math.min(minY, cell.y - halfHeight), Infinity)
  }, [layout.cells, size])
  const axisLabelX = Math.max(axisFontSize * 1.6, firstColumnX - size * 2.1)
  const colLabelY = Math.max(axisFontSize * 0.72, boardTopY - axisFontSize * 0.55)
  const rowLabelY = colLabelY + axisFontSize * 1.15
  const rowNumberX = Math.max(axisFontSize * 2, firstColumnX - size * 2.45)

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

  const spawnIndexByCellKey = useMemo(() => {
    const groups = {
      PLAYER_1: [],
      PLAYER_2: [],
    }

    for (const cell of layout.cells) {
      if (!cell?.isOccupied || !cell?.minion) continue
      const owner = resolveMinionOwner(cell)
      if (!owner) continue
      groups[owner].push(cell)
    }

    const next = {}

    for (const owner of Object.keys(groups)) {
      groups[owner]
        .sort((left, right) => {
          const leftCreatedAt = Number(left.minion?.createdAt ?? 0)
          const rightCreatedAt = Number(right.minion?.createdAt ?? 0)

          if (leftCreatedAt && rightCreatedAt && leftCreatedAt !== rightCreatedAt) {
            return leftCreatedAt - rightCreatedAt
          }

          const leftId = String(left.minion?.id ?? "")
          const rightId = String(right.minion?.id ?? "")
          if (leftId && rightId && leftId !== rightId) {
            return leftId.localeCompare(rightId)
          }

          return left.row - right.row || left.col - right.col
        })
        .forEach((cell, index) => {
          next[cell.key] = index + 1
        })
    }

    return next
  }, [layout.cells])

  return (
    <div
      className={`relative min-h-0 min-w-0 ${className}`}
      style={{
        width: layout.width || 0,
        height: layout.height || 0,
        flex: "0 0 auto",
      }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMinYMin meet"
        width={layout.width || 0}
        height={layout.height || 0}
        className="block select-none"
        style={{ shapeRendering: "crispEdges", textRendering: "geometricPrecision" }}
      >
        <defs>
          <linearGradient id="hex-gradient-neutral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f6fb" />
            <stop offset="60%" stopColor="#d9e0ec" />
            <stop offset="100%" stopColor="#c3ccdb" />
          </linearGradient>
          <linearGradient id="hex-gradient-p1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bbfbff" />
            <stop offset="55%" stopColor="#8ef3d3" />
            <stop offset="100%" stopColor="#65d6ff" />
          </linearGradient>
          <linearGradient id="hex-gradient-p2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffc0cb" />
            <stop offset="55%" stopColor="#ff9ba8" />
            <stop offset="100%" stopColor="#ff6f8f" />
          </linearGradient>
          <linearGradient id="hex-gradient-buyable" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9d8" />
            <stop offset="60%" stopColor="#ffefad" />
            <stop offset="100%" stopColor="#f6d45b" />
          </linearGradient>
          <filter id="hex-glow-neutral" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#9fb0d1" floodOpacity="0.18" />
          </filter>
          <filter id="hex-glow-hover" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#e0f2fe" floodOpacity="0.4" />
          </filter>
          <filter id="hex-glow-buyable" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#facc15" floodOpacity="0.4" />
          </filter>
          <filter id="hex-glow-buyable-strong" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fde047" floodOpacity="0.65" />
          </filter>
          <filter id="hex-glow-p1" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22d3ee" floodOpacity="0.42" />
          </filter>
          <filter id="hex-glow-p1-strong" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#67e8f9" floodOpacity="0.72" />
          </filter>
          <filter id="hex-glow-p2" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#fb7185" floodOpacity="0.42" />
          </filter>
          <filter id="hex-glow-p2-strong" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#fb7185" floodOpacity="0.72" />
          </filter>
          <filter id="hex-glow-selected" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#ffd166" floodOpacity="0.8" />
          </filter>
        </defs>

        <text
          x={axisLabelX}
          y={colLabelY}
          textAnchor="middle"
          {...axisTextProps}
        >
          COL
        </text>

        {columnAnchors.map((item) => (
          <text
            key={`col-label-${item.col}`}
            x={item.x}
            y={colLabelY}
            textAnchor="middle"
            {...axisTextProps}
          >
            {item.col}
          </text>
        ))}

        <text
          x={axisLabelX}
          y={rowLabelY}
          textAnchor="middle"
          {...axisTextProps}
        >
          ROW
        </text>

        {rowAnchors.map((item) => (
          <text
            key={`row-label-${item.row}`}
            x={rowNumberX}
            y={item.y}
            textAnchor="middle"
            {...axisTextProps}
          >
            {item.row}
          </text>
        ))}

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
                fill={`url(#${visual.fillId})`}
                stroke={visual.stroke}
                strokeWidth={visual.strokeWidth}
                strokeDasharray={visual.strokeDasharray}
                strokeLinecap="round"
                strokeLinejoin="round"
                shapeRendering="geometricPrecision"
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  filter: visual.filter,
                  opacity: visual.opacity,
                }}
                className={[
                  "transition-all duration-200",
                  hex.isSelected ? "hex-selected-pulse" : "",
                ].join(" ")}
                onMouseEnter={() => setHoveredKey(hex.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => handleHexClick(hex)}
              />
              <polygon
                points={points}
                fill={visual.overlayFill}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
                strokeLinejoin="round"
                style={{ pointerEvents: "none", mixBlendMode: "screen" }}
              />

              {hex.isOccupied && hex.minion ? (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={hex.x - 16}
                    y={hex.y - 30}
                    width="32"
                    height="16"
                    rx="8"
                    fill={
                      resolveMinionOwner(hex) === "PLAYER_1"
                        ? "rgba(16,64,108,0.94)"
                        : "rgba(114,33,74,0.94)"
                    }
                    stroke={
                      resolveMinionOwner(hex) === "PLAYER_1"
                        ? "rgba(125,211,252,0.42)"
                        : "rgba(249,168,212,0.42)"
                    }
                  />
                  <text
                    x={hex.x}
                    y={hex.y - 19}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="800"
                    fill="rgba(255,255,255,0.96)"
                    letterSpacing="0.08em"
                  >
                    {spawnIndexByCellKey[hex.key] ?? 1}
                  </text>

                  <text
                    x={hex.x}
                    y={hex.y - 1}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="800"
                    fill="rgba(248,250,252,0.98)"
                    stroke="rgba(15,23,42,0.7)"
                    strokeWidth="0.85"
                    paintOrder="stroke"
                    letterSpacing="0.04em"
                  >
                    {shortLabel(hex.minion.name)}
                  </text>

                  <rect
                    x={hex.x - 24}
                    y={hex.y + 4}
                    width="48"
                    height="20"
                    rx="10"
                    fill={
                      resolveMinionOwner(hex) === "PLAYER_1"
                        ? "rgba(16,64,108,0.94)"
                        : "rgba(114,33,74,0.94)"
                    }
                    stroke={
                      resolveMinionOwner(hex) === "PLAYER_1"
                        ? "rgba(125,211,252,0.42)"
                        : "rgba(249,168,212,0.42)"
                    }
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
