public class StrategyParser {
    private List<String> tokens;
    private int pos = 0;

    // ดึง Token ปัจจุบัน
    private String peek() {
        return pos < tokens.size() ? tokens.get(pos) : null;
    }

    // เลื่อนไปยัง Token ถัดไป
    private String consume() {
        return tokens.get(pos++);
    }

    // ฟังก์ชันหลักในการแกะ Statement [cite: 116]
    public Node parseStatement() {
        String token = peek();
        if ("if".equals(token)) return parseIf(); [cite: 128]
        if ("while".equals(token)) return parseWhile(); [cite: 129]
        if ("{".equals(token)) return parseBlock(); [cite: 126]
        return parseCommand(); [cite: 117]
    }

    // ตัวอย่างการแกะคำสั่ง move [cite: 124]
    private Node parseMove() {
        consume(); // consume 'move'
        String direction = consume(); // รับทิศทาง (up, down, etc.) [cite: 127]
        return new MoveNode(direction);
    }
}