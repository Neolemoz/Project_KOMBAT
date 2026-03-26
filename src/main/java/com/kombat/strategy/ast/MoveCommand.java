package com.kombat.strategy.ast;

import java.util.Objects;

public final class MoveCommand extends Statement {
    private final String direction;

    public MoveCommand(String direction) {
        this.direction = Objects.requireNonNull(direction, "direction must not be null");
    }

    public String getDirection() {
        return direction;
    }
}
