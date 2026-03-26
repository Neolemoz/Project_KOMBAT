package main.backend.service;

import main.backend.logic.*;
import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.MinionType;
import main.backend.model.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameService {
    private GameState gameState;
    private ConfigLoader config;
    private int currentPlayerId = 1;
    private String gameMode = "duel";

    public void setGameMode(String mode) { this.gameMode = mode; }
    public String getGameMode() { return gameMode; }

    private Map<String, MinionType> definedMinionTypes = new HashMap<>();
    private static final int MAX_MINION_TYPES = 5;

    @Autowired
    public GameService(ConfigLoader config) {
        this.config = config;
        init();
    }

    public void init() {
        this.gameState = new GameState(
                config.get("init_budget"),
                (int) config.get("max_turns"),
                (int) config.get("max_spawns"),
                config.get("spawn_cost"),
                config.get("init_hp"),
                config.get("max_budget"),
                (double) config.get("interest_pct")
        );
        this.definedMinionTypes.clear();
        this.currentPlayerId = 1;
        this.gameState.setActivePlayerId(1);
        startTurn(this.currentPlayerId);
    }

    private void startTurn(int playerId) {
        Player p = gameState.getPlayer(playerId);
        double currentBudget = p.getBudget();
        int t = gameState.getTurnCount();
        double b = (double) config.get("interest_pct");
        double r = 0;

        if (currentBudget >= 1 && t > 0) {
            r = b * Math.log10(currentBudget) * Math.log(t);
        }

        double interest = (currentBudget * r) / 100.0;
        double income = config.get("turn_budget") + interest;

        p.addBudget(income);
        long maxB = config.get("max_budget");
        if (p.getBudget() > maxB) { p.setBudget(maxB); }
    }

    public boolean defineMinionType(String name, int hp, int defense, String script) {
        if (definedMinionTypes.size() >= MAX_MINION_TYPES) return false;
        if (definedMinionTypes.containsKey(name)) return false;

        try {
            List<String> tokens = new Tokenizer(script).tokenize();
            Node ast = new Parser(tokens).parse();
            MinionType type = new MinionType(name, hp, defense, ast);
            definedMinionTypes.put(name, type);
            return true;
        } catch (Exception e) { e.printStackTrace(); return false; }
    }

    public boolean spawnMinion(int playerId, int row, int col, String typeName) {
        if (checkWinner() != 0) return false; // ดัก: ถ้าเกมจบห้ามวางหุ่น
        if (playerId != currentPlayerId) return false;

        MinionType type = definedMinionTypes.get(typeName);
        if (type == null) return false;

        Player p = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(p, row, col)) return false;

        boolean isFreeSpawn = p.getMinions().isEmpty();
        long cost = isFreeSpawn ? 0 : (type.getDefense() + config.get("spawn_cost"));

        if (p.spend(cost)) {
            Minion m = new Minion(p, type.getDefense(), type.getMaxHp(), type.getStrategyAST());
            gameState.placeMinion(p, m, row, col);
            return true;
        }
        return false;
    }

    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode) {
        if (checkWinner() != 0) return false;
        if (playerId != currentPlayerId) return false;

        Player p = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(p, row, col)) return false;

        boolean isFreeSpawn = p.getMinions().isEmpty();
        long cost = isFreeSpawn ? 0 : (defense + config.get("spawn_cost"));

        if (p.spend(cost)) {
            try {
                List<String> tokens = new Tokenizer(strategyCode).tokenize();
                Node ast = new Parser(tokens).parse();
                Minion m = new Minion(p, defense, config.get("init_hp"), ast);
                gameState.placeMinion(p, m, row, col);
                return true;
            } catch (Exception e) { e.printStackTrace(); return false; }
        }
        return false;
    }

    public boolean buyHex(int playerId, int row, int col) {
        if (checkWinner() != 0) return false; // ดัก: ถ้าเกมจบห้ามซื้อพื้นที่
        if (playerId != currentPlayerId) return false;
        Player p = gameState.getPlayer(playerId);
        return gameState.buyHex(p, row, col, config.get("hex_purchase_cost"));
    }

    public void endTurn() {
        if (checkWinner() != 0) return;

        Player currentP = gameState.getPlayer(currentPlayerId);
        executeTeam(currentP);

        if (currentPlayerId == 1) {
            currentPlayerId = 2;
        } else {
            currentPlayerId = 1;
            gameState.nextTurn();
        }

        gameState.setActivePlayerId(currentPlayerId);

        if (!gameState.isGameOver()) {
            startTurn(currentPlayerId);
            if ("solitaire".equals(this.gameMode) && currentPlayerId == 2) {
                playBotTurn();
            }
        }
    }

    private void executeTeam(Player p) {
        for (Minion m : new java.util.ArrayList<>(p.getMinions())) {
            if (!m.isAlive()) continue;
            Node ast = m.getStrategyAST();
            if (ast == null) continue;
            MinionContext ctx = new MinionContext(m, gameState);
            new StrategyEvaluator().execute(ast, ctx);
        }
    }

    // แก้ไขระบบตรวจสอบแพ้ชนะให้เป๊ะตาม Spec
    public int checkWinner() {
        Player p1 = gameState.getPlayer(1);
        Player p2 = gameState.getPlayer(2);

        // เช็คการตายหมด (Elimination) หลังผ่าน Turn 2 ไปแล้ว
        if (gameState.getTurnCount() > 2) {
            boolean p1Dead = p1.getAliveMinionCount() == 0;
            boolean p2Dead = p2.getAliveMinionCount() == 0;
            if (p1Dead && p2Dead) return 3; // เสมอ
            if (p1Dead) return 2;           // P2 ชนะ
            if (p2Dead) return 1;           // P1 ชนะ
        }

        // เช็คเมื่อเทิร์นหมด (Max Turns)
        if (gameState.isGameOver()) {
            if (p1.getAliveMinionCount() > p2.getAliveMinionCount()) return 1;
            if (p2.getAliveMinionCount() > p1.getAliveMinionCount()) return 2;
            if (p1.getTotalHp() > p2.getTotalHp()) return 1;
            if (p2.getTotalHp() > p1.getTotalHp()) return 2;
            if (p1.getBudget() > p2.getBudget()) return 1;
            if (p2.getBudget() > p1.getBudget()) return 2;
            return 3; // เสมอ
        }

        return 0; // ยังไม่มีใครชนะ
    }

    public int getCurrentPlayerId() { return currentPlayerId; }
    public GameState getGameState() { return gameState; }

    public void setPlayerStrategy(int playerId, String script) {
        List<String> tokens = new Tokenizer(script).tokenize();
        Node strategyTree = new Parser(tokens).parse();
        for (Minion minion : gameState.getMinionsOfPlayer(playerId)) {
            minion.setStrategyAST(strategyTree);
        }
    }

    public void validateScript(String Strategy) throws Exception {
        List<String> tokens = new Tokenizer(Strategy).tokenize();
        new Parser(tokens).parse();
    }

    public void playBotTurn() {
        if (checkWinner() != 0) return;
        Player bot = gameState.getPlayer(currentPlayerId);
        boolean hasSpawned = false;
        for (int r = 1; r <= 8 && !hasSpawned; r++) {
            for (int c = 1; c <= 8 && !hasSpawned; c++) {
                if (gameState.canSpawn(bot, r, c)) {
                    if (!definedMinionTypes.isEmpty()) {
                        List<String> types = new ArrayList<>(definedMinionTypes.keySet());
                        String randomType = types.get((int) (Math.random() * types.size()));
                        spawnMinion(currentPlayerId, r, c, randomType);
                        hasSpawned = true;
                    }
                }
            }
        }
        endTurn();
    }
}