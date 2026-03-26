import { useEffect, useMemo, useRef, useState } from "react"
import { hexPointsFlatTop, hexToPixelFlatTop } from "../../utils/hexMath"

export default function BoardSVG({
  rows,
  cols,
  selected,
  spawnZone,
  activePlayer,
  onHexClick,
  size = 54,
  padding = 40,
  className = "",
}) {
  const spawnFill =
    activePlayer === "P1"
      ? "#60a5fa"
      : "#fb7185"

  const [hover, setHover] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const velocity = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const pointerState = useRef({ id: null, x: 0, y: 0 })
  const movedRef = useRef(false)
  const suppressClickRef = useRef(false)

  const boardLayout = useMemo(() => {
    const items = []
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const { x, y } = hexToPixelFlatTop(r, c, size)
        items.push({ row: r, col: c, x: x + padding, y: y + padding })
      }
    }

    if (items.length === 0) return { width: 0, height: 0, hexes: [] }

    const halfH = (Math.sqrt(3) / 2) * size
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity

    for (const h of items) {
      minX = Math.min(minX, h.x - size)
      maxX = Math.max(maxX, h.x + size)
      minY = Math.min(minY, h.y - halfH)
      maxY = Math.max(maxY, h.y + halfH)
    }

    const margin = 20
    const width = maxX - minX + margin * 2
    const height = maxY - minY + margin * 2

    return {
      width,
      height,
      hexes: items.map((hex) => ({
        ...hex,
        x: hex.x - minX + margin,
        y: hex.y - minY + margin,
      })),
    }
  }, [rows, cols, size, padding])

  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => {
      const seed = index + 1
      const x = ((seed * 73) % 1000) / 1000
      const y = ((seed * 137) % 1000) / 1000
      const radius = 2 + (seed % 4)
      const duration = 3.5 + (seed % 5) * 0.45
      const delay = (seed % 6) * 0.35
      const color = seed % 3 === 0 ? "rgba(250,204,21,0.75)" : "rgba(96,165,250,0.65)"

      return { id: seed, x, y, radius, duration, delay, color }
    })
  }, [])

  useEffect(() => {
    if (isDragging) return undefined

    let rafId = 0
    const loop = () => {
      velocity.current.x *= 0.92
      velocity.current.y *= 0.92

      if (Math.abs(velocity.current.x) <= 0.1 && Math.abs(velocity.current.y) <= 0.1) {
        velocity.current = { x: 0, y: 0 }
        return
      }

      setOffset((current) => ({
        x: current.x + velocity.current.x,
        y: current.y + velocity.current.y,
      }))

      rafId = requestAnimationFrame(loop)
    }

    if (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1) {
      rafId = requestAnimationFrame(loop)
    }

    return () => cancelAnimationFrame(rafId)
  }, [isDragging])

  const handleWheel = (event) => {
    event.preventDefault()
    const delta = -event.deltaY * 0.001
    setZoom((current) => Math.min(Math.max(0.6, current + delta), 2.5))
  }

  const handlePointerDown = (event) => {
    dragging.current = true
    movedRef.current = false
    suppressClickRef.current = false
    velocity.current = { x: 0, y: 0 }
    pointerState.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragging.current || pointerState.current.id !== event.pointerId) return

    const deltaX = event.clientX - pointerState.current.x
    const deltaY = event.clientY - pointerState.current.y

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      movedRef.current = true
    }

    pointerState.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    velocity.current = { x: deltaX, y: deltaY }
    setOffset((current) => ({ x: current.x + deltaX, y: current.y + deltaY }))
  }

  const handlePointerUp = (event) => {
    if (pointerState.current.id !== event.pointerId) return

    dragging.current = false
    pointerState.current = { id: null, x: 0, y: 0 }
    setIsDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (movedRef.current) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 120)
    }
  }

  const stageTransform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <div
        className={`absolute inset-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          transform: stageTransform,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <svg
          viewBox={`0 0 ${boardLayout.width} ${boardLayout.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full select-none board-breathe"
        >
          <defs>
            <filter id="particleGlow" x="-200%" y="-200%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {boardLayout.hexes.map((h) => {
          const key = `${h.row},${h.col}`
          const isSpawn = spawnZone?.has(key)
          const isSelected =
            selected && selected.row === h.row && selected.col === h.col
          const isHovered = hover && hover.row === h.row && hover.col === h.col

          const fill = isSpawn ? spawnFill : "#e5e7eb"
          const stroke = isSelected
            ? "#facc15"
            : isHovered
              ? "#93c5fd"
              : "rgba(30,41,59,0.55)"
          const glowColor = isSelected
            ? "rgba(250,204,21,0.9)"
            : isHovered
              ? "rgba(96,165,250,0.8)"
              : isSpawn
                ? "rgba(96,165,250,0.65)"
                : "none"

          const strokeWidth = isSelected ? 4 : isHovered ? 2.5 : 1.5
          const pts = hexPointsFlatTop(h.x, h.y, size)

          return (
            <g key={key}>
              <polygon
                points={pts}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{
                  cursor: "pointer",
                  filter:
                    isHovered || isSelected || isSpawn
                      ? `drop-shadow(0 0 8px ${glowColor})`
                      : "none",
                  transition: "filter 120ms ease, stroke 120ms ease",
                }}
                onMouseEnter={() =>
                  setHover({ row: h.row, col: h.col, x: h.x, y: h.y })
                }
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (suppressClickRef.current) return
                  onHexClick?.(h.row, h.col)
                }}
              >
                <title>{`(${h.row}, ${h.col})`}</title>
              </polygon>

              <text
                x={h.x}
                y={h.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="rgba(15,23,42,0.72)"
                style={{ pointerEvents: "none" }}
              >
                {h.row},{h.col}
              </text>
            </g>
          )
          })}

          {particles.map((particle) => (
            <circle
              key={particle.id}
              cx={particle.x * boardLayout.width}
              cy={particle.y * boardLayout.height}
              r={particle.radius}
              fill={particle.color}
              opacity="0.75"
              filter="url(#particleGlow)"
              className="magic-particle"
              style={{
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}

          {hover && (
            <g style={{ pointerEvents: "none" }}>
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
    </div>
  )
}
