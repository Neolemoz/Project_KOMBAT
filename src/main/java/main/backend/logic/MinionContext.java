package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class MinionContext {
    private Minion minion;
    private GameState gameState;
    private Map<String, Long> localVariables;

    public MinionContext(Minion minion, GameState gameState) {
        this.minion = minion;
        this.gameState = gameState;
        this.localVariables = new HashMap<>();
    }

    public long getVariable(String name) {
        // 1. ตัวแปรระบบ
        if (name.equals("row")) return minion.getRow();
        if (name.equals("col")) return minion.getCol();
        if (name.equals("budget")) return minion.getOwner().getBudgetLong();
        if (name.equals("int")) return (long) (minion.getOwner().getBudget() * calculateInterestRate());
        if (name.equals("max_budget")) return 10000;
        if (name.equals("safe")) return 0;
        if (name.equals("random")) return new Random().nextInt(1000);

        // 1.1 จัดการ nearby_ทิศทาง
        if (name.startsWith("nearby_")) {
            String direction = name.substring(7);
            return calculateNearby(direction);
        }

        // 2. Info Expressions (Sensors)
        if (name.equals("ally")) return calculateClosest(false);
        if (name.equals("opponent")) return calculateClosest(true);

        // 3. ตัวแปร Global (ตัวพิมพ์ใหญ่)
        if (Character.isUpperCase(name.charAt(0))) {
            return minion.getOwner().getGlobalVars().getOrDefault(name, 0L);
        }

        // 4. ตัวแปร Local (ตัวพิมพ์เล็ก)
        return localVariables.getOrDefault(name, 0L);
    }

    public void setVariable(String name, long value) {
        if (isSystemVar(name)) return;

        if (Character.isUpperCase(name.charAt(0))) {
            minion.getOwner().getGlobalVars().put(name, value);
        } else {
            localVariables.put(name, value);
        }
    }

    private boolean isSystemVar(String name) {
        return name.equals("row") || name.equals("col") || name.equals("budget") ||
                name.equals("int") || name.equals("max_budget") || name.equals("random") ||
                name.equals("ally") || name.equals("opponent") || name.startsWith("nearby_");
    }

    private double calculateInterestRate() {
        return 0.05;
    }

    private long calculateNearby(String direction) {
        int[] next = gameState.getNeighbor(minion.getRow(), minion.getCol(), direction);

        if (!gameState.isValidHex(next[0], next[1])) return 0;

        Hex h = gameState.getHex(next[0], next[1]);
        if (h == null || h.getOccupant() == null) return 0;

        Minion target = h.getOccupant();
        int hpLen = String.valueOf(target.getHp()).length();
        int defLen = String.valueOf(target.getDefense()).length();
        int dist = 1;

        long val = (100L * hpLen) + (10L * defLen) + dist;
        return (target.getOwner() == minion.getOwner()) ? -val : val;
    }

    private long calculateClosest(boolean findOpponent) {
        long minVal = Long.MAX_VALUE;
        boolean found = false;
        String[] dirs = {"up", "upright", "downright", "down", "downleft", "upleft"};

        for (int i = 0; i < 6; i++) {
            int dirVal = i + 1;
            int r = minion.getRow();
            int c = minion.getCol();
            int dist = 0;

            while (true) {
                int[] next = gameState.getNeighbor(r, c, dirs[i]);
                r = next[0];
                c = next[1];
                dist++;

                if (!gameState.isValidHex(r, c)) break;

                Hex h = gameState.getHex(r, c);
                if (h.getOccupant() != null) {
                    boolean isOpponent = (h.getOccupant().getOwner().getId() != minion.getOwner().getId());
                    if (isOpponent == findOpponent) {
                        long val = (dist * 10L) + dirVal;
                        if (val < minVal) minVal = val;
                        found = true;
                        break;
                    }
                }
            }
        }
        return found ? minVal : 0;
    }

    // --- ส่วนที่เพิ่มมา (แก้ Error) ---
    public Minion getMinion() {
        return minion;
    }

    public GameState getGameState() {
        return gameState;
    }

    public long evaluateInfo(String type, String direction) {
        // ส่งต่อไปให้ Evaluator หรือ GameState คำนวณ
        return StrategyEvaluator.calculateInfo(this, type, direction);
    }
}