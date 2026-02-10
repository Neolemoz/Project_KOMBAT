package main.backend.service;

import main.backend.logic.*;
import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;

import java.util.List;
import java.util.Map;

public class GameService {
    private GameState gameState;
    private ConfigLoader config;
    private StrategyEvaluator evaluator;

    public GameService(ConfigLoader config) {
        this.config = config;
        this.gameState = new GameState(
                config.get("init_budget"),
                (int) config.get("max_turns"),
                (int) config.get("max_spawns"), // แก้ให้รับเป็น int
                config.get("spawn_cost"),
                config.get("init_hp")
        );
        this.evaluator = new StrategyEvaluator();
    }

    // --- Core Game Loop ---

    // 1. ซื้อพื้นที่ (ผู้เล่นเรียก)
    public boolean buyHex(int playerId, int row, int col) {
        Player p = gameState.getPlayer(playerId);
        return gameState.buyHex(p, row, col, config.get("hex_purchase_cost"));
    }

    // 2. วาง Minion (ผู้เล่นเรียก)
    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode) {
        Player p = gameState.getPlayer(playerId);

        // เช็คเงื่อนไขพื้นฐานจาก GameState
        if (!gameState.canSpawn(p, row, col)) return false;

        // เช็คสูตรค่าใช้จ่าย Spawn: defense + cost
        long cost = defense + config.get("spawn_cost");

        if (p.spend(cost)) {
            // Parse Code รอไว้ก่อน
            List<String> tokens = new Tokenizer(strategyCode).tokenize();
            Node ast = new Parser(tokens).parse();

            // สร้าง Minion
            Minion m = new Minion(p, defense, config.get("init_hp"), ast);
            gameState.placeMinion(p, m, row, col);
            return true;
        }
        return false;
    }

    // 3. จบเทิร์น (คำนวณทุกอย่าง)
    public void endTurn() {
        // 3.1 สั่ง Minion ทุกตัวทำงาน (Execute Scripts)
        runMinionAI();

        // 3.2 เพิ่มเงินและคิดดอกเบี้ยสำหรับเทิร์นหน้า
        updatePlayerBudget(gameState.getPlayer(1));
        updatePlayerBudget(gameState.getPlayer(2));

        // 3.3 ขยับไปเทิร์นถัดไป
        gameState.nextTurn();
    }

    private void runMinionAI() {
        // รันฝ่ายที่ 1 ก่อน
        executeTeam(gameState.getPlayer(1));
        // รันฝ่ายที่ 2
        executeTeam(gameState.getPlayer(2));
    }

    private void executeTeam(Player p) {
        for (Minion m : p.getMinions()) {
            if (m.isAlive()) {
                MinionContext ctx = new MinionContext(m, gameState);
                // Reset ตัวแปร done ใน Evaluator (ถ้ามี instance variable ต้องระวัง)
                // เพื่อความชัวร์ สร้าง Evaluator ใหม่หรือใช้ method execute ที่ stateless
                new StrategyEvaluator().execute(m.getStrategy(), ctx);
            }
        }
    }

    // --- สูตรดอกเบี้ย (Spec หน้า 4) ---
    private void updatePlayerBudget(Player p) {
        long m = p.getBudget();
        int t = gameState.getTurnCount();

        // สูตร: r = b * log10(m) * ln(t)
        // b = interest_pct จาก config
        double b = config.get("interest_pct") / 100.0;

        double r = 0;
        if (m > 0 && t > 0) {
            r = b * Math.log10(m) * Math.log(t);
        }

        long interest = (long) (m * r);
        long income = config.get("turn_budget") + interest;

        p.addBudget(income);

        // Capped ที่ max_budget
        long maxB = config.get("max_budget");
        if (p.getBudget() > maxB) {
            p.setBudget(maxB);
        }
    }

    // --- ตัดสินผู้ชนะ (Spec หน้า 8) ---
    // Return: 0=ยังไม่จบ, 1=P1 ชนะ, 2=P2 ชนะ, 3=เสมอ
    public int checkWinner() {
        boolean p1Alive = gameState.getPlayer(1).getAliveMinionCount() > 0;
        boolean p2Alive = gameState.getPlayer(2).getAliveMinionCount() > 0;

        // 1. เช็คว่ามีฝ่ายไหนตายหมดไหม
        if (!p1Alive && !p2Alive) return 3; // ตายคู่ (เสมอ)
        if (!p1Alive) return 2;
        if (!p2Alive) return 1;

        // 2. เช็คว่าครบจำนวนเทิร์นหรือยัง
        if (gameState.isGameOver()) {
            Player p1 = gameState.getPlayer(1);
            Player p2 = gameState.getPlayer(2);

            // Tie-breaker 1: จำนวน Minion
            int c1 = p1.getAliveMinionCount();
            int c2 = p2.getAliveMinionCount();
            if (c1 > c2) return 1;
            if (c2 > c1) return 2;

            // Tie-breaker 2: ผลรวม HP
            long hp1 = p1.getTotalHp();
            long hp2 = p2.getTotalHp();
            if (hp1 > hp2) return 1;
            if (hp2 > hp1) return 2;

            // Tie-breaker 3: เงินเหลือ
            if (p1.getBudget() > p2.getBudget()) return 1;
            if (p2.getBudget() > p1.getBudget()) return 2;

            return 3; // เสมอทุกอย่าง
        }

        return 0; // เกมยังดำเนินต่อ
    }

    public GameState getGameState() { return gameState; }
}