package main.backend.logic;

public class WhileStatementNode implements Node {
    private ExpressionNode condition;
    private Node body;

    public WhileStatementNode(ExpressionNode condition, Node body) {
        this.condition = condition;
        this.body = body;
    }
    public ExpressionNode getCondition() { return condition; }
    public Node getBody() { return body; }
}