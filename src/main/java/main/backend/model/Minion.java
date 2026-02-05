package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import main.backend.logic.Node;

public class Minion {

    @JsonIgnore
    private Player owner;
    private int row;
    private int col;
    private int hp;
    private int maxHp;
    private int defense;
    private Node strategyAST;
    private String name;

    // Constructor หลัก (6 ตัวแปร)
    public Minion(Player owner, int row, int col, int maxHp, int defense, String name) {
        this.owner = owner;
        this.row = row;
        this.col = col;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.defense = defense;
        this.name = name;
    }

    // --- เพิ่ม Constructor นี้ (แก้ Error expected 6 but found 3) ---
    public Minion(Player owner, int row, int col) {
        // เรียก Constructor หลักโดยกำหนดค่าเริ่มต้นให้: HP=100, Def=0, Name="Minion"
        this(owner, row, col, 100, 0, "Minion");
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

    // เพิ่มเมธอดนี้เพื่อความสะดวก (GameState อาจจะเรียกใช้)
    public void setPosition(int row, int col) {
        this.row = row;
        this.col = col;
    }

    @JsonIgnore
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