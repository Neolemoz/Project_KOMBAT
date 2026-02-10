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
    grid.innerHTML = "";

    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 8; c++) {
            const hex = board[r][c];
            if (!hex) continue;

            const cell = document.createElement("div");
            cell.className = "hex-cell";
            cell.title = `Row: ${r}, Col: ${c}`;

            // --- 1. แก้ส่วนนี้: เช็คเจ้าของพื้นที่ (Owner) ---
            if (hex.owner) {
                const ownerId = (typeof hex.owner === 'object') ? hex.owner.id : hex.owner;
                // ใช้ชื่อ class ให้ตรงกับ style.css (.owned-p1)
                if (ownerId === 1) cell.classList.add("owned-p1");
                if (ownerId === 2) cell.classList.add("owned-p2");
            }
            // -------------------------------------------

            // --- 2. ส่วนแสดง Minion ---
            if (hex.occupant) {
                const m = hex.occupant;
                const minionDiv = document.createElement("div");
                // ตรงนี้ Minion ใช้ class แยก (p1, p2) ตาม style เดิม
                minionDiv.className = `minion p${m.owner.id}`;
                minionDiv.innerText = m.hp;
                cell.appendChild(minionDiv);
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
    // 1. แสดง Popup ยืนยัน
    const isConfirmed = confirm(`คุณต้องการซื้อพื้นที่พิกัด (${row}, ${col}) หรือไม่?`);

    // ถ้าผู้เล่นกด "Cancel" หรือ "ยกเลิก" ให้หยุดการทำงานทันที
    if (!isConfirmed) {
        return;
    }

    // 2. ถ้ากด "OK" ให้ส่งคำสั่งซื้อไปที่ Backend
    fetch(`${API_URL}/buy`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        // ส่งข้อมูลเป็น JSON Body เพื่อให้ตรงกับ GameController (@RequestBody)
        body: JSON.stringify({
            row: row,
            col: col
        })
    })
        .then(response => response.json()) // รับค่า true/false กลับมา
        .then(success => {
            if (success) {
                log(`Success: Bought hex at (${row}, ${col})`);
                updateBoard(); // โหลดกระดานใหม่เพื่อแสดงพื้นที่ที่ซื้อแล้ว
            } else {
                log("Failed: Cannot buy this hex!");
                alert("ไม่สามารถซื้อพื้นที่นี้ได้! (เงินไม่พอ หรือ ไม่ติดกับพื้นที่เดิม)");
            }
        })
        .catch(err => {
            console.error("Error buying hex:", err);
            log("Error occurred while buying.");
        });
}

// ฟังก์ชันจบเทิร์น
function endTurn() {
    fetch(`${API_URL}/endturn`, { method: "POST" })
        .then(() => {
            log("Turn Ended.");
            updateBoard();
            showModal();
        })
        .catch(err => {
            console.error("Error ending turn:", err);
            showModal();
        });
}

// ฟังก์ชันรีเซ็ตเกม
function resetGame() {
    fetch(`${API_URL}/start`, { method: "POST" })
        .then(() => {
            closeModal();
            log("Game Restarted!");
            updateBoard();
        })
        .catch(err => console.error("Error resetting game:", err));
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