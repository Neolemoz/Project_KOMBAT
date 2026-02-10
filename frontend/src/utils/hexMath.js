// Flat-top hex grid (column offset)
// row, col are 1..8
// size = radius of hex (center to corner)

export function hexToPixelFlatTop(row, col, size) {
    // flat-top:
    // width = 2*size
    // height = sqrt(3)*size
    // horizontal step = 1.5*size
    // vertical step = height
    const h = Math.sqrt(3) * size
    const x = (col - 1) * (1.5 * size)
    const y = (row - 1) * h + ((col - 1) % 2) * (h / 2)
    return { x, y }
}

export function hexPointsFlatTop(cx, cy, size) {
    // flat-top corners angles: 0,60,120,180,240,300
    const pts = []
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i)
        const x = cx + size * Math.cos(angle)
        const y = cy + size * Math.sin(angle)
        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
    }
    return pts.join(" ")
}