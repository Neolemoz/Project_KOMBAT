// src/api/websocket.js
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

const BASE = "http://localhost:8080"

let stompClient = null
let onStateUpdate = null
let isConnected = false

export function connectWebSocket(onUpdate) {
    onStateUpdate = onUpdate

    if (stompClient) {
        stompClient.deactivate()
        stompClient = null
        isConnected = false
    }

    stompClient = new Client({
        webSocketFactory: () => new SockJS(`${BASE}/ws`),
        reconnectDelay: 3000,
        onConnect: () => {
            console.log("WebSocket connected")
            isConnected = true
            stompClient.subscribe("/topic/game", (message) => {
                const state = JSON.parse(message.body)
                onStateUpdate?.(state)
            })
        },
        onDisconnect: () => { isConnected = false },
        onStompError: (frame) => {
            console.error("STOMP error", frame)
            isConnected = false
        },
    })

    stompClient.activate()
}

export function disconnectWebSocket() {
    stompClient?.deactivate()
    stompClient = null
    isConnected = false
}

// ── ส่งผ่าน WebSocket (ถ้า connected) ──
function wsSend(destination, body = {}) {
    if (isConnected && stompClient?.connected) {
        stompClient.publish({
            destination: `/app${destination}`,
            body: JSON.stringify(body),
        })
        return true
    }
    return false
}

// ── REST fallback ──
async function restPost(path, body = {}) {
    try {
        const res = await fetch(`${BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
        if (res.ok) {
            const state = await res.json()
            onStateUpdate?.(state)
        }
    } catch (e) {
        console.error(`REST ${path} failed`, e)
    }
}

// ── endturn: ใช้ REST เสมอ (เร็ว แน่นอน ไม่ง้อ WS connected) ──
export function wsEndTurn() {
    restPost("/api/endturn")
}

// ── buy/spawn: ลอง WS ก่อน ถ้าไม่ได้ fallback REST ──
export function wsBuy(row, col) {
    if (!wsSend("/buy", { row, col })) {
        restPost("/api/buy", { row, col })
    }
}

export function wsSpawn(row, col, minionType) {
    if (!wsSend("/spawn", { row, col, minionType })) {
        restPost("/api/spawn", { row, col, minionType })
    }
}

export const wsStrategy = (playerId, script) => wsSend("/strategy", { playerId, script })