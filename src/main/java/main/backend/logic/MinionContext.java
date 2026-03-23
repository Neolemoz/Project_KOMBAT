package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player; // เพิ่ม Import เพื่อป้องกันปัญหาหา Class ไม่เจอ

public class MinionContext {
    private Minion minion;
    private GameState gameState;

    public MinionContext(Minion minion, GameState gameState) {
        this.minion = minion;
        this.gameState = gameState;
    }

    public Minion getMinion() { return minion; }
    public GameState getGameState() { return gameState; }

    // --- จัดการตัวแปร (Variable Scope) ---
    public void setVariable(String name, long value) {
        if (Character.isUpperCase(name.charAt(0))) {
            // Global Variable: เรียกใช้ method ที่เราเพิ่งแก้ใน Player
            minion.getOwner().setGlobalVariable(name, value);
        } else {
            // Local Variable
            minion.getMemory().put(name, value);
        }
    }

    public long getVariable(String name) {
        // 1. Reserved Words
        Player owner = minion.getOwner();

        if (name.equals("row")) return minion.getRow();
        if (name.equals("col")) return minion.getCol();
        if (name.equals("Budget")) return owner.getBudgetLong();

        // แก้ไข: เปลี่ยนเป็น "Int" (ตัว I ใหญ่) ให้ตรงกับ Spec และ Evaluator
        if (name.equals("Int")) {
            return gameState.calculateInterest(owner.getBudgetLong());
        }

        // แก้ไข: เปลี่ยนเป็น "MaxBudget" (M, B ใหญ่) ให้ตรงกับ Spec
        if (name.equals("MaxBudget")) return gameState.getMaxBudget();

        // เพิ่มตัวแปร "SpawnsLeft" ตาม Spec
        if (name.equals("SpawnsLeft")) return gameState.getRemainingSpawns(owner.getId());

        if (name.equals("random")) return (long) (Math.random() * 1000);

        // 2. Global/Local Variables
        if (Character.isUpperCase(name.charAt(0))) {
            return owner.getGlobalVariable(name);
        } else {
            return minion.getMemory().getOrDefault(name, 0L);
        }
    }

    public long evaluateInfo(String type, String direction) {
        return StrategyEvaluator.calculateInfo(this, type, direction);
    }
}