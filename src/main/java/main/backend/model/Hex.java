package main.backend.model;

import main.backend.model.Minion;

public class Hex {
    private final int row;
    private final int col;
    private boolean isSpawnable = false; // สถานะว่าเป็นช่องที่วางยูนิตได้ไหม
    private main.backend.model.Minion occupant = null;

    public Hex(int row, int col) {
        this.row = row;
        this.col = col;
    }

    // Getters and Setters
    public boolean isSpawnable() { return isSpawnable; }
    public void setSpawnable(boolean spawnable) { isSpawnable = spawnable; }
    public Minion getOccupant() { return occupant; }
    public void setOccupant(Minion m) { this.occupant = m; }
    public int getRow() { return row; }
    public int getCol() { return col; }
}