import main.backend.model

public class StrategyEvaluator {
    private boolean isDone = false; // ตัวแปรสำหรับจบเทิร์นเมื่อเจอคำสั่ง done หรือ error

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
        }
    }

    // --- ส่วน Logic ของ Loop ---
    private void executeWhile(WhileStatementNode node, MinionContext ctx) {
        int counter = 0;
        // ป้องกัน Loop ไม่สิ้นสุด: สูงสุด 10,000 รอบ
        // เรียกใช้ evaluateExpression ที่ยุบรวมเข้ามาด้านล่าง
        while (evaluateExpression(node.condition, ctx) > 0 && counter < 10000 && !isDone) {
            execute(node.body, ctx);
            counter++;
        }
    }

    // --- ส่วน Logic ของ Action (Move, Shoot, Done) ---
    private void executeAction(ActionCommandNode node, MinionContext ctx) {
        String action = node.getActionType();
        if ("done".equals(action)) {
            this.isDone = true; //
            return;
        }

        Player p = ctx.getMinion().getOwner();

        if ("move".equals(action)) {
            // move ใช้ 1 budget เสมอ แม้เดินไม่ได้
            if (p.spend(1)) {
                ctx.getGameState().moveMinion(ctx.getMinion(), node.getDirection());
            } else {
                this.isDone = true; // เงินไม่พอให้หยุดเทิร์น
            }
        }
        // อย่าลืมใส่ Logic shoot ที่นี่ตามที่คุยกันก่อนหน้านี้
    }

    // --- ส่วนที่ยุบรวมเข้ามาจาก evaluateExpression.java ---
    private long evaluateExpression(ExpressionNode expr, MinionContext ctx) {
        // ดำเนินการทางคณิตศาสตร์แบบ Long
        // ถ้ามีการหารด้วย 0 ให้จบการประมวลผลทันที
        try {
            return expr.evaluate(ctx);
        } catch (ArithmeticException e) {
            this.isDone = true; // สั่งจบการทำงานของ Evaluator ทันที
            return 0;
        }
    }

    // ต้องมี method executeIf และ executeAssignment ด้วย (ตามโครงสร้าง execute ด้านบน)
    private void executeIf(IfStatementNode node, MinionContext ctx) {
        if (evaluateExpression(node.condition, ctx) > 0) {
            execute(node.thenBlock, ctx);
        } else if (node.elseBlock != null) {
            execute(node.elseBlock, ctx);
        }
    }

    private void executeAssignment(AssignmentNode node, MinionContext ctx) {
        long value = evaluateExpression(node.expression, ctx);
        ctx.setVariable(node.identifier, value);
    }
}