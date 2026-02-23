import { useMemo, useState } from "react"
import { hexPointsFlatTop, hexToPixelFlatTop } from "../utils/hexMath"

export default function BoardSVG({
  rows,
  cols,
  selected, // {row,col} or null
  spawnZone, // Set of "r,c"
  activePlayer, // "P1" | "P2"
  onHexClick, // (row,col) => void

  // ✅ เพิ่ม: ปรับขนาด hex ได้จากข้างนอก
  size = 54, // เดิม 45 -> ใหญ่ขึ้น
  padding = 40, // เดิม 60 -> ลดนิดให้ compact
  className = "",
}) {
  const spawnFill =
    activePlayer === "P1"
      ? "rgba(125, 211, 252, 0.22)"
      : "rgba(251, 113, 133, 0.22)"

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
  }, [rows, cols, size, padding])

  // ✅ bounds แบบ robust (คำนวณจากตำแหน่งจริง ไม่เดาสูตร)
  const bounds = useMemo(() => {
    if (hexes.length === 0) return { w: 0, h: 0 }

    const halfH = (Math.sqrt(3) / 2) * size
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity

    for (const h of hexes) {
      minX = Math.min(minX, h.x - size)
      maxX = Math.max(maxX, h.x + size)
      minY = Math.min(minY, h.y - halfH)
      maxY = Math.max(maxY, h.y + halfH)
    }

    const margin = 10
    const w = (maxX - minX) + margin * 2
    const h = (maxY - minY) + margin * 2
    return { w, h, minX: minX - margin, minY: minY - margin }
  }, [hexes, size])

  return (
    <div className={`relative ${className}`}>
      <svg
        // ✅ responsive: ให้ parent คุมขนาด
        width="100%"
        height="100%"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="select-none"
      >
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
                <title>{`(${h.row}, ${h.col})`}</title>
              </polygon>

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