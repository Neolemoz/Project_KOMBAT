package main.backend.logic;
import java.util.List;

public class BlockNode implements Node {
    private List<Node> statements;
    public BlockNode(List<Node> statements) { this.statements = statements; }
    public List<Node> getStatements() { return statements; }
}