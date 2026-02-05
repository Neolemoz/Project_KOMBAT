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
}