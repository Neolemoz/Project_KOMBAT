package com.kombat.strategy.ast;

import com.kombat.strategy.tokenizer.TokenType;

import java.util.Objects;

public final class UnaryExpr extends Expression {
    private final TokenType operator;
    private final Expression expression;

    public UnaryExpr(TokenType operator, Expression expression) {
        this.operator = Objects.requireNonNull(operator, "operator must not be null");
        this.expression = Objects.requireNonNull(expression, "expression must not be null");
    }

    public TokenType getOperator() {
        return operator;
    }

    public Expression getExpression() {
        return expression;
    }
}
