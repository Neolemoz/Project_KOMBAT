package main.backend.service;

import main.backend.logic.*;
import main.backend.model.*;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class GameService {
    private GameState gameState;
    private StrategyEvaluator evaluator;
    private ConfigLoader config;

    // เก็บชนิดของ Minion ที่ลงทะเบียนไว้ (Key = ชื่อชนิด)
    private Map<String, MinionType> definedMinionTypes = new HashMap<>();

    // เพิ่มโหมดเกม
    private String gameMode = "duel"; // duel, solitaire, auto

    @PostConstruct
    public void init() {
        config = new ConfigLoader();
        config.loadConfig("config.txt"); // ตรวจสอบ path ให้ถูก

        // ส่ง Config ทั้งหมดเข้า GameState
        gameState = new GameState(
                config.get("init_budget"),
                config.getInt("max_turns"),
                config.getInt("max_spawns"),
                config.get("spawn_cost"),
                config.get("init_hp")
        );
        evaluator = new StrategyEvaluator();
        definedMinionTypes.clear(); // ล้างค่าเมื่อเริ่มเกมใหม่
    }

    // --- 1. ฟังก์ชันลงทะเบียน Minion Type (เรียกช่วง Setup) ---
    public boolean defineMinionType(String typeName, int hp, int defense, String scriptCode) {
        // จำกัดจำนวนชนิดตามโจทย์ (1-5 ชนิด)
        if (definedMinionTypes.size() >= 5) return false;

        // Parse Script รอไว้เลย
        Node ast = parseScript(scriptCode);
        if (ast == null) return false; // Parse Error

        MinionType type = new MinionType(typeName, hp, defense, ast);
        definedMinionTypes.put(typeName, type);
        return true;
    }

    // --- 2. ฟังก์ชัน Spawn ที่แก้แล้ว (ระบุชนิดแทน) ---
    public boolean spawnMinion(int playerId, int row, int col, String typeName) {
        MinionType type = definedMinionTypes.get(typeName);
        if (type == null) return false; // ไม่รู้จักชนิดนี้

        Player p = gameState.getPlayer(playerId);

        // ตรวจสอบเงื่อนไขพื้นฐาน (ที่ดิน, เงิน, โควต้า) ใน GameState ก่อน
        // แต่ต้องส่ง cost ไปเช็คด้วย
        if (!gameState.canSpawn(p, row, col)) return false;

        // จ่ายเงิน
        if (p.spend(config.get("spawn_cost"))) {
            // สร้าง Minion ตามแบบแปลน
            Minion m = new Minion(p, row, col, type.getMaxHp(), type.getDefense(), type.getName());
            m.setStrategyAST(type.getStrategyAST()); // จ่ายงาน Script ให้ Minion ตัวนั้น

            gameState.placeMinion(p, m, row, col); // ฟังก์ชันช่วยวางตัว (ต้องไปเขียนเพิ่มใน GameState)
            return true;
        }
        return false;
    }

    // --- 3. Parser Helper (ตัวช่วยแยกคำ) ---
    private Node parseScript(String script) {
        try {
            // นี่คือ Tokenizer แบบง่าย (คุณควรใช้ Tokenizer จริงๆ ถ้าสคริปต์ซับซ้อน)
            // เทคนิค: เติมช่องว่างรอบวงเล็บ เพื่อให้ split เก็บวงเล็บแยกเป็น token
            String cleaned = script.replaceAll("([(){},;])", " $1 ");
            List<String> tokens = java.util.Arrays.asList(cleaned.trim().split("\\s+"));

            Parser parser = new Parser(tokens);
            return parser.parse();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }



    public GameState getGameState() {
        return gameState;
    }

    public void endTurn() {
        if (gameState.isGameOver()) {
            System.out.println("GAME OVER - Max Turns Reached");
            return;
        }

        // 1. รัน AI (ถ้าเป็น Auto mode หรือ Solitaire ต้องปรับ logic ตรงนี้เพิ่ม)
        runMinionAI(gameState.getPlayer(1));
        runMinionAI(gameState.getPlayer(2));

        // 2. คิดดอกเบี้ย
        updatePlayerBudget(gameState.getPlayer(1));
        updatePlayerBudget(gameState.getPlayer(2));

        // 3. เพิ่มเทิร์น
        gameState.nextTurn();
    }

    private void runMinionAI(Player p) {
        for (Minion m : p.getMinions()) {
            if (m.isAlive()) {
                MinionContext ctx = new MinionContext(m, gameState);
                if (m.getStrategyAST() != null) {
                    evaluator.execute(m.getStrategyAST(), ctx);
                }
            }
        }
    }

    // ใน GameService.java

    private void updatePlayerBudget(Player p) {
        long m = p.getBudget();
        int t = gameState.getTurnCount();
        double r;

        // สูตรจาก Spec หน้า 4
        if (m < 1) {
            r = 0;
        } else {
            double b = config.getDouble("interest_pct"); // สมมติว่าแก้ ConfigLoader ให้อ่าน double ได้
            // r = b * log10(m) * ln(t)
            r = b * Math.log10(m) * Math.log(t);
        }

        long interest = (long) (m * r / 100.0);
        p.addBudget(config.get("turn_budget") + interest);

        // ตรวจสอบ Max Budget
        if (p.getBudget() > config.get("max_budget")) {
            p.setBudget(config.get("max_budget"));
        }
    }

    public boolean buyHex(int playerId, int row, int col) {
        Player p = gameState.getPlayer(playerId);
        return gameState.buyHex(p, row, col, config.get("hex_purchase_cost"));
    }



    public void setMinionScript(int playerId, int minionIndex, String scriptCode) {
        // (Logic เดิม)
        List<String> tokens = java.util.Arrays.asList(scriptCode.replace("(", " ( ").replace(")", " ) ").replace("{", " { ").replace("}", " } ").trim().split("\\s+"));
        Parser p = new Parser(tokens);
        Node ast = p.parse();

        Player player = gameState.getPlayer(playerId);
        if (player.getMinions().size() > minionIndex) {
            player.getMinions().get(minionIndex).setStrategyAST(ast);
        }
    }
}