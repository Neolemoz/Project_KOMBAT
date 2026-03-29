package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Player;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameServiceTurnFlowTest extends GameServiceTestSupport {

    @AfterAll
    static void writeReport() {
        new GameServiceTurnFlowTest().writeScenarioReport("turn-flow");
    }

    @Test
    void minionsExecuteInCreationOrder() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        var first = placeMinion(game, p1, 4, 4, 0, 100, "First", "move down");
        var second = placeMinion(game, p1, 5, 4, 0, 100, "Second", "move down");

        runScenario(
                "turn-flow",
                "minion_order",
                "First tries to enter Second's tile, then Second moves",
                "First=(4,4), Second=(6,4)",
                "Execution order should follow creation order.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(first, 4, 4);
                    assertPosition(second, 6, 4);
                },
                () -> "First=(" + first.getRow() + "," + first.getCol() + "), Second=("
                        + second.getRow() + "," + second.getCol() + ")"
        );
    }

    @Test
    void firstSpawnIsFreeButLaterSpawnCostsConfiguredAmount() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        double budgetBeforeFirstSpawn = p1.getBudget();
        runScenario(
                "turn-flow",
                "spawn_free_then_paid",
                "first spawn on turn 1, then later spawn on next own turn",
                "first free, later spawn costs configured amount",
                "First spawn is free and later spawns cost spawnCost.",
                () -> {
                    assertTrue(service.spawnMinion(1, 1, 1, 3, "done", "Starter"));
                    assertDoubleEquals(budgetBeforeFirstSpawn, p1.getBudget());
                    service.endTurn();
                    assertTrue(service.spawnMinion(2, 8, 8, 3, "done", "EnemyStarter"));
                    service.endTurn();
                    double budgetBeforePaidSpawn = p1.getBudget();
                    assertTrue(service.spawnMinion(1, 1, 2, 3, "done", "Paid"));
                    assertDoubleEquals(budgetBeforePaidSpawn - game.getSpawnCost(), p1.getBudget());
                },
                () -> "P1 budget=" + p1.getBudget() + ", spawnCost=" + game.getSpawnCost()
        );
    }

    @Test
    void spawnOnlyOncePerTurnAndOnlyOnOwnedEmptyHexOfCurrentPlayer() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        runScenario(
                "turn-flow",
                "spawn_constraints",
                "spawn twice / neutral hex / wrong player",
                "first succeeds, others fail",
                "Spawn should require active player, owned hex, empty tile, and once-per-turn.",
                () -> {
                    assertTrue(service.spawnMinion(1, 1, 1, 3, "done", "A"));
                    assertFalse(service.spawnMinion(1, 1, 2, 3, "done", "B"));
                    assertFalse(service.spawnMinion(1, 4, 4, 3, "done", "Neutral"));
                    assertFalse(service.spawnMinion(2, 8, 8, 3, "done", "WrongPlayer"));
                    assertNotNull(game.getHex(1, 1).getOccupant());
                    assertEquals(null, game.getHex(1, 2).getOccupant());
                },
                () -> "hex(1,1)=" + (game.getHex(1, 1).getOccupant() != null) + ", hex(1,2)=" + game.getHex(1, 2).getOccupant()
        );
    }

    @Test
    void buyHexCanHappenOnlyOncePerTurnAndMustBeAdjacentNeutral() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double budgetBefore = p1.getBudget();

        runScenario(
                "turn-flow",
                "buy_hex_rules",
                "buy adjacent neutral, then buy again, then enemy corner",
                "true,false,false and mana -1000",
                "Buy hex should require adjacency, neutrality, enough budget, and once per turn.",
                () -> {
                    assertTrue(service.buyHex(1, 2, 3));
                    assertFalse(service.buyHex(1, 2, 4));
                    assertFalse(service.buyHex(1, 8, 8));
                    assertEquals(p1, game.getHex(2, 3).getOwner());
                    assertDoubleEquals(budgetBefore - 1000, p1.getBudget());
                },
                () -> "owner(2,3)=" + (game.getHex(2, 3).getOwner() != null ? game.getHex(2, 3).getOwner().getId() : null)
                        + ", mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void openingTurnCannotEndBeforeFirstSpawn() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        runScenario(
                "turn-flow",
                "turn_one_spawn_required",
                "try to end turn 1 without spawning",
                "turn should not advance",
                "Opening turn should require first spawn before ending.",
                () -> {
                    assertFalse(service.canEndCurrentTurn());
                    service.endTurn();
                    assertEquals(1, service.getCurrentPlayerId());
                    assertEquals(1, game.getTurnCount());
                },
                () -> "player=" + service.getCurrentPlayerId() + ",turn=" + game.getTurnCount()
        );
    }

    @Test
    void endTurnSwitchesPlayerAndAdvancesRoundAfterPlayerTwo() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        runScenario(
                "turn-flow",
                "turn_flow_switching",
                "spawn once each, then endTurn by P1 then P2",
                "after P1->P2 same round, after P2->P1 next round",
                "Turn count should advance after player 2 hands back to player 1.",
                () -> {
                    assertTrue(service.spawnMinion(1, 1, 1, 3, "done", "P1Starter"));
                    service.endTurn();
                    assertEquals(2, service.getCurrentPlayerId());
                    assertEquals(1, game.getTurnCount());
                    assertEquals(1, game.getPlayerTurnCount(2));
                    assertTrue(service.spawnMinion(2, 8, 8, 3, "done", "P2Starter"));
                    service.endTurn();
                    assertEquals(1, service.getCurrentPlayerId());
                    assertEquals(2, game.getTurnCount());
                    assertEquals(2, game.getPlayerTurnCount(1));
                },
                () -> "player=" + service.getCurrentPlayerId() + ",turn=" + game.getTurnCount()
                        + ",turns=(" + game.getPlayerTurnCount(1) + "," + game.getPlayerTurnCount(2) + ")"
        );
    }

    @Test
    void botTurnWithoutRegisteredMinionTypesDoesNotDeadlock() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        service.setGameMode("solo");

        runScenario(
                "turn-flow",
                "bot_turn_no_deadlock",
                "solo mode bot turn without registered minion types",
                "control returns to P1 next round",
                "Bot should not deadlock even when no minion types are defined.",
                () -> {
                    assertTrue(service.spawnMinion(1, 1, 1, 3, "done", "P1Starter"));
                    service.endTurn();
                    int turnBefore = game.getTurnCount();
                    service.playBotTurn();
                    assertEquals(1, service.getCurrentPlayerId());
                    assertEquals(turnBefore + 1, game.getTurnCount());
                    assertEquals(2, game.getPlayerTurnCount(1));
                    assertEquals(1, game.getPlayerTurnCount(2));
                },
                () -> "player=" + service.getCurrentPlayerId() + ",turn=" + game.getTurnCount()
                        + ",turns=(" + game.getPlayerTurnCount(1) + "," + game.getPlayerTurnCount(2) + ")"
        );
    }
}
