package main.backend.model; // ตรวจสอบชื่อ Package ให้ตรงกับโฟลเดอร์ของคุณ

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Player {
    private int id;
    private double budget; // ใช้ double เพื่อความแม่นยำของดอกเบี้ย
    private List<Minion> minions; // รายชื่อมินิยอนในสังกัด
    private Map<String, Long> globalVars; // ตัวแปร Global (ตัวพิมพ์ใหญ่) แชร์กันทั้งทีม
    private Map<String, Long> globalMemory = new HashMap<>();

    public Player(int id, double initBudget) {
        this.id = id;
        this.budget = initBudget;
        this.minions = new ArrayList<>();
        this.globalVars = new HashMap<>();
    }

    // --- ส่วนการจัดการ Budget และ ดอกเบี้ย ---

    public void updateBudget(double turnBudget, double baseRate, int turnCount, double maxBudget) {
        // 1. เพิ่มงบรายเทิร์น
        this.budget += turnBudget;

        // 2. คำนวณดอกเบี้ย: r = b * log10(m) * ln(t)
        if (this.budget >= 1) {
            double r = baseRate * Math.log10(this.budget) * Math.log(turnCount);
            this.budget += (this.budget * r / 100.0);
        }

        // 3. จำกัดงบสูงสุด (Cap Budget)
        if (this.budget > maxBudget) {
            this.budget = maxBudget;
        }
    }

    public boolean spend(double amount) {
        if (this.budget >= amount) {
            this.budget -= amount;
            return true;
        }
        return false;
    }

    public long getBudgetLong() {
        return (long) this.budget; // Helper สำหรับ Evaluator ที่ต้องการค่า int/long
    }

    // --- ส่วนการจัดการ Minion ---

    public void addMinion(Minion m) {
        minions.add(m);
        m.setOwner(this); // กำหนดเจ้าของให้มินิยอน
    }

    public void removeMinion(Minion m) {
        minions.remove(m);
    }

    public List<Minion> getMinions() {
        return minions;
    }

    // --- ส่วนการจัดการ Global Variables ---

    public Map<String, Long> getGlobalVars() {
        return globalVars;
    }

    // --- Getters ทั่วไป ---
    public int getId() { return id; }
    public double getBudget() { return budget; }
    public Map<String, Long> getGlobalMemory() { return globalMemory; }

    // นับจำนวน Minion ที่ยังไม่ตาย
    public int getAliveMinionCount() {
        int count = 0;
        for (Minion m : minions) {
            if (m.isAlive()) count++;
        }
        return count;
    }

    // ผลรวม HP ของ Minion ทั้งหมดที่ยังไม่ตาย
    public long getTotalHp() {
        long total = 0;
        for (Minion m : minions) {
            if (m.isAlive()) total += m.getHp();
        }
        return total;
    }
}