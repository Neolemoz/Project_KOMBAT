package com.kombat.strategy.tokenizer;

public enum TokenType {
    NUMBER,
    IDENTIFIER,

    PLUS,
    MINUS,
    MUL,
    DIV,
    MOD,
    POW,
    ASSIGN,

    LPAREN,
    RPAREN,
    LBRACE,
    RBRACE,

    IF,
    THEN,
    ELSE,
    WHILE,

    MOVE,
    SHOOT,
    DONE,

    DIRECTION,
    ALLY,
    OPPONENT,
    NEARBY,

    EOF
}
