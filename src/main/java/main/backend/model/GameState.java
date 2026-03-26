package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class GameState {

    @JsonIgnore
    private final Hex[][] board;

    private final Map<Integer, Player> players;
    private final int rows = 8;
    private final int cols = 8;

    private int turnCount = 1;
    private final int maxTurns;
    private final int maxSpawns;
    private final long spawnCost;
    private final long initHp;
    private final long maxBudget;
    private final double interestPct;

    private int activePlayerId = 1;
    private boolean gameOver;
    private int winner;

    private final Map<Integer, Integer> spawnCounts = new HashMap<>();
    private final Map<Integer, Integer> playerTurnCounts = new HashMap<>();
    private final Map<Integer, Double> interestByPlayer = new HashMap<>();
    private final Map<Integer, Integer> strategyCostByPlayer = new HashMap<>();
    private final Map<Integer, Boolean> boughtHexThisTurn = new HashMap<>();
    private final Map<Integer, Boolean> spawnedThisTurn = new HashMap<>();
    private final List<BattleLogEntry> battleLog = new ArrayList<>();

    @JsonIgnore
    private final Set<String> spawnableHexesP1 = new HashSet<>();
    @JsonIgnore
    private final Set<String> spawnableHexesP2 = new HashSet<>();

    @JsonProperty("board")
    public Map<Integer, Map<Integer, Hex>> getBoardAsMap() {
        refreshHexStates();
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
        this.playerTurnCounts.put(1, 0);
        this.playerTurnCounts.put(2, 0);
        this.interestByPlayer.put(1, 0.0);
        this.interestByPlayer.put(2, 0.0);
        this.strategyCostByPlayer.put(1, 0);
        this.strategyCostByPlayer.put(2, 0);
        this.boughtHexThisTurn.put(1, false);
        this.boughtHexThisTurn.put(2, false);
        this.spawnedThisTurn.put(1, false);
        this.spawnedThisTurn.put(2, false);

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

        int[][] p1Spawns = {{1, 1}, {1, 2}, {1, 3}, {2, 1}, {2, 2}};
        for (int[] pos : p1Spawns) {
            spawnableHexesP1.add(pos[0] + "," + pos[1]);
            board[pos[0]][pos[1]].setOwner(players.get(1));
            board[pos[0]][pos[1]].setSpawnable(true);
        }

        int[][] p2Spawns = {{8, 8}, {8, 7}, {8, 6}, {7, 8}, {7, 7}};
        for (int[] pos : p2Spawns) {
            spawnableHexesP2.add(pos[0] + "," + pos[1]);
            board[pos[0]][pos[1]].setOwner(players.get(2));
            board[pos[0]][pos[1]].setSpawnable(true);
        }
    }

    public long getMaxBudget() {
        return maxBudget;
    }

    public int getMaxTurns() {
        return maxTurns;
    }

    public long getSpawnCost() {
        return spawnCost;
    }

    public long getInitHp() {
        return initHp;
    }

    public double getInterestPct() {
        return interestPct;
    }

    public long getRemainingSpawns(int playerId) {
        return Math.max(0, maxSpawns - spawnCounts.getOrDefault(playerId, 0));
    }

    public int getTotalSpawnedMinions() {
        return spawnCounts.values().stream().mapToInt(Integer::intValue).sum();
    }

    public List<BattleLogEntry> getBattleLog() {
        return battleLog;
    }

    public void addBattleLog(BattleLogEntry entry) {
        if (entry == null) {
            return;
        }
        battleLog.add(entry);
        if (battleLog.size() > 120) {
            battleLog.remove(0);
        }
    }

    public Map<Integer, Integer> getStrategyCostByPlayer() {
        return strategyCostByPlayer;
    }

    public Map<Integer, Boolean> getBoughtHexThisTurn() {
        return boughtHexThisTurn;
    }

    public Map<Integer, Boolean> getSpawnedThisTurn() {
        return spawnedThisTurn;
    }

    public void resetStrategyCostForPlayer(int playerId) {
        strategyCostByPlayer.put(playerId, 0);
    }

    public void addStrategyCostForPlayer(int playerId, int amount) {
        strategyCostByPlayer.put(playerId, strategyCostByPlayer.getOrDefault(playerId, 0) + Math.max(0, amount));
    }

    public boolean hasBoughtHexThisTurn(int playerId) {
        return boughtHexThisTurn.getOrDefault(playerId, false);
    }

    public void setBoughtHexThisTurn(int playerId, boolean value) {
        boughtHexThisTurn.put(playerId, value);
    }

    public boolean hasSpawnedThisTurn(int playerId) {
        return spawnedThisTurn.getOrDefault(playerId, false);
    }

    public void setSpawnedThisTurn(int playerId, boolean value) {
        spawnedThisTurn.put(playerId, value);
    }

    public double calculateInterest(double currentBudget, int playerTurnCount) {
        if (currentBudget < 1) {
            return 0.0;
        }

        int safeTurnCount = Math.max(1, playerTurnCount);
        double rate = interestPct * Math.log10(currentBudget) * Math.log(safeTurnCount);
        double interest = currentBudget * rate / 100.0;
        if (Double.isNaN(interest) || Double.isInfinite(interest)) {
            return 0.0;
        }
        return interest;
    }

    public boolean buyHex(Player player, int row, int col, long cost) {
        if (player == null || !isValidHex(row, col)) {
            return false;
        }

        Hex target = board[row][col];
        if (target.getOwner() != null) {
            return false;
        }

        Set<String> myOwnedHexes = getOwnedHexes(player.getId());
        boolean isAdjacent = false;
        for (String direction : new String[]{"up", "down", "upleft", "upright", "downleft", "downright"}) {
            int[] neighbor = getNeighbor(row, col, direction);
            if (myOwnedHexes.contains(neighbor[0] + "," + neighbor[1])) {
                isAdjacent = true;
                break;
            }
        }

        if (!isAdjacent) {
            return false;
        }

        if (!player.spend(cost)) {
            return false;
        }

        target.setOwner(player);
        target.setSpawnable(true);
        getSpawnableHexes(player.getId()).add(row + "," + col);
        return true;
    }

    public boolean canSpawn(Player player, int row, int col) {
        if (player == null || !isValidHex(row, col)) {
            return false;
        }

        Hex target = board[row][col];
        if (target == null || target.getOwner() == null || target.getOwner().getId() != player.getId()) {
            return false;
        }
        if (target.getOccupant() != null) {
            return false;
        }
        return spawnCounts.getOrDefault(player.getId(), 0) < maxSpawns;
    }

    public void placeMinion(Player player, Minion minion, int row, int col) {
        if (player == null || minion == null || !isValidHex(row, col)) {
            return;
        }

        board[row][col].setOccupant(minion);
        minion.setOwner(player);
        minion.setPosition(row, col);
        player.addMinion(minion);
        spawnCounts.put(player.getId(), spawnCounts.getOrDefault(player.getId(), 0) + 1);
    }

    public boolean moveMinion(Minion minion, String direction) {
        if (minion == null || !minion.isAlive()) {
            return false;
        }

        int[] next = getNeighbor(minion.getRow(), minion.getCol(), direction);
        int targetRow = next[0];
        int targetCol = next[1];
        if (!isValidHex(targetRow, targetCol)) {
            return false;
        }

        Hex currentHex = getHex(minion.getRow(), minion.getCol());
        Hex targetHex = getHex(targetRow, targetCol);
        if (currentHex == null || targetHex == null || targetHex.getOccupant() != null) {
            return false;
        }

        currentHex.setOccupant(null);
        targetHex.setOccupant(minion);
        minion.setPosition(targetRow, targetCol);
        return true;
    }

    public void removeMinion(Minion minion) {
        if (minion == null) {
            return;
        }

        if (isValidHex(minion.getRow(), minion.getCol())) {
            Hex hex = board[minion.getRow()][minion.getCol()];
            if (hex != null && hex.getOccupant() == minion) {
                hex.setOccupant(null);
            }
        }

        Player owner = minion.getOwner();
        if (owner != null) {
            owner.getMinions().remove(minion);
        }

        minion.setPosition(0, 0);
    }

    public void removeDeadMinions() {
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= cols; c++) {
                Hex hex = board[r][c];
                if (hex == null) {
                    continue;
                }
                Minion occupant = hex.getOccupant();
                if (occupant != null && !occupant.isAlive()) {
                    removeMinion(occupant);
                }
            }
        }

        for (Player player : players.values()) {
            player.getMinions().removeIf(minion -> minion == null || !minion.isAlive());
        }
    }

    public int[] getNeighbor(int row, int col, String direction) {
        int nextRow = row;
        int nextCol = col;
        boolean isOddCol = (col % 2 != 0);

        switch (direction) {
            case "up":
                nextRow = row - 1;
                break;
            case "down":
                nextRow = row + 1;
                break;
            case "upleft":
                nextRow = isOddCol ? row : row - 1;
                nextCol = col - 1;
                break;
            case "upright":
                nextRow = isOddCol ? row : row - 1;
                nextCol = col + 1;
                break;
            case "downleft":
                nextRow = isOddCol ? row + 1 : row;
                nextCol = col - 1;
                break;
            case "downright":
                nextRow = isOddCol ? row + 1 : row;
                nextCol = col + 1;
                break;
            default:
                break;
        }

        return new int[]{nextRow, nextCol};
    }

    public boolean isValidHex(int row, int col) {
        return row >= 1 && row <= rows && col >= 1 && col <= cols;
    }

    public void refreshHexStates() {
        for (int row = 1; row <= rows; row++) {
            for (int col = 1; col <= cols; col++) {
                Hex hex = board[row][col];
                if (hex == null) {
                    continue;
                }

                boolean isOwned = hex.getOwner() != null;
                hex.setSpawnable(isOwned);
                hex.setBuyable(false);
            }
        }

        Player activePlayer = players.get(activePlayerId);
        if (activePlayer == null) {
            return;
        }

        Set<String> activeOwned = getOwnedHexes(activePlayerId);
        for (String ownedKey : activeOwned) {
            String[] parts = ownedKey.split(",");
            if (parts.length != 2) {
                continue;
            }

            int row = Integer.parseInt(parts[0]);
            int col = Integer.parseInt(parts[1]);

            for (String direction : new String[]{"up", "down", "upleft", "upright", "downleft", "downright"}) {
                int[] neighbor = getNeighbor(row, col, direction);
                int neighborRow = neighbor[0];
                int neighborCol = neighbor[1];

                if (!isValidHex(neighborRow, neighborCol)) {
                    continue;
                }

                Hex target = board[neighborRow][neighborCol];
                if (target.getOwner() == null) {
                    target.setBuyable(true);
                }
            }
        }
    }

    public Hex getHex(int row, int col) {
        return isValidHex(row, col) ? board[row][col] : null;
    }

    @JsonIgnore
    public Hex[][] getBoard() {
        return board;
    }

    public Player getPlayer(int id) {
        return players.get(id);
    }

    public Map<Integer, Player> getPlayers() {
        return players;
    }

    public Map<Integer, Double> getInterestByPlayer() {
        return interestByPlayer;
    }

    public void setInterestForPlayer(int playerId, double interest) {
        interestByPlayer.put(playerId, interest);
    }

    public int getPlayerTurnCount(int playerId) {
        return playerTurnCounts.getOrDefault(playerId, 0);
    }

    public void setPlayerTurnCount(int playerId, int turnCount) {
        playerTurnCounts.put(playerId, Math.max(0, turnCount));
    }

    public int getTotalPlayedTurns() {
        return playerTurnCounts.values().stream().mapToInt(Integer::intValue).sum();
    }

    public int getTurnCount() {
        return turnCount;
    }

    public void nextTurn() {
        turnCount++;
    }

    public boolean hasReachedTurnLimit() {
        return playerTurnCounts.getOrDefault(1, 0) >= maxTurns
                && playerTurnCounts.getOrDefault(2, 0) >= maxTurns;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public void setGameOver(boolean gameOver) {
        this.gameOver = gameOver;
    }

    public int getWinner() {
        return winner;
    }

    public void setWinner(int winner) {
        this.winner = winner;
    }

    public List<Minion> getMinionsOfPlayer(int playerId) {
        List<Minion> result = new ArrayList<>();
        Player player = players.get(playerId);
        if (player == null) {
            return result;
        }

        for (Minion minion : player.getMinions()) {
            if (minion != null && minion.isAlive()) {
                result.add(minion);
            }
        }
        return result;
    }

    private Set<String> getSpawnableHexes(int playerId) {
        return playerId == 1 ? spawnableHexesP1 : spawnableHexesP2;
    }

    private Set<String> getOwnedHexes(int playerId) {
        Set<String> ownedHexes = new HashSet<>();
        for (int row = 1; row <= rows; row++) {
            for (int col = 1; col <= cols; col++) {
                Hex hex = board[row][col];
                if (hex != null && hex.getOwner() != null && hex.getOwner().getId() == playerId) {
                    ownedHexes.add(row + "," + col);
                }
            }
        }
        return ownedHexes;
    }
}
