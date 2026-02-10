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

    private int turnCount = 1;
    private int maxTurns;
    private int maxSpawns;
    private long spawnCost;
    private long initHp;

    // เพิ่ม Field ใหม่ตาม Spec
    private long maxBudget;
    private double interestPct;

    private Map<Integer, Integer> spawnCounts = new HashMap<>();
    private Set<String> spawnableHexesP1 = new HashSet<>();
    private Set<String> spawnableHexesP2 = new HashSet<>();

    // อัปเดต Constructor ให้รับ maxBudget และ interestPct
    public GameState(long initBudget, int maxTurns, int maxSpawns, long spawnCost, long initHp, long maxBudget, double interestPct) {
        this.maxTurns = maxTurns;
        this.maxSpawns = maxSpawns;
        this.spawnCost = spawnCost;
        this.initHp = initHp;
        this.maxBudget = maxBudget;     // New
        this.interestPct = interestPct; // New

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
        // Player 1 Spawn zones
        spawnableHexesP1.add("1,1"); spawnableHexesP1.add("1,2"); spawnableHexesP1.add("1,3");
        spawnableHexesP1.add("2,1"); spawnableHexesP1.add("2,2");

        // Player 2 Spawn zones
        spawnableHexesP2.add("8,8"); spawnableHexesP2.add("8,7"); spawnableHexesP2.add("8,6");
        spawnableHexesP2.add("7,8"); spawnableHexesP2.add("7,7");
    }

    // --- New Methods for Evaluator Support ---

    public long getMaxBudget() {
        return maxBudget;
    }

    public long getRemainingSpawns(int playerId) {
        return Math.max(0, maxSpawns - spawnCounts.getOrDefault(playerId, 0));
    }

    // คำนวณอัตราดอกเบี้ย (Spec หน้า 4 ข้อ 111)
    // r = b * log10(m) * ln(t)
    public long calculateInterest(long currentBudget) {
        if (currentBudget <= 0) return 0;

        // b = interestPct, m = currentBudget, t = turnCount
        double r = interestPct * Math.log10(currentBudget) * Math.log(turnCount);
        return (long) r; // Spec บอกว่า Int variable คืนค่าเป็น percentage (integer)
    }
    // -----------------------------------------

    public boolean buyHex(Player player, int row, int col, long cost) {
        if (!isValidHex(row, col)) return false;
        Hex target = board[row][col];
        if (target.getOwner() != null) return false;

        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        boolean isAdjacent = false;

        String[] directions = {"up", "down", "upleft", "upright", "downleft", "downright"};
        for (String d : directions) {
            int[] neighbor = getNeighbor(row, col, d);
            if (mySpawnables.contains(neighbor[0] + "," + neighbor[1])) {
                isAdjacent = true;
                break;
            }
        }

        if (!isAdjacent) return false;

        if (player.spend(cost)) {
            target.setOwner(player);
            mySpawnables.add(row + "," + col);
            return true;
        }
        return false;
    }

    public boolean canSpawn(Player player, int row, int col) {
        if (!isValidHex(row, col)) return false;
        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        if (!mySpawnables.contains(row + "," + col)) return false;

        Hex target = board[row][col];
        if (target.getOccupant() != null) return false;
        if (spawnCounts.getOrDefault(player.getId(), 0) >= maxSpawns) return false;

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
        if (isValidHex(row, col)) return board[row][col];
        return null;
    }

    public Player getPlayer(int id) { return players.get(id); }
    public Map<Integer, Player> getPlayers() { return players; }
    public Hex[][] getBoard() { return board; }

    public int getTurnCount() { return turnCount; }
    public void nextTurn() { turnCount++; }
    public boolean isGameOver() { return turnCount > maxTurns; }
}