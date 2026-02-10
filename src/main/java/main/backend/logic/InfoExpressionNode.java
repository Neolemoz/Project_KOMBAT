package main.backend.logic;

import main.backend.model.MinionContext;

public class InfoExpressionNode extends ExpressionNode {
    private String type; // "ally", "opponent", "nearby"
    private String direction; // only for "nearby", null otherwise

    public InfoExpressionNode(String type, String direction) {
        this.type = type;
        this.direction = direction;
    }

    @Override
    public long evaluate(MinionContext ctx) {
        // การคำนวณจะถูกส่งไปให้ StrategyEvaluator หรือคำนวณผ่าน Context
        // ในที่นี้เราจะให้ Context หรือ Evaluator จัดการ
        return ctx.evaluateInfo(type, direction);
    }
}