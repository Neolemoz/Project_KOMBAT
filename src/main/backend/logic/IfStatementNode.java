package main.backend.logic;

public class IfStatementNode implements Node {
    private ExpressionNode condition;
    private Node thenBlock;
    private Node elseBlock;

    public IfStatementNode(ExpressionNode condition, Node thenBlock, Node elseBlock) {
        this.condition = condition;
        this.thenBlock = thenBlock;
        this.elseBlock = elseBlock;
    }
    // Getters
    public ExpressionNode getCondition() { return condition; }
    public Node getThenBlock() { return thenBlock; }
    public Node getElseBlock() { return elseBlock; }
}