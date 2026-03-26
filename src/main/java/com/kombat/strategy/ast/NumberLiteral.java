package com.kombat.strategy.ast;

public final class NumberLiteral extends Expression {
    private final double value;

    public NumberLiteral(double value) {
        this.value = value;
    }

    public double getValue() {
        return value;
    }
}
