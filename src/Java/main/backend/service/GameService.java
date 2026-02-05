package src.Java.main.backend.service;

import main.backend.logic.ConfigLoader;
import main.backend.model.GameState;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import

@Service
public class GameService {
    private GameState gameState;
    private StrategyEvaluator evaluator;
    private Parser parser;
    private ConfigLoader config;

    @PostConstruct
    public void init() {
        // 1. โหลด Config (เหมือนที่เคยทำใน Main)
        config = new ConfigLoader();
        config.loadConfig("config.txt");

        // 2. สร้างเกมใหม่
        gameState = new GameState(config.get("init_budget"));
        evaluator = new StrategyEvaluator();

        // parser อาจต้องรอรับสคริปต์จากหน้าบ้านในภายหลัง หรือโหลด default
        System.out.println("Game Engine Started!");
    }

    public GameState getGameState() {
        return gameState;
    }

    // ฟังก์ชันจบเทิร์น: รัน AI ของ Minion ทุกตัว + คิดดอกเบี้ย
    public void endTurn() {
        // 1. รัน AI ผู้เล่น 1
        runMinionAI(gameState.getPlayer(1));

        // 2. รัน AI ผู้เล่น 2
        runMinionAI(gameState.getPlayer(2));

        // 3. คิดดอกเบี้ยและเพิ่มงบ
        int turn = 1; // ในของจริงต้องเก็บ turn count ไว้ใน gameState
        updatePlayerBudget(gameState.getPlayer(1), turn);
        updatePlayerBudget(gameState.getPlayer(2), turn);
    }

    private void runMinionAI(Player p) {
        for (Minion m : p.getMinions()) {
            if (m.isAlive()) {
                // สร้าง Context และรันสคริปต์
                MinionContext ctx = new MinionContext(m, gameState);
                // สมมติว่า parser parse สคริปต์เก็บไว้ใน Minion แล้ว
                if (m.getStrategyAST() != null) {
                    evaluator.execute(m.getStrategyAST(), ctx);
                }
            }
        }
    }

    private void updatePlayerBudget(Player p, int turn) {
        p.updateBudget(config.get("turn_budget"), config.get("interest_pct"), turn, config.get("max_budget"));
    }

    // ฟังก์ชันซื้อพื้นที่ (เรียกจาก Controller)
    public boolean buyHex(int playerId, int row, int col) {
        Player p = gameState.getPlayer(playerId);
        double cost = config.get("hex_purchase_cost"); // หรือค่าคงที่ตามโจทย์
        return gameState.buyHex(p, row, col, cost);
    }

    public void setMinionScript(int playerId, int minionIndex, String scriptCode) {
        // 1. สร้าง Tokenizer (แยกคำ) - *คุณอาจต้องเขียนคลาส Tokenizer เพิ่ม หรือทำง่ายๆ แบบ split*
        List<String> tokens = java.util.Arrays.asList(scriptCode.replace("(", " ( ").replace(")", " ) ").replace("{", " { ").replace("}", " } ").trim().split("\\s+"));

        // 2. สร้าง Parser และ Parse
        Parser p = new Parser(tokens);
        Node ast = p.parse();

        // 3. ยัดใส่ Minion
        Player player = gameState.getPlayer(playerId);
        if (player.getMinions().size() > minionIndex) {
            player.getMinions().get(minionIndex).setStrategyAST(ast);
        }
    }
}