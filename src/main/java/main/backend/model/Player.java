package main.backend.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Player {
    private int id;
    private double budget;
    private List<Minion> minions;

    // รวมเหลือตัวแปรเดียวเพื่อความชัดเจน
    private Map<String, Long> globalMemory = new HashMap<>();

    public Player(int id, double initBudget) {
        this.id = id;
        this.budget = initBudget;
        this.minions = new ArrayList<>();
    }

    // --- Accessor สำหรับ Global Variables ---
    public Map<String, Long> getGlobalMemory() {
        return globalMemory;
    }

    public void setGlobalVariable(String name, long value) {
        globalMemory.put(name, value);
    }

    public long getGlobalVariable(String name) {
        return globalMemory.getOrDefault(name, 0L);
    }

    // --- Budget Logic ---
    public void updateBudget(double turnBudget, double baseRate, int turnCount, double maxBudget) {
        this.budget += turnBudget;
        if (this.budget >= 1) {
            double r = baseRate * Math.log10(this.budget) * Math.log(turnCount);
            this.budget += (this.budget * r / 100.0);
        }
        if (this.budget > maxBudget) {
            this.budget = maxBudget;
        }
    }

    public boolean spend(double amount) {
        if (budget >= amount) {
            budget -= amount;
            return true;
        }
        return false;
    }

    public void addBudget(double amount) {
        this.budget += amount;
    }

    public void setBudget(double amount) {
        this.budget = amount;
    }

    public double getBudget() { return budget; }

    // Helper สำหรับ Evaluator ที่ต้องการค่า long
    public long getBudgetLong() {
        return (long) budget;
    }

    // --- Minion Management ---
    public void addMinion(Minion m) {
        minions.add(m);
        // m.setOwner(this); // ถ้า Minion มี method setOwner ให้เปิดใช้งาน
    }

    public List<Minion> getMinions() { return minions; }

    public int getId() { return id; }

    public int getAliveMinionCount() {
        int count = 0;
        for (Minion m : minions) {
            if (m.isAlive()) count++;
        }
        return count;
    }

    public long getTotalHp() {
        long total = 0;
        for (Minion m : minions) {
            if (m.isAlive()) total += m.getHp();
        }
        return total;
    }
}