package main.backend.service;

import main.backend.logic.ActionCommandNode;
import main.backend.logic.AssignmentNode;
import main.backend.logic.BlockNode;
import main.backend.logic.ConfigLoader;
import main.backend.logic.ExpressionNode;
import main.backend.logic.IfStatementNode;
import main.backend.logic.MinionContext;
import main.backend.logic.Node;
import main.backend.logic.Parser;
import main.backend.logic.Tokenizer;
import main.backend.logic.WhileStatementNode;
import main.backend.model.BattleLogEntry;
import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.MinionType;
import main.backend.model.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GameService {
    private static final int MAX_MINION_TYPES = 5;
    private static final int MAX_STRATEGY_LOOPS = 10_000;
    private static final int MAX_GAME_TURNS = 50;

    private GameState gameState;
    private final ConfigLoader config;

    private int currentPlayerId = 1;
    private String gameMode = "duel";

    private final Map<String, MinionType> definedMinionTypes = new HashMap<>();
    private final Set<String> appliedTurnEconomyKeys = new java.util.HashSet<>();

    @Autowired
    public GameService(ConfigLoader config) {
        this.config = config;
        init();
    }

    public void setGameMode(String mode) {
        this.gameMode = mode;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void init() {
        this.gameState = new GameState(
                config.get("init_budget"),
                MAX_GAME_TURNS,
                (int) config.get("max_spawns"),
                config.get("spawn_cost"),
                config.get("init_hp"),
                config.get("max_budget"),
                (double) config.get("interest_pct")
        );
        this.definedMinionTypes.clear();
        this.appliedTurnEconomyKeys.clear();
        this.currentPlayerId = 1;
        this.gameState.setActivePlayerId(1);
        this.gameState.setGameOver(false);
        this.gameState.setWinner(0);
        this.gameState.setInterestForPlayer(1, 0.0);
        this.gameState.setInterestForPlayer(2, 0.0);
        this.gameState.setPlayerTurnCount(1, 0);
        this.gameState.setPlayerTurnCount(2, 0);
        this.gameState.resetStrategyCostForPlayer(1);
        this.gameState.resetStrategyCostForPlayer(2);
        this.gameState.setBoughtHexThisTurn(1, false);
        this.gameState.setBoughtHexThisTurn(2, false);
        this.gameState.setSpawnedThisTurn(1, false);
        this.gameState.setSpawnedThisTurn(2, false);
        applyTurnEconomy(this.gameState);
        refreshGameStatus();
    }

    public void applyTurnEconomy(GameState game) {
        if (game == null || game.isGameOver()) {
            return;
        }

        int playerId = currentPlayerId;
        String economyKey = game.getTurnCount() + ":" + playerId;
        if (appliedTurnEconomyKeys.contains(economyKey)) {
            return;
        }

        Player player = resolveCurrentPlayer(game);
        if (player == null) {
            return;
        }

        double turnBudget = config.get("turn_budget");
        double maxBudget = config.get("max_budget");

        player.setBudget(player.getBudget() + turnBudget);

        int playerTurnNumber = Math.max(1, game.getPlayerTurnCount(playerId) + 1);
        double interestApplied = game.calculateInterest(player.getBudget(), playerTurnNumber);

        double nextBudget = player.getBudget() + interestApplied;
        if (nextBudget > maxBudget) {
            nextBudget = maxBudget;
        }

        player.setBudget(nextBudget);
        game.setInterestForPlayer(playerId, interestApplied);
        game.setPlayerTurnCount(playerId, playerTurnNumber);
        appliedTurnEconomyKeys.add(economyKey);
    }

    public boolean defineMinionType(String name, int hp, int defense, String script) {
        if (definedMinionTypes.size() >= MAX_MINION_TYPES || definedMinionTypes.containsKey(name)) {
            return false;
        }

        try {
            List<String> tokens = new Tokenizer(script).tokenize();
            Node ast = new Parser(tokens).parse();
            definedMinionTypes.put(name, new MinionType(name, hp, defense, ast));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void clearDefinedMinionTypes() {
        definedMinionTypes.clear();
    }

    public boolean spawnMinion(int playerId, int row, int col, String typeName) {
        if (gameState.isGameOver() || playerId != currentPlayerId) {
            return false;
        }
        if (gameState.hasSpawnedThisTurn(playerId)) {
            return false;
        }

        MinionType type = definedMinionTypes.get(typeName);
        if (type == null) {
            return false;
        }

        Player player = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(player, row, col)) {
            return false;
        }

        long cost = getSpawnCost(player);
        if (!player.spend(cost)) {
            return false;
        }

        Minion minion = new Minion(player, type.getDefense(), type.getMaxHp(), type.getStrategyAST());
        gameState.placeMinion(player, minion, row, col);
        gameState.setSpawnedThisTurn(playerId, true);
        appendBattleLog(playerId, "spawn", minion.getName(),
                String.format("%s spawned at (%d,%d).", minion.getName(), row, col),
                null, null, row, col, null, null);
        refreshGameStatus();
        return true;
    }

    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode) {
        return spawnMinion(playerId, row, col, defense, strategyCode, "Minion");
    }

    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode, String minionName) {
        if (gameState.isGameOver() || playerId != currentPlayerId) {
            return false;
        }
        if (gameState.hasSpawnedThisTurn(playerId)) {
            return false;
        }

        Player player = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(player, row, col)) {
            return false;
        }

        long cost = getSpawnCost(player);
        if (!player.spend(cost)) {
            return false;
        }

        try {
            List<String> tokens = new Tokenizer(strategyCode).tokenize();
            Node ast = new Parser(tokens).parse();
            Minion minion = new Minion(player, defense, config.get("init_hp"), ast);
            if (minionName != null && !minionName.isBlank()) {
                minion.setName(minionName);
            }
            gameState.placeMinion(player, minion, row, col);
            gameState.setSpawnedThisTurn(playerId, true);
            appendBattleLog(playerId, "spawn", minion.getName(),
                    String.format("%s spawned at (%d,%d).", minion.getName(), row, col),
                    null, null, row, col, null, null);
            refreshGameStatus();
            return true;
        } catch (Exception e) {
            player.addBudget(cost);
            return false;
        }
    }

    public boolean buyHex(int playerId, int row, int col) {
        if (gameState.isGameOver() || playerId != currentPlayerId) {
            return false;
        }
        if (gameState.hasBoughtHexThisTurn(playerId)) {
            return false;
        }

        Player player = gameState.getPlayer(playerId);
        boolean bought = gameState.buyHex(player, row, col, config.get("hex_purchase_cost"));
        if (bought) {
            gameState.setBoughtHexThisTurn(playerId, true);
            appendBattleLog(playerId, "buy", null,
                    String.format("Player %d bought hex (%d,%d).", playerId, row, col),
                    null, null, row, col, null, null);
            refreshGameStatus();
        }
        return bought;
    }

    public void executeMinionStrategies(Long gameId) {
        if (gameState.isGameOver()) {
            return;
        }

        Player currentPlayer = gameState.getPlayer(currentPlayerId);
        if (currentPlayer == null) {
            return;
        }

        List<Minion> minionsInCreationOrder = new ArrayList<>(currentPlayer.getMinions()).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        for (Minion minion : minionsInCreationOrder) {
            if (gameState.isGameOver()) {
                break;
            }

            if (!isMinionActiveOnBoard(minion)) {
                continue;
            }

            MinionContext context = new MinionContext(minion, gameState);
            executeStrategyNode(minion.getStrategy(), context, new StrategyExecutionState());
            gameState.removeDeadMinions();
            refreshGameStatus();
        }
    }

    private boolean handleMove(Minion minion, Direction direction) {
        if (minion == null || direction == null || !minion.isAlive()) {
            return true;
        }

        Player owner = minion.getOwner();
        if (owner == null) {
            return true;
        }

        int fromRow = minion.getRow();
        int fromCol = minion.getCol();

        if (!owner.spend(1)) {
            appendBattleLog(owner.getId(), "move", minion.getName(),
                    String.format("%s failed to move %s due to low budget.", minion.getName(), direction.value()),
                    fromRow, fromCol, null, null, null, null);
            return false;
        }
        gameState.addStrategyCostForPlayer(owner.getId(), 1);

        int[] target = gameState.getNeighbor(fromRow, fromCol, direction.value());
        int targetRow = target[0];
        int targetCol = target[1];

        if (!gameState.isValidHex(targetRow, targetCol)) {
            appendBattleLog(owner.getId(), "move", minion.getName(),
                    String.format("%s tried to move %s but hit the border.", minion.getName(), direction.value()),
                    fromRow, fromCol, targetRow, targetCol, null, null);
            return true;
        }

        Hex currentHex = gameState.getHex(fromRow, fromCol);
        Hex targetHex = gameState.getHex(targetRow, targetCol);
        if (currentHex == null || targetHex == null || targetHex.getOccupant() != null) {
            appendBattleLog(owner.getId(), "move", minion.getName(),
                    String.format("%s tried to move %s but the destination was blocked.", minion.getName(), direction.value()),
                    fromRow, fromCol, targetRow, targetCol, null, null);
            return true;
        }

        currentHex.setOccupant(null);
        targetHex.setOccupant(minion);
        minion.setPosition(targetRow, targetCol);
        appendBattleLog(owner.getId(), "move", minion.getName(),
                String.format("%s moved %s to (%d,%d).", minion.getName(), direction.value(), targetRow, targetCol),
                fromRow, fromCol, targetRow, targetCol, null, null);
        return true;
    }

    private boolean handleShoot(Minion minion, Direction direction, int expenditure) {
        if (minion == null || direction == null || !minion.isAlive()) {
            return true;
        }

        Player owner = minion.getOwner();
        if (owner == null) {
            return true;
        }

        int fromRow = minion.getRow();
        int fromCol = minion.getCol();

        long totalCost = (long) expenditure + 1;
        if (!owner.spend(totalCost)) {
            appendBattleLog(owner.getId(), "shoot", minion.getName(),
                    String.format("%s failed to shoot %s due to low budget.", minion.getName(), direction.value()),
                    fromRow, fromCol, null, null, null, null);
            return false;
        }
        gameState.addStrategyCostForPlayer(owner.getId(), (int) totalCost);

        int[] target = gameState.getNeighbor(fromRow, fromCol, direction.value());
        int targetRow = target[0];
        int targetCol = target[1];

        if (!gameState.isValidHex(targetRow, targetCol)) {
            appendBattleLog(owner.getId(), "shoot", minion.getName(),
                    String.format("%s shot %s off the board.", minion.getName(), direction.value()),
                    fromRow, fromCol, null, null, targetRow, targetCol);
            return true;
        }

        Hex targetHex = gameState.getHex(targetRow, targetCol);
        if (targetHex == null) {
            appendBattleLog(owner.getId(), "shoot", minion.getName(),
                    String.format("%s shot %s into empty space.", minion.getName(), direction.value()),
                    fromRow, fromCol, null, null, targetRow, targetCol);
            return true;
        }

        Minion targetMinion = targetHex.getOccupant();
        if (targetMinion == null) {
            appendBattleLog(owner.getId(), "shoot", minion.getName(),
                    String.format("%s shot %s but hit no target.", minion.getName(), direction.value()),
                    fromRow, fromCol, null, null, targetRow, targetCol);
            return true;
        }

        int damage = Math.max(1, expenditure - targetMinion.getDefense());
        targetMinion.takeDamage(damage);
        if (!targetMinion.isAlive()) {
            gameState.removeMinion(targetMinion);
            appendBattleLog(owner.getId(), "shoot", minion.getName(),
                    String.format("%s shot (%d,%d) and defeated %s.", minion.getName(), targetRow, targetCol, targetMinion.getName()),
                    fromRow, fromCol, null, null, targetRow, targetCol);
            return true;
        }
        appendBattleLog(owner.getId(), "shoot", minion.getName(),
                String.format("%s shot (%d,%d) for %d damage.", minion.getName(), targetRow, targetCol, damage),
                fromRow, fromCol, null, null, targetRow, targetCol);
        return true;
    }

    public void endTurn(Long gameId) {
        refreshGameStatus();
        if (gameState.isGameOver()) {
            return;
        }
        if (!canEndCurrentTurn()) {
            return;
        }

        appendBattleLog(currentPlayerId, "turn", null,
                String.format("Player %d resolved turn %d.", currentPlayerId, gameState.getTurnCount()),
                null, null, null, null, null, null);

        gameState.resetStrategyCostForPlayer(currentPlayerId);
        executeMinionStrategies(gameId);
        int winner = determineWinner(gameState);
        if (winner != 0) {
            gameState.setGameOver(true);
            gameState.setWinner(winner);
            return;
        }
        refreshGameStatus();
        if (gameState.isGameOver()) {
            return;
        }

        switchPlayer(gameState);
        refreshGameStatus();
        if (gameState.isGameOver()) {
            return;
        }

        applyTurnEconomy(gameState);
        refreshGameStatus();

    }

    public void endTurn() {
        endTurn(null);
    }

    public boolean canEndCurrentTurn() {
        return !mustSpawnFirstMinionThisTurn(currentPlayerId);
    }

    private GameState getGame(Long gameId) {
        return gameState;
    }

    private Player resolveCurrentPlayer(GameState game) {
        return game == null ? null : game.getPlayer(currentPlayerId);
    }

    private void switchPlayer(GameState game) {
        if (game == null) {
            return;
        }

        if (currentPlayerId == 1) {
            currentPlayerId = 2;
        } else {
            currentPlayerId = 1;
            game.nextTurn();
        }
        game.setBoughtHexThisTurn(currentPlayerId, false);
        game.setSpawnedThisTurn(currentPlayerId, false);
        game.setActivePlayerId(currentPlayerId);
    }

    private boolean mustSpawnFirstMinionThisTurn(int playerId) {
        if (gameState == null || gameState.getTurnCount() != 1) {
            return false;
        }
        Player player = gameState.getPlayer(playerId);
        return player != null && player.getMinions().isEmpty();
    }

    private void executeStrategyNode(Node node, MinionContext context, StrategyExecutionState state) {
        if (node == null || state.done || state.budgetBlocked || gameState.isGameOver()) {
            return;
        }

        Minion minion = context.getMinion();
        if (!isMinionActiveOnBoard(minion)) {
            state.done = true;
            return;
        }

        if (node instanceof BlockNode blockNode) {
            for (Node statement : blockNode.getStatements()) {
                executeStrategyNode(statement, context, state);
                if (state.done || state.budgetBlocked || gameState.isGameOver()) {
                    break;
                }
            }
            return;
        }

        if (node instanceof IfStatementNode ifNode) {
            try {
                long condition = evaluateExpression(ifNode.getCondition(), context);
                if (condition > 0) {
                    executeStrategyNode(ifNode.getThenBlock(), context, state);
                } else if (ifNode.getElseBlock() != null) {
                    executeStrategyNode(ifNode.getElseBlock(), context, state);
                }
            } catch (ArithmeticException e) {
                state.done = true;
            }
            return;
        }

        if (node instanceof WhileStatementNode whileNode) {
            int iterations = 0;
            while (!state.done && !state.budgetBlocked && !gameState.isGameOver() && iterations < MAX_STRATEGY_LOOPS) {
                if (!isMinionActiveOnBoard(context.getMinion())) {
                    state.done = true;
                    break;
                }

                try {
                    long condition = evaluateExpression(whileNode.getCondition(), context);
                    if (condition <= 0) {
                        break;
                    }
                } catch (ArithmeticException e) {
                    state.done = true;
                    break;
                }

                executeStrategyNode(whileNode.getBody(), context, state);
                iterations++;
            }
            return;
        }

        if (node instanceof AssignmentNode assignmentNode) {
            try {
                applyAssignment(assignmentNode, context);
            } catch (ArithmeticException e) {
                state.done = true;
            }
            return;
        }

        if (node instanceof ActionCommandNode actionNode) {
            applyAction(actionNode, context, state);
        }
    }

    private void applyAssignment(AssignmentNode node, MinionContext context) {
        String name = node.getIdentifier();
        if (isSpecialVariable(name)) {
            return;
        }

        try {
            long value = evaluateExpression(node.getExpression(), context);
            context.setVariable(name, value);
        } catch (ArithmeticException e) {
            throw e;
        }
    }

    private void applyAction(ActionCommandNode node, MinionContext context, StrategyExecutionState state) {
        String action = node.getActionType();
        if (action == null) {
            return;
        }

        if ("done".equals(action)) {
            appendBattleLog(context.getMinion().getOwner().getId(), "done", context.getMinion().getName(),
                    String.format("%s ended its turn.", context.getMinion().getName()),
                    context.getMinion().getRow(), context.getMinion().getCol(), null, null, null, null);
            state.done = true;
            return;
        }

        Minion minion = context.getMinion();
        if (!isMinionActiveOnBoard(minion)) {
            state.done = true;
            return;
        }

        Direction direction = Direction.from(node.getDirection());
        if (direction == null) {
            state.done = true;
            return;
        }

        if ("move".equals(action)) {
            if (state.moveUsed) {
                return;
            }
            boolean canContinue = handleMove(minion, direction);
            state.moveUsed = true;
            if (!canContinue) {
                state.budgetBlocked = true;
                state.done = true;
            }
            return;
        }

        if ("shoot".equals(action)) {
            if (state.shootUsed) {
                return;
            }
            int expenditure;
            try {
                expenditure = safeToInt(evaluateExpression(node.getExpression(), context));
            } catch (ArithmeticException e) {
                state.done = true;
                return;
            }
            if (expenditure < 0) {
                expenditure = 0;
            }

            boolean canContinue = handleShoot(minion, direction, expenditure);
            state.shootUsed = true;
            if (canContinue) {
                gameState.removeDeadMinions();
                refreshGameStatus();
            }
        }
    }

    private long evaluateExpression(ExpressionNode expression, MinionContext context) {
        try {
            return expression == null ? 0 : expression.evaluate(context);
        } catch (ArithmeticException e) {
            throw e;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isSpecialVariable(String name) {
        return "row".equals(name)
                || "col".equals(name)
                || "Budget".equals(name)
                || "Int".equals(name)
                || "MaxBudget".equals(name)
                || "random".equals(name)
                || "ally".equals(name)
                || "opponent".equals(name)
                || "nearby".equals(name)
                || "SpawnsLeft".equals(name);
    }

    private int safeToInt(long value) {
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) value;
    }

    private void appendBattleLog(
            int playerId,
            String actionType,
            String minionName,
            String message,
            Integer fromRow,
            Integer fromCol,
            Integer toRow,
            Integer toCol,
            Integer targetRow,
            Integer targetCol
    ) {
        if (gameState == null) {
            return;
        }

        gameState.addBattleLog(new BattleLogEntry(
                gameState.getTurnCount(),
                playerId,
                actionType,
                minionName,
                message,
                fromRow,
                fromCol,
                toRow,
                toCol,
                targetRow,
                targetCol
        ));
    }

    public int checkWinner() {
        refreshGameStatus();
        return gameState.getWinner();
    }

    public int getCurrentPlayerId() {
        return currentPlayerId;
    }

    public GameState getGameState() {
        refreshGameStatus();
        return gameState;
    }

    public void setPlayerStrategy(int playerId, String script) {
        List<String> tokens = new Tokenizer(script).tokenize();
        Node strategyTree = new Parser(tokens).parse();
        for (Minion minion : gameState.getMinionsOfPlayer(playerId)) {
            minion.setStrategyAST(strategyTree);
        }
        refreshGameStatus();
    }

    public void validateScript(String strategy) throws Exception {
        List<String> tokens = new Tokenizer(strategy).tokenize();
        new Parser(tokens).parse();
    }

    public Map<String, Object> validateStrategyInput(String strategy) {
        if (strategy == null || strategy.isBlank()) {
            return Map.of(
                    "valid", false,
                    "ok", false,
                    "message", "Strategy must not be empty"
            );
        }

        try {
            List<String> tokens = new Tokenizer(strategy).tokenize();
            new Parser(tokens).parse();
            return Map.of(
                    "valid", true,
                    "ok", true,
                    "message", "Valid strategy"
            );
        } catch (Exception e) {
            return Map.of(
                    "valid", false,
                    "ok", false,
                    "message", e.getMessage() == null || e.getMessage().isBlank()
                            ? "Invalid strategy syntax"
                            : e.getMessage()
            );
        }
    }

    public void playBotTurn() {
        refreshGameStatus();
        if (gameState.isGameOver()) {
            return;
        }

        Player bot = gameState.getPlayer(currentPlayerId);
        if (bot == null) {
            return;
        }

        attemptBotHexPurchase(bot);
        attemptBotSpawn(bot);
        endTurn(null);
    }

    private void attemptBotHexPurchase(Player bot) {
        if (bot == null || gameState.hasBoughtHexThisTurn(bot.getId())) {
            return;
        }
        if (bot.getBudget() < config.get("hex_purchase_cost")) {
            return;
        }

        for (int row = 1; row <= 8; row++) {
            for (int col = 1; col <= 8; col++) {
                Hex hex = gameState.getHex(row, col);
                if (hex != null && hex.isBuyable()) {
                    if (buyHex(bot.getId(), row, col)) {
                        return;
                    }
                }
            }
        }
    }

    private void attemptBotSpawn(Player bot) {
        if (bot == null || gameState.hasSpawnedThisTurn(bot.getId()) || definedMinionTypes.isEmpty()) {
            return;
        }

        List<String> types = new ArrayList<>(definedMinionTypes.keySet());
        for (int row = 1; row <= 8; row++) {
            for (int col = 1; col <= 8; col++) {
                if (!gameState.canSpawn(bot, row, col)) {
                    continue;
                }

                for (String typeName : types) {
                    if (spawnMinion(bot.getId(), row, col, typeName)) {
                        return;
                    }
                }
            }
        }
    }

    private long getSpawnCost(Player player) {
        boolean freeSpawn = gameState.getTurnCount() == 1 && player.getMinions().isEmpty();
        return freeSpawn ? 0 : config.get("spawn_cost");
    }

    private boolean isMinionActiveOnBoard(Minion minion) {
        if (minion == null || !minion.isAlive()) {
            return false;
        }
        if (!gameState.isValidHex(minion.getRow(), minion.getCol())) {
            return false;
        }
        Hex hex = gameState.getHex(minion.getRow(), minion.getCol());
        return hex != null && hex.getOccupant() == minion;
    }

    private void refreshGameStatus() {
        if (gameState == null) {
            return;
        }

        gameState.removeDeadMinions();
        gameState.setActivePlayerId(currentPlayerId);

        int winner = determineWinner(gameState);
        if (winner != 0) {
            gameState.setWinner(winner);
            gameState.setGameOver(true);
        } else {
            gameState.setWinner(0);
            gameState.setGameOver(false);
        }
    }

    public int determineWinner(GameState game) {
        if (game == null) {
            return 0;
        }

        game.removeDeadMinions();

        Player player1 = game.getPlayer(1);
        Player player2 = game.getPlayer(2);
        if (player1 == null || player2 == null) {
            return 0;
        }

        int alive1 = player1.getAliveMinionCount();
        int alive2 = player2.getAliveMinionCount();

        boolean player1Spawned = hasPlayerEverSpawned(game, 1);
        boolean player2Spawned = hasPlayerEverSpawned(game, 2);
        if (player1Spawned || player2Spawned) {
            if (alive1 == 0 && alive2 == 0) {
                return 3;
            }
            if (player1Spawned && alive1 == 0 && alive2 > 0) {
                return 2;
            }
            if (player2Spawned && alive2 == 0 && alive1 > 0) {
                return 1;
            }
        }

        if (hasReachedMaxTurns(game)) {
            if (alive1 > alive2) {
                return 1;
            }
            if (alive2 > alive1) {
                return 2;
            }

            long hp1 = player1.getTotalHp();
            long hp2 = player2.getTotalHp();
            if (hp1 > hp2) {
                return 1;
            }
            if (hp2 > hp1) {
                return 2;
            }

            int budgetCompare = Double.compare(player1.getBudget(), player2.getBudget());
            if (budgetCompare > 0) {
                return 1;
            }
            if (budgetCompare < 0) {
                return 2;
            }
            return 3;
        }

        return 0;
    }

    private boolean hasPlayerEverSpawned(GameState game, int playerId) {
        return game != null && game.getRemainingSpawns(playerId) < config.get("max_spawns");
    }

    private boolean hasReachedMaxTurns(GameState game) {
        if (game == null) {
            return false;
        }

        return game.getPlayerTurnCount(1) >= game.getMaxTurns()
                && game.getPlayerTurnCount(2) >= game.getMaxTurns();
    }

    private static final class StrategyExecutionState {
        private boolean done;
        private boolean budgetBlocked;
        private boolean moveUsed;
        private boolean shootUsed;
    }

    private enum Direction {
        UP("up"),
        UPRIGHT("upright"),
        DOWNRIGHT("downright"),
        DOWN("down"),
        DOWNLEFT("downleft"),
        UPLEFT("upleft");

        private final String value;

        Direction(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }

        public static Direction from(String raw) {
            if (raw == null) {
                return null;
            }

            for (Direction direction : values()) {
                if (direction.value.equalsIgnoreCase(raw)) {
                    return direction;
                }
            }
            return null;
        }
    }
}
