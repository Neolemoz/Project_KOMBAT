public class GameState {
    private Hex[][] board = new Hex[9][9]; // ใช้ 1-8 ตามพิกัดในรูป [cite: 10]
    private Player p1, p2;
    private int currentTurn = 1;

    public GameState(double initBudget) {
        for (int r = 1; r <= 8; r++) {
            for (int c = 1; c <= 8; c++) {
                board[r][c] = new Hex(r, c);
            }
        }
        p1 = new Player(1, initBudget);
        p2 = new Player(2, initBudget);
        setupInitialSpawnAreas();
    }

    private void setupInitialSpawnAreas() {
        // P1: มุมบนซ้าย 5 ช่อง [cite: 75]
        int[][] p1Starts = {{1,1}, {1,2}, {1,3}, {2,1}, {2,2}};
        for (int[] pos : p1Starts) board[pos[0]][pos[1]].setSpawnable(true);

        // P2: มุมล่างขวา 5 ช่อง [cite: 76]
        int[][] p2Starts = {{8,8}, {8,7}, {8,6}, {7,8}, {7,7}};
        for (int[] pos : p2Starts) board[pos[0]][pos[1]].setSpawnable(true);
    }

    public boolean buyHex(Player p, int r, int c, double cost) {
        // ตรวจสอบว่าอยู่ติดกับช่องที่ spawn ได้เดิมหรือไม่ [cite: 94]
        if (isAdjacentToSpawnable(r, c) && p.spend(cost)) {
            board[r][c].setSpawnable(true);
            return true;
        }
        return false;
    }

    private boolean isAdjacentToSpawnable(int r, int c) {
        String[] dirs = {"up", "down", "upleft", "downleft", "upright", "downright"};
        for (String d : dirs) {
            int[] n = getNeighbor(r, c, d);
            // ตรวจสอบขอบกระดาน (1-8) และดูว่าเป็นช่อง Spawnable หรือไม่
            if (n[0] >= 1 && n[0] <= 8 && n[1] >= 1 && n[1] <= 8) {
                if (board[n[0]][n[1]].isSpawnable()) return true;
            }
        }
        return false;
    }

    // Helper สำหรับหาพิกัดรอบข้าง (Col-based skew)
    public int[] getNeighbor(int r, int c, String direction) {
        int nextR = r;
        int nextC = c;
        boolean isEvenCol = (c % 2 == 0); // ตรวจสอบว่าเป็นคอลัมน์คู่หรือไม่

        switch (direction) {
            case "up": nextR--; break;
            case "down": nextR++; break;
            case "upleft":
                nextC--;
                if (!isEvenCol) nextR--; // คอลัมน์คี่ต้องลด row
                break;
            case "downleft":
                nextC--;
                if (isEvenCol) nextR++; // คอลัมน์คู่ต้องเพิ่ม row
                break;
            case "upright":
                nextC++;
                if (!isEvenCol) nextR--;
                break;
            case "downright":
                nextC++;
                if (isEvenCol) nextR++;
                break;
        }
        return new int[]{nextR, nextC};
    }
    }
}