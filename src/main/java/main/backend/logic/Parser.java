package main.backend.logic;

import java.util.ArrayList;
import java.util.List;

public class Parser {
    private List<String> tokens;
    private int pos = 0;

    public Parser(List<String> tokens) {
        this.tokens = tokens;
    }

    public Node parse() {
        // เริ่มต้น Parse คำสั่งทั้งหมดเป็น Block เดียว
        List<Node> statements = new ArrayList<>();
        while (pos < tokens.size()) {
            // หยุดถ้าเจอปีกกาปิดของ Block อื่น
            if (peek().equals("}")) break;
            statements.add(parseStatement());
        }
        return new BlockNode(statements);
    }

    private Node parseStatement() {
        String token = peek();

        if (token.equals("if")) {
            return parseIf();
        } else if (token.equals("while")) {
            return parseWhile();
        } else if (token.equals("{")) {
            return parseBlock();
        } else {
            // เช็คว่าเป็น Assignment (x = 5) หรือ Action (move up)
            if (pos + 1 < tokens.size() && tokens.get(pos + 1).equals("=")) {
                return parseAssignment();
            } else {
                return parseAction();
            }
        }
    }

    // --- Parsing Logic สำหรับโครงสร้างต่างๆ ---

    private Node parseIf() {
        consume("if");
        consume("(");
        ExpressionNode condition = parseExpression();
        consume(")");
        Node thenBlock = parseStatement(); // หรือ parseBlock() ก็ได้ถ้าบังคับใส่ {}
        Node elseBlock = null;
        if (pos < tokens.size() && peek().equals("else")) {
            consume("else");
            elseBlock = parseStatement();
        }
        return new IfStatementNode(condition, thenBlock, elseBlock);
    }

    private Node parseWhile() {
        consume("while");
        consume("(");
        ExpressionNode condition = parseExpression();
        consume(")");
        Node body = parseStatement();
        return new WhileStatementNode(condition, body);
    }

    private Node parseBlock() {
        consume("{");
        List<Node> stmts = new ArrayList<>();
        while (!peek().equals("}")) {
            stmts.add(parseStatement());
        }
        consume("}");
        return new BlockNode(stmts);
    }

    private Node parseAssignment() {
        String varName = consume(); // ชื่อตัวแปร
        consume("=");
        ExpressionNode expr = parseExpression();
        return new AssignmentNode(varName, expr);
    }

    private Node parseAction() {
        String action = consume(); // move, shoot, done
        String direction = "up";   // default
        ExpressionNode expr = null; // สำหรับ shoot

        // ถ้าไม่ใช่ done อาจจะมีทิศทาง
        if (!action.equals("done") && pos < tokens.size() && !isReserved(peek())) {
            // เช็คว่าเป็นทิศทางหรือไม่ (อย่างง่าย)
            String next = peek();
            if (next.matches("up|down|upleft|upright|downleft|downright")) {
                direction = consume();
            }
        }

        // ถ้าเป็น shoot ต้องรับค่าพลังงานด้วย (shoot up 100)
        if (action.equals("shoot")) {
            // ถ้า token ถัดไปเป็นตัวเลขหรือตัวแปร
            expr = parseExpression();
        }

        return new ActionCommandNode(action, direction, expr);
    }

    // --- Expression Parsing (อย่างง่าย: ไม่มีวงเล็บซ้อนในสมการเลข) ---
    // ถ้าต้องการสมบูรณ์กว่านี้ต้องทำ Shunting-yard หรือ Recursive Descent แยก Level
    private ExpressionNode parseExpression() {
        ExpressionNode left = parseTerm();

        while (pos < tokens.size() && (peek().equals("+") || peek().equals("-") || peek().equals("*") || peek().equals("/") || peek().equals("%") || peek().equals(">") || peek().equals("<"))) {
            String op = consume();
            ExpressionNode right = parseTerm();
            left = new BinaryOpNode(left, op, right);
        }
        return left;
    }

    private ExpressionNode parseTerm() {
        String t = peek();

        // --- เพิ่มส่วนนี้สำหรับ InfoExpression ---
        if (t.equals("ally")) {
            consume();
            return new InfoExpressionNode("ally", null);
        } else if (t.equals("opponent")) {
            consume();
            return new InfoExpressionNode("opponent", null);
        } else if (t.equals("nearby")) {
            consume();
            String dir = consume(); // ต้องตามด้วยทิศทางเสมอ เช่น nearby up
            return new InfoExpressionNode("nearby", dir);
        }
        // -------------------------------------

        // Logic เดิม
        t = consume();
        if (t.matches("\\d+")) {
            return new NumberNode(Long.parseLong(t));
        } else if (t.matches("[a-zA-Z_][a-zA-Z0-9_]*")) {
            return new VariableNode(t);
        } else if (t.equals("(")) { // รองรับวงเล็บ (Expression)
            ExpressionNode node = parseExpression();
            consume(")");
            return node;
        }
        throw new RuntimeException("Unexpected token: " + t);
    }

    // --- Helpers ---
    private String peek() {
        if (pos >= tokens.size()) return "";
        return tokens.get(pos);
    }

    private String consume() {
        String t = tokens.get(pos);
        pos++;
        return t;
    }

    private void consume(String expected) {
        if (!consume().equals(expected)) {
            throw new RuntimeException("Expected " + expected);
        }
    }

    private boolean isReserved(String t) {
        return t.equals("if") || t.equals("else") || t.equals("while") || t.equals("}") || t.equals("done");
    }
}