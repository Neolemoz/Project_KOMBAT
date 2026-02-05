package main.backend.logic;

public interface ExpressionNode extends Node {
    // บังคับให้ทุก Expression ต้องคำนวณค่าออกมาได้
    long evaluate(MinionContext ctx);
}