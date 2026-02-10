package main;

import main.backend.logic.*;
import main.backend.model.*;
import java.util.List;

public class TestFullSystem {

    public static void main(String[] args) {
        System.out.println("=== STARTING FULL SYSTEM ROBUSTNESS TEST ===\n");

        testIllegalMoves();
        testIllegalSpawn();
        testCombatAndDeath();
        testBadScriptHandling();
        testDivisionByZero();

        System.out.println("\n=== ALL TESTS COMPLETED ===");
    }

    // ... (เมธอดอื่นคงเดิม) ...
    private static void testIllegalMoves() {
        System.out.print("Test 1: Illegal Moves (Boundary/Collision)... ");
        GameState gs = new GameState(1000, 10, 10, 100, 100, 5000, 5.0);
        Player p1 = gs.getPlayer(1);
        String script = "move up";
        Minion m = new Minion(p1, 10, 100, parse(script));
        gs.placeMinion(p1, m, 1, 1);
        MinionContext ctx = new MinionContext(m, gs);
        new StrategyEvaluator().execute(m.getStrategy(), ctx);
        if (m.getRow() == 1 && m.getCol() == 1) {
            System.out.println("PASSED (Stayed in bounds)");
        } else {
            System.out.println("FAILED (Moved to " + m.getRow() + "," + m.getCol() + ")");
        }
    }

    private static void testIllegalSpawn() {
        System.out.print("Test 2: Illegal Spawn (Enemy Zone)... ");
        GameState gs = new GameState(1000, 10, 10, 100, 100, 5000, 5.0);
        Player p1 = gs.getPlayer(1);
        boolean canSpawn = gs.canSpawn(p1, 8, 8);
        if (!canSpawn) {
            System.out.println("PASSED (Prevented illegal spawn)");
        } else {
            System.out.println("FAILED (Allowed P1 to spawn at 8,8)");
        }
    }

    // --- แก้ไขตรงนี้ ---
    private static void testCombatAndDeath() {
        System.out.print("Test 3: Combat (Damage & Death)... ");
        GameState gs = new GameState(1000, 10, 10, 100, 100, 5000, 5.0);
        Player p1 = gs.getPlayer(1);
        Player p2 = gs.getPlayer(2);

        // 1. Setup Shooter & Victim
        String shooterScript = "shoot down 50";
        Minion shooter = new Minion(p1, 10, 100, parse(shooterScript));
        gs.placeMinion(p1, shooter, 1, 1);

        Minion victim = new Minion(p2, 10, 100, parse("move up"));
        gs.placeMinion(p2, victim, 2, 1);

        // 2. First Shot (Damage 40)
        MinionContext ctx = new MinionContext(shooter, gs);
        new StrategyEvaluator().execute(shooter.getStrategy(), ctx);

        if (victim.getHp() == 60) {
            System.out.print("Damage OK... ");

            // 3. Second Shot (Fatal)
            shooterScript = "shoot down 70";
            shooter = new Minion(p1, 10, 100, parse(shooterScript));

            // *** เพิ่มบรรทัดนี้: ต้องกำหนดตำแหน่งให้ Shooter ตัวใหม่ด้วย ไม่งั้นมันจะอยู่ที่ (0,0) ***
            shooter.setPosition(1, 1);

            ctx = new MinionContext(shooter, gs);
            new StrategyEvaluator().execute(shooter.getStrategy(), ctx);

            if (!victim.isAlive() && gs.getHex(2,1).getOccupant() == null) {
                System.out.println("PASSED (Victim died and removed)");
            } else {
                System.out.println("FAILED (Victim logic wrong: Alive=" + victim.isAlive() + ")");
            }
        } else {
            System.out.println("FAILED (Wrong Damage: HP=" + victim.getHp() + ")");
        }
    }

    private static void testBadScriptHandling() {
        System.out.print("Test 4: Bad Script Handling... ");
        String badCode = "if (x >> 5) { move up }";
        try {
            List<String> tokens = new Tokenizer(badCode).tokenize();
            new Parser(tokens).parse();
            System.out.println("WARNING (Parser accepted bad code?)");
        } catch (Exception e) {
            System.out.println("PASSED (Caught expected error: " + e.getMessage() + ")");
        }
    }

    private static void testDivisionByZero() {
        System.out.print("Test 5: Division By Zero... ");
        GameState gs = new GameState(1000, 10, 10, 100, 100, 5000, 5.0);
        Player p1 = gs.getPlayer(1);
        String script = "x = 100 / 0";
        Minion m = new Minion(p1, 10, 100, parse(script));
        MinionContext ctx = new MinionContext(m, gs);
        try {
            new StrategyEvaluator().execute(m.getStrategy(), ctx);
            System.out.println("PASSED (Handled gracefully)");
        } catch (Exception e) {
            System.out.println("FAILED (System Crashed: " + e.getMessage() + ")");
        }
    }

    private static Node parse(String code) {
        return new Parser(new Tokenizer(code).tokenize()).parse();
    }
}