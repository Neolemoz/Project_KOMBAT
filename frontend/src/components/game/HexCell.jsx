import { hexPointsFlatTop } from "../../utils/hexMath"

function shortLabel(name) {
  return String(name || "").slice(0, 3).toUpperCase()
}

export default function HexCell({
  cell,
  size,
  onClick,
  onHover,
  onLeave,
}) {
  const { x, y, row, col, minion, isSpawnable, isBuyable, isSelected, isOccupied, owner } = cell
  const points = hexPointsFlatTop(x, y, size)

  const fill = isOccupied
    ? owner === "P1"
      ? "rgba(56,189,248,0.88)"
      : "rgba(244,114,182,0.88)"
    : isSelected
      ? "rgba(34,211,238,0.72)"
      : isSpawnable
        ? "rgba(34,197,94,0.38)"
        : isBuyable
          ? "rgba(250,204,21,0.16)"
          : "rgba(226,232,240,0.92)"

  const stroke = isSelected
    ? "#22d3ee"
    : isBuyable
      ? "#facc15"
      : isSpawnable
        ? "#4ade80"
        : isOccupied
          ? "rgba(255,255,255,0.55)"
          : "rgba(30,41,59,0.5)"

  const strokeDasharray = isBuyable ? "7 5" : undefined
  const filter = isSelected
    ? "drop-shadow(0 0 14px rgba(34,211,238,0.9))"
    : isSpawnable
      ? "drop-shadow(0 0 10px rgba(74,222,128,0.8))"
      : isBuyable
        ? "drop-shadow(0 0 10px rgba(250,204,21,0.7))"
        : isOccupied
          ? owner === "P1"
            ? "drop-shadow(0 0 10px rgba(56,189,248,0.5))"
            : "drop-shadow(0 0 10px rgba(244,114,182,0.5))"
          : "none"

  const isInteractive = isSpawnable || isBuyable

  return (
    <g>
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 4 : 2}
        strokeDasharray={strokeDasharray}
        style={{
          cursor: isInteractive ? "pointer" : isOccupied ? "default" : "not-allowed",
          filter,
          transition: "filter 160ms ease, stroke 160ms ease, fill 160ms ease",
        }}
        onMouseEnter={() => onHover?.({ row, col, x, y })}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <title>{`(${row}, ${col})`}</title>
      </polygon>

      {isOccupied ? (
        <g style={{ pointerEvents: "none" }}>
          <text
            x={x}
            y={y - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="rgba(255,255,255,0.96)"
          >
            {shortLabel(minion.name)}
          </text>
          <g>
            <rect
              x={x - 18}
              y={y + 2}
              width="36"
              height="16"
              rx="8"
              fill="rgba(2,6,23,0.75)"
              stroke="rgba(255,255,255,0.18)"
            />
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="rgba(255,255,255,0.92)"
            >
              {minion.hp} HP
            </text>
          </g>
        </g>
      ) : (
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="rgba(15,23,42,0.6)"
          style={{ pointerEvents: "none" }}
        >
          {row},{col}
        </text>
      )}
    </g>
  )
}
