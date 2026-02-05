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
    public long getVariable(String name) {
        if (name.equals("row")) return minion.getRow();
        if (name.equals("col")) return minion.getCol();
        if (name.equals("Budget")) return (long) minion.getOwner().getBudget();
        if (name.equals("random")) return new Random().nextInt(1000); [cite_start]// 0-999 [cite: 167]

        // การคำนวณ Info Expression (ต้องมีฟังก์ชันเสริม)
        if (name.equals("opponent")) return calculateClosest(true);
        if (name.equals("ally")) return calculateClosest(false);

        // nearby ต้องรับทิศทาง (อาจต้องแก้โครงสร้าง Parser ให้ส่ง nearby เป็น Function Call ไม่ใช่ Variable)
        // แต่ถ้าใน AST มองเป็นตัวแปรชื่อ "nearby" อาจจะไม่พอ ต้องดู Parser

        // ... (ส่วนของ Local/Global variables เดิม) ...
    }

    // ฟังก์ชันหา Opponent/Ally ที่ใกล้ที่สุด [cite: 194-197]
    private long calculateClosest(boolean findOpponent) {
        long minVal = Long.MAX_VALUE;
        boolean found = false;
        String[] dirs = {"up", "upright", "downright", "down", "downleft", "upleft"}; // เรียงตามทิศ 1-6

        for (int i = 0; i < 6; i++) {
            int dirVal = i + 1; // ทิศ 1-6
            int r = minion.getRow();
            int c = minion.getCol();
            int dist = 0;

            while (true) {
                int[] next = gameState.getNeighbor(r, c, dirs[i]);
                r = next[0];
                c = next[1];
                dist++;

                Hex h = gameState.getHex(r, c);
                if (h == null) break; // สุดขอบกระดาน

                if (h.getOccupant() != null) {
                    boolean isOpponent = (h.getOccupant().getOwner() != minion.getOwner());
                    if (isOpponent == findOpponent) {
                    [cite_start]// สูตรค่า: (distance * 10) + direction [cite: 194]
                        long val = (dist * 10L) + dirVal;
                        if (val < minVal) minVal = val;
                        found = true;
                        break; // เจอตัวแรกในทิศนี้แล้วหยุด
                    }
                }
            }
        }
        return found ? minVal : 0;
    }
}
