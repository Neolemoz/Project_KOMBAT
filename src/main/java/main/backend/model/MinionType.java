package main.backend.model;

import main.backend.logic.Node;

public class MinionType {
    private String name;
    private int maxHp;
    private int defense;
    private Node strategyAST; // เก็บ AST ของสคริปต์ที่ compile แล้ว

    public MinionType(String name, int maxHp, int defense, Node strategyAST) {
        this.name = name;
        this.maxHp = maxHp;
        this.defense = defense;
        this.strategyAST = strategyAST;
    }

    // Getters
    public String getName() { return name; }
    public int getMaxHp() { return maxHp; }
    public int getDefense() { return defense; }
    public Node getStrategyAST() { return strategyAST; }
}