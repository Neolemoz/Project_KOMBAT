package main.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Hex {
    private final int row;
    private final int col;
    private boolean isSpawnable = false;
    private boolean isBuyable = false;
    private Minion occupant = null;

    @JsonIgnore
    private Player owner;

    public Hex(int row, int col) {
        this.row = row;
        this.col = col;
    }

    public boolean isSpawnable() { return isSpawnable; }
    public void setSpawnable(boolean spawnable) { isSpawnable = spawnable; }

    public boolean isBuyable() { return isBuyable; }
    public void setBuyable(boolean buyable) { isBuyable = buyable; }

    public Minion getOccupant() { return occupant; }
    public void setOccupant(Minion m) { this.occupant = m; }

    public int getRow() { return row; }
    public int getCol() { return col; }

    @JsonIgnore
    public Player getOwner() { return owner; }
    public void setOwner(Player owner) { this.owner = owner; }

    // ── KEY FIX: เพิ่ม @JsonProperty เพื่อบังคับให้ Jackson serialize ออกมาเสมอ ──
    @JsonProperty("ownerId")
    public Integer getOwnerId() {
        if (this.owner != null) {
            return this.owner.getId();
        }
        return null;
    }
}
