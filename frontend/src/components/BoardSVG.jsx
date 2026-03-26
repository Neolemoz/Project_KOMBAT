import React from "react"

export default function BoardSVG({
                                     rows = 8,
                                     cols = 8,
                                     size = 42,
                                     padding = 40,
                                     selected,
                                     spawnZone,
                                     activePlayer,
                                     boardState,
                                     purchasableHexes,
                                     onHexClick,
                                     className = "",
                                 }) {
    const hexWidth = size * 2
    const hexHeight = Math.sqrt(3) * size
    const horizontalSpacing = hexWidth * 0.75
    const verticalSpacing = hexHeight
    const boardWidth = padding * 2 + (cols - 1) * horizontalSpacing + hexWidth
    const boardHeight = padding * 2 + (rows - 1) * verticalSpacing + hexHeight + (hexHeight / 2)

    const getHexPoints = (cx, cy) => {
        const points = []
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i
            const angle_rad = (Math.PI / 180) * angle_deg
            points.push(`${cx + size * Math.cos(angle_rad)},${cy + size * Math.sin(angle_rad)}`)
        }
        return points.join(" ")
    }

    const renderP1Minion = (cx, cy, hp) => (
        <g className="pointer-events-none drop-shadow-md">
            <circle cx={cx - 10} cy={cy - 12} r={6} fill="#0284C7" />
            <line x1={cx - 10} y1={cy - 6} x2={cx - 10} y2={cy + 8} stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy - 2} x2={cx} y2={cy - 6} stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy - 2} x2={cx - 20} y2={cy + 4} stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy + 8} x2={cx - 18} y2={cy + 20} stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy + 8} x2={cx - 2} y2={cy + 20} stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <circle cx={cx + 6} cy={cy + 2} r={14} fill="#22D3EE" stroke="#083344" strokeWidth="2" />
            <text x={cx + 6} y={cy + 7} textAnchor="middle" fill="#083344" fontSize="14" fontWeight="bold">{hp}</text>
        </g>
    )

    const renderP2Minion = (cx, cy, hp) => (
        <g className="pointer-events-none drop-shadow-md">
            <circle cx={cx - 10} cy={cy - 12} r={6} fill="#C2410C" />
            <path d={`M ${cx - 16} ${cy - 15} Q ${cx - 12} ${cy - 22} ${cx - 10} ${cy - 18}`} fill="none" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M ${cx - 4} ${cy - 15} Q ${cx - 8} ${cy - 22} ${cx - 10} ${cy - 18}`} fill="none" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy - 6} x2={cx - 10} y2={cy + 8} stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy - 2} x2={cx} y2={cy - 6} stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy - 2} x2={cx - 20} y2={cy + 4} stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy + 8} x2={cx - 18} y2={cy + 20} stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
            <line x1={cx - 10} y1={cy + 8} x2={cx - 2} y2={cy + 20} stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
            <path d={`M ${cx - 4} ${cy - 10} L ${cx + 16} ${cy - 10} L ${cx + 16} ${cy + 4} Q ${cx + 6} ${cy + 20} ${cx - 4} ${cy + 4} Z`} fill="#EA580C" stroke="#431407" strokeWidth="2" />
            <text x={cx + 6} y={cy + 5} textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">{hp}</text>
        </g>
    )

    const hexes = []

    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const key = `${r},${c}`

            const yOffset = (c % 2 !== 0) ? hexHeight / 2 : 0
            const cx = padding + hexWidth / 2 + (c - 1) * horizontalSpacing
            const cy = padding + hexHeight / 2 + (r - 1) * verticalSpacing + yOffset

            const cellData = boardState?.get(key)
            const isSelected = selected?.row === r && selected?.col === c
            const isSpawnable = spawnZone?.has(key)
            const isPurchasable = purchasableHexes?.has(key)

            let fill = "#CBD5E1"
            let stroke = "#94A3B8"
            let textColor = "#64748B"

            if (cellData?.owner === 1) {
                fill = "#22D3EE"
                stroke = "#0891B2"
                textColor = "#083344"
            } else if (cellData?.owner === 2) {
                fill = "#EA580C"
                stroke = "#9A3412"
                textColor = "#431407"
            } else if (isPurchasable) {
                fill = "#FDE047"
                stroke = "#CA8A04"
            }

            let filter = ""
            let strokeWidth = 2
            if (isSelected) {
                filter = "brightness(1.2)"
                stroke = "#FFFFFF"
                strokeWidth = 3
            } else if (isSpawnable && !cellData?.hasMinion) {
                stroke = activePlayer === 1 ? "#67E8F9" : "#FCA5A5"
                strokeWidth = 3
            }

            hexes.push(
                <g
                    key={key}
                    onClick={() => onHexClick?.(r, c)}
                    className="cursor-pointer transition-all duration-200 hover:brightness-110"
                    style={{ filter }}
                >
                    <polygon points={getHexPoints(cx, cy)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

                    {cellData?.hasMinion ? (
                        cellData.occupantOwner === 1
                            ? renderP1Minion(cx, cy, cellData.hp)
                            : renderP2Minion(cx, cy, cellData.hp)
                    ) : (
                        <text x={cx} y={cy + 5} textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" className="pointer-events-none opacity-80">
                            {r},{c}
                        </text>
                    )}
                </g>
            )
        }
    }

    return (
        <svg viewBox={`0 0 ${boardWidth} ${boardHeight}`} className={className}>
            {hexes}
        </svg>
    )
}