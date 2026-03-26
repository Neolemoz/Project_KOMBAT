package com.kombat.strategy.parser;

import com.kombat.strategy.ast.AssignmentStatement;
import com.kombat.strategy.ast.BinaryExpr;
import com.kombat.strategy.ast.BlockStatement;
import com.kombat.strategy.ast.DoneCommand;
import com.kombat.strategy.ast.Expression;
import com.kombat.strategy.ast.IfStatement;
import com.kombat.strategy.ast.InfoExpression;
import com.kombat.strategy.ast.MoveCommand;
import com.kombat.strategy.ast.NumberLiteral;
import com.kombat.strategy.ast.ShootCommand;
import com.kombat.strategy.ast.Statement;
import com.kombat.strategy.ast.Strategy;
import com.kombat.strategy.ast.UnaryExpr;
import com.kombat.strategy.ast.Variable;
import com.kombat.strategy.ast.WhileStatement;
import com.kombat.strategy.tokenizer.Token;
import com.kombat.strategy.tokenizer.TokenType;

import java.util.ArrayList;
import java.util.List;

public final class Parser {
    private final List<Token> tokens;
    private int current = 0;

    public Parser(List<Token> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            throw new ParseException("Token stream must not be empty");
        }
        this.tokens = List.copyOf(tokens);
    }

    public Strategy parseStrategy() {
        List<Statement> statements = new ArrayList<>();
        while (!isAtEnd()) {
            statements.add(parseStatement());
        }
        return new Strategy(statements);
    }

    public Statement parseStatement() {
        if (match(TokenType.LBRACE)) {
            return parseBlockStatement();
        }
        if (match(TokenType.IF)) {
            return parseIfStatement();
        }
        if (match(TokenType.WHILE)) {
            return parseWhileStatement();
        }
        if (match(TokenType.MOVE)) {
            return parseMoveCommand();
        }
        if (match(TokenType.SHOOT)) {
            return parseShootCommand();
        }
        if (match(TokenType.DONE)) {
            return new DoneCommand();
        }
        if (check(TokenType.IDENTIFIER) && checkNext(TokenType.ASSIGN)) {
            return parseAssignmentStatement();
        }

        throw error(peek(), "Expected statement");
    }

    public Expression parseExpression() {
        return parseAdditive();
    }

    public Expression parseTerm() {
        Expression expression = parsePower();
        while (match(TokenType.MUL, TokenType.DIV, TokenType.MOD)) {
            Token operator = previous();
            Expression right = parsePower();
            expression = new BinaryExpr(expression, operator.getType(), right);
        }
        return expression;
    }

    public Expression parseFactor() {
        if (match(TokenType.PLUS, TokenType.MINUS)) {
            Token operator = previous();
            return new UnaryExpr(operator.getType(), parseFactor());
        }
        return parsePrimary();
    }

    public Expression parsePrimary() {
        if (match(TokenType.NUMBER)) {
            Token token = previous();
            return new NumberLiteral(Double.parseDouble(token.getLexeme()));
        }

        if (match(TokenType.IDENTIFIER)) {
            return new Variable(previous().getLexeme());
        }

        if (match(TokenType.ALLY, TokenType.OPPONENT, TokenType.NEARBY)) {
            Token info = previous();
            String direction = null;
            if (match(TokenType.DIRECTION)) {
                direction = previous().getLexeme();
            }
            return new InfoExpression(info.getLexeme().toLowerCase(), direction);
        }

        if (match(TokenType.LPAREN)) {
            Expression expression = parseExpression();
            consume(TokenType.RPAREN, "Expected ')' after expression");
            return expression;
        }

        throw error(peek(), "Expected expression");
    }

    private Statement parseBlockStatement() {
        List<Statement> statements = new ArrayList<>();
        while (!check(TokenType.RBRACE) && !isAtEnd()) {
            statements.add(parseStatement());
        }
        consume(TokenType.RBRACE, "Expected '}' after block");
        return new BlockStatement(statements);
    }

    private Statement parseIfStatement() {
        consume(TokenType.LPAREN, "Expected '(' after 'if'");
        Expression condition = parseExpression();
        consume(TokenType.RPAREN, "Expected ')' after if condition");
        consume(TokenType.THEN, "Expected 'then' after if condition");
        Statement thenStatement = parseStatement();
        consume(TokenType.ELSE, "Expected 'else' after then branch");
        Statement elseStatement = parseStatement();
        return new IfStatement(condition, thenStatement, elseStatement);
    }

    private Statement parseWhileStatement() {
        consume(TokenType.LPAREN, "Expected '(' after 'while'");
        Expression condition = parseExpression();
        consume(TokenType.RPAREN, "Expected ')' after while condition");
        Statement body = parseStatement();
        return new WhileStatement(condition, body);
    }

    private Statement parseMoveCommand() {
        Token direction = consume(TokenType.DIRECTION, "Expected direction after 'move'");
        return new MoveCommand(direction.getLexeme().toLowerCase());
    }

    private Statement parseShootCommand() {
        Token direction = consume(TokenType.DIRECTION, "Expected direction after 'shoot'");
        Expression expression = parseExpression();
        return new ShootCommand(direction.getLexeme().toLowerCase(), expression);
    }

    private Statement parseAssignmentStatement() {
        Token identifier = consume(TokenType.IDENTIFIER, "Expected identifier");
        consume(TokenType.ASSIGN, "Expected '=' after identifier");
        Expression expression = parseExpression();
        return new AssignmentStatement(identifier.getLexeme(), expression);
    }

    private Expression parseAdditive() {
        Expression expression = parseTerm();
        while (match(TokenType.PLUS, TokenType.MINUS)) {
            Token operator = previous();
            Expression right = parseTerm();
            expression = new BinaryExpr(expression, operator.getType(), right);
        }
        return expression;
    }

    private Expression parsePower() {
        Expression expression = parseFactor();
        if (match(TokenType.POW)) {
            Token operator = previous();
            Expression right = parsePower();
            expression = new BinaryExpr(expression, operator.getType(), right);
        }
        return expression;
    }

    private boolean match(TokenType... types) {
        for (TokenType type : types) {
            if (check(type)) {
                advance();
                return true;
            }
        }
        return false;
    }

    private Token consume(TokenType type, String message) {
        if (check(type)) {
            return advance();
        }
        throw error(peek(), message);
    }

    private boolean check(TokenType type) {
        if (isAtEnd()) {
            return type == TokenType.EOF;
        }
        return peek().getType() == type;
    }

    private boolean checkNext(TokenType type) {
        if (current + 1 >= tokens.size()) {
            return false;
        }
        return tokens.get(current + 1).getType() == type;
    }

    private Token advance() {
        if (!isAtEnd()) {
            current++;
        }
        return previous();
    }

    private boolean isAtEnd() {
        return peek().getType() == TokenType.EOF;
    }

    private Token peek() {
        return tokens.get(current);
    }

    private Token previous() {
        return tokens.get(current - 1);
    }

    private ParseException error(Token token, String message) {
        return new ParseException(message + " at position " + token.getPosition());
    }
}
