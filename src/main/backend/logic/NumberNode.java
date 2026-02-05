package main.backend.logic;

public class NumberNode implements ExpressionNode {
    private long value;
    public NumberNode(long value) { this.value = value; }

    @Override
    public long evaluate(MinionContext ctx) { return value; }
}