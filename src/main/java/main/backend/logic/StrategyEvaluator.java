package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;

public class StrategyEvaluator {
    private boolean isDone = false; // ตัวแปรสำหรับจบเทิร์น (เมื่อเจอคำสั่ง done หรือเงินหมด หรือ error)
    private static final int MAX_LOOPS = 10000; // ป้องกัน Infinite Loop

    public void execute(Node node, MinionContext ctx) {
        if (isDone || node == null) return;

        if (node instanceof ActionCommandNode) {
            executeAction((ActionCommandNode) node, ctx);
        } else if (node instanceof IfStatementNode) {
            executeIf((IfStatementNode) node, ctx);
        } else if (node instanceof WhileStatementNode) {
            executeWhile((WhileStatementNode) node, ctx);
        } else if (node instanceof AssignmentNode) {
            executeAssignment((AssignmentNode) node, ctx);
        } else if (node instanceof BlockNode) { // กรณีมี Block { ... }
            for (Node stmt : ((BlockNode) node).getStatements()) {
                execute(stmt, ctx);
                if (isDone) break;
            }
        }
    }

    // --- Logic การควบคุม Flow (If/While) ---

    private void executeIf(IfStatementNode node, MinionContext ctx) {
        if (evaluateExpression(node.getCondition(), ctx) > 0) {
            execute(node.getThenBlock(), ctx);
        } else if (node.getElseBlock() != null) {
            execute(node.getElseBlock(), ctx);
        }
    }

    private void executeWhile(WhileStatementNode node, MinionContext ctx) {
        int counter = 0;
        // กฎ: หยุดเมื่อเงื่อนไขเป็นเท็จ หรือวนเกิน 10,000 รอบ
        while (evaluateExpression(node.getCondition(), ctx) > 0 && counter < MAX_LOOPS && !isDone) {
            execute(node.getBody(), ctx);
            counter++;
        }
    }

    // --- Logic การกระทำ (Action) ---

    private void executeAction(ActionCommandNode node, MinionContext ctx) {
        String action = node.getActionType();

        if ("done".equals(action)) {
            this.isDone = true;
            return;
        }

        Player player = ctx.getMinion().getOwner();
        GameState gameState = ctx.getGameState();
        Minion minion = ctx.getMinion();

        if ("move".equals(action)) {
            // move: เสียค่าใช้จ่าย 1 เสมอ
            if (player.spend(1)) {
                gameState.moveMinion(minion, node.getDirection());
            } else {
                this.isDone = true; // เงินหมด จบเทิร์น
            }

        } else if ("shoot".equals(action)) {
            // shoot: คำนวณค่าใช้จ่ายและดาเมจ
            long expenditure = evaluateExpression(node.getExpression(), ctx);
            long cost = expenditure + 1;

            if (player.spend(cost)) {
                // หาเป้าหมายในทิศทางที่ยิง (ระยะ 1 ช่อง)
                int[] targetPos = gameState.getNeighbor(minion.getRow(), minion.getCol(), node.getDirection());
                Hex targetHex = gameState.getHex(targetPos[0], targetPos[1]);

                if (targetHex != null && targetHex.getOccupant() != null) {
                    Minion target = targetHex.getOccupant();

                    // สูตร Damage: max(1, x - d)
                    long defense = target.getDefense();
                    long effectiveDamage = Math.max(1, expenditure - defense);

                    target.takeDamage((int) effectiveDamage);

                    if (!target.isAlive()) {
                        // ลบออกจากกระดานและ Player
                        targetHex.setOccupant(null);
                        target.getOwner().removeMinion(target);
                    }
                }
            } else {
                // เงินไม่พอ shoot ถือเป็น no-op (ตามกฎ)
            }
        }
    }

    private void executeAssignment(AssignmentNode node, MinionContext ctx) {
        long value = evaluateExpression(node.getExpression(), ctx);
        ctx.setVariable(node.getIdentifier(), value);
    }

    // --- ส่วนคำนวณนิพจน์ (Expression) ---

    private long evaluateExpression(ExpressionNode expr, MinionContext ctx) {
        try {
            // เรียกใช้ evaluate ของ Node ลูก (เช่น BinaryOpNode, NumberNode)
            return expr.evaluate(ctx);
        } catch (ArithmeticException e) {
            this.isDone = true; // หารด้วย 0 ให้จบเทิร์นทันที
            return 0;
        }
    }

    // ในไฟล์ StrategyEvaluator.java เพิ่ม static method หรือ instance method

    public static long calculateInfo(MinionContext ctx, String type, String direction) {
        Minion me = ctx.getMinion();
        GameState gs = ctx.getGameState();

        if (type.equals("nearby")) {
            return calculateNearby(gs, me, direction);
        } else if (type.equals("opponent")) {
            return calculateClosest(gs, me, false); // false = หาศัตรู
        } else if (type.equals("ally")) {
            return calculateClosest(gs, me, true);  // true = หาพวกเดียวกัน
        }
        return 0;
    }

    private static long calculateNearby(GameState gs, Minion me, String direction) {
        int r = me.getRow();
        int c = me.getCol();
        int dist = 0;

        // เดินไปในทิศทางนั้นเรื่อยๆ จนกว่าจะเจอ Minion หรือตกขอบ
        while (true) {
            int[] next = gs.getNeighbor(r, c, direction);
            r = next[0];
            c = next[1];
            dist++;

            if (!gs.isValidHex(r, c)) return 0; // ตกขอบ ไม่เจอใคร

            Hex h = gs.getHex(r, c);
            if (h.getOccupant() != null) {
                Minion target = h.getOccupant();
                // สูตร: 100x + 10y + z
                long x = String.valueOf(target.getHp()).length();     // จำนวนหลัก HP
                long y = String.valueOf(target.getDefense()).length(); // จำนวนหลัก Defense
                long z = dist;

                long val = 100*x + 10*y + z;

                // ถ้าเป็นพวกเดียวกัน คืนค่าติดลบ
                if (target.getOwner() == me.getOwner()) {
                    return -val;
                } else {
                    return val;
                }
            }
        }
    }

    private static long calculateClosest(GameState gs, Minion me, boolean findAlly) {
        long bestValue = 0;
        int minDistance = Integer.MAX_VALUE;

        // Mapping ทิศทางและรหัสตัวเลขตาม Diagram หน้า 6
        // Index 1..6 ตรงกับค่า Direction ที่ต้องคืน
        // 1=up, 2=upright, 3=downright, 4=down, 5=downleft, 6=upleft
        String[] directions = {null, "up", "upright", "downright", "down", "downleft", "upleft"};

        // วนลูปตรวจสอบทั้ง 6 ทิศทาง
        for (int dir = 1; dir <= 6; dir++) {
            int r = me.getRow();
            int c = me.getCol();
            int dist = 0;

            // Ray Casting: เดินหน้าไปในทิศทางนั้นเรื่อยๆ จนกว่าจะเจอ Minion หรือตกขอบ
            while (true) {
                // ขยับไปช่องถัดไป
                int[] nextPos = gs.getNeighbor(r, c, directions[dir]);
                r = nextPos[0];
                c = nextPos[1];
                dist++;

                // 1. ถ้าตกขอบกระดาน ให้หยุดหาในทิศนี้
                if (!gs.isValidHex(r, c)) {
                    break;
                }

                // 2. ถ้าเจอ Minion (สิ่งกีดขวางแรกในทิศนี้)
                Hex hex = gs.getHex(r, c);
                if (hex != null && hex.getOccupant() != null) {
                    Minion target = hex.getOccupant();

                    // เช็คว่าเป็นพวกเดียวกันหรือไม่ (เทียบ Object Owner หรือ ID)
                    boolean isSameOwner = (target.getOwner() == me.getOwner());

                    // ตรวจสอบว่า Minion นี้ตรงกับเงื่อนไขที่เราหาหรือไม่
                    // (หา Ally และเจอ Ally) หรือ (หา Opponent และเจอ Opponent)
                    if (findAlly == isSameOwner) {
                        // เจอเป้าหมาย! ตรวจสอบว่าเป็นตัวที่ใกล้ที่สุดหรือไม่
                        if (dist < minDistance) {
                            minDistance = dist;
                            // คำนวณค่าคืนกลับ: 10 * distance + direction code
                            bestValue = (long) dist * 10 + dir;
                        }
                    }

                    // *สำคัญ* ตามกฎการมองเห็น (Visibility):
                    // เมื่อเจอ Minion ตัวแรกขวางอยู่ในทิศนี้ (ไม่ว่าจะใช่เป้าหมายหรือไม่)
                    // ถือว่าบังตัวที่อยู่ด้านหลังจนมิด จึงต้องหยุดค้นหาในทิศนี้ทันที
                    break;
                }
            }
        }

        // หากไม่เจอเป้าหมายเลยในทุกทิศทาง จะคืนค่า 0 (bestValue เริ่มต้นเป็น 0)
        return bestValue;
    }

}