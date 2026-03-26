package com.kombat.strategy.ast;

import java.util.Objects;

public final class AssignmentStatement extends Statement {
    private final String identifier;
    private final Expression expression;

    public AssignmentStatement(String identifier, Expression expression) {
        this.identifier = Objects.requireNonNull(identifier, "identifier must not be null");
        this.expression = Objects.requireNonNull(expression, "expression must not be null");
    }

    public String getIdentifier() {
        return identifier;
    }

    public Expression getExpression() {
        return expression;
    }
}
