package main.backend.logic;


public class InfoExpressionNode implements ExpressionNode {
    private String type;      // เก็บค่า "ally", "opponent", หรือ "nearby"
    private String direction; // เก็บทิศทาง เช่น "up", "down" (ถ้ามี)

    public InfoExpressionNode(String type, String direction) {
        this.type = type;
        this.direction = direction;
    }

    @Override
    public long evaluate(MinionContext ctx) {
        // ส่งไปคำนวณค่าจริงที่ MinionContext (เราจะไปแก้ Context ในขั้นตอนถัดไป)
        return ctx.evaluateInfo(type, direction);
    }

    public String getType() { return type; }
    public String getDirection() { return direction; }
}