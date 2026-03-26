package main.backend.model;

public class BattleLogEntry {
    private final int turn;
    private final int playerId;
    private final String actionType;
    private final String minionName;
    private final String message;
    private final Integer fromRow;
    private final Integer fromCol;
    private final Integer toRow;
    private final Integer toCol;
    private final Integer targetRow;
    private final Integer targetCol;

    public BattleLogEntry(
            int turn,
            int playerId,
            String actionType,
            String minionName,
            String message,
            Integer fromRow,
            Integer fromCol,
            Integer toRow,
            Integer toCol,
            Integer targetRow,
            Integer targetCol
    ) {
        this.turn = turn;
        this.playerId = playerId;
        this.actionType = actionType;
        this.minionName = minionName;
        this.message = message;
        this.fromRow = fromRow;
        this.fromCol = fromCol;
        this.toRow = toRow;
        this.toCol = toCol;
        this.targetRow = targetRow;
        this.targetCol = targetCol;
    }

    public int getTurn() { return turn; }
    public int getPlayerId() { return playerId; }
    public String getActionType() { return actionType; }
    public String getMinionName() { return minionName; }
    public String getMessage() { return message; }
    public Integer getFromRow() { return fromRow; }
    public Integer getFromCol() { return fromCol; }
    public Integer getToRow() { return toRow; }
    public Integer getToCol() { return toCol; }
    public Integer getTargetRow() { return targetRow; }
    public Integer getTargetCol() { return targetCol; }
}
