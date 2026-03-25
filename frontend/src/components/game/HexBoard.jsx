import { useMemo, useState } from "react"
import { hexToPixelFlatTop } from "../../utils/hexMath"
import HexCell from "./HexCell"

export default function HexBoard({
  rows,
  cols,
  boardState,
  activePlayer,
  onHexClick,
  size = 74,
  padding = 70,
  className = "",
}) {
  const [hover, setHover] = useState(null)

  const layout = useMemo(() => {
    const cells = []
    for (let row = 1; row <= rows; row += 1) {
      for (let col = 1; col <= cols; col += 1) {
        const key = `${row},${col}`
        const boardCell = boardState[key]
        if (!boardCell) continue

        const { x, y } = hexToPixelFlatTop(row, col, size)
        cells.push({
          ...boardCell,
          x: x + padding,
          y: y + padding,
        })
      }
    }

    if (cells.length === 0) {
      return { width: 0, height: 0, cells: [] }
    }

    const halfHeight = (Math.sqrt(3) / 2) * size
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const cell of cells) {
      minX = Math.min(minX, cell.x - size)
      maxX = Math.max(maxX, cell.x + size)
      minY = Math.min(minY, cell.y - halfHeight)
      maxY = Math.max(maxY, cell.y + halfHeight)
    }

    const margin = 28
    const width = maxX - minX + margin * 2
    const height = maxY - minY + margin * 2

    return {
      width,
      height,
      cells: cells.map((cell) => ({
        ...cell,
        x: cell.x - minX + margin,
        y: cell.y - minY + margin,
      })),
    }
  }, [boardState, cols, padding, rows, size])

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full select-none"
      >
        <rect
          x="0"
          y="0"
          width={layout.width}
          height={layout.height}
          rx="36"
          fill="rgba(2,6,23,0.18)"
        />

        {layout.cells.map((cell) => (
          <HexCell
            key={`${cell.row},${cell.col}`}
            cell={cell}
            size={size}
            onHover={setHover}
            onLeave={() => setHover(null)}
            onClick={() => onHexClick?.(cell)}
          />
        ))}

        {hover && (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={hover.x + 14}
              y={hover.y - 34}
              width="98"
              height="24"
              rx="8"
              fill="rgba(2,6,23,0.75)"
              stroke="rgba(255,255,255,0.12)"
            />
            <text
              x={hover.x + 63}
              y={hover.y - 18}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="rgba(255,255,255,0.92)"
            >
              {`HEX ${hover.row},${hover.col}`}
            </text>
          </g>
        )}

        <text
          x={layout.width / 2}
          y={layout.height - 18}
          textAnchor="middle"
          fontSize="12"
          fill={activePlayer === "P1" ? "rgba(125,211,252,0.8)" : "rgba(251,113,133,0.8)"}
        >
          {activePlayer === "P1"
            ? "PLAYER 1 TERRITORY ACTIVE"
            : "PLAYER 2 TERRITORY ACTIVE"}
        </text>
      </svg>
    </div>
  )
}
