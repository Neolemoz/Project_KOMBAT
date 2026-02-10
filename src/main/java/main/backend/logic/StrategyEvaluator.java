package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;

public class StrategyEvaluator {
    private boolean isDone = false; // ตัวแปรบอกว่าจบเทิร์นหรือยัง
    private static final int MAX_LOOPS = 10000;

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
        } else if (node instanceof BlockNode) {
            for (Node stmt : ((BlockNode) node).getStatements()) {
                execute(stmt, ctx);
                if (isDone) break; // ถ้าสั่ง Move/Shoot แล้วให้หลุดลูปทันที
            }
        }
    }

    // --- Logic การคำนวณข้อมูล (Info Expressions) ---
    public static long calculateInfo(MinionContext ctx, String type, String direction) {
        GameState gs = ctx.getGameState();
        Minion me = ctx.getMinion();

        if ("nearby".equals(type)) {
            return calculateNearby(gs, me, direction);
        } else if ("ally".equals(type)) {
            return calculateClosest(gs, me, true); // true = หาพวกเดียวกัน
        } else if ("opponent".equals(type)) {
            return calculateClosest(gs, me, false); // false = หาศัตรู
        }
        return 0;
    }

    // สูตร Nearby: 100x + 10y + z (Spec หน้า 7)
    private static long calculateNearby(GameState gs, Minion me, String direction) {
        int r = me.getRow();
        int c = me.getCol();
        int dist = 0;

        while (true) {
            int[] next = gs.getNeighbor(r, c, direction);
            r = next[0];
            c = next[1];
            dist++;

            if (!gs.isValidHex(r, c)) return 0; // สุดขอบกระดาน ไม่เจอใคร

            Hex h = gs.getHex(r, c);
            if (h.getOccupant() != null) {
                Minion target = h.getOccupant();

                long x = String.valueOf(target.getHp()).length();     // หลัก HP
                long y = String.valueOf(target.getDefense()).length(); // หลัก Defense
                long z = dist;

                long val = 100 * x + 10 * y + z;

                // ถ้าเป็นพวกเดียวกัน คืนค่าติดลบ
                return (target.getOwner() == me.getOwner()) ? -val : val;
            }
        }
    }

    // สูตร Opponent/Ally: หาตัวที่ใกล้ที่สุดใน 6 ทิศ (Spec หน้า 6)
    private static long calculateClosest(GameState gs, Minion me, boolean findAlly) {
        long bestValue = 0;
        int minDistance = Integer.MAX_VALUE;
        String[] directions = {null, "up", "upright", "downright", "down", "downleft", "upleft"};

        // วนหาทั้ง 6 ทิศ
        for (int dir = 1; dir <= 6; dir++) {
            int r = me.getRow();
            int c = me.getCol();
            int dist = 0;

            while (true) {
                int[] next = gs.getNeighbor(r, c, directions[dir]);
                r = next[0];
                c = next[1];
                dist++;

                if (!gs.isValidHex(r, c)) break; // ตกขอบ

                Hex h = gs.getHex(r, c);
                if (h != null && h.getOccupant() != null) {
                    Minion target = h.getOccupant();
                    boolean isAlly = (target.getOwner() == me.getOwner());

                    if (isAlly == findAlly) {
                        // เจอเป้าหมายที่ต้องการ
                        if (dist < minDistance) {
                            minDistance = dist;
                            // Return: 10 * distance + direction_code
                            bestValue = (long) dist * 10 + dir;
                        }
                    }
                    // เจอ Minion (ไม่ว่าจะพวกไหน) บังทัศนวิสัย -> หยุดหาในทิศนี้
                    break;
                }
            }
        }
        return bestValue;
    }

    // --- Logic การกระทำ (Action) ---
    private void executeAction(ActionCommandNode node, MinionContext ctx) {
        if (isDone) return;

        String action = node.getActionType();
        if ("done".equals(action)) {
            this.isDone = true;
            return;
        }

        Player player = ctx.getMinion().getOwner();
        GameState gameState = ctx.getGameState();
        Minion minion = ctx.getMinion();

        if ("move".equals(action)) {
            if (player.spend(1)) { // ค่าเดิน 1 หน่วย
                gameState.moveMinion(minion, node.getDirection());
                this.isDone = true; // เดินแล้วจบเทิร์นทันที (Spec ข้อ 210)
            } else {
                this.isDone = true; // เงินหมดก็จบเทิร์น
            }

        } else if ("shoot".equals(action)) {
            long expenditure = evaluateExpression(node.getExpression(), ctx);
            long cost = expenditure + 1;

            if (player.spend(cost)) {
                int[] targetPos = gameState.getNeighbor(minion.getRow(), minion.getCol(), node.getDirection());
                Hex targetHex = gameState.getHex(targetPos[0], targetPos[1]);

                if (targetHex != null && targetHex.getOccupant() != null) {
                    Minion target = targetHex.getOccupant();
                    long defense = target.getDefense();
                    long damage = Math.max(1, expenditure - defense); // Damage อย่างน้อย 1

                    target.takeDamage((int) damage);
                    if (!target.isAlive()) {
                        targetHex.setOccupant(null);
                        // TODO: ควรมี method removeMinion ใน GameState หรือ Player เพื่อลบออกจาก list
                    }
                }
                this.isDone = true; // ยิงแล้วจบเทิร์นทันที (Spec ข้อ 210)
            }
        }
    }

    // --- Helper Methods อื่นๆ (Control Flow & Expression) ---
    private void executeIf(IfStatementNode node, MinionContext ctx) {
        if (evaluateExpression(node.getCondition(), ctx) > 0) {
            execute(node.getThenBlock(), ctx);
        } else if (node.getElseBlock() != null) {
            execute(node.getElseBlock(), ctx);
        }
    }

    private void executeWhile(WhileStatementNode node, MinionContext ctx) {
        int counter = 0;
        while (evaluateExpression(node.getCondition(), ctx) > 0 && counter < MAX_LOOPS && !isDone) {
            execute(node.getBody(), ctx);
            counter++;
        }
    }

    private void executeAssignment(AssignmentNode node, MinionContext ctx) {
        long value = evaluateExpression(node.getExpression(), ctx);
        ctx.setVariable(node.getIdentifier(), value);
    }

    private long evaluateExpression(ExpressionNode expr, MinionContext ctx) {
        try {
            return expr.evaluate(ctx);
        } catch (Exception e) {
            return 0;
        }
    }
}