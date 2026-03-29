package main.backend;

import main.backend.logic.*;
import main.backend.model.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class StrategyTest {
    private static final String STRATEGY_FILE_PATH = "src/main/java/main/backend/strategy.txt";

    //โหลด strategy จากไฟล์
    static String loadStrategy(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            System.out.println("📄 Loaded strategy from: " + path);
            return content;
        } catch (IOException e) {
            System.out.println("⚠️  Cannot load file: " + path + " → " + e.getMessage());
            return null;
        }
    }

    // สร้าง GameState สำหรับ test
    static GameState makeGameState() {
        return new GameState(
                10000,  // init_budget
                69,     // max_turns
                47,     // max_spawns
                100,    // spawn_cost
                100,    // init_hp
                23456,  // max_budget
                5.0     // interest_pct
        );
    }

    // HELPER: parse + run strategy บน minion
    static void runStrategy(Minion minion, GameState gs, String script) {
        List<String> tokens = new Tokenizer(script).tokenize();
        Node ast = new Parser(tokens).parse();
        new StrategyEvaluator().execute(ast, new MinionContext(minion, gs));
    }

    static void pass(String name) { System.out.println(" PASS: " + name); }
    static void fail(String name, String msg) { System.out.println(" FAIL: " + name + " → " + msg); }
    static void header(String title) { System.out.println("\n========== " + title + " =========="); }

    //  แก้ bug: ใช้ %.0f แทน %d เพราะ budget อาจเป็น double
    static void printGameState(GameState gs, Minion... minions) {
        System.out.println("Turn: " + gs.getTurnCount());
        for (Minion m : minions) {
            System.out.printf("  P%d Minion: row=%d col=%d hp=%d budget=%.0f%n",
                    m.getOwner().getId(),
                    m.getRow(),
                    m.getCol(),
                    m.getHp(),
                    (double) m.getOwner().getBudget());
        }
    }

    static void testLoadFromFile() {
        header("1. LOAD STRATEGY FROM FILE: " + STRATEGY_FILE_PATH);

        String script = loadStrategy(STRATEGY_FILE_PATH);
        if (script == null) {
            System.out.println("⚠️  SKIP: วางไฟล์ strategy.txt ที่ root project ก่อนแล้วรันใหม่");
            return;
        }

        // Parse
        List<String> tokens;
        Node ast;
        try {
            tokens = new Tokenizer(script).tokenize();
            ast = new Parser(tokens).parse();
            pass("Parse strategy.txt สำเร็จ (tokens=" + tokens.size() + ")");
        } catch (Exception e) {
            fail("Parse strategy.txt", e.getMessage());
            return;
        }

        // Setup game
        GameState gs = makeGameState();
        Player p1 = gs.getPlayer(1);
        Player p2 = gs.getPlayer(2);

        Minion myMinion = new Minion(p1, 5, 100, null);
        gs.getHex(4, 4).setOccupant(myMinion);
        myMinion.setPosition(4, 4);
        p1.addMinion(myMinion);

        Minion enemy = new Minion(p2, 5, 100, null);
        gs.getHex(6, 4).setOccupant(enemy);
        enemy.setPosition(6, 4);
        p2.addMinion(enemy);

        System.out.println("[Before]");
        printGameState(gs, myMinion, enemy);

        // รัน
        try {
            new StrategyEvaluator().execute(ast, new MinionContext(myMinion, gs));
            pass("Run strategy.txt สำเร็จ ไม่ throw exception");
        } catch (Exception e) {
            fail("Run strategy.txt", e.getMessage());
            e.printStackTrace();
        }

        System.out.println("[After]");
        printGameState(gs, myMinion, enemy);
        System.out.printf("  → P1 minion: (%d,%d)  P2 minion: hp=%d alive=%b%n",
                myMinion.getRow(), myMinion.getCol(), enemy.getHp(), enemy.isAlive());
    }

    static void testParser() {
        header("2. PARSER");

        String[] scripts = {
                "done",
                "move up",
                "x = 5",
                "if (Budget - 100) then done else {}",
                "while (3) { done }",
                "shoot down 50",
                "x = opponent",
                "x = nearby up",
                "x = ally",
                "t = t + 1\nm = 0\nwhile (3 - m) { done }"
        };

        for (String s : scripts) {
            try {
                new Parser(new Tokenizer(s).tokenize()).parse();
                pass("Parse: \"" + s.split("\n")[0] + "\"");
            } catch (Exception e) {
                fail("Parse: \"" + s.split("\n")[0] + "\"", e.getMessage());
            }
        }
    }

    static void testMove() {
        header("3. MOVE COMMAND");

        GameState gs = makeGameState();
        Player p1 = gs.getPlayer(1);

        Minion m = new Minion(p1, 5, 100, null);
        gs.getHex(4, 4).setOccupant(m);
        m.setPosition(4, 4);
        p1.addMinion(m);

        long budgetBefore = (long) p1.getBudget();

        runStrategy(m, gs, "move down");
        if (m.getRow() == 5 && m.getCol() == 4) pass("move down: (4,4)→(5,4) ");
        else fail("move down", "pos=" + m.getRow() + "," + m.getCol());

        if ((long) p1.getBudget() == budgetBefore - 1) pass("move cost = 1 ");
        else fail("move cost", "budget=" + p1.getBudget());

        runStrategy(m, gs, "move up");
        if (m.getRow() == 4) pass("move up: (5,4)→(4,4) ");
        else fail("move up", "row=" + m.getRow());

        // ชนขอบ
        Minion edge = new Minion(p1, 5, 100, null);
        gs.getHex(1, 1).setOccupant(edge);
        edge.setPosition(1, 1);
        p1.addMinion(edge);
        runStrategy(edge, gs, "move up");
        if (edge.getRow() == 1 && edge.getCol() == 1) pass("move ชนขอบ = no-op ");
        else fail("move edge", "pos=" + edge.getRow() + "," + edge.getCol());

        // ชนคน
        Minion blocker = new Minion(p1, 5, 100, null);
        gs.getHex(3, 4).setOccupant(blocker);
        blocker.setPosition(3, 4);
        int rowBefore = m.getRow();
        runStrategy(m, gs, "move up");
        if (m.getRow() == rowBefore) pass("move ชน minion อื่น = no-op ");
        else fail("move occupied", "moved to row=" + m.getRow());
    }

    static void testShoot() {
        header("4. SHOOT COMMAND");

        GameState gs = makeGameState();
        Player p1 = gs.getPlayer(1);
        Player p2 = gs.getPlayer(2);

        // Attacker (4,4) → shoot down → Target (5,4)
        Minion attacker = new Minion(p1, 10, 100, null);
        gs.getHex(4, 4).setOccupant(attacker);
        attacker.setPosition(4, 4);
        p1.addMinion(attacker);

        Minion target = new Minion(p2, 5, 100, null); // defense=5
        gs.getHex(5, 4).setOccupant(target);
        target.setPosition(5, 4);
        p2.addMinion(target);

        long budgetBefore = (long) p1.getBudget();
        runStrategy(attacker, gs, "shoot down 20"); // damage=max(1,20-5)=15 → hp=85, cost=21

        if (target.getHp() == 85) pass("shoot damage: hp=85 ");
        else fail("shoot damage", "hp=" + target.getHp() + " expected=85");

        if ((long) p1.getBudget() == budgetBefore - 21) pass("shoot cost=21 ");
        else fail("shoot cost", "budget=" + p1.getBudget());

        // defense > expenditure → damage = 1
        Minion tank = new Minion(p2, 50, 100, null);
        gs.getHex(3, 4).setOccupant(tank);
        tank.setPosition(3, 4);
        p2.addMinion(tank);
        runStrategy(attacker, gs, "shoot up 10");
        if (tank.getHp() == 99) pass("shoot vs high defense: damage=1 ");
        else fail("shoot min damage", "hp=" + tank.getHp());

        int[] nb = gs.getNeighbor(3, 5, "downright");
        System.out.printf("  [debug] neighbor(3,5,downright)=(%d,%d)%n", nb[0], nb[1]);

        Minion weakTarget = new Minion(p2, 0, 5, null); // defense=0, hp=5
        gs.getHex(nb[0], nb[1]).setOccupant(weakTarget);
        weakTarget.setPosition(nb[0], nb[1]);
        p2.addMinion(weakTarget);

        Minion killer = new Minion(p1, 0, 100, null);
        gs.getHex(3, 5).setOccupant(killer);
        killer.setPosition(3, 5);
        p1.addMinion(killer);

        runStrategy(killer, gs, "shoot downright 100");

        if (!weakTarget.isAlive() && weakTarget.getHp() <= 0)
            pass("shoot lethal: target dead ");
        else if (weakTarget.getHp() <= 0)
            fail("shoot lethal", "hp≤0 แต่ isAlive()=true → แก้ isAlive() ใน Minion.java ให้ return hp > 0");
        else
            fail("shoot lethal", "hp=" + weakTarget.getHp() + " neighbor=(" + nb[0] + "," + nb[1] + ")");
    }

    static void testGameState() {
        header("5. GAME STATE OUTPUT");

        GameState gs = makeGameState();
        Player p1 = gs.getPlayer(1);
        Player p2 = gs.getPlayer(2);

        Minion m1 = new Minion(p1, 5, 100, null);
        gs.getHex(4, 4).setOccupant(m1);
        m1.setPosition(4, 4);
        p1.addMinion(m1);

        Minion m2 = new Minion(p2, 5, 100, null);
        gs.getHex(5, 4).setOccupant(m2);
        m2.setPosition(5, 4);
        p2.addMinion(m2);

        System.out.println("[Before]");
        printGameState(gs, m1, m2);

        runStrategy(m1, gs, "move up");
        runStrategy(m2, gs, "shoot up 30");

        System.out.println("[After]");
        printGameState(gs, m1, m2);

        if (m1.getRow() == 3) pass("m1 moved up to row=3 ");
        else fail("m1 position", "row=" + m1.getRow());

        if ((long) p2.getBudget() < 10000) pass("P2 budget decreased ");
        else fail("P2 budget", "budget=" + p2.getBudget());
    }

    static void testVariables() {
        header("6. VARIABLES");

        GameState gs = makeGameState();
        Player p1 = gs.getPlayer(1);

        Minion m = new Minion(p1, 5, 100, null);
        gs.getHex(3, 3).setOccupant(m);
        m.setPosition(3, 3);
        p1.addMinion(m);

        runStrategy(m, gs, "x = 42");
        if (m.getMemory().getOrDefault("x", -1L) == 42) pass("local var x=42 ");
        else fail("local var", "x=" + m.getMemory().get("x"));

        MinionContext ctx = new MinionContext(m, gs);
        if (ctx.getVariable("row") == 3) pass("row=3 ");
        else fail("row", "" + ctx.getVariable("row"));

        if (ctx.getVariable("col") == 3) pass("col=3 ");
        else fail("col", "" + ctx.getVariable("col"));

        runStrategy(m, gs, "row = 999");
        if (ctx.getVariable("row") == 3) pass("row read-only ");
        else fail("row read-only", "row=" + ctx.getVariable("row"));

        runStrategy(m, gs, "result = 2 ^ 10");
        if (m.getMemory().getOrDefault("result", -1L) == 1024) pass("2^10=1024 ");
        else fail("2^10", "" + m.getMemory().get("result"));

        runStrategy(m, gs, "result = 17 % 5");
        if (m.getMemory().getOrDefault("result", -1L) == 2) pass("17%5=2 ");
        else fail("17%5", "" + m.getMemory().get("result"));

        runStrategy(m, gs, "result = 10 / 3");
        if (m.getMemory().getOrDefault("result", -1L) == 3) pass("10/3=3 (int div) ");
        else fail("10/3", "" + m.getMemory().get("result"));
    }

    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════╗");
        System.out.println("║   KOMBAT Strategy Test Suite     ║");
        System.out.println("╚══════════════════════════════════╝");

        testLoadFromFile();
        testParser();
        testMove();
        testShoot();
        testGameState();
        testVariables();

        System.out.println("\n========== DONE ==========");
    }
}