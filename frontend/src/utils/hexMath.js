// Pointy-top hex grid ตามสเปค KOMBAT
// row, col เริ่มที่ 1..8
// size = รัศมีของ Hex

export function hexToPixelPointyTop(row, col, size) {
    // ความกว้าง/สูง ของ pointy-top hex
    const w = Math.sqrt(3) * size
    const h = 2 * size

    // การคำนวณแกน x, y ตามภาพในเอกสาร (แถวคู่/คี่ จะเยื้องกันในแนวนอน)
    // สังเกตว่าในสเปค (1,1) อยู่มุมซ้ายบน และ (1,2) อยู่ด้านขวาบนเยื้องไปทางขวา
    const x = (col - 1) * w + ((row - 1) % 2) * (w / 2)
    const y = (row - 1) * (h * 0.75)

    return { x, y }
}

export function hexPointsPointyTop(cx, cy, size) {
    // มุมของ pointy-top เริ่มที่ 30 องศา (แทนที่จะเป็น 0 องศาเหมือน flat-top)
    const pts = []
    for (let i = 0; i < 6; i++) {
        // 30 องศา = Math.PI / 6
        const angle = (Math.PI / 180) * (60 * i + 30)
        const x = cx + size * Math.cos(angle)
        const y = cy + size * Math.sin(angle)
        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
    }
    return pts.join(" ")
}