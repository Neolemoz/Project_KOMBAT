package main;

import main.backend.logic.*;
import main.backend.model.*;

public class Main {
    public static void main(String[] args) {
        // 1. โหลด Config
        ConfigLoader config = new ConfigLoader();
        config.loadConfig("config.txt"); // อย่าลืมสร้างไฟล์ config.txt ไว้ที่ root project

        // 2. สร้างเกม
        GameState game = new GameState(config.get("init_budget"));
        StrategyEvaluator evaluator = new StrategyEvaluator();
        Parser parser = new Parser(null); // ต้องเขียน logic อ่านไฟล์สคริปต์มาใส่ Parser

        // 3. Game Loop (จำลองการเล่น)
        int maxTurns = (int) config.get("max_turns");
        for (int turn = 1; turn <= maxTurns; turn++) {
            System.out.println("Turn: " + turn);

            // วนลูปทุก Minion ของผู้เล่น 1 และ 2
            // game.getPlayer(1).getMinions().forEach(...)
            // สร้าง MinionContext
            // evaluator.execute(minion.getStrategyAST(), ctx);

            // จบเทิร์น: คิดดอกเบี้ย
            game.getPlayer(1).updateBudget(config.get("turn_budget"), config.get("interest_pct"), turn, config.get("max_budget"));
            game.getPlayer(2).updateBudget(config.get("turn_budget"), config.get("interest_pct"), turn, config.get("max_budget"));
        }
    }
}