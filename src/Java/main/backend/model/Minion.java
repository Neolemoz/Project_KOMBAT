package src.Java.main.backend.model; // ตรวจสอบชื่อ Package

import main.backend.model.Player;
import main.backend.logic.Node; // ต้อง Import Node ของ AST ที่ได้จาก Parser

public class Minion {
    private Player owner;
    private int row;
    private int col;
    private int hp;
    private int maxHp;
    private int defense; // Defense Factor ใช้ลด Damage
    private Node strategyAST; // เก็บโครงสร้างคำสั่ง (Abstract Syntax Tree)
    private String name; // ชื่อชนิดของ Minion (เช่น "Archer", "Tank")

    public Minion(Player owner, int row, int col, int maxHp, int defense, String name) {
        this.owner = owner;
        this.row = row;
        this.col = col;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.defense = defense;
        this.name = name;
    }

    // --- เมธอดจัดการสถานะ ---

    public boolean isAlive() {
        return hp > 0;
    }

    public void takeDamage(int damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }

    // --- Getters & Setters ---

    public Player getOwner() { return owner; }
    public void setOwner(Player owner) { this.owner = owner; }

    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }

    public int getCol() { return col; }
    public void setCol(int col) { this.col = col; }

    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }

    public int getDefense() { return defense; }

    public Node getStrategyAST() { return strategyAST; }
    public void setStrategyAST(Node strategyAST) { this.strategyAST = strategyAST; }

    public String getName() { return name; }
}