package main.backend.logic;

public class BinaryOpNode implements ExpressionNode {
    private ExpressionNode left, right;
    private String operator;

    public BinaryOpNode(ExpressionNode left, String operator, ExpressionNode right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    @Override
    public long evaluate(MinionContext ctx) {
        long l = left.evaluate(ctx);
        long r = right.evaluate(ctx);
        switch (operator) {
            case "+": return l + r;
            case "-": return l - r;
            case "*": return l * r;
            case "/": if (r == 0) throw new ArithmeticException("Division by zero"); return l / r;
            case "%": if (r == 0) throw new ArithmeticException("Division by zero"); return l % r;
            case "^": return (long) Math.pow(l, r);
            default: return 0;
        }
    }
}
