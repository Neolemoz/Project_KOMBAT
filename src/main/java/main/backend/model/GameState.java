package main.backend.model;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GameState {
    private Hex[][] board;
    private Map<Integer, Player> players;
    private int rows = 8;
    private int cols = 8;

    // กติกาเกม
    private int turnCount = 1;
    private int maxTurns;
    private int maxSpawns;
    private long spawnCost;
    private long initHp;

    // เก็บจำนวน minion ที่ spawn ไปแล้ว
    private Map<Integer, Integer> spawnCounts = new HashMap<>();

    // --- เพิ่มส่วนนี้: เก็บพิกัดพื้นที่ Spawn ของแต่ละฝ่าย ---
    private Set<String> spawnableHexesP1 = new HashSet<>();
    private Set<String> spawnableHexesP2 = new HashSet<>();

    public GameState(long initBudget, int maxTurns, int maxSpawns, long spawnCost, long initHp) {
        this.maxTurns = maxTurns;
        this.maxSpawns = maxSpawns;
        this.spawnCost = spawnCost;
        this.initHp = initHp;

        this.board = new Hex[rows + 1][cols + 1];
        this.players = new HashMap<>();

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

        // --- เพิ่มส่วนนี้: กำหนดพื้นที่ Spawn เริ่มต้น (ตาม Spec หน้า 3) ---
        // Player 1: มุมซ้ายบน
        spawnableHexesP1.add("1,1"); spawnableHexesP1.add("1,2"); spawnableHexesP1.add("1,3");
        spawnableHexesP1.add("2,1"); spawnableHexesP1.add("2,2");

        // Player 2: มุมขวาล่าง
        spawnableHexesP2.add("8,8"); spawnableHexesP2.add("8,7"); spawnableHexesP2.add("8,6");
        spawnableHexesP2.add("7,8"); spawnableHexesP2.add("7,7");
    }

    // --- แก้ไข Logic การซื้อพื้นที่ (Spec ข้อ 93-94) ---
    public boolean buyHex(Player player, int row, int col, long cost) {
        if (!isValidHex(row, col)) return false;

        Hex target = board[row][col];
        if (target.getOwner() != null) return false; // ห้ามซื้อทับ

        // ตรวจสอบว่า "ติดกับพื้นที่ Spawn เดิม" ของตัวเองหรือไม่
        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        boolean isAdjacent = false;

        String[] directions = {"up", "down", "upleft", "upright", "downleft", "downright"};
        for (String d : directions) {
            int[] neighbor = getNeighbor(row, col, d);
            // neighbor[0] = row, neighbor[1] = col
            if (mySpawnables.contains(neighbor[0] + "," + neighbor[1])) {
                isAdjacent = true;
                break;
            }
        }

        if (!isAdjacent) return false; // ไม่ติดกับพื้นที่ Spawn เดิม ซื้อไม่ได้

        if (player.spend(cost)) {
            target.setOwner(player);
            // พื้นที่ที่ซื้อใหม่ กลายเป็นจุด Spawn ได้ด้วย (Spec ข้อ 95)
            mySpawnables.add(row + "," + col);
            return true;
        }
        return false;
    }

    // --- แก้ไข Logic การ Spawn (Spec ข้อ 75-76) ---
    public boolean canSpawn(Player player, int row, int col) {
        if (!isValidHex(row, col)) return false;

        // ต้องอยู่ในพื้นที่ Spawn ของตัวเองเท่านั้น
        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        if (!mySpawnables.contains(row + "," + col)) return false;

        Hex target = board[row][col];
        if (target.getOccupant() != null) return false; // ห้ามวางทับ Minion อื่น
        if (spawnCounts.getOrDefault(player.getId(), 0) >= maxSpawns) return false; // ห้ามเกินโควต้า

        return true;
    }

    public void placeMinion(Player player, Minion minion, int row, int col) {
        if (isValidHex(row, col)) {
            Hex target = board[row][col];
            player.addMinion(minion);
            target.setOccupant(minion);
            minion.setPosition(row, col);

            int currentCount = spawnCounts.getOrDefault(player.getId(), 0);
            spawnCounts.put(player.getId(), currentCount + 1);
        }
    }

    // --- Logic การเคลื่อนที่และอื่นๆ (คงเดิม) ---
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

    public Player getPlayer(int id) { return players.get(id); }
    public Map<Integer, Player> getPlayers() { return players; }
    public Hex[][] getBoard() { return board; }

    public int getTurnCount() { return turnCount; }
    public void nextTurn() { turnCount++; }
    public boolean isGameOver() { return turnCount > maxTurns; }
}