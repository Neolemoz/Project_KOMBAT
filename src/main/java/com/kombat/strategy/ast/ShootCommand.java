package com.kombat.strategy.ast;

import java.util.Objects;

public final class ShootCommand extends Statement {
    private final String direction;
    private final Expression expression;

    public ShootCommand(String direction, Expression expression) {
        this.direction = Objects.requireNonNull(direction, "direction must not be null");
        this.expression = Objects.requireNonNull(expression, "expression must not be null");
    }

    public String getDirection() {
        return direction;
    }

    public Expression getExpression() {
        return expression;
    }
}
