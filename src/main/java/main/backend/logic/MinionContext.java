package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Minion;

public class MinionContext {
    private Minion minion;
    private GameState gameState;

    public MinionContext(Minion minion, GameState gameState) {
        this.minion = minion;
        this.gameState = gameState;
    }

    public Minion getMinion() { return minion; }
    public GameState getGameState() { return gameState; }

    // --- จัดการตัวแปร (Variable Scope) ตาม Spec หน้า 5 ข้อ 143-148 ---
    public void setVariable(String name, long value) {
        if (Character.isUpperCase(name.charAt(0))) {
            // ตัวพิมพ์ใหญ่ -> Global Variable (เก็บที่ Player)
            minion.getOwner().getGlobalMemory().put(name, value);
        } else {
            // ตัวพิมพ์เล็ก -> Local Variable (เก็บที่ Minion)
            minion.getMemory().put(name, value);
        }
    }

    public long getVariable(String name) {
        // 1. เช็คตัวแปรระบบ (Reserved Words)
        if (name.equals("Budget")) return minion.getOwner().getBudget();
        if (name.equals("row")) return minion.getRow();
        if (name.equals("col")) return minion.getCol();
        if (name.equals("int")) return (long) (minion.getOwner().getBudget() * configInterest()); // ต้องแก้ให้ดึงสูตรดอกเบี้ยจริง
        if (name.equals("maxbudget")) return 10000; // ค่าสมมติ ควรดึงจาก Config
        if (name.equals("random")) return (long) (Math.random() * 1000);

        // 2. เช็คตัวแปร Global/Local
        if (Character.isUpperCase(name.charAt(0))) {
            return minion.getOwner().getGlobalMemory().getOrDefault(name, 0L);
        } else {
            return minion.getMemory().getOrDefault(name, 0L);
        }
    }

    // Helper ชั่วคราว (ควรดึงจาก Config จริง)
    private double configInterest() { return 0.05; }

    // --- ส่วนที่เพิ่มใหม่: รองรับ InfoExpression (nearby, ally, opponent) ---
    public long evaluateInfo(String type, String direction) {
        // ส่งไปคำนวณที่ StrategyEvaluator (เพราะ Logic มันซับซ้อน)
        return StrategyEvaluator.calculateInfo(this, type, direction);
    }
}