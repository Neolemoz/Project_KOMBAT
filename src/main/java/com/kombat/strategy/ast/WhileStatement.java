package com.kombat.strategy.ast;

import java.util.Objects;

public final class WhileStatement extends Statement {
    private final Expression condition;
    private final Statement body;

    public WhileStatement(Expression condition, Statement body) {
        this.condition = Objects.requireNonNull(condition, "condition must not be null");
        this.body = Objects.requireNonNull(body, "body must not be null");
    }

    public Expression getCondition() {
        return condition;
    }

    public Statement getBody() {
        return body;
    }
}
