import React from 'react';

export default function HexBoard({ rows = 8, cols = 8, hexSize = 20 }) {
    // คณิตศาสตร์เป็นแบบ Flat-topped (ด้านแบนอยู่บนและล่าง)
    const hexWidth = 2 * hexSize;
    const hexHeight = Math.sqrt(3) * hexSize;

    // ระยะห่างเวลาขยับช่อง
    const xOffset = (3 / 4) * hexWidth;
    const yOffset = hexHeight

    // คำนวณขนาดของกล่อง SVG ทั้งหมดเพื่อให้พอดีกับจำนวนช่อง
    const boardWidth = cols * hexWidth + (hexWidth / 2);
    const boardHeight = rows * yOffset + (hexHeight / 4);

    //  กำหนดระยะเผื่อ (Padding) ให้เส้นขอบไม่ล้น
    const padding = 20;

    // ฟังก์ชันคำนวณจุดมุมทั้ง 6 ของหกเหลี่ยม 1 รูป
    const getHexPoints = (cx, cy, size) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i ;
            const angle_rad = (Math.PI / 180) * angle_deg;
            points.push(`${cx + size * Math.cos(angle_rad)},${cy + size * Math.sin(angle_rad)}`);
        }
        return points.join(' ');
    };

    // สร้างอาร์เรย์เก็บช่องหกเหลี่ยมทั้งหมด
    const hexes = [];
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {

            // ระบบพิกัดแบบ Odd-q: ถ้าเป็นคอลัมน์เลขคี่ ให้เยื้องพิกัด Y ลงมาครึ่งช่อง
            const x = c * xOffset + hexWidth / 2;
            const y = r * yOffset + (c % 2 === 1 ? yOffset / 2 : 0) + hexHeight / 2;

            hexes.push(
                <polygon
                    key={`col${c}-row${r}`}
                    points={getHexPoints(x, y, hexSize - 1)} // -1 เพื่อให้เห็นเส้นขอบแยกกัน
                    className="hex-tile"
                    onClick={() => alert(`คุณคลิกช่องแนวตั้งที่: Col ${c}, แนวขวาง: Row ${r}`)}
                />
            );
        }
    }

    return (
        <div className="hex-board-wrapper">
            {/* ถอยจุดเริ่มต้นไป -padding และบวกความกว้าง/ยาวเพิ่ม 2 เท่าของ padding */}
            <svg
                viewBox={`-${padding} -${padding} ${boardWidth + padding * 2} ${boardHeight + padding * 2}`}
                className="hex-svg"
            >
                {hexes}
            </svg>
        </div>
    );
}