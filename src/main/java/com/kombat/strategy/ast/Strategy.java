package com.kombat.strategy.ast;

import java.util.List;
import java.util.Objects;

public final class Strategy implements Node {
    private final List<Statement> statements;

    public Strategy(List<Statement> statements) {
        this.statements = List.copyOf(Objects.requireNonNull(statements, "statements must not be null"));
    }

    public List<Statement> getStatements() {
        return statements;
    }
}
