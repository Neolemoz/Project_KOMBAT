package com.kombat.strategy.tokenizer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class Lexer {
    private static final Map<String, TokenType> KEYWORDS = Map.ofEntries(
            Map.entry("if", TokenType.IF),
            Map.entry("then", TokenType.THEN),
            Map.entry("else", TokenType.ELSE),
            Map.entry("while", TokenType.WHILE),
            Map.entry("move", TokenType.MOVE),
            Map.entry("shoot", TokenType.SHOOT),
            Map.entry("done", TokenType.DONE),
            Map.entry("up", TokenType.DIRECTION),
            Map.entry("down", TokenType.DIRECTION),
            Map.entry("upleft", TokenType.DIRECTION),
            Map.entry("upright", TokenType.DIRECTION),
            Map.entry("downleft", TokenType.DIRECTION),
            Map.entry("downright", TokenType.DIRECTION),
            Map.entry("ally", TokenType.ALLY),
            Map.entry("opponent", TokenType.OPPONENT),
            Map.entry("nearby", TokenType.NEARBY)
    );

    private final String source;
    private final List<Token> tokens = new ArrayList<>();
    private int index = 0;

    public Lexer(String source) {
        this.source = source == null ? "" : source;
    }

    public List<Token> tokenize() {
        while (!isAtEnd()) {
            char current = peek();
            int start = index;

            if (Character.isWhitespace(current)) {
                advance();
                continue;
            }

            if (current == '#') {
                skipComment();
                continue;
            }

            if (Character.isDigit(current)) {
                tokenizeNumber();
                continue;
            }

            if (Character.isLetter(current) || current == '_') {
                tokenizeIdentifier();
                continue;
            }

            switch (advance()) {
                case '+' -> tokens.add(new Token(TokenType.PLUS, "+", start));
                case '-' -> tokens.add(new Token(TokenType.MINUS, "-", start));
                case '*' -> tokens.add(new Token(TokenType.MUL, "*", start));
                case '/' -> tokens.add(new Token(TokenType.DIV, "/", start));
                case '%' -> tokens.add(new Token(TokenType.MOD, "%", start));
                case '^' -> tokens.add(new Token(TokenType.POW, "^", start));
                case '=' -> tokens.add(new Token(TokenType.ASSIGN, "=", start));
                case '(' -> tokens.add(new Token(TokenType.LPAREN, "(", start));
                case ')' -> tokens.add(new Token(TokenType.RPAREN, ")", start));
                case '{' -> tokens.add(new Token(TokenType.LBRACE, "{", start));
                case '}' -> tokens.add(new Token(TokenType.RBRACE, "}", start));
                default -> throw new IllegalArgumentException(
                        "Unexpected character '" + current + "' at position " + start
                );
            }
        }

        tokens.add(new Token(TokenType.EOF, "", index));
        return List.copyOf(tokens);
    }

    private void tokenizeNumber() {
        int start = index;
        while (!isAtEnd() && Character.isDigit(peek())) {
            advance();
        }

        if (!isAtEnd() && peek() == '.' && hasDigitAfterDecimal()) {
            advance();
            while (!isAtEnd() && Character.isDigit(peek())) {
                advance();
            }
        }

        tokens.add(new Token(TokenType.NUMBER, source.substring(start, index), start));
    }

    private void tokenizeIdentifier() {
        int start = index;
        while (!isAtEnd() && (Character.isLetterOrDigit(peek()) || peek() == '_')) {
            advance();
        }

        String lexeme = source.substring(start, index);
        TokenType type = KEYWORDS.getOrDefault(lexeme.toLowerCase(), TokenType.IDENTIFIER);
        tokens.add(new Token(type, lexeme, start));
    }

    private boolean hasDigitAfterDecimal() {
        return index + 1 < source.length() && Character.isDigit(source.charAt(index + 1));
    }

    private void skipComment() {
        while (!isAtEnd() && peek() != '\n') {
            advance();
        }
    }

    private boolean isAtEnd() {
        return index >= source.length();
    }

    private char peek() {
        return source.charAt(index);
    }

    private char advance() {
        return source.charAt(index++);
    }
}
