const API_URL = "http://localhost:8080/api";

// เริ่มเกม: โหลดข้อมูลครั้งแรก
document.addEventListener("DOMContentLoaded", () => {
    updateBoard();
});

// ฟังก์ชันดึงข้อมูลจาก Backend
function updateBoard() {
    fetch(`${API_URL}/state`)
        .then(response => response.json())
        .then(data => {
            renderGrid(data.board); // วาดกระดาน
            updateStatus(data.players); // อัปเดตเงิน
        })
        .catch(err => console.error("Error loading state:", err));
}

// ฟังก์ชันวาดกระดาน
function renderGrid(board) {
    const grid = document.getElementById("hex-grid");
    grid.innerHTML = ""; // เคลียร์ของเก่า

    // board ใน Java เป็น Array 2D [row][col]
    // แต่ index เริ่มที่ 1 ตามโค้ด GameState ของคุณ ดังนั้นต้องระวัง index 0
    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 8; c++) {
            const hex = board[r][c];
            const cell = document.createElement("div");
            cell.className = "hex-cell";
            cell.title = `Row: ${r}, Col: ${c}`; // Tooltip บอกพิกัด

            // ตรวจสอบพื้นที่ (ใน GameState คุณยังไม่ได้แยกเจ้าของพื้นที่ชัดเจน
            // แต่ถ้ามี Minion ยืนอยู่ ให้แสดงสีตามเจ้าของ)
            if (hex.occupant) {
                const m = hex.occupant;
                const minionDiv = document.createElement("div");
                minionDiv.className = `minion p${m.owner.id}`;
                minionDiv.innerText = m.hp; // โชว์ HP
                cell.appendChild(minionDiv);

                // ถ้ายืนอยู่ แสดงว่าเป็นพื้นที่ของคนนั้น (สมมติ)
                cell.classList.add(m.owner.id === 1 ? "p1-owned" : "p2-owned");
            } else if (hex.spawnable) {
                cell.classList.add("spawnable");
            }

            // คลิกเพื่อซื้อพื้นที่ (สมมติให้ P1 ซื้อก่อนเพื่อทดสอบ)
            cell.onclick = () => buyHex(1, r, c);

            grid.appendChild(cell);
        }
    }
}

// ฟังก์ชันซื้อพื้นที่
function buyHex(playerId, row, col) {
    // ส่ง Request POST ไปที่ Backend
    fetch(`${API_URL}/buy?playerId=${playerId}&row=${row}&col=${col}`, { method: "POST" })
        .then(response => response.text())
        .then(result => {
            if (result === "SUCCESS") {
                log(`P${playerId} bought hex at (${row}, ${col})`);
                updateBoard(); // โหลดกระดานใหม่
            } else {
                log("Cannot buy this hex!");
            }
        });
}

// ฟังก์ชันจบเทิร์น
function endTurn() {
    fetch(`${API_URL}/end-turn`, { method: "POST" })
        .then(() => {
            log("Turn Ended.");
            updateBoard();

            // --- เพิ่มตรงนี้: ให้เด้งหน้าต่างรีเซ็ตทุกครั้งที่จบเทิร์น (ตามที่คุณขอ) ---
            // หรือถ้าจะให้เด้งเฉพาะตอน Error ก็ลบบรรทัดนี้ออก แล้วให้ catch ของ updateBoard ทำงานแทน
            showModal();
        })
        .catch(err => showModal()); // ถ้า Backend พัง ก็เด้งหน้าต่าง
}

// --- ฟังก์ชัน: รีเซ็ตเกม ---
function resetGame() {
    fetch(`${API_URL}/reset`, { method: "POST" })
        .then(() => {
            closeModal();
            log("Game Restarted!");
            updateBoard();
        });
}

// --- ฟังก์ชันจัดการ Popup ---
function showModal() {
    document.getElementById("restart-modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("restart-modal").classList.add("hidden");
}

function updateStatus(players) {
    // ใน GameState.java คุณใช้ Map<Integer, Player>
    // JSON key จะเป็น "1" และ "2"
    if (players["1"]) document.getElementById("p1-stats").innerText = `P1 Budget: ${players["1"].budget.toFixed(0)}`;
    if (players["2"]) document.getElementById("p2-stats").innerText = `P2 Budget: ${players["2"].budget.toFixed(0)}`;
}

function log(msg) {
    const logPanel = document.getElementById("game-log");
    logPanel.innerText = msg;
}

