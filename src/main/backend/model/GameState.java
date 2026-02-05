package main.backend.model;

import java.util.HashMap;
import java.util.Map;

public class GameState {
    private Hex[][] board; // กระดานเก็บ Hex แบบ 2D Array
    private Map<Integer, Player> players; // เก็บผู้เล่น P1, P2
    private int rows = 8;
    private int cols = 8;

    public GameState(double initBudget) {
        this.board = new Hex[rows + 1][cols + 1]; // ใช้ index 1-8 เพื่อความไม่งง
        this.players = new HashMap<>();

        // สร้างกระดานเปล่า
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= cols; c++) {
                board[r][c] = new Hex(r, c);
            }
        }

        // สร้างผู้เล่น 2 คน
        players.put(1, new Player(1, initBudget));
        players.put(2, new Player(2, initBudget));

        // กำหนดจุดเกิดเริ่มต้น (Spawn Areas) ตามกติกา
        setupInitialSpawnAreas();
    }

    private void setupInitialSpawnAreas() {
        // P1 เริ่มมุมบนซ้าย (Top-Left)
        int[][] p1Starts = {{1,1}, {1,2}, {1,3}, {2,1}, {2,2}};
        for (int[] pos : p1Starts) {
            if (isValidHex(pos[0], pos[1])) board[pos[0]][pos[1]].setSpawnable(true);
        }

        // P2 เริ่มมุมล่างขวา (Bottom-Right)
        int[][] p2Starts = {{8,8}, {8,7}, {8,6}, {7,8}, {7,7}};
        for (int[] pos : p2Starts) {
            if (isValidHex(pos[0], pos[1])) board[pos[0]][pos[1]].setSpawnable(true);
        }
    }

    // --- เมธอดจัดการการเล่น (Actions) ---

    public boolean buyHex(Player player, int r, int c, double cost) {
        if (!isValidHex(r, c)) return false;
        Hex hex = board[r][c];

        // เงื่อนไข: ต้องยังไม่ถูกซื้อ และ ต้องอยู่ติดกับเขตเดิมของตัวเอง
        if (!hex.isSpawnable() && isAdjacentToSpawnable(r, c) && player.spend(cost)) {
            hex.setSpawnable(true); // ในเกมจริงอาจต้องระบุว่าเป็นของ Player ไหน
            return true;
        }
        return false;
    }

    public boolean spawnMinion(Player player, int r, int c, double cost, Minion minion) {
        if (!isValidHex(r, c)) return false;
        Hex hex = board[r][c];

        // เงื่อนไข: ต้องเป็นพื้นที่ spawnable, ไม่มีคนอยู่, และเงินพอ
        if (hex.isSpawnable() && hex.getOccupant() == null && player.spend(cost)) {
            hex.setOccupant(minion);
            minion.setRow(r);
            minion.setCol(c);
            player.addMinion(minion);
            return true;
        }
        return false;
    }

    public void moveMinion(Minion m, String direction) {
        int[] nextPos = getNeighbor(m.getRow(), m.getCol(), direction);
        int nr = nextPos[0];
        int nc = nextPos[1];

        if (isValidHex(nr, nc)) {
            Hex targetHex = board[nr][nc];
            // ต้องไม่มีคนขวาง
            if (targetHex.getOccupant() == null) {
                // ย้ายออกจากช่องเดิม
                board[m.getRow()][m.getCol()].setOccupant(null);

                // ไปเข้าช่องใหม่
                m.setRow(nr);
                m.setCol(nc);
                targetHex.setOccupant(m);
            }
        }
    }

    // --- ระบบพิกัดและเพื่อนบ้าน (Hex Logic) ---

    public int[] getNeighbor(int r, int c, String direction) {
        int nextR = r;
        int nextC = c;
        boolean isEvenCol = (c % 2 == 0); // คอลัมน์คู่เยื้องลง (Shifted Down)

        switch (direction) {
            case "up": nextR--; break;
            case "down": nextR++; break;
            case "upleft":
                nextC--;
                if (!isEvenCol) nextR--;
                break;
            case "downleft":
                nextC--;
                if (isEvenCol) nextR++;
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

    private boolean isAdjacentToSpawnable(int r, int c) {
        String[] dirs = {"up", "down", "upleft", "downleft", "upright", "downright"};
        for (String d : dirs) {
            int[] n = getNeighbor(r, c, d);
            if (isValidHex(n[0], n[1]) && board[n[0]][n[1]].isSpawnable()) {
                return true;
            }
        }
        return false;
    }

    public boolean isValidHex(int r, int c) {
        return r >= 1 && r <= rows && c >= 1 && c <= cols;
    }

    // --- Getters ---

    public Hex getHex(int r, int c) {
        if (!isValidHex(r, c)) return null;
        return board[r][c];
    }

    public Player getPlayer(int id) {
        return players.get(id);
    }
}