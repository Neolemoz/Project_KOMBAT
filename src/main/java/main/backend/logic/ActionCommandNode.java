package main.backend.logic;

public class ActionCommandNode implements Node {
    private String actionType; // "move", "shoot", "done"
    private String direction;  // "up", "down", etc. (ถ้ามี)
    private ExpressionNode expression; // สำหรับ shoot ที่ต้องมีพลังงาน

    public ActionCommandNode(String actionType, String direction, ExpressionNode expression) {
        this.actionType = actionType;
        this.direction = direction;
        this.expression = expression;
    }

    public String getActionType() {
        return actionType;
    }
    public String getDirection() {
        return direction;
    }
    public ExpressionNode getExpression() {
        return expression;
    }
}