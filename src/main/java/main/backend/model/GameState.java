package main.backend.model;

import java.util.HashMap;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;



public class GameState {
    private Hex[][] board;
    private Map<Integer, Player> players;
    private int rows = 8;
    private int cols = 8;

    // ตัวแปรสำหรับกติกาเกม
    private int turnCount = 1;
    private int maxTurns;
    private int maxSpawns;
    private long spawnCost;
    private long initHp; // ค่า HP เริ่มต้น (อาจเก็บไว้ใช้เป็น Default หรืออ้างอิง)

    private Set<String> spawnableHexesP1 = new HashSet<>();
    private Set<String> spawnableHexesP2 = new HashSet<>();

    // เก็บจำนวน minion ที่ spawn ไปแล้วของแต่ละคน
    private Map<Integer, Integer> spawnCounts = new HashMap<>();

    public GameState(long initBudget, int maxTurns, int maxSpawns, long spawnCost, long initHp) {
        this.maxTurns = maxTurns;
        this.maxSpawns = maxSpawns;
        this.spawnCost = spawnCost;
        this.initHp = initHp;

        this.board = new Hex[rows + 1][cols + 1];
        this.players = new HashMap<>();
        // กำหนดค่าเริ่มต้นจำนวน Spawn เป็น 0
        this.spawnCounts.put(1, 0);
        this.spawnCounts.put(2, 0);

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
        // กำหนดพื้นที่ Spawn เริ่มต้นตาม Spec (หน้า 3 ภาพประกอบ)
        // Player 1: มุมซ้ายบน (1,1), (1,2), (1,3), (2,1), (2,2)
        spawnableHexesP1.add("1,1"); spawnableHexesP1.add("1,2"); spawnableHexesP1.add("1,3");
        spawnableHexesP1.add("2,1"); spawnableHexesP1.add("2,2");

        // Player 2: มุมขวาล่าง (8,8), (8,7), (8,6), (7,8), (7,7)
        spawnableHexesP2.add("8,8"); spawnableHexesP2.add("8,7"); spawnableHexesP2.add("8,6");
        spawnableHexesP2.add("7,8"); spawnableHexesP2.add("7,7");

    }

    // --- Logic การซื้อพื้นที่ ---
    public boolean buyHex(Player player, int row, int col, long cost) {
        if (!isValidHex(row, col)) return false;
        Hex target = board[row][col];
        if (target.getOwner() != null) return false;

        // เช็คว่าติดกับพื้นที่ Spawn เดิมของตัวเองหรือไม่
        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        boolean isAdjacent = false;

        // ทิศทางทั้ง 6
        String[] dirs = {"up", "down", "upleft", "upright", "downleft", "downright"};
        for (String d : dirs) {
            int[] neighbor = getNeighbor(row, col, d);
            if (mySpawnables.contains(neighbor[0] + "," + neighbor[1])) {
                isAdjacent = true;
                break;
            }
        }

        if (!isAdjacent) return false; // ไม่ติดกับพื้นที่ Spawn เดิม ซื้อไม่ได้

        if (player.spend(cost)) {
            target.setOwner(player);
            // พื้นที่ที่ซื้อใหม่ กลายเป็นจุด Spawn ได้ด้วย
            mySpawnables.add(row + "," + col);
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
            if (nextHex.getOccupant() == null) {
                currentHex.setOccupant(null);
                nextHex.setOccupant(minion);
                minion.setPosition(r, c);
            }
        }
    }

    // --- Helper คำนวณทิศทาง ---
    public int[] getNeighbor(int row, int col, String direction) {
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

    public Hex getHex(int row, int col) {
        if (isValidHex(row, col)) {
            return board[row][col];
        }
        return null;
    }

    // --- Turn Management ---
    public int getTurnCount() { return turnCount; }
    public void nextTurn() { turnCount++; }
    public boolean isGameOver() { return turnCount > maxTurns; }

    // --- Spawn Helper Methods (ใช้โดย GameService) ---

    // 1. เช็คเงื่อนไขก่อน Spawn (ไม่หักเงิน)
    public boolean canSpawn(Player player, int row, int col) {
        if (!isValidHex(row, col)) return false;

        // ต้องอยู่ใน Set พื้นที่ Spawn ของตัวเอง
        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        if (!mySpawnables.contains(row + "," + col)) return false;

        Hex target = board[row][col];
        if (target.getOccupant() != null) return false;
        if (spawnCounts.getOrDefault(player.getId(), 0) >= maxSpawns) return false;

        return true;
    }

    // 2. วาง Minion ลงกระดานจริง (หลังจาก GameService หักเงินและสร้างตัวแล้ว)
    public void placeMinion(Player player, Minion minion, int row, int col) {
        Hex target = board[row][col];
        player.addMinion(minion);
        target.setOccupant(minion);

        // อัปเดตจำนวนที่ Spawn ไปแล้ว
        int currentCount = spawnCounts.getOrDefault(player.getId(), 0);
        spawnCounts.put(player.getId(), currentCount + 1);
    }

    // --- Getters ---
    public Hex[][] getBoard() { return board; }
    public Player getPlayer(int id) { return players.get(id); }
    public Map<Integer, Player> getPlayers() { return players; }
}