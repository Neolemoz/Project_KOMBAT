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

        // ทดสอบ AI Bot ขั้นสูง
        testAdvancedBot();

        System.out.println("\n=== ALL TESTS COMPLETED ===");
    }

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

    private static void testAdvancedBot() {
        System.out.print("Test 6: Advanced Bot AI Script... ");

        // สคริปต์ AI ขั้นสูง ที่ถูกปรับแก้ไวยากรณ์ (ลบ then และเปลี่ยน right เป็น upright)
        // เพื่อให้ตรงกับกฎ Parser ของโปรเจกต์
        String advancedScript =
                "t = t + 1\n" +
                        "m = 0\n" +
                        "while (3 - m) {\n" +
                        "  if (Budget - 100) {} else done\n" +
                        "  opponentLoc = opponent\n" +
                        "  if (opponentLoc / 10 - 1) {\n" +
                        "    if (opponentLoc % 10 - 5) move downleft\n" +
                        "    else if (opponentLoc % 10 - 4) move down\n" +
                        "    else if (opponentLoc % 10 - 3) move downright\n" +
                        "    else if (opponentLoc % 10 - 2) move upright\n" +
                        "    else if (opponentLoc % 10 - 1) move upright\n" +
                        "    else move up\n" +
                        "  } else if (opponentLoc) {\n" +
                        "    if (opponentLoc % 10 - 5) { cost = 10 ^ (nearby upleft % 100 + 1) if (Budget - cost) shoot upleft cost else {} }\n" +
                        "    else if (opponentLoc % 10 - 4) { cost = 10 ^ (nearby downleft % 100 + 1) if (Budget - cost) shoot downleft cost else {} }\n" +
                        "    else if (opponentLoc % 10 - 3) { cost = 10 ^ (nearby down % 100 + 1) if (Budget - cost) shoot down cost else {} }\n" +
                        "    else if (opponentLoc % 10 - 2) { cost = 10 ^ (nearby downright % 100 + 1) if (Budget - cost) shoot downright cost else {} }\n" +
                        "    else if (opponentLoc % 10 - 1) { cost = 10 ^ (nearby upright % 100 + 1) if (Budget - cost) shoot upright cost else {} }\n" +
                        "    else { cost = 10 ^ (nearby up % 100 + 1) if (Budget - cost) shoot up cost else {} }\n" +
                        "  } else {\n" +
                        "    try = 0\n" +
                        "    while (3 - try) {\n" +
                        "      success = 1\n" +
                        "      dir = random % 6\n" +
                        "      if ((dir - 4) * (nearby upleft % 10 + 1) ^ 2) move upleft\n" +
                        "      else if ((dir - 3) * (nearby downleft % 10 + 1) ^ 2) move downleft\n" +
                        "      else if ((dir - 2) * (nearby down % 10 + 1) ^ 2) move down\n" +
                        "      else if ((dir - 1) * (nearby downright % 10 + 1) ^ 2) move downright\n" +
                        "      else if (dir * (nearby upright % 10 + 1) ^ 2) move upright\n" +
                        "      else if ((nearby up % 10 + 1) ^ 2) move up\n" +
                        "      else success = 0\n" +
                        "      if (success) try = 3 else try = try + 1\n" +
                        "    }\n" +
                        "    m = m + 1\n" +
                        "  }\n" +
                        "}";

        GameState gs = new GameState(1000, 10, 10, 100, 100, 5000, 5.0);
        Player p1 = gs.getPlayer(1);

        try {
            // 1. ลองแยกประโยคและแปลง AST ว่าสคริปต์นี้เกิด Error หรือไม่
            Node rootNode = parse(advancedScript);

            // 2. จำลองสถานการณ์ 1: ให้เงินเยอะๆ และไม่มีศัตรู (บอทควรจะเดินสุ่ม)
            p1.setBudget(5000);
            Minion bot = new Minion(p1, 10, 100, rootNode);
            gs.placeMinion(p1, bot, 5, 5);
            MinionContext ctx = new MinionContext(bot, gs);

            int startRow = bot.getRow();
            int startCol = bot.getCol();
            new StrategyEvaluator().execute(rootNode, ctx);

            boolean didRandomMove = (bot.getRow() != startRow) || (bot.getCol() != startCol);

            // 3. จำลองสถานการณ์ 2: มีเงินแค่ 50 (น้อยกว่า 100 บอทควรจะโดนคำสั่ง 'done' และไม่ขยับ)
            p1.setBudget(50);
            startRow = bot.getRow();
            startCol = bot.getCol();
            ctx = new MinionContext(bot, gs);
            new StrategyEvaluator().execute(rootNode, ctx);

            boolean didStopDueToBudget = (bot.getRow() == startRow) && (bot.getCol() == startCol);

            // 4. สรุปผลลัพธ์
            if (didRandomMove && didStopDueToBudget) {
                System.out.println("PASSED (Parsed successfully and behaved correctly)");
            } else {
                System.out.println("FAILED (Moved=" + didRandomMove + ", Stopped=" + didStopDueToBudget + ")");
            }

        } catch (Exception e) {
            System.out.println("FAILED (Syntax or execution error: " + e.getMessage() + ")");
        }
    }

    private static Node parse(String code) {
        return new Parser(new Tokenizer(code).tokenize()).parse();
    }
}