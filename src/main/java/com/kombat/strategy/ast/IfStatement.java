package com.kombat.strategy.ast;

import java.util.Objects;

public final class IfStatement extends Statement {
    private final Expression condition;
    private final Statement thenStatement;
    private final Statement elseStatement;

    public IfStatement(Expression condition, Statement thenStatement, Statement elseStatement) {
        this.condition = Objects.requireNonNull(condition, "condition must not be null");
        this.thenStatement = Objects.requireNonNull(thenStatement, "thenStatement must not be null");
        this.elseStatement = Objects.requireNonNull(elseStatement, "elseStatement must not be null");
    }

    public Expression getCondition() {
        return condition;
    }

    public Statement getThenStatement() {
        return thenStatement;
    }

    public Statement getElseStatement() {
        return elseStatement;
    }
}
