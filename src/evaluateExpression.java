private long evaluateExpression(ExpressionNode expr, MinionContext ctx) {
    // ดำเนินการทางคณิตศาสตร์แบบ Long [cite: 137]
    // ถ้ามีการหารด้วย 0 ให้จบการประมวลผลทันที [cite: 234]
    try {
        // ตัวอย่าง logic การคำนวณค่าจาก AST
        return expr.evaluate(ctx);
    } catch (ArithmeticException e) {
        this.isDone = true;
        return 0;
    }
}