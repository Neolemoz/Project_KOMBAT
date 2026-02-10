package main.backend.service;

import main.backend.logic.*;
import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.MinionType;
import main.backend.model.Player;
import org.springframework.beans.factory.annotation.Autowired; // เพิ่ม import
import org.springframework.stereotype.Service; // เพิ่ม import

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service // <--- 1. ต้องใส่ตรงนี้เพื่อให้ Spring รู้จัก
public class GameService {
    private GameState gameState;
    private ConfigLoader config;
    private StrategyEvaluator evaluator;

    private Map<String, MinionType> definedMinionTypes = new HashMap<>();
    private static final int MAX_MINION_TYPES = 10;

    @Autowired // <--- 2. สั่งให้ Spring ส่ง ConfigLoader เข้ามาให้อัตโนมัติ
    public GameService(ConfigLoader config) {
        this.config = config;
        this.evaluator = new StrategyEvaluator();
        init();
    }

    // ... (โค้ดส่วนที่เหลือเหมือนเดิม) ...
    public void init() {
        this.gameState = new GameState(
                config.get("init_budget"),
                (int) config.get("max_turns"),
                (int) config.get("max_spawns"),
                config.get("spawn_cost"),
                config.get("init_hp")
        );
        this.definedMinionTypes.clear();
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
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean spawnMinion(int playerId, int row, int col, String typeName) {
        MinionType type = definedMinionTypes.get(typeName);
        if (type == null) return false;

        Player p = gameState.getPlayer(playerId);

        if (!gameState.canSpawn(p, row, col)) return false;

        long cost = type.getDefense() + config.get("spawn_cost");

        if (p.spend(cost)) {
            Minion m = new Minion(p, type.getDefense(), type.getMaxHp(), type.getStrategyAST());
            gameState.placeMinion(p, m, row, col);
            return true;
        }
        return false;
    }

    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode) {
        Player p = gameState.getPlayer(playerId);

        if (!gameState.canSpawn(p, row, col)) return false;

        long cost = defense + config.get("spawn_cost");

        if (p.spend(cost)) {
            List<String> tokens = new Tokenizer(strategyCode).tokenize();
            Node ast = new Parser(tokens).parse();

            Minion m = new Minion(p, defense, config.get("init_hp"), ast);
            gameState.placeMinion(p, m, row, col);
            return true;
        }
        return false;
    }

    public boolean buyHex(int playerId, int row, int col) {
        Player p = gameState.getPlayer(playerId);
        return gameState.buyHex(p, row, col, config.get("hex_purchase_cost"));
    }

    public void endTurn() {
        runMinionAI();
        updatePlayerBudget(gameState.getPlayer(1));
        updatePlayerBudget(gameState.getPlayer(2));
        gameState.nextTurn();
    }

    private void runMinionAI() {
        executeTeam(gameState.getPlayer(1));
        executeTeam(gameState.getPlayer(2));
    }

    private void executeTeam(Player p) {
        for (Minion m : p.getMinions()) {
            if (m.isAlive()) {
                MinionContext ctx = new MinionContext(m, gameState);
                new StrategyEvaluator().execute(m.getStrategy(), ctx);
            }
        }
    }

    private void updatePlayerBudget(Player p) {
        double m = p.getBudget();
        int t = gameState.getTurnCount();

        double b = config.get("interest_pct") / 100.0;

        double r = 0;
        if (m > 0 && t > 0) {
            r = b * Math.log10(m) * Math.log(t);
        }

        long interest = (long) (m * r);
        long income = config.get("turn_budget") + interest;

        p.addBudget(income);

        long maxB = config.get("max_budget");
        if (p.getBudget() > maxB) {
            p.setBudget(maxB);
        }
    }

    public int checkWinner() {
        boolean p1Alive = gameState.getPlayer(1).getAliveMinionCount() > 0;
        boolean p2Alive = gameState.getPlayer(2).getAliveMinionCount() > 0;

        if (!p1Alive && !p2Alive) return 3;
        if (!p1Alive) return 2;
        if (!p2Alive) return 1;

        if (gameState.isGameOver()) {
            Player p1 = gameState.getPlayer(1);
            Player p2 = gameState.getPlayer(2);

            int c1 = p1.getAliveMinionCount();
            int c2 = p2.getAliveMinionCount();
            if (c1 > c2) return 1;
            if (c2 > c1) return 2;

            long hp1 = p1.getTotalHp();
            long hp2 = p2.getTotalHp();
            if (hp1 > hp2) return 1;
            if (hp2 > hp1) return 2;

            if (p1.getBudget() > p2.getBudget()) return 1;
            if (p2.getBudget() > p1.getBudget()) return 2;

            return 3;
        }

        return 0;
    }

    public GameState getGameState() { return gameState; }
}