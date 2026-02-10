import React from "react";
import "../styles.css";

import HexBoard from "../components/HexBoard";

export default function GamePage({ mode, minionCount }) {
    // จำลองช่องใส่ Minion 5 ช่องซ้ายมือ
    const minionSlots = [1, 2, 3, 4, 5];

    return (
        <div className="game-container">
            {/* --- แถบด้านบน: แสดงเทิร์น --- */}
            <div className="top-banner">
                <div className="turn-ribbon">
                    <span className="turn-text">TURN 1</span>
                    <span className="player-text">PLAYER 1</span>
                </div>
            </div>

            {/* --- โซนหลักของเกม --- */}
            <div className="game-main-area">

                {/* แผงควบคุมด้านซ้าย (Player 1) */}
                <div className="left-panel">
                    <div className="player-profile">
                        <div className="avatar p1-avatar"></div>
                        <div className="player-name-box">PLAYER 1</div>
                    </div>

                    <div className="stats-box">
                        <div className="budget-box">1000</div>
                        <div className="shop-btn">SHOP</div>
                    </div>

                    <div className="minion-inventory">
                        {minionSlots.map((slot) => (
                            <div key={slot} className="minion-slot-wrapper">
                                <div className="minion-slot"></div>
                                {/* แสดงเลือดแค่อันแรกเพื่อเป็นตัวอย่าง */}
                                {slot === 1 && <div className="hp-bar">HP : 100 / 100</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* พื้นที่กระดานเกมตรงกลาง (จำลอง Hex Grid ด้วยรูปภาพหรือ CSS ไปก่อน) */}
                <div className="center-board">
                    {/* กำหนดจำนวนแถว คอลัมน์ และขนาด (ปรับได้ตามที่ Backend ของคุณตั้งไว้) */}
                    <HexBoard rows={8} cols={8} hexSize={20} />
                </div>

                {/* แผงควบคุมด้านขวา (Player 2 / AI) */}
                <div className="right-panel">
                    <div className="player-profile right">
                        <div className="avatar p2-avatar"></div>
                        <div className="player-name-box right">PLAYER 2</div>
                    </div>
                    <div className="budget-box right-budget">10000</div>
                </div>
            </div>

            {/* --- ปุ่ม End Turn ด้านล่าง --- */}
            <div className="bottom-bar">
                <button className="end-turn-btn">
                    End Turn
                </button>
            </div>
        </div>
    );
}