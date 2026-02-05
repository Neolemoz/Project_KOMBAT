package main.backend.logic; // ตรวจสอบชื่อ Package

import java.util.ArrayList;
import java.util.List;

public class Parser {
    private List<String> tokens;
    private int pos = 0;

    public Parser(List<String> tokens) {
        this.tokens = tokens;
    }

    private String peek() {
        if (pos >= tokens.size()) return null;
        return tokens.get(pos);
    }

    private String consume() {
        if (pos >= tokens.size()) return null;
        return tokens.get(pos++);
    }

    // --- Parsing Logic ---

    public Node parse() {
        // สคริปต์คือ List ของ Statement
        List<Node> statements = new ArrayList<>();
        while (peek() != null) {
            statements.add(parseStatement());
        }
        return new BlockNode(statements); // คืนค่าเป็น Block ใหญ่สุด
    }

    private Node parseStatement() {
        String t = peek();
        if (t == null) return null;

        if (t.equals("if")) return parseIf();
        if (t.equals("while")) return parseWhile();
        if (t.equals("{")) return parseBlock();
        if (t.equals("move") || t.equals("shoot") || t.equals("done")) return parseCommand();

        // ถ้าไม่ใช่คำสั่งหลัก ให้ถือว่าเป็น Assignment (ตัวแปร = ค่า)
        return parseAssignment();
    }

    private Node parseIf() {
        consume(); // if
        consume(); // (
        ExpressionNode condition = parseExpression();
        consume(); // )
        consume(); // then
        Node thenBlock = parseStatement();
        Node elseBlock = null;
        if ("else".equals(peek())) {
            consume(); // else
            elseBlock = parseStatement();
        }
        return new IfStatementNode(condition, thenBlock, elseBlock);
    }

    private Node parseWhile() {
        consume(); // while
        consume(); // (
        ExpressionNode condition = parseExpression();
        consume(); // )
        Node body = parseStatement();
        return new WhileStatementNode(condition, body);
    }

    private Node parseBlock() {
        consume(); // {
        List<Node> stmts = new ArrayList<>();
        while (!"}".equals(peek()) && peek() != null) {
            stmts.add(parseStatement());
        }
        consume(); // }
        return new BlockNode(stmts);
    }

    private Node parseAssignment() {
        String identifier = consume();
        consume(); // =
        ExpressionNode expr = parseExpression();
        return new AssignmentNode(identifier, expr);
    }

    private Node parseCommand() {
        String cmd = consume(); // move, shoot, done
        if (cmd.equals("done")) {
            return new ActionCommandNode("done", null, null);
        }

        String dir = consume(); // direction
        ExpressionNode expr = null;

        if (cmd.equals("shoot")) {
            // shoot ต้องตามด้วย expression พลังงาน
            expr = parseExpression();
        }

        return new ActionCommandNode(cmd, dir, expr);
    }

    // --- Expression Parsing (Recursive Descent) ---
    // จัดการลำดับความสำคัญเครื่องหมาย: Term (+,-) -> Factor (*,/,%) -> Atom

    private ExpressionNode parseExpression() {
        ExpressionNode left = parseTerm();
        while (peek() != null && (peek().equals("+") || peek().equals("-"))) {
            String op = consume();
            ExpressionNode right = parseTerm();
            left = new BinaryOpNode(left, op, right);
        }
        return left;
    }

    private ExpressionNode parseTerm() {
        ExpressionNode left = parseFactor();
        while (peek() != null && (peek().equals("*") || peek().equals("/") || peek().equals("%"))) {
            String op = consume();
            ExpressionNode right = parseFactor();
            left = new BinaryOpNode(left, op, right);
        }
        return left;
    }

    private ExpressionNode parseFactor() {
        String t = peek();
        if (t.equals("(")) {
            consume();
            ExpressionNode expr = parseExpression();
            consume(); // )
            return expr;
        }
        try {
            long val = Long.parseLong(t);
            consume();
            return new NumberNode(val);
        } catch (NumberFormatException e) {
            // ถ้าไม่ใช่ตัวเลข ก็คือตัวแปร (Variable)
            String varName = consume();

            // กรณี nearby (sensor ที่ต้องการ direction)
            if (varName.equals("nearby")) {
                String dir = consume();
                // เพื่อความง่าย ให้ Nearby เป็น Variable พิเศษ หรือจะสร้าง NearbyNode ก็ได้
                // แต่ในที่นี้ผมจะให้ MinionContext จัดการโดยส่งเป็นชื่อ "nearby_up" ไปเลย
                return new VariableNode("nearby_" + dir); // ต้องไปแก้ MinionContext ให้รองรับ
            }

            return new VariableNode(varName);
        }
    }
}