package main.backend.logic;

public class VariableNode implements ExpressionNode {
    private String name;

    public VariableNode(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public long evaluate(MinionContext ctx) {
        return ctx.getVariable(name);
    }
}