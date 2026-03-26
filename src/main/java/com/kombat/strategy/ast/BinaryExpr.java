package com.kombat.strategy.ast;

import com.kombat.strategy.tokenizer.TokenType;

import java.util.Objects;

public final class BinaryExpr extends Expression {
    private final Expression left;
    private final TokenType operator;
    private final Expression right;

    public BinaryExpr(Expression left, TokenType operator, Expression right) {
        this.left = Objects.requireNonNull(left, "left must not be null");
        this.operator = Objects.requireNonNull(operator, "operator must not be null");
        this.right = Objects.requireNonNull(right, "right must not be null");
    }

    public Expression getLeft() {
        return left;
    }

    public TokenType getOperator() {
        return operator;
    }

    public Expression getRight() {
        return right;
    }
}
