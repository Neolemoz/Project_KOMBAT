package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import main.backend.logic.Node;
import java.util.Map;
import java.util.HashMap;

public class Minion {

    @JsonIgnore
    private Player owner;
    private int row;
    private int col;
    private int hp;
    private int maxHp;
    private int defense;

    @JsonIgnore
    private Node strategyAST;

    private String name;
    private Map<String, Long> memory = new HashMap<>();

    public Minion(Player owner, long defense, long maxHp, Node strategyAST) {
        this.owner = owner;
        this.defense = (int) defense;
        this.maxHp = (int) maxHp;
        this.hp = (int) maxHp;
        this.strategyAST = strategyAST;
        this.name = "Minion";
        this.memory = new HashMap<>();
    }

    public boolean isAlive() { return hp > 0; }

    public void takeDamage(int damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }

    public void setPosition(int row, int col) { this.row = row; this.col = col; }

    @JsonIgnore public Player getOwner() { return owner; }
    public void setOwner(Player owner) { this.owner = owner; }

    // ส่ง ownerId แทน owner object เพื่อให้ frontend รู้ว่าเป็นของใคร
    public Integer getOwnerId() { return owner != null ? owner.getId() : null; }

    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }

    public int getCol() { return col; }
    public void setCol(int col) { this.col = col; }

    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }

    public int getMaxHp() { return maxHp; }
    public int getDefense() { return defense; }

    @JsonIgnore public Node getStrategyAST() { return strategyAST; }
    public void setStrategyAST(Node ast) { this.strategyAST = ast; }

    @JsonIgnore public Node getStrategy() { return strategyAST; }

    public String getName() { return name; }
    public Map<String, Long> getMemory() { return memory; }
}