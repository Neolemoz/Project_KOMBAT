package main.backend.logic;

public class BinaryOpNode implements ExpressionNode {
    private ExpressionNode left, right;
    private String operator;

    public BinaryOpNode(ExpressionNode left, String operator, ExpressionNode right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public ExpressionNode getLeft() { return left; }
    public ExpressionNode getRight() { return right; }
    public String getOperator() { return operator; }

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
            case "^": return powLong(l, r);
            default: return 0;
        }
    }

    private long powLong(long base, long exponent) {
        if (exponent < 0) {
            return 0;
        }

        long result = 1L;
        long factor = base;
        long power = exponent;
        while (power > 0) {
            if ((power & 1L) == 1L) {
                result *= factor;
            }
            power >>= 1;
            if (power > 0) {
                factor *= factor;
            }
        }
        return result;
    }
}
