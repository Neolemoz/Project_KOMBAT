package main.backend.service;

import main.backend.logic.*;
import main.backend.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameService {
    private static final int MAX_MINION_TYPES = 5;
    private static final int MAX_STRATEGY_LOOPS = 10_000;
    private static final int MAX_GAME_TURNS = 50;
    private static final Set<String> SPECIAL_VARS = Set.of("row", "col", "Budget", "Int", "MaxBudget", "random", "ally", "opponent", "nearby", "SpawnsLeft");

    private GameState gameState;
    private final ConfigLoader config;
    private int currentPlayerId = 1;
    private String gameMode = "duel";
    private final Map<String, MinionType> definedMinionTypes = new HashMap<>();
    private final Set<String> appliedTurnEconomyKeys = new HashSet<>();

    @Autowired
    public GameService(ConfigLoader config) {
        this.config = config;
        init();
    }

    public void setGameMode(String mode) { this.gameMode = mode; }
    public String getGameMode() { return gameMode; }
    public int getCurrentPlayerId() { return currentPlayerId; }
    public GameState getGameState() { refreshGameStatus(); return gameState; }

    public void init() {
        this.gameState = new GameState(config.get("init_budget"), MAX_GAME_TURNS, (int) config.get("max_spawns"), config.get("spawn_cost"), config.get("init_hp"), config.get("max_budget"), (double) config.get("interest_pct"));
        this.definedMinionTypes.clear();
        this.appliedTurnEconomyKeys.clear();
        this.currentPlayerId = 1;
        this.gameState.setActivePlayerId(1);
        this.gameState.setGameOver(false);
        this.gameState.setWinner(0);

        for (int i = 1; i <= 2; i++) {
            this.gameState.setInterestForPlayer(i, 0.0);
            this.gameState.setPlayerTurnCount(i, 0);
            this.gameState.resetStrategyCostForPlayer(i);
            this.gameState.setBoughtHexThisTurn(i, false);
            this.gameState.setSpawnedThisTurn(i, false);
        }
        applyTurnEconomy();
        refreshGameStatus();
    }

    public void applyTurnEconomy() {
        if (gameState.isGameOver()) return;
        String economyKey = gameState.getTurnCount() + ":" + currentPlayerId;
        if (!appliedTurnEconomyKeys.add(economyKey)) return;

        Player player = gameState.getPlayer(currentPlayerId);
        int turnNum = Math.max(1, gameState.getPlayerTurnCount(currentPlayerId) + 1);
        double newBudget = player.getBudget() + config.get("turn_budget");
        double interest = gameState.calculateInterest(newBudget, turnNum);

        player.setBudget(Math.min(newBudget + interest, config.get("max_budget")));
        gameState.setInterestForPlayer(currentPlayerId, interest);
        gameState.setPlayerTurnCount(currentPlayerId, turnNum);
    }

    public boolean defineMinionType(String name, int hp, int defense, String script) {
        if (definedMinionTypes.size() >= MAX_MINION_TYPES || definedMinionTypes.containsKey(name)) return false;
        try {
            definedMinionTypes.put(name, new MinionType(name, hp, defense, new Parser(new Tokenizer(script).tokenize()).parse()));
            return true;
        } catch (Exception e) { return false; }
    }

    public void clearDefinedMinionTypes() { definedMinionTypes.clear(); }

    public boolean spawnMinion(int pId, int row, int col, String typeName) {
        MinionType type = definedMinionTypes.get(typeName);
        return type != null && spawnMinion(pId, row, col, type.getDefense(), typeName, type.getStrategyAST(), type.getMaxHp());
    }

    public boolean spawnMinion(int pId, int row, int col, long def, String script) {
        return spawnMinion(pId, row, col, def, script, "Minion");
    }

    public boolean spawnMinion(int pId, int row, int col, long def, String script, String name) {
        try {
            return spawnMinion(pId, row, col, def, name, new Parser(new Tokenizer(script).tokenize()).parse(), config.get("init_hp"));
        } catch (Exception e) { return false; }
    }

    private boolean spawnMinion(int pId, int row, int col, long def, String name, Node ast, long hp) {
        if (gameState.isGameOver() || pId != currentPlayerId || gameState.hasSpawnedThisTurn(pId)) return false;
        Player p = gameState.getPlayer(pId);
        if (!gameState.canSpawn(p, row, col)) return false;

        long cost = (gameState.getTurnCount() == 1 && p.getMinions().isEmpty()) ? 0 : config.get("spawn_cost");
        if (!p.spend(cost)) return false;

        Minion m = new Minion(p, def, hp, ast);
        if (name != null && !name.isBlank()) m.setName(name);
        gameState.placeMinion(p, m, row, col);
        gameState.setSpawnedThisTurn(pId, true);
        log(pId, "spawn", m.getName(), m.getName() + " spawned at (" + row + "," + col + ").", null, null, row, col, null, null);
        refreshGameStatus();
        return true;
    }

    public boolean buyHex(int pId, int row, int col) {
        if (gameState.isGameOver() || pId != currentPlayerId || gameState.hasBoughtHexThisTurn(pId)) return false;
        if (gameState.buyHex(gameState.getPlayer(pId), row, col, config.get("hex_purchase_cost"))) {
            gameState.setBoughtHexThisTurn(pId, true);
            log(pId, "buy", null, "Player " + pId + " bought hex (" + row + "," + col + ").", null, null, row, col, null, null);
            refreshGameStatus();
            return true;
        }
        return false;
    }

    public void endTurn(Long gameId) {
        if (isGameOver()) return;
        log(currentPlayerId, "turn", null, "Player " + currentPlayerId + " resolved turn " + gameState.getTurnCount(), null, null, null, null, null, null);
        gameState.resetStrategyCostForPlayer(currentPlayerId);

        for (Minion m : gameState.getPlayer(currentPlayerId).getMinions().stream().filter(Objects::nonNull).collect(Collectors.toList())) {
            if (isGameOver()) break;
            if (isMinionActive(m)) executeStrategyNode(m.getStrategy(), new MinionContext(m, gameState), new StrategyExecutionState());
            refreshGameStatus();
        }

        if (isGameOver()) return;
        switchPlayer();
        if (isGameOver()) return;
        applyTurnEconomy();
        refreshGameStatus();
    }

    public void endTurn() { endTurn(null); }

    private void switchPlayer() {
        currentPlayerId = (currentPlayerId == 1) ? 2 : 1;
        if (currentPlayerId == 1) gameState.nextTurn();
        gameState.setBoughtHexThisTurn(currentPlayerId, false);
        gameState.setSpawnedThisTurn(currentPlayerId, false);
        gameState.setActivePlayerId(currentPlayerId);
    }

    private void executeStrategyNode(Node node, MinionContext ctx, StrategyExecutionState state) {
        if (node == null || state.done || state.budgetBlocked || gameState.isGameOver() || !isMinionActive(ctx.getMinion())) {
            state.done = true; return;
        }

        if (node instanceof BlockNode b) {
            for (Node n : b.getStatements()) {
                executeStrategyNode(n, ctx, state);
                if (state.done || state.budgetBlocked || gameState.isGameOver()) break;
            }
        } else if (node instanceof IfStatementNode i) {
            try { executeStrategyNode(evaluate(i.getCondition(), ctx) > 0 ? i.getThenBlock() : i.getElseBlock(), ctx, state); }
            catch (ArithmeticException e) { state.done = true; }
        } else if (node instanceof WhileStatementNode w) {
            int loops = 0;
            while (!state.done && !state.budgetBlocked && !gameState.isGameOver() && loops++ < MAX_STRATEGY_LOOPS && isMinionActive(ctx.getMinion())) {
                try { if (evaluate(w.getCondition(), ctx) <= 0) break; } catch (ArithmeticException e) { state.done = true; break; }
                executeStrategyNode(w.getBody(), ctx, state);
            }
        } else if (node instanceof AssignmentNode a) {
            if (!SPECIAL_VARS.contains(a.getIdentifier())) {
                try { ctx.setVariable(a.getIdentifier(), evaluate(a.getExpression(), ctx)); }
                catch (ArithmeticException e) { state.done = true; throw e; }
            }
        } else if (node instanceof ActionCommandNode ac) {
            applyAction(ac, ctx, state);
        }
    }

    private void applyAction(ActionCommandNode node, MinionContext ctx, StrategyExecutionState state) {
        String act = node.getActionType();
        Minion m = ctx.getMinion();
        if ("done".equals(act)) {
            log(m.getOwner().getId(), "done", m.getName(), m.getName() + " ended its turn.", m.getRow(), m.getCol(), null, null, null, null);
            state.done = true; return;
        }
        Direction dir = Direction.from(node.getDirection());
        if (dir == null) { state.done = true; return; }

        if ("move".equals(act) && !state.moveUsed) {
            state.moveUsed = true;
            if (!handleMove(m, dir)) { state.budgetBlocked = true; state.done = true; }
        } else if ("shoot".equals(act) && !state.shootUsed) {
            try {
                int exp = Math.max(0, (int) Math.min(Integer.MAX_VALUE, Math.max(Integer.MIN_VALUE, evaluate(node.getExpression(), ctx))));
                state.shootUsed = true;
                if (handleShoot(m, dir, exp)) refreshGameStatus();
            } catch (ArithmeticException e) { state.done = true; }
        }
    }

    private boolean handleMove(Minion m, Direction dir) {
        Player p = m.getOwner();
        int r = m.getRow(), c = m.getCol();
        if (!p.spend(1)) {
            log(p.getId(), "move", m.getName(), m.getName() + " failed to move " + dir.value + " due to budget.", r, c, null, null, null, null);
            return false;
        }
        gameState.addStrategyCostForPlayer(p.getId(), 1);
        int[] t = gameState.getNeighbor(r, c, dir.value);
        if (!gameState.isValidHex(t[0], t[1]) || gameState.getHex(t[0], t[1]).getOccupant() != null) {
            log(p.getId(), "move", m.getName(), m.getName() + " tried to move " + dir.value + " but failed.", r, c, t[0], t[1], null, null);
            return true;
        }
        gameState.getHex(r, c).setOccupant(null);
        gameState.getHex(t[0], t[1]).setOccupant(m);
        m.setPosition(t[0], t[1]);
        log(p.getId(), "move", m.getName(), m.getName() + " moved " + dir.value + " to (" + t[0] + "," + t[1] + ").", r, c, t[0], t[1], null, null);
        return true;
    }

    private boolean handleShoot(Minion m, Direction dir, int exp) {
        Player p = m.getOwner();
        int r = m.getRow(), c = m.getCol();
        if (!p.spend(exp + 2L)) {
            log(p.getId(), "shoot", m.getName(), m.getName() + " failed to shoot " + dir.value + " due to budget.", r, c, null, null, null, null);
            return false;
        }
        gameState.addStrategyCostForPlayer(p.getId(), exp + 1);
        int[] t = gameState.getNeighbor(r, c, dir.value);
        Hex tgtHex = gameState.isValidHex(t[0], t[1]) ? gameState.getHex(t[0], t[1]) : null;
        Minion tgt = tgtHex != null ? tgtHex.getOccupant() : null;

        if (tgt == null) {
            log(p.getId(), "shoot", m.getName(), m.getName() + " missed.", r, c, null, null, t[0], t[1]);
        } else {
            int dmg = Math.max(1, exp - tgt.getDefense());
            tgt.takeDamage(dmg);
            String msg = tgt.isAlive() ? m.getName() + " shot (" + t[0] + "," + t[1] + ") for " + dmg + " damage." : m.getName() + " defeated " + tgt.getName() + ".";
            log(p.getId(), "shoot", m.getName(), msg, r, c, null, null, t[0], t[1]);
        }
        return true;
    }

    private long evaluate(ExpressionNode expr, MinionContext ctx) { return expr == null ? 0 : expr.evaluate(ctx); }

    private void log(int pId, String act, String minion, String msg, Integer fR, Integer fC, Integer tR, Integer tC, Integer tgtR, Integer tgtC) {
        gameState.addBattleLog(new BattleLogEntry(gameState.getTurnCount(), pId, act, minion, msg, fR, fC, tR, tC, tgtR, tgtC));
    }

    public int checkWinner() { return getGameState().getWinner(); }

    public void setPlayerStrategy(int pId, String script) {
        try {
            Node ast = new Parser(new Tokenizer(script).tokenize()).parse();
            gameState.getMinionsOfPlayer(pId).forEach(m -> m.setStrategyAST(ast));
            refreshGameStatus();
        } catch (Exception ignored) {}
    }

    public void validateScript(String script) throws Exception { new Parser(new Tokenizer(script).tokenize()).parse(); }

    public Map<String, Object> validateStrategyInput(String script) {
        if (script == null || script.isBlank()) return Map.of("valid", false, "ok", false, "message", "Strategy must not be empty");
        try { validateScript(script); return Map.of("valid", true, "ok", true, "message", "Valid strategy"); }
        catch (Exception e) { return Map.of("valid", false, "ok", false, "message", e.getMessage() != null ? e.getMessage() : "Invalid syntax"); }
    }

    public void playBotTurn() {
        if (isGameOver()) return;
        Player bot = gameState.getPlayer(currentPlayerId);
        if (bot.getBudget() >= config.get("hex_purchase_cost") && !gameState.hasBoughtHexThisTurn(bot.getId())) {
            for (int r = 1; r <= 8; r++) for (int c = 1; c <= 8; c++) {
                Hex h = gameState.getHex(r, c);
                if (h != null && h.isBuyable() && buyHex(bot.getId(), r, c)) { r = 9; break; }
            }
        }
        if (!definedMinionTypes.isEmpty() && !gameState.hasSpawnedThisTurn(bot.getId())) {
            List<String> types = new ArrayList<>(definedMinionTypes.keySet());
            for (int r = 1; r <= 8; r++) for (int c = 1; c <= 8; c++) {
                if (gameState.canSpawn(bot, r, c)) {
                    for (String t : types) if (spawnMinion(bot.getId(), r, c, t)) { r = 9; break; }
                }
            }
        }
        endTurn();
    }

    private boolean isMinionActive(Minion m) { return m != null && m.isAlive() && gameState.isValidHex(m.getRow(), m.getCol()) && gameState.getHex(m.getRow(), m.getCol()).getOccupant() == m; }

    private boolean isGameOver() { refreshGameStatus(); return gameState.isGameOver(); }

    private void refreshGameStatus() {
        gameState.removeDeadMinions();
        gameState.setActivePlayerId(currentPlayerId);
        int winner = determineWinner();
        gameState.setWinner(winner);
        gameState.setGameOver(winner != 0);
    }

    public int determineWinner() {
        gameState.removeDeadMinions();
        Player p1 = gameState.getPlayer(1), p2 = gameState.getPlayer(2);
        int a1 = p1.getAliveMinionCount(), a2 = p2.getAliveMinionCount();
        boolean s1 = gameState.getRemainingSpawns(1) < config.get("max_spawns"), s2 = gameState.getRemainingSpawns(2) < config.get("max_spawns");

        if (s1 || s2) {
            if (a1 == 0 && a2 == 0) return 3;
            if (s1 && a1 == 0) return 2;
            if (s2 && a2 == 0) return 1;
        }
        if (gameState.getPlayerTurnCount(1) >= MAX_GAME_TURNS && gameState.getPlayerTurnCount(2) >= MAX_GAME_TURNS) {
            if (a1 != a2) return a1 > a2 ? 1 : 2;
            if (p1.getTotalHp() != p2.getTotalHp()) return p1.getTotalHp() > p2.getTotalHp() ? 1 : 2;
            return Double.compare(p1.getBudget(), p2.getBudget()) > 0 ? 1 : (Double.compare(p1.getBudget(), p2.getBudget()) < 0 ? 2 : 3);
        }
        return 0;
    }

    private static final class StrategyExecutionState { boolean done, budgetBlocked, moveUsed, shootUsed; }

    private enum Direction {
        UP("up"), UPRIGHT("upright"), DOWNRIGHT("downright"), DOWN("down"), DOWNLEFT("downleft"), UPLEFT("upleft");
        final String value;
        Direction(String value) { this.value = value; }
        static Direction from(String raw) { return raw == null ? null : Arrays.stream(values()).filter(d -> d.value.equalsIgnoreCase(raw)).findFirst().orElse(null); }
    }
    public void executeMinionStrategies(Long gameId) {
        if (isGameOver()) return;
        Player p = gameState.getPlayer(currentPlayerId);
        if (p == null) return;

        List<Minion> minions = p.getMinions().stream().filter(Objects::nonNull).collect(Collectors.toList());
        for (Minion m : minions) {
            if (isGameOver()) break;
            if (isMinionActive(m)) {
                executeStrategyNode(m.getStrategy(), new MinionContext(m, gameState), new StrategyExecutionState());
            }
            refreshGameStatus();
        }
    }
    public int determineWinner(GameState mockGame) {
        if (mockGame == null) return 0;
        GameState originalGame = this.gameState;
        this.gameState = mockGame;
        int winner = determineWinner();
        this.gameState = originalGame; // คืนค่ากระดานหลักกลับมา
        return winner;
    }
    public boolean canEndCurrentTurn() {
        if (gameState == null) {
            return false;
        }
        // สามารถกดจบเทิร์นได้ ถ้าเกมยังไม่จบ
        return !gameState.isGameOver();
    }
}