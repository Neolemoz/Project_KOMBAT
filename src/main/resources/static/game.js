const API_URL = "http://localhost:8080/api";

// แก้ไข: ไม่ให้โหลดกระดานทันทีที่เข้าเว็บ แต่รอให้กด Start
document.addEventListener("DOMContentLoaded", () => {
    // updateBoard(); // เอาบรรทัดนี้ออก หรือ comment ไว้
});

// ฟังก์ชันสำหรับปุ่ม Start Game ในหน้าแรก
function startGame() {
    // ซ่อนหน้า Start Screen
    document.getElementById("start-screen").style.display = "none";

    // แสดงหน้า Select Mode แทนที่จะเข้าเกมเลย
    document.getElementById("select-mode-screen").style.display = "block";
}

// เพิ่มฟังก์ชันย้อนกลับไปหน้าแรก (ถ้าต้องการ)
function backToStart() {
    document.getElementById("select-mode-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
}

// เพิ่มฟังก์ชันสำหรับเลือกโหมดแล้วเข้าเกม
function enterGame(mode) {
    console.log("Selected Mode:", mode); // เช็คว่าเลือกโหมดอะไร (เผื่อใช้ในอนาคต)

    // ซ่อนหน้า Select Mode
    document.getElementById("select-mode-screen").style.display = "none";

    // แสดงหน้าเกม (Game Container)
    const gameContainer = document.querySelector(".game-container");
    gameContainer.style.display = "inline-block";

    // โหลดข้อมูลเกม
    updateBoard();
}

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

    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 8; c++) {
            const hex = board[r][c];
            const cell = document.createElement("div");
            cell.className = "hex-cell";
            cell.title = `Row: ${r}, Col: ${c}`;

            if (hex.occupant) {
                const m = hex.occupant;
                const minionDiv = document.createElement("div");
                minionDiv.className = `minion p${m.owner.id}`;
                minionDiv.innerText = m.hp;
                cell.appendChild(minionDiv);
                cell.classList.add(m.owner.id === 1 ? "p1-owned" : "p2-owned");
            } else if (hex.spawnable) {
                cell.classList.add("spawnable");
            }

            cell.onclick = () => buyHex(1, r, c);
            grid.appendChild(cell);
        }
    }
}

// ฟังก์ชันซื้อพื้นที่
function buyHex(playerId, row, col) {
    fetch(`${API_URL}/buy?playerId=${playerId}&row=${row}&col=${col}`, { method: "POST" })
        .then(response => response.text())
        .then(result => {
            if (result === "SUCCESS") {
                log(`P${playerId} bought hex at (${row}, ${col})`);
                updateBoard();
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
            showModal();
        })
        .catch(err => showModal());
}

// ฟังก์ชันรีเซ็ตเกม
function resetGame() {
    fetch(`${API_URL}/reset`, { method: "POST" })
        .then(() => {
            closeModal();
            log("Game Restarted!");
            updateBoard();
        });
}

function showModal() {
    document.getElementById("restart-modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("restart-modal").classList.add("hidden");
}

function updateStatus(players) {
    if (players["1"]) document.getElementById("p1-stats").innerText = `P1 Budget: ${players["1"].budget.toFixed(0)}`;
    if (players["2"]) document.getElementById("p2-stats").innerText = `P2 Budget: ${players["2"].budget.toFixed(0)}`;
}

function log(msg) {
    const logPanel = document.getElementById("game-log");
    logPanel.innerText = msg;
}