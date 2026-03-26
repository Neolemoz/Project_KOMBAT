package com.kombat.strategy.ast;

public final class InfoExpression extends Expression {
    private final String type;
    private final String direction;

    public InfoExpression(String type, String direction) {
        this.type = type;
        this.direction = direction;
    }

    public String getType() {
        return type;
    }

    public String getDirection() {
        return direction;
    }
}
