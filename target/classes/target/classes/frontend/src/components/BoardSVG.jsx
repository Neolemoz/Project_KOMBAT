import { useMemo, useState } from "react"
import { hexPointsFlatTop, hexToPixelFlatTop } from "../utils/hexMath"

export default function BoardSVG({
  rows,
  cols,
  selected,     // {row,col} or null
  spawnZone,    // Set of "r,c"
  activePlayer, // "P1" | "P2"
  onHexClick,   // (row,col) => void
}) {
  const size = 45 // ปรับได้ (ยิ่งมาก ยิ่งใหญ่)
  const padding = 60

  const spawnFill =
    activePlayer === "P1" ? "rgba(125, 211, 252, 0.22)" : "rgba(251, 113, 133, 0.22)"

  const [hover, setHover] = useState(null) // {row,col, x, y}

  const hexes = useMemo(() => {
    const items = []
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const { x, y } = hexToPixelFlatTop(r, c, size)
        items.push({ row: r, col: c, x: x + padding, y: y + padding })
      }
    }
    return items
  }, [rows, cols, size])

  const bounds = useMemo(() => {
    const boardWidth = cols * (1.5 * size) + size * 2 + padding * 2
    const boardHeight = rows * (Math.sqrt(3) * size) + padding * 2
    return { w: boardWidth, h: boardHeight }
  }, [cols, rows, size, padding])

  return (
    <div className="relative">
      <svg
        width={bounds.w}
        height={bounds.h}
        viewBox={`0 0 ${bounds.w} ${bounds.h}`}
        className="select-none"
      >
        {/* board */}
        {hexes.map((h) => {
          const key = `${h.row},${h.col}`
          const isSpawn = spawnZone?.has(key)
          const isSelected = selected && selected.row === h.row && selected.col === h.col
          const isHovered = hover && hover.row === h.row && hover.col === h.col

          const fill = isSpawn ? spawnFill : "rgba(255,255,255,0.95)"
          const stroke = isSelected
            ? "rgba(255,215,0,0.95)"
            : isHovered
              ? "rgba(148,163,184,0.9)"
              : "rgba(30,41,59,0.55)"

          const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1

          const pts = hexPointsFlatTop(h.x, h.y, size)

          return (
            <g key={key}>
              <polygon
                points={pts}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ row: h.row, col: h.col, x: h.x, y: h.y })}
                onMouseLeave={() => setHover(null)}
                onClick={() => onHexClick?.(h.row, h.col)}
              >
                {/* tooltip แบบ native */}
                <title>{`(${h.row}, ${h.col})`}</title>
              </polygon>

              {/* label เล็กๆ ในช่อง */}
              <text
                x={h.x}
                y={h.y + 4}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(15,23,42,0.55)"
              >
                {h.row},{h.col}
              </text>
            </g>
          )
        })}

        {/* hover tooltip แบบ custom */}
        {hover && (
          <g>
            <rect
              x={hover.x + 14}
              y={hover.y - 30}
              width="64"
              height="22"
              rx="6"
              fill="rgba(0,0,0,0.55)"
              stroke="rgba(255,255,255,0.18)"
            />
            <text
              x={hover.x + 46}
              y={hover.y - 15}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(255,255,255,0.9)"
            >
              {hover.row},{hover.col}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
