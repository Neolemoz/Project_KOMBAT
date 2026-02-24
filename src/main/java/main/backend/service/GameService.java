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

    // เก็บสถานะว่าตาใคร (1 หรือ 2)
    private int currentPlayerId = 1;

    // โหมดการเล่น: "duel", "solitaire", "auto"
    private String gameMode = "duel";

    public void setGameMode(String mode) {
        this.gameMode = mode;
    }
    public String getGameMode() {
        return gameMode;
    }

    private Map<String, MinionType> definedMinionTypes = new HashMap<>();
    private static final int MAX_MINION_TYPES = 5;

    @Autowired
    public GameService(ConfigLoader config) {
        this.config = config;
        init();
    }

    public void init() {
        // --- แก้ไขจุดที่ Error: ส่งค่าให้ครบ 7 ตัว ตาม Constructor ใหม่ของ GameState ---
        this.gameState = new GameState(
                config.get("init_budget"),
                (int) config.get("max_turns"),
                (int) config.get("max_spawns"),
                config.get("spawn_cost"),
                config.get("init_hp"),
                config.get("max_budget"),            // Argument ที่ 6: Max Budget
                (double) config.get("interest_pct")  // Argument ที่ 7: Interest % (ต้องแปลงเป็น double)
        );
        this.definedMinionTypes.clear();

        // เริ่มเกมที่ Player 1 และคิดเงินเทิร์นแรกทันที
        this.currentPlayerId = 1;
        this.gameState.setActivePlayerId(1);

        startTurn(this.currentPlayerId);
    }

    // --- Logic เริ่มเทิร์น: คิดเงินและดอกเบี้ย ---
    private void startTurn(int playerId) {
        Player p = gameState.getPlayer(playerId);

        // ดึงค่า Budget เป็น double เพื่อความแม่นยำในการคำนวณ
        double currentBudget = p.getBudget();
        int t = gameState.getTurnCount();

        // Spec: b คือ base interest rate percentage
        double b = (double) config.get("interest_pct");
        double r = 0;

        // Spec: ถ้างบประมาณน้อยกว่า 1 จะไม่ได้รับดอกเบี้ย
        if (currentBudget >= 1 && t > 0) {
            // สูตร: r = b * log10(m) * ln(t)
            r = b * Math.log10(currentBudget) * Math.log(t);
        }

        // Spec: interest = m * r / 100 (ใช้ floating-point arithmetic)
        double interest = (currentBudget * r) / 100.0;

        // คำนวณรายได้ทั้งหมดโดยยังคงเก็บทศนิยมไว้สะสม
        double income = config.get("turn_budget") + interest;

        // เพิ่มเงินให้ผู้เล่น (Player.java ของคุณรองรับ double อยู่แล้ว)
        p.addBudget(income);

        // ตรวจสอบ Max Budget
        long maxB = config.get("max_budget");
        if (p.getBudget() > maxB) {
            p.setBudget(maxB); // ถ้าเกินก็ตัดยอดกลับลงมาให้เท่าลิมิต
        }
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
        // เช็คว่าเป็นตาของผู้เล่นหรือไม่
        if (playerId != currentPlayerId) return false;

        MinionType type = definedMinionTypes.get(typeName);
        if (type == null) return false;

        Player p = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(p, row, col)) return false;

        // เช็คว่าเป็นการวาง Minion ตัวแรกสุดของผู้เล่นคนนี้หรือไม่ (ถ้า List ว่าง = ตัวแรก)
        boolean isFreeSpawn = p.getMinions().isEmpty();

        // คำนวณราคา: ถ้าตัวแรกให้ฟรี (cost = 0) ถ้าไม่ใช่ตัวแรกให้คิดราคาตามปกติ
        long cost = isFreeSpawn ? 0 : (type.getDefense() + config.get("spawn_cost"));

        if (p.spend(cost)) {
            // สร้าง Minion (ส่งค่า defense, hp เป็น long)
            Minion m = new Minion(p, type.getDefense(), type.getMaxHp(), type.getStrategyAST());
            gameState.placeMinion(p, m, row, col);
            return true;
        }
        return false;
    }

    // Overload สำหรับการทดสอบหรือ Auto Mode
    public boolean spawnMinion(int playerId, int row, int col, long defense, String strategyCode) {
        if (playerId != currentPlayerId) return false;

        Player p = gameState.getPlayer(playerId);
        if (!gameState.canSpawn(p, row, col)) return false;

        // เช็คตัวแรกฟรีเช่นเดียวกัน
        boolean isFreeSpawn = p.getMinions().isEmpty();
        long cost = isFreeSpawn ? 0 : (defense + config.get("spawn_cost"));

        if (p.spend(cost)) {
            try {
                List<String> tokens = new Tokenizer(strategyCode).tokenize();
                Node ast = new Parser(tokens).parse();

                Minion m = new Minion(p, defense, config.get("init_hp"), ast);
                gameState.placeMinion(p, m, row, col);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
        return false;
    }

    public boolean buyHex(int playerId, int row, int col) {
        if (playerId != currentPlayerId) return false;
        Player p = gameState.getPlayer(playerId);
        return gameState.buyHex(p, row, col, config.get("hex_purchase_cost"));
    }

    // --- EndTurn แบบ Turn-based ---
    public void endTurn() {
        if (checkWinner() != 0) return;

        // 1. รัน AI ของเจ้าของเทิร์นปัจจุบัน
        Player currentP = gameState.getPlayer(currentPlayerId);
        executeTeam(currentP);

        // 2. สลับตาผู้เล่น (Switch Turn)
        if (currentPlayerId == 1) {
            currentPlayerId = 2;
        } else {
            currentPlayerId = 1;
            gameState.nextTurn(); // ขึ้นรอบใหม่เมื่อ P2 จบ
        }

        // อัปเดตลง GameState ส่งไปให้หน้าเว็บ
        gameState.setActivePlayerId(currentPlayerId);

        // 3. เริ่มเทิร์นของผู้เล่นคนถัดไป (คิดเงิน)
        if (!gameState.isGameOver()) {
            startTurn(currentPlayerId);

            // --- ส่วนที่เพิ่มสำหรับโหมด Solitaire ---
            if ("solitaire".equals(this.gameMode) && currentPlayerId == 2) {
                playBotTurn();
            }
        }
    }

    private void executeTeam(Player p) {
        for (Minion m : p.getMinions()) {
            if (m.isAlive()) {
                MinionContext ctx = new MinionContext(m, gameState);
                // สร้าง Evaluator ใหม่ทุกครั้งเพื่อความสะอาดของ State
                new StrategyEvaluator().execute(m.getStrategy(), ctx);
            }
        }
    }

    public int checkWinner() {
        // ให้เช็คผู้ชนะเฉพาะตอนที่เกมดำเนินไปจนถึง Turn สูงสุด (Max Turns) แล้วเท่านั้น
        // (หรือคุณสามารถเพิ่มเงื่อนไข เลือดฐาน <= 0 ค่อยประกาศผู้ชนะทีหลังได้)
        if (gameState.isGameOver()) {
            Player p1 = gameState.getPlayer(1);
            Player p2 = gameState.getPlayer(2);

            if (p1.getAliveMinionCount() > p2.getAliveMinionCount()) return 1;
            if (p2.getAliveMinionCount() > p1.getAliveMinionCount()) return 2;

            if (p1.getTotalHp() > p2.getTotalHp()) return 1;
            if (p2.getTotalHp() > p1.getTotalHp()) return 2;

            if (p1.getBudget() > p2.getBudget()) return 1;
            if (p2.getBudget() > p1.getBudget()) return 2;

            return 3;
        }

        return 0; // 0 แปลว่าเกมยังไม่จบ ให้เล่นต่อไปได้เรื่อยๆ
    }

    public int getCurrentPlayerId() { return currentPlayerId; }
    public GameState getGameState() { return gameState; }
    public void setPlayerStrategy(int playerId, String script) {
        Player player = gameState.getPlayer(playerId);
        // Parse script ด้วย Parser ที่มีอยู่แล้ว
        List<String> tokens = new Tokenizer(script).tokenize();
        Node strategyTree = new Parser(tokens).parse();

        // รัน strategy สำหรับ minion ทุกตัวของ player นั้น
        for (Minion minion : gameState.getMinionsOfPlayer(playerId)) {
            StrategyEvaluator evaluator = new StrategyEvaluator();
            MinionContext ctx = new MinionContext(minion, gameState);
            evaluator.execute(strategyTree, ctx);
        }
    }

    public void validateScript(String Strategy) throws Exception {
        // ใช้ Tokenizer + Parser ที่มีอยู่แล้ว
        List<String> tokens = new Tokenizer(Strategy).tokenize();
        new Parser(tokens).parse();
        // ถ้าไม่ throw = grammar ถูก
    }

    // --- Logic สำหรับ Bot ---
    public void playBotTurn() {
        if (checkWinner() != 0) return; // ถ้าเกมจบแล้วไม่ต้องทำอะไร
        Player bot = gameState.getPlayer(currentPlayerId);

        // 1. Bot พยายาม Spawn Minion (วนหาช่องว่างที่สามารถ Spawn ได้)
        boolean hasSpawned = false;
        for (int r = 1; r <= 8 && !hasSpawned; r++) {
            for (int c = 1; c <= 8 && !hasSpawned; c++) {
                if (gameState.canSpawn(bot, r, c)) {
                    if (!definedMinionTypes.isEmpty()) {
                        // สุ่มหยิบชนิดของ Minion ที่มีอยู่ในเกมมา 1 ชนิด
                        List<String> types = new ArrayList<>(definedMinionTypes.keySet());
                        String randomType = types.get((int) (Math.random() * types.size()));

                        // วาง Minion (ฟังก์ชันนี้จะเช็คเรื่องงบ และตัวแรกฟรีให้เองที่เราแก้ไปก่อนหน้านี้)
                        spawnMinion(currentPlayerId, r, c, randomType);
                        hasSpawned = true; // Spawn ตัวเดียวพอแล้วค่อยไปลุยต่อเทิร์นหน้า
                    }
                }
            }
        }

        // 2. จบเทิร์นให้ Bot ทันที เพื่อประมวลผล Strategy และสลับตากลับ
        endTurn();
    }

}

