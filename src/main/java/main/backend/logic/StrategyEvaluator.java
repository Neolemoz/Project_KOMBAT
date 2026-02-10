package main.backend.logic;

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;

public class StrategyEvaluator {
    private boolean isDone = false;
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
                if (isDone) break;
            }
        }
    }

    private void executeAssignment(AssignmentNode node, MinionContext ctx) {
        String name = node.getIdentifier();

        // ห้ามแก้ไขค่าตัวแปรระบบ
        if (isSpecialVariable(name)) return;

        long value = evaluateExpression(node.getExpression(), ctx);

        // มอบหน้าที่ให้ MinionContext จัดการ (เช็ค Global/Local เอง)
        ctx.setVariable(name, value);
    }

    private long evaluateExpression(ExpressionNode expr, MinionContext ctx) {
        try {
            // แก้ไข: เรียกใช้ evaluate() ของ Node โดยตรง
            // ให้ VariableNode ไปดึงค่าจาก MinionContext เอง (ซึ่งแก้เรื่อง double/long ไว้แล้ว)
            // ให้ BinaryOpNode ไปคำนวณเลขเอง (รวมถึง ^ ที่เพิ่มไปแล้ว)
            return expr.evaluate(ctx);
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isSpecialVariable(String name) {
        // รายชื่อตัวแปรที่ห้าม Assign ค่าทับ
        return name.equals("row") || name.equals("col") || name.equals("Budget") ||
                name.equals("int") || name.equals("maxbudget") || name.equals("random") ||
                name.equals("ally") || name.equals("opponent") || name.equals("nearby");
    }

    // --- Logic การคำนวณข้อมูล (Info Expressions) ---
    // ถูกเรียกใช้จาก InfoExpressionNode.evaluate -> MinionContext -> StrategyEvaluator
    public static long calculateInfo(MinionContext ctx, String type, String direction) {
        GameState gs = ctx.getGameState();
        Minion me = ctx.getMinion();

        if ("nearby".equals(type)) {
            return calculateNearby(gs, me, direction);
        } else if ("ally".equals(type)) {
            return calculateClosest(gs, me, true);
        } else if ("opponent".equals(type)) {
            return calculateClosest(gs, me, false);
        }
        return 0;
    }

    private static long calculateNearby(GameState gs, Minion me, String direction) {
        int r = me.getRow();
        int c = me.getCol();
        int dist = 0;

        while (true) {
            int[] next = gs.getNeighbor(r, c, direction);
            r = next[0];
            c = next[1];
            dist++;

            if (!gs.isValidHex(r, c)) return 0;

            Hex h = gs.getHex(r, c);
            if (h.getOccupant() != null) {
                Minion target = h.getOccupant();
                // สูตร: 100x + 10y + z
                long x = String.valueOf(target.getHp()).length();
                long y = String.valueOf(target.getDefense()).length();
                long z = dist;
                long val = 100 * x + 10 * y + z;
                return (target.getOwner() == me.getOwner()) ? -val : val;
            }
        }
    }

    private static long calculateClosest(GameState gs, Minion me, boolean findAlly) {
        long bestValue = 0;
        int minDistance = Integer.MAX_VALUE;
        String[] directions = {null, "up", "upright", "downright", "down", "downleft", "upleft"};

        for (int dir = 1; dir <= 6; dir++) {
            int r = me.getRow();
            int c = me.getCol();
            int dist = 0;

            while (true) {
                int[] next = gs.getNeighbor(r, c, directions[dir]);
                r = next[0];
                c = next[1];
                dist++;

                if (!gs.isValidHex(r, c)) break;

                Hex h = gs.getHex(r, c);
                if (h != null && h.getOccupant() != null) {
                    Minion target = h.getOccupant();
                    boolean isAlly = (target.getOwner() == me.getOwner());

                    if (isAlly == findAlly) {
                        if (dist < minDistance) {
                            minDistance = dist;
                            bestValue = (long) dist * 10 + dir;
                        }
                    }
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
            if (player.spend(1)) {
                gameState.moveMinion(minion, node.getDirection());
                this.isDone = true;
            } else {
                this.isDone = true;
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
                    long damage = Math.max(1, expenditure - defense);

                    target.takeDamage((int) damage);
                    if (!target.isAlive()) {
                        targetHex.setOccupant(null);
                        // GameState.checkWinner() will handle cleaning up later or updated implicitly
                    }
                }
                this.isDone = true;
            }
        }
    }

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
}