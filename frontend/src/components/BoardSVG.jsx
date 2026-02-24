import { useMemo, useState } from "react"
import { hexPointsPointyTop, hexToPixelPointyTop } from "../utils/hexMath" // 👈 เปลี่ยนเป็น PointyTop

export default function BoardSVG({
                                     rows = 8,
                                     cols = 8,
                                     selected,
                                     spawnZone,
                                     activePlayer,
                                     boardState, // 👈 ข้อมูลกระดานจริงๆ จาก Backend
                                     onHexClick,
                                     size = 35, // 👈 เล็กลงนิดหน่อยเพื่อให้พอดีจอแนวตั้ง
                                     padding = 40,
                                     className = "",
                                 }) {
    // สีไฮไลต์ตอนชี้ช่องเกิด
    const spawnFill = activePlayer === 1 ? "rgba(125, 211, 252, 0.4)" : "rgba(251, 113, 133, 0.4)"

    const [hover, setHover] = useState(null)

    const hexes = useMemo(() => {
        const items = []
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                const { x, y } = hexToPixelPointyTop(r, c, size) // 👈 ใช้ PointyTop
                items.push({ row: r, col: c, x: x + padding, y: y + padding })
            }
        }
        return items
    }, [rows, cols, size, padding])

    const bounds = useMemo(() => {
        if (hexes.length === 0) return { w: 0, h: 0 }
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const h of hexes) {
            minX = Math.min(minX, h.x - size)
            maxX = Math.max(maxX, h.x + size)
            minY = Math.min(minY, h.y - size)
            maxY = Math.max(maxY, h.y + size)
        }
        const margin = 20
        return { w: (maxX - minX) + margin * 2, h: (maxY - minY) + margin * 2, minX: minX - margin, minY: minY - margin }
    }, [hexes, size])

    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            <svg
                width="100%"
                height="100%"
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
                preserveAspectRatio="xMidYMid meet"
                className="select-none max-h-[85vh]"
            >
                {hexes.map((h) => {
                    const key = `${h.row},${h.col}`
                    const isSpawn = spawnZone?.has(key)
                    const isSelected = selected && selected.row === h.row && selected.col === h.col
                    const isHovered = hover && hover.row === h.row && hover.col === h.col

                    // 👈 อ่านค่าจาก Backend
                    const hexData = boardState?.get(key) || {}
                    const owner = hexData.owner
                    const hasMinion = hexData.hasMinion

                    // กำหนดสีพื้นหลังช่อง
                    let fill = "rgba(20,25,35,0.7)" // ช่องว่างเปล่าๆ สีเข้มๆ ให้ดูขลัง
                    if (owner === 1) fill = "rgba(14, 165, 233, 0.3)" // พื้นที่ P1 สีฟ้า
                    if (owner === 2) fill = "rgba(244, 63, 94, 0.3)" // พื้นที่ P2 สีแดง
                    if (isSpawn && !owner) fill = spawnFill // โซนเกิด

                    const stroke = isSelected ? "rgba(255,215,0,1)" : isHovered ? "rgba(255,255,255,0.8)" : "rgba(100,116,139,0.5)"
                    const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1
                    const pts = hexPointsPointyTop(h.x, h.y, size)

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
                                <title>{`Row: ${h.row}, Col: ${h.col}`}</title>
                            </polygon>

                            {/* เลื่อนตัวเลขพิกัดขึ้นไปด้านบนนิดหน่อย เพื่อเว้นที่ให้ Minion */}
                            <text x={h.x} y={h.y - size * 0.4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">
                                {h.row},{h.col}
                            </text>

                            {/* 👈 ถัามี Minion ให้วาดวงกลม/ไอคอน */}
                            {hasMinion && (
                                <g>
                                    <circle cx={h.x} cy={h.y + 4} r={size * 0.45} fill={owner === 1 ? "#38bdf8" : "#fb7185"} stroke="#fff" strokeWidth="2" />
                                    <text x={h.x} y={h.y + 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                                        M
                                    </text>
                                </g>
                            )}
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}