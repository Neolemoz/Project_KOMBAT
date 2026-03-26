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
            // โดยดู Token ถัดไปว่าใช่เครื่องหมาย = หรือไม่
            if (pos + 1 < tokens.size() && tokens.get(pos + 1).equals("=")) {
                return parseAssignment();
            } else {
                return parseAction();
            }
        }
    }

    // --- Parsing Logic สำหรับโครงสร้าง Control Flow ---

    private Node parseIf() {
        consume("if");
        consume("(");
        ExpressionNode condition = parseExpression();
        consume(")");
        if (pos < tokens.size() && peek().equals("then")) consume("then"); // C-01 fix
        Node thenBlock = parseStatement();
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
        if (!action.equals("done") && !action.equals("move") && !action.equals("shoot")) {
            throw new RuntimeException("Unknown command: " + action);
        }

        String direction = "up";   // default
        ExpressionNode expr = null; // สำหรับ shoot

        // ถ้าไม่ใช่ done อาจจะมีทิศทาง (เช่น move up)
        if (!action.equals("done") && pos < tokens.size() && !isReserved(peek())) {
            String next = peek();
            // เช็คว่าเป็นทิศทางหรือไม่
            if (next.matches("up|down|upleft|upright|downleft|downright|right|left")) {
                direction = consume();
                if (direction.equals("right")) direction = "upright"; // alias fix
                if (direction.equals("left"))  direction = "upleft";  // alias fix
            }
        }

        // ถ้าเป็น shoot ต้องรับค่าพลังงานด้วย (เช่น shoot up 100)
        // ตาม Grammar: shoot Direction Expression
        if (action.equals("shoot")) {
            expr = parseExpression();
        }

        return new ActionCommandNode(action, direction, expr);
    }

    // --- Expression Parsing Hierarchy (แก้ไขใหม่ตาม Spec) ---

    private ExpressionNode parseExpression() {
        return parseAdditive();
    }

    // Level 2: Addition/Subtraction (+, -)
    private ExpressionNode parseAdditive() {
        ExpressionNode left = parseTerm();

        while (pos < tokens.size() && (peek().equals("+") || peek().equals("-"))) {
            String op = consume();
            ExpressionNode right = parseTerm();
            left = new BinaryOpNode(left, op, right);
        }
        return left;
    }

    // Level 3: Multiplication/Division/Modulo (*, /, %)
    private ExpressionNode parseTerm() {
        ExpressionNode left = parseFactor();

        while (pos < tokens.size() && (peek().equals("*") || peek().equals("/") || peek().equals("%"))) {
            String op = consume();
            ExpressionNode right = parseFactor();
            left = new BinaryOpNode(left, op, right);
        }
        return left;
    }

    // Level 4: Power (^) - ความสำคัญสูงสุดใน Operator ปกติ
    // ทำงานแบบ Right-associative (ขวาไปซ้าย) เช่น 2^3^2 = 2^(3^2)
    private ExpressionNode parseFactor() {
        ExpressionNode left = parsePower();

        if (pos < tokens.size() && peek().equals("^")) {
            String op = consume();
            ExpressionNode right = parseFactor(); // เรียกซ้ำ (Recursive) เพื่อให้ทำด้านขวาก่อน
            return new BinaryOpNode(left, op, right);
        }
        return left;
    }

    // Level 5: Atomic Values (Numbers, Variables, Parentheses, InfoCommands)
    // ตรงกับ Rule: Power -> <number> | <identifier> | (Expression) | InfoExpression
    private ExpressionNode parsePower() {
        String t = peek();

        // จัดการ InfoExpression (ally, opponent, nearby)
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

        // จัดการค่าทั่วไป
        t = consume();
        if (t.matches("\\d+")) {
            return new NumberNode(Long.parseLong(t));
        } else if (t.matches("[a-zA-Z][a-zA-Z0-9]*")) {
            return new VariableNode(t);
        } else if (t.equals("(")) { // รองรับวงเล็บ (Expression)
            ExpressionNode node = parseExpression(); // กลับไปเรียก Level 1
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
        // ใช้สำหรับเช็คว่าคำถัดไปเป็น command ใหม่หรือ control flow หรือไม่
        // เพื่อแยกแยะใน parseAction ว่าจบคำสั่ง move/shoot หรือยัง
        return t.equals("if") || t.equals("else") || t.equals("then") || t.equals("while") || t.equals("}") || t.equals("done") || t.equals("move") || t.equals("shoot"); // C-02 L-05 fix
    }
}
