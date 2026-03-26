package com.kombat.strategy.ast;

import java.util.Objects;

public final class Variable extends Expression {
    private final String name;

    public Variable(String name) {
        this.name = Objects.requireNonNull(name, "name must not be null");
    }

    public String getName() {
        return name;
    }
}
