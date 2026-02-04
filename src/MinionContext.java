import java.util.*;

public class MinionContext {
    private Minion minion;
    private GameState gameState;
    private Map<String, Long> localVariables = new HashMap<>(); // ตัวแปรอักษรเล็ก [cite: 145]
    private Map<String, Long> globalVariables; // ตัวแปรอักษรใหญ่ (แชร์ใน Player) [cite: 148]

    public MinionContext(Minion minion, GameState gameState, Map<String, Long> globalVars) {
        this.minion = minion;
        this.gameState = gameState;
        this.globalVariables = globalVars;
    }

    public long getVariable(String name) {
        // จัดการ Special Variables [cite: 152]
        if (name.equals("row")) return minion.getRow(); [cite: 154]
        if (name.equals("col")) return minion.getCol(); [cite: 156]
        if (name.equals("Budget")) return (long) minion.getOwner().getBudget(); [cite: 158]

        if (Character.isLowerCase(name.charAt(0))) {
            return localVariables.getOrDefault(name, 0L); [cite: 143, 145]
        } else {
            return globalVariables.getOrDefault(name, 0L); [cite: 148]
        }
    }
}