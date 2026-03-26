package com.kombat.strategy.tokenizer;

import java.util.Objects;

public final class Token {
    private final TokenType type;
    private final String lexeme;
    private final int position;

    public Token(TokenType type, String lexeme, int position) {
        this.type = Objects.requireNonNull(type, "type must not be null");
        this.lexeme = lexeme == null ? "" : lexeme;
        this.position = position;
    }

    public TokenType getType() {
        return type;
    }

    public String getLexeme() {
        return lexeme;
    }

    public int getPosition() {
        return position;
    }

    @Override
    public String toString() {
        return "Token{" +
                "type=" + type +
                ", lexeme='" + lexeme + '\'' +
                ", position=" + position +
                '}';
    }
}
