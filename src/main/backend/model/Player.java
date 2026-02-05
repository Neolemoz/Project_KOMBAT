import java.util.*;

public class Player {
    private double budget;
    private int id;
    private List<Minion> minions = new ArrayList<>();

    public Player(int id, double initBudget) {
        this.id = id;
        this.budget = initBudget;
    }

    public void updateBudget(double turnBudget, double baseRate, int turnCount, double maxBudget) {
        // 1. เพิ่มงบรายเทิร์น
        this.budget += turnBudget; [cite: 72]

        // 2. คำนวณดอกเบี้ย
        if (this.budget >= 1) { [cite: 110]
            double r = baseRate * Math.log10(this.budget) * Math.log(turnCount); [cite: 111]
            this.budget += (this.budget * r / 100.0); [cite: 109]
        }

        // 3. ตรวจสอบงบสูงสุด
        if (this.budget > maxBudget) this.budget = maxBudget; [cite: 73]
    }

    public boolean spend(double amount) {
        if (this.budget >= amount) {
            this.budget -= amount;
            return true;
        }
        return false;
    }

    public long getBudgetLong() {
        return (long) this.budget;
    }
}