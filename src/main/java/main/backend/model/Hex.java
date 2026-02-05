package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Hex {
    private final int row;
    private final int col;
    private boolean isSpawnable = false;
    private Minion occupant = null;

    @JsonIgnore // เพิ่ม JsonIgnore เพื่อป้องกัน loop
    private Player owner; // เพิ่มตัวแปรนี้

    public Hex(int row, int col) {
        this.row = row;
        this.col = col;
    }

    // --- Getters & Setters ---
    public boolean isSpawnable() { return isSpawnable; }
    public void setSpawnable(boolean spawnable) { isSpawnable = spawnable; }

    public Minion getOccupant() { return occupant; }
    public void setOccupant(Minion m) { this.occupant = m; }

    public int getRow() { return row; }
    public int getCol() { return col; }

    // เพิ่มชุดนี้เข้าไปเพื่อแก้ Error "cannot find symbol setOwner"
    public Player getOwner() { return owner; }
    public void setOwner(Player owner) { this.owner = owner; }
}