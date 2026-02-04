public class StrategyEvaluator {
    private boolean isDone = false;

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
        // จัดการ Node ประเภทอื่นๆ ต่อไป...
    }

    private void executeWhile(WhileStatementNode node, MinionContext ctx) {
        int counter = 0;
        // ป้องกัน Loop ไม่สิ้นสุด: สูงสุด 10,000 รอบ [cite: 240]
        while (evaluateExpression(node.condition, ctx) > 0 && counter < 10000 && !isDone) { [cite: 237, 240]
            execute(node.body, ctx);
            counter++;
        }
    }

    private void executeAction(ActionCommandNode node, MinionContext ctx) {
        String action = node.getActionType();
        if ("done".equals(action)) {
            this.isDone = true; [cite: 212]
            return;
        }

        Player p = ctx.getMinion().getOwner();

        if ("move".equals(action)) {
            // move ใช้ 1 budget เสมอ แม้เดินไม่ได้ [cite: 217]
            if (p.spend(1)) {
                ctx.getGameState().moveMinion(ctx.getMinion(), node.getDirection()); [cite: 215]
            } else {
                this.isDone = true; // เงินไม่พอให้หยุดเทิร์น [cite: 218]
            }
        }
        // เพิ่ม logic ของ shoot และการคำนวณ Damage [cite: 227]
    }
}