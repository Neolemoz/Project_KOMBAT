// Pointy-top hex grid
// row, col เริ่มที่ 1..8

export function hexToPixelPointyTop(row, col, size) {

    const w = Math.sqrt(3) * size
    const h = 2 * size

    const x = (col - 1) * w + ((row - 1) % 2) * (w / 2)
    const y = (row - 1) * (h * 0.75)

    return { x, y }
}

export function hexPointsPointyTop(cx, cy, size) {

    const pts = []

    for (let i = 0; i < 6; i++) {

        const angle = (Math.PI / 180) * (60 * i + 30)

        const x = cx + size * Math.cos(angle)
        const y = cy + size * Math.sin(angle)

        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
    }

    return pts.join(" ")
}