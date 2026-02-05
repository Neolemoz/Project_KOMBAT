package main.backend.logic; // ตรวจสอบชื่อ Package

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;

public class StrategyEvaluator {
    private boolean isDone = false; // ตัวแปรสำหรับจบเทิร์น (เมื่อเจอคำสั่ง done หรือเงินหมด)
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

                    // สูตร Damage: max(0, h - max(1, x - d))
                    long defense = target.getDefense();
                    long damage = Math.max(0, expenditure - defense); // สูตรง่ายๆ หรือใช้สูตรเต็มตามโจทย์
                    // ถ้าตามโจทย์เป๊ะ: damage = h - max(1, x - d) -> ลด HP ตามผลลัพธ์
                    long effectiveDamage = Math.max(1, expenditure - defense);
                    target.takeDamage((int) effectiveDamage);

                    if (!target.isAlive()) {
                        // ลบออกจากกระดานและ Player
                        targetHex.setOccupant(null);
                        target.getOwner().removeMinion(target);
                    }
                }
            } else {
                // เงินไม่พอ shoot ถือเป็น no-op (แต่ในบาง implementation อาจให้จบเทิร์นเลย)
            }
        }
    }

    private void executeAssignment(AssignmentNode node, MinionContext ctx) {
        long value = evaluateExpression(node.getExpression(), ctx);
        ctx.setVariable(node.getIdentifier(), value);
    }

    // --- ส่วนคำนวณนิพจน์ (Expression) ---

    private long evaluateExpression(Node expr, MinionContext ctx) {
        // ต้องตรวจสอบว่าเป็น Node ประเภทไหน (ตัวเลข, ตัวแปร, หรือ Operator)
        // เนื่องจาก Node อาจเป็น Abstract Class คุณต้อง Cast ตามชนิดจริงที่ Parser สร้างมา
        // ตัวอย่าง Logic คร่าวๆ (ขึ้นอยู่กับโครงสร้าง Node ของคุณ):

        /* if (expr instanceof NumberNode) return ((NumberNode) expr).getValue();
        if (expr instanceof VariableNode) return ctx.getVariable(((VariableNode) expr).getName());
        if (expr instanceof BinaryOpNode) {
            long left = evaluateExpression(((BinaryOpNode) expr).getLeft(), ctx);
            long right = evaluateExpression(((BinaryOpNode) expr).getRight(), ctx);
            String op = ((BinaryOpNode) expr).getOperator();
            switch (op) {
                case "+": return left + right;
                case "-": return left - right;
                case "*": return left * right;
                case "/": return right == 0 ? 0 : left / right; // กันหาร 0
                case "%": return right == 0 ? 0 : left % right;
                case "^": return (long) Math.pow(left, right);
                default: return 0;
            }
        }
        */

        // หาก Node มีเมธอด evaluate() อยู่แล้ว ให้เรียกใช้ได้เลย
        // return expr.evaluate(ctx);
        return 0; // แก้เป็น Logic จริงของคุณ
    }
}