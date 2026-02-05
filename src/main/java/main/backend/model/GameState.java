package main.backend.model;

import java.util.HashMap;
import java.util.Map;

public class GameState {
    private Hex[][] board;
    private Map<Integer, Player> players;
    private int rows = 8;
    private int cols = 8;

    public GameState(double initBudget) {
        this.board = new Hex[rows + 1][cols + 1]; // เริ่มที่ index 1 ตามโจทย์
        this.players = new HashMap<>();

        // สร้างผู้เล่น 2 คน
        players.put(1, new Player(1, initBudget));
        players.put(2, new Player(2, initBudget));

        initializeBoard();
    }

    private void initializeBoard() {
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                board[i][j] = new Hex(i, j);
            }
        }
    }

    // --- Logic การซื้อพื้นที่ ---
    public boolean buyHex(Player player, int row, int col, double cost) {
        if (!isValidHex(row, col)) return false;

        Hex target = board[row][col];
        if (target.getOwner() != null) return false; // มีคนจองแล้ว

        // เช็คว่าซื้อได้ไหม (ต้องติดกับพื้นที่ตัวเอง หรือเป็นจุดเริ่มต้น)
        // เพื่อความง่ายในขั้นต้น: อนุญาตให้ซื้อได้ถ้าเงินพอ (หรือจะเพิ่ม Logic isSpawnable ตรงนี้ก็ได้)
        if (player.spend(cost)) {
            target.setOwner(player);

            // แถม Minion ให้ 1 ตัวเมื่อซื้อที่ (ตามกติกาพื้นฐาน หรือจะแยกปุ่ม Spawn ก็ได้)
            // ในที่นี้สมมติว่าซื้อที่แล้วได้ Minion เลยเพื่อทดสอบ
            Minion m = new Minion(player, row, col);
            player.addMinion(m);
            target.setOccupant(m);

            return true;
        }
        return false;
    }

    // --- Logic การเคลื่อนที่ ---
    public void moveMinion(Minion minion, String direction) {
        int[] nextPos = getNeighbor(minion.getRow(), minion.getCol(), direction);
        int r = nextPos[0];
        int c = nextPos[1];

        if (isValidHex(r, c)) {
            Hex currentHex = board[minion.getRow()][minion.getCol()];
            Hex nextHex = board[r][c];

            // เดินได้ถ้าไม่มีคนขวาง
            if (nextHex.getOccupant() == null) {
                // ย้ายตัว
                currentHex.setOccupant(null);
                nextHex.setOccupant(minion);
                minion.setPosition(r, c);
            }
        }
    }

    // --- Logic คำนวณทิศทางหกเหลี่ยม (สำคัญมาก!) ---
    // Offset Coordinates: "Odd-r" horizontal layout (แถวคี่/คู่ เยื้องไม่เหมือนกัน)
    public int[] getNeighbor(int row, int col, String direction) {
        // ทิศทาง: up, upright, downright, down, downleft, upleft
        // ตรวจสอบว่าเป็นแถวคู่หรือคี่
        int[][] directions;
        if (row % 2 != 0) { // แถวคี่ (Odd)
            directions = new int[][]{
                    {-1, 0}, {-1, 1}, {0, 1}, {1, 0}, {0, -1}, {-1, -1}
            };
        } else { // แถวคู่ (Even)
            directions = new int[][]{
                    {-1, 0}, {-1, 1}, {1, 1}, {1, 0}, {1, -1}, {0, -1} // แก้ไขทิศให้ถูกต้องตาม Offset
                    // หมายเหตุ: สูตร Offset Hexagon อาจซับซ้อน ปรับตามความเหมาะสม
                    // ชุดนี้คือมาตรฐาน Odd-r:
                    // Odd: (-1,0), (-1,+1), (0,+1), (+1,0), (+1,-1), (0,-1) -> (ไม่ตรงชื่อทิศเป๊ะๆ ต้อง map เอา)
            };
        }

        // Mapping ชื่อทิศ -> index array
        int idx = switch (direction) {
            case "up" -> 0;
            case "upright" -> 1;
            case "downright" -> 2;
            case "down" -> 3;
            case "downleft" -> 4;
            case "upleft" -> 5;
            default -> -1;
        };

        if (idx == -1) return new int[]{row, col};

        // เพื่อความชัวร์ ใช้ Logic แบบเจาะจงเลยดีกว่า (Odd-r Shove)
        int dRow = 0, dCol = 0;
        boolean isOdd = (row % 2 != 0);

        switch (direction) {
            case "up":        dRow = -1; dCol = 0; break;
            case "down":      dRow = 1; dCol = 0; break;
            case "upleft":    dRow = -1; dCol = isOdd ? -1 : 0; break;
            case "upright":   dRow = -1; dCol = isOdd ? 0 : 1; break;
            case "downleft":  dRow = 1; dCol = isOdd ? -1 : 0; break;
            case "downright": dRow = 1; dCol = isOdd ? 0 : 1; break;
        }

        return new int[]{row + dRow, col + dCol};
    }

    public boolean isValidHex(int r, int c) {
        return r >= 1 && r <= rows && c >= 1 && c <= cols;
    }

    public Hex getHex(int r, int c) {
        if (isValidHex(r, c)) return board[r][c];
        return null;
    }

    // --- Getters (ต้องมี เพื่อให้ส่ง JSON ไปหน้าเว็บได้) ---
    public Hex[][] getBoard() {
        return board;
    }

    public Player getPlayer(int id) {
        return players.get(id);
    }

    public Map<Integer, Player> getPlayers() {
        return players;
    }
}