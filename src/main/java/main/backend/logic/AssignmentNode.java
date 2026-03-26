package main.backend.logic;

public class AssignmentNode implements Node {
    private String identifier;
    private ExpressionNode expression;

    public AssignmentNode(String identifier, ExpressionNode expression) {
        this.identifier = identifier;
        this.expression = expression;
    }
    public String getIdentifier() {
        return identifier;
    }
    public ExpressionNode getExpression() {
        return expression;
    }
}