import { apiFetch } from "./client"

// 1. เริ่มเกมใหม่ (พร้อมส่งโหมด: "duel", "solitaire", "auto")
export async function startGame(mode = "duel") {
    return apiFetch("/api/start", {
        method: "POST",
        body: JSON.stringify({ mode }),
    })
}

// 2. ดึงสถานะเกมล่าสุด
export async function getGameState() {
    return apiFetch("/api/state", { method: "GET" })
}

// 3. ซื้อพื้นที่ Hex
export async function buyHex(playerId, row, col) {
    return apiFetch("/api/buy", {
        method: "POST",
        body: JSON.stringify({ playerId, row, col }),
    })
}

// 4. วาง Minion (อิงจาก Type ที่เซ็ตไว้ตอน Setup)
export async function spawnMinion(playerId, row, col, minionType) {
    return apiFetch("/api/spawn", {
        method: "POST",
        body: JSON.stringify({ playerId, row, col, minionType }),
    })
}

// 5. สร้าง Minion Type ตอนหน้า Setup
export async function defineMinionType(name, hp, defense, script) {
    return apiFetch("/api/minion_type", {
        method: "POST",
        body: JSON.stringify({ name, hp, defense, script }),
    })
}

// 6. จบเทิร์น
export async function endTurn() {
    return apiFetch("/api/endturn", { method: "POST" })
}

// 7. เช็คผู้ชนะ
export async function checkWinner() {
    return apiFetch("/api/winner", { method: "GET" })
}

// 8. ให้บอทเล่น (สำหรับโหมด Solitaire/Auto)
export async function triggerBotTurn() {
    return apiFetch("/api/bot_turn", { method: "POST" })
}

// 9. ตรวจสอบ Syntax ของ Strategy
export async function validateStrategy(script) {
    return apiFetch("/api/validate", {
        method: "POST",
        body: JSON.stringify({ script: script ?? "" }),
    })
}