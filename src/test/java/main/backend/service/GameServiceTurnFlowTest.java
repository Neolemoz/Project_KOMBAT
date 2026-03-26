package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Hex;
import main.backend.model.Minion;
import main.backend.model.Player;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

class GameServiceTurnFlowTest extends GameServiceTestSupport {

    @Test
    void shouldValidateTurnFlowRulesAndExportReports() {
        List<ScenarioResult> results = new ArrayList<>();
        results.add(testMinionsExecuteInCreationOrder());
        results.add(testFirstSpawnIsFree());
        results.add(testSecondSpawnInSameTurnIsBlocked());
        results.add(testSpawnCostsConfiguredAmountAfterFirstFreeSpawn());
        results.add(testSpawnRequiresOwnedEmptyHexForCurrentPlayer());
        results.add(testCanBuyOnlyAdjacentNeutralHexOncePerTurn());
        results.add(testTurnOneRequiresSpawnBeforeEndTurn());
        results.add(testEndTurnSwitchesPlayerAndAdvancesRoundAfterPlayerTwo());
        finalizeReport("turn-flow", results);
    }

    private ScenarioResult testMinionsExecuteInCreationOrder() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        Minion first = placeMinion(game, p1, 4, 4, 0, 100, "First", "move down");
        Minion second = placeMinion(game, p1, 5, 4, 0, 100, "Second", "move down");

        service.executeMinionStrategies(null);

        boolean passed = first.getRow() == 4
                && first.getCol() == 4
                && second.getRow() == 6
                && second.getCol() == 4;

        return new ScenarioResult(
                "minion_order",
                "First tries to enter Second's tile, then Second moves",
                "First=(4,4), Second=(6,4)",
                "First=(" + first.getRow() + "," + first.getCol() + "), Second=(" + second.getRow() + "," + second.getCol() + ")",
                passed,
                "If execution is in creation order, First is blocked before Second vacates the tile."
        );
    }

    private ScenarioResult testFirstSpawnIsFree() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        boolean spawned = service.spawnMinion(1, 1, 1, 3, "done", "Freebie");
        Hex hex = game.getHex(1, 1);

        boolean passed = spawned
                && hex.getOccupant() != null
                && Math.abs(p1.getBudget() - beforeBudget) < 0.000001;

        return new ScenarioResult(
                "first_spawn_free",
                "spawn first minion on turn 1",
                "spawned=true, mana -0",
                "spawned=" + spawned + ", mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "First spawn of the game for a player is free when they have no minions on turn 1."
        );
    }

    private ScenarioResult testSecondSpawnInSameTurnIsBlocked() {
        GameService service = newService();
        GameState game = service.getGameState();

        boolean first = service.spawnMinion(1, 1, 1, 3, "done", "A");
        boolean second = service.spawnMinion(1, 1, 2, 3, "done", "B");

        boolean passed = first && !second && game.getHex(1, 2).getOccupant() == null;

        return new ScenarioResult(
                "spawn_once_per_turn",
                "spawn twice in same turn",
                "first=true, second=false",
                "first=" + first + ", second=" + second,
                passed,
                "Each player can only spawn once per turn."
        );
    }

    private ScenarioResult testSpawnCostsConfiguredAmountAfterFirstFreeSpawn() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        boolean first = service.spawnMinion(1, 1, 1, 3, "done", "Starter");
        service.endTurn();
        boolean p2First = service.spawnMinion(2, 8, 8, 3, "done", "Starter2");
        service.endTurn();

        double beforeBudget = p1.getBudget();
        boolean second = service.spawnMinion(1, 1, 2, 3, "done", "Paid");

        boolean passed = first
                && p2First
                && second
                && Math.abs(p1.getBudget() - (beforeBudget - game.getSpawnCost())) < 0.000001;

        return new ScenarioResult(
                "spawn_paid_after_free",
                "spawn again on later own turn",
                "spawned=true, mana -" + game.getSpawnCost(),
                "spawned=" + second + ", mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "Later spawns should use configured spawn cost."
        );
    }

    private ScenarioResult testSpawnRequiresOwnedEmptyHexForCurrentPlayer() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        placeMinion(game, p1, 1, 1, 0, 100, "Blocker", "done");

        boolean wrongPlayer = service.spawnMinion(2, 8, 8, 3, "done", "EnemyTurn");
        boolean occupiedHex = service.spawnMinion(1, 1, 1, 3, "done", "Occupied");
        boolean neutralHex = service.spawnMinion(1, 4, 4, 3, "done", "Neutral");

        boolean passed = !wrongPlayer && !occupiedHex && !neutralHex;

        return new ScenarioResult(
                "spawn_constraints",
                "wrong player / occupied hex / neutral hex",
                "all false",
                wrongPlayer + "," + occupiedHex + "," + neutralHex,
                passed,
                "Spawn should require active player, owned hex, and empty tile."
        );
    }

    private ScenarioResult testCanBuyOnlyAdjacentNeutralHexOncePerTurn() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        boolean success = service.buyHex(1, 2, 3);
        boolean secondBuySameTurn = service.buyHex(1, 2, 4);
        boolean enemyOwned = service.buyHex(1, 8, 8);

        boolean passed = success
                && !secondBuySameTurn
                && !enemyOwned
                && game.getHex(2, 3).getOwner() == p1
                && Math.abs(p1.getBudget() - (beforeBudget - 1000)) < 0.000001;

        return new ScenarioResult(
                "buy_hex_rules",
                "buy adjacent neutral, then buy again, then enemy hex",
                "true,false,false and mana -1000",
                success + "," + secondBuySameTurn + "," + enemyOwned + " and mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "Buying a hex should require adjacency, neutrality, enough budget, and only happen once per turn."
        );
    }

    private ScenarioResult testEndTurnSwitchesPlayerAndAdvancesRoundAfterPlayerTwo() {
        GameService service = newService();
        GameState game = service.getGameState();

        boolean p1Spawned = service.spawnMinion(1, 1, 1, 3, "done", "P1Starter");
        service.endTurn();
        String afterFirstSnapshot = "player=" + service.getCurrentPlayerId()
                + ",turn=" + game.getTurnCount()
                + ",p1Turns=" + game.getPlayerTurnCount(1)
                + ",p2Turns=" + game.getPlayerTurnCount(2);
        boolean afterFirstEnd = service.getCurrentPlayerId() == 2
                && game.getTurnCount() == 1
                && game.getPlayerTurnCount(2) == 1;

        boolean p2Spawned = service.spawnMinion(2, 8, 8, 3, "done", "P2Starter");
        service.endTurn();
        String afterSecondSnapshot = "player=" + service.getCurrentPlayerId()
                + ",turn=" + game.getTurnCount()
                + ",p1Turns=" + game.getPlayerTurnCount(1)
                + ",p2Turns=" + game.getPlayerTurnCount(2);
        boolean afterSecondEnd = service.getCurrentPlayerId() == 1
                && game.getTurnCount() == 2
                && game.getPlayerTurnCount(1) == 2;

        boolean passed = p1Spawned && p2Spawned && afterFirstEnd && afterSecondEnd;

        return new ScenarioResult(
                "turn_flow_switching",
                "spawn once each, then endTurn by P1 then P2",
                "after P1->P2 same round, after P2->P1 next round",
                "after1=(" + afterFirstSnapshot + "), after2=(" + afterSecondSnapshot + ")",
                passed,
                "Turn count advances only when control returns from player 2 back to player 1."
        );
    }

    private ScenarioResult testTurnOneRequiresSpawnBeforeEndTurn() {
        GameService service = newService();
        GameState game = service.getGameState();

        service.endTurn();

        boolean passed = service.getCurrentPlayerId() == 1
                && game.getTurnCount() == 1
                && service.canEndCurrentTurn() == false;

        return new ScenarioResult(
                "turn_one_spawn_required",
                "try to end turn 1 without spawning",
                "turn should not advance",
                "player=" + service.getCurrentPlayerId() + ",turn=" + game.getTurnCount(),
                passed,
                "Each player must place their first minion on turn 1 before ending their turn, but buying a hex is optional."
        );
    }
}
