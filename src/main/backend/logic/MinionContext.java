package main.backend.logic; // ตรวจสอบชื่อ Package

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
    private Map<String, Long> localVariables; // ตัวแปร Local (ตัวพิมพ์เล็ก)

    public MinionContext(Minion minion, GameState gameState) {
        this.minion = minion;
        this.gameState = gameState;
        this.localVariables = new HashMap<>();
    }

    // --- การจัดการตัวแปร (Variables) ---

    public long getVariable(String name) {
        // 1. ตัวแปรระบบ (System Variables)
        if (name.equals("row")) return minion.getRow();
        if (name.equals("col")) return minion.getCol();
        if (name.equals("budget")) return minion.getOwner().getBudgetLong();
        if (name.equals("int")) return (long) (minion.getOwner().getBudget() * calculateInterestRate()); // Interest rate โดยประมาณ
        if (name.equals("max_budget")) return 10000; // หรือค่าตาม Config
        if (name.equals("safe")) return 0; // ต้องมี Logic safe (ถ้าโจทย์กำหนด)
        if (name.equals("random")) return new Random().nextInt(1000);
        if (name.startsWith("nearby_")) {
            String direction = name.substring(7); // ตัดคำว่า "nearby_" ออก เหลือแค่ทิศ (เช่น "up")
            return calculateNearby(direction);
        }

        // 2. Info Expressions (Sensors)
        if (name.equals("ally")) return calculateClosest(false);
        if (name.equals("opponent")) return calculateClosest(true);
        // หมายเหตุ: nearby จะถูกเรียกผ่านฟังก์ชัน calculateNearby แยกต่างหากเพราะต้องรับ Direction

        // 3. ตัวแปร Global (ตัวพิมพ์ใหญ่) -> ไปดึงจาก Player
        if (Character.isUpperCase(name.charAt(0))) {
            return minion.getOwner().getGlobalVars().getOrDefault(name, 0L);
        }

        // 4. ตัวแปร Local (ตัวพิมพ์เล็ก)
        return localVariables.getOrDefault(name, 0L);
    }

    public void setVariable(String name, long value) {
        // ห้ามแก้ตัวแปรระบบ
        if (isSystemVar(name)) return;

        // แยก Global vs Local ตามตัวพิมพ์
        if (Character.isUpperCase(name.charAt(0))) {
            minion.getOwner().getGlobalVars().put(name, value);
        } else {
            localVariables.put(name, value);
        }
    }

    private boolean isSystemVar(String name) {
        return name.equals("row") || name.equals("col") || name.equals("budget") ||
                name.equals("int") || name.equals("max_budget") || name.equals("random") ||
                name.equals("ally") || name.equals("opponent");
    }

    private double calculateInterestRate() {
        // คำนวณ Rate คร่าวๆ หรือดึงจาก Config
        // สูตร: r = b * log10(m) * ln(t)
        // เพื่อความง่ายในการ getVariable 'int' อาจจะคืนค่าเป็น % จำนวนเต็ม
        return 0; // หรือ