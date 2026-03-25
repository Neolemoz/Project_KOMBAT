package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;

public class GameState {

    @JsonIgnore  // ซ่อน raw array — ใช้ getBoard() แบบ Map แทน
    private Hex[][] board;

    private Map<Integer, Player> players;
    private int rows = 8;
    private int cols = 8;

    private int turnCount = 1;
    private int maxTurns;
    private int maxSpawns;
    private long spawnCost;
    private long initHp;
    private long maxBudget;
    private double interestPct;

    private int activePlayerId = 1;
    private Map<Integer, Integer> spawnCounts = new HashMap<>();

    @JsonIgnore
    private Set<String> spawnableHexesP1 = new HashSet<>();
    @JsonIgnore
    private Set<String> spawnableHexesP2 = new HashSet<>();

    // ── JSON ส่งออก board เป็น Map<row, Map<col, Hex>> ──
    @JsonProperty("board")
    public Map<Integer, Map<Integer, Hex>> getBoardAsMap() {
        Map<Integer, Map<Integer, Hex>> result = new HashMap<>();
        for (int r = 1; r <= rows; r++) {
            Map<Integer, Hex> rowMap = new HashMap<>();
            for (int c = 1; c <= cols; c++) {
                if (board[r][c] != null) {
                    rowMap.put(c, board[r][c]);
                }
            }
            result.put(r, rowMap);
        }
        return result;
    }

    // currentPlayerId ส่งออกด้วย (frontend ใช้)
    @JsonProperty("currentPlayerId")
    public int getActivePlayerId() {
        return activePlayerId;
    }

    public void setActivePlayerId(int activePlayerId) {
        this.activePlayerId = activePlayerId;
    }

    public GameState(long initBudget, int maxTurns, int maxSpawns, long spawnCost, long initHp, long maxBudget, double interestPct) {
        this.maxTurns = maxTurns;
        this.maxSpawns = maxSpawns;
        this.spawnCost = spawnCost;
        this.initHp = initHp;
        this.maxBudget = maxBudget;
        this.interestPct = interestPct;

        this.board = new Hex[rows + 1][cols + 1];
        this.players = new HashMap<>();
        this.spawnCounts.put(1, 0);
        this.spawnCounts.put(2, 0);

        players.put(1, new Player(1, initBudget));
        players.put(2, new Player(2, initBudget));

        initializeBoard();
    }

    private void initializeBoard() {
        for (int i = 1; i <= rows; i++)
            for (int j = 1; j <= cols; j++)
                board[i][j] = new Hex(i, j);

        // P1 spawn zone — set owner ทันทีเพื่อให้ frontend รู้ว่าเป็นพื้นที่ของ P1
        int[][] p1Spawns = {{1,1},{1,2},{1,3},{2,1},{2,2}};
        for (int[] pos : p1Spawns) {
            spawnableHexesP1.add(pos[0] + "," + pos[1]);
            board[pos[0]][pos[1]].setOwner(players.get(1));
        }

        // P2 spawn zone — set owner ทันทีเพื่อให้ frontend รู้ว่าเป็นพื้นที่ของ P2
        int[][] p2Spawns = {{8,8},{8,7},{8,6},{7,8},{7,7}};
        for (int[] pos : p2Spawns) {
            spawnableHexesP2.add(pos[0] + "," + pos[1]);
            board[pos[0]][pos[1]].setOwner(players.get(2));
        }
    }

    public long getMaxBudget() { return maxBudget; }

    public long getRemainingSpawns(int playerId) {
        return Math.max(0, maxSpawns - spawnCounts.getOrDefault(playerId, 0));
    }

    public long calculateInterest(long currentBudget) {
        if (currentBudget <= 0) return 0;
        double r = interestPct * Math.log10(currentBudget) * Math.log(turnCount);
        return (long) r;
    }

    public boolean buyHex(Player player, int row, int col, long cost) {
        if (!isValidHex(row, col)) return false;
        Hex target = board[row][col];
        if (target.getOwner() != null) return false;

        Set<String> mySpawnables = (player.getId() == 1) ? spawnableHexesP1 : spawnableHexesP2;
        boolean isAdjacent = false;
        for (String d : new String[]{"up","down","upleft","upright","downleft","downright"}) {
            int[] n = getNeighbor(row, col, d);
            if (mySpawnables.contains(n[0] + "," + n[1])) { isAdjacent = true; break; }
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
        if (board[row][col].getOccupant() != null) return false;
        if (spawnCounts.getOrDefault(player.getId(), 0) >= maxSpawns) return false;
        return true;
    }

    public void placeMinion(Player player, Minion minion, int row, int col) {
        if (isValidHex(row, col)) {
            board[row][col].setOccupant(minion);
            player.addMinion(minion);
            minion.setPosition(row, col);
            spawnCounts.put(player.getId(), spawnCounts.getOrDefault(player.getId(), 0) + 1);
        }
    }

    public void moveMinion(Minion minion, String direction) {
        int[] next = getNeighbor(minion.getRow(), minion.getCol(), direction);
        int r = next[0], c = next[1];
        if (isValidHex(r, c) && board[r][c].getOccupant() == null) {
            board[minion.getRow()][minion.getCol()].setOccupant(null);
            board[r][c].setOccupant(minion);
            minion.setPosition(r, c);
        }
    }

    public int[] getNeighbor(int row, int col, String direction) {
        if (direction == null) return new int[]{row, col};
        int dRow = 0, dCol = 0;
        boolean isOdd = (col % 2 != 0);
        switch (direction) {
            case "up":        dRow = -1; dCol =  0; break;
            case "down":      dRow =  1; dCol =  0; break;
            case "upleft":    dRow = isOdd ?  0 : -1; dCol = -1; break;
            case "upright":   dRow = isOdd ?  0 : -1; dCol =  1; break;
            case "downleft":  dRow = isOdd ?  1 :  0; dCol = -1; break;
            case "downright": dRow = isOdd ?  1 :  0; dCol =  1; break;
        }
        return new int[]{row + dRow, col + dCol};
    }

    public boolean isValidHex(int r, int c) { return r >= 1 && r <= rows && c >= 1 && c <= cols; }
    public Hex getHex(int row, int col) { return isValidHex(row, col) ? board[row][col] : null; }

    // getRawBoard ไว้ใช้ภายใน Java เท่านั้น (ไม่ serialize)
    @JsonIgnore
    public Hex[][] getBoard() { return board; }

    public Player getPlayer(int id) { return players.get(id); }
    public Map<Integer, Player> getPlayers() { return players; }
    public int getTurnCount() { return turnCount; }
    public void nextTurn() { turnCount++; }
    public boolean isGameOver() { return turnCount > maxTurns; }

    public List<Minion> getMinionsOfPlayer(int playerId) {
        List<Minion> result = new ArrayList<>();
        Player player = players.get(playerId);
        if (player == null) return result;
        for (int r = 1; r <= rows; r++)
            for (int c = 1; c <= cols; c++) {
                Hex hex = board[r][c];
                if (hex != null && hex.getOccupant() != null && hex.getOccupant().getOwner() == player)
                    result.add(hex.getOccupant());
            }
        return result;
    }
}