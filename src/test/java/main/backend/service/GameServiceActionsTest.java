package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameServiceActionsTest extends GameServiceTestSupport {

    @AfterAll
    static void writeReport() {
        new GameServiceActionsTest().writeScenarioReport("actions");
    }

    @Test
    void validMoveCostsOneManaAndChangesPosition() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double budgetBefore = p1.getBudget();

        Minion mover = placeMinion(game, p1, 4, 4, 3, 100, "Walker", "move down");

        runScenario(
                "actions",
                "move_valid",
                "move down from (4,4)",
                "pos=(5,4), mana -1",
                "Valid move should change position and cost 1 mana.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(mover, 5, 4);
                    assertDoubleEquals(budgetBefore - 1, p1.getBudget());
                },
                () -> "pos=(" + mover.getRow() + "," + mover.getCol() + "), mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void invalidMoveStillCostsOneMana() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double budgetBefore = p1.getBudget();

        Minion edge = placeMinion(game, p1, 1, 1, 3, 100, "Edge", "move up");

        runScenario(
                "actions",
                "move_invalid_border",
                "move up from board edge",
                "pos=(1,1), mana -1",
                "Invalid move should keep position but still spend mana.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(edge, 1, 1);
                    assertDoubleEquals(budgetBefore - 1, p1.getBudget());
                },
                () -> "pos=(" + edge.getRow() + "," + edge.getCol() + "), mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void shootUsesExpenditurePlusOneAndDealsDefenseReducedDamage() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        double budgetBefore = p1.getBudget();

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 20");
        Minion target = placeMinion(game, p2, 5, 4, 5, 100, "Target", "done");

        runScenario(
                "actions",
                "shoot_damage_cost",
                "shoot down 20 into defense 5",
                "targetHp=85, mana -21",
                "Shoot should cost exp+1 and damage should be exp-defense with minimum 1.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertEquals(85, target.getHp());
                    assertDoubleEquals(budgetBefore - 21, p1.getBudget());
                    assertEquals(21, game.getStrategyCostByPlayer().get(1));
                },
                () -> "targetHp=" + target.getHp() + ", mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void shootHasMinimumDamageAndCanHitAllies() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 3");
        Minion ally = placeMinion(game, p1, 5, 4, 10, 100, "Ally", "done");

        runScenario(
                "actions",
                "shoot_min_damage_friendly_fire",
                "shoot ally with expenditure 3 into defense 10",
                "allyHp=99",
                "Friendly fire is allowed and damage floor should be 1.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertEquals(99, ally.getHp());
                },
                () -> "allyHp=" + ally.getHp()
        );
    }

    @Test
    void doneStopsLaterActionsInTheSameScript() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double budgetBefore = p1.getBudget();

        Minion minion = placeMinion(game, p1, 4, 4, 0, 100, "Stopper", "done move down shoot down 10");

        runScenario(
                "actions",
                "done_stops_actions",
                "done move down shoot down 10",
                "pos=(4,4), mana -0",
                "done should stop later actions in the same script.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(minion, 4, 4);
                    assertDoubleEquals(budgetBefore, p1.getBudget());
                },
                () -> "pos=(" + minion.getRow() + "," + minion.getCol() + "), mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void oneMinionCanMoveAndShootAtMostOncePerExecution() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        double budgetBefore = p1.getBudget();

        Minion actor = placeMinion(game, p1, 4, 4, 0, 100, "Combo", "move down move down shoot down 10 shoot down 10");
        Minion target = placeMinion(game, p2, 6, 4, 0, 100, "Victim", "done");

        runScenario(
                "actions",
                "move_and_shoot_once_each",
                "move down move down shoot down 10 shoot down 10",
                "actor=(5,4), targetHp=90, mana -12",
                "A minion should move at most once and shoot at most once.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(actor, 5, 4);
                    assertEquals(90, target.getHp());
                    assertDoubleEquals(budgetBefore - 12, p1.getBudget());
                },
                () -> "actor=(" + actor.getRow() + "," + actor.getCol() + "), targetHp=" + target.getHp()
                        + ", mana -" + (budgetBefore - p1.getBudget())
        );
    }

    @Test
    void lowBudgetBlocksMoveAndPreventsLaterActions() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        p1.setBudget(0);

        Minion actor = placeMinion(game, p1, 4, 4, 0, 100, "Poor", "move down shoot down 10");
        Minion target = placeMinion(game, p2, 5, 4, 0, 100, "Victim", "done");

        runScenario(
                "actions",
                "low_budget_blocks_actions",
                "move down shoot down 10 with budget 0",
                "actor stays, target untouched, mana 0",
                "Budget failure on move should stop later actions.",
                () -> {
                    service.executeMinionStrategies(null);
                    assertPosition(actor, 4, 4);
                    assertEquals(100, target.getHp());
                    assertDoubleEquals(0, p1.getBudget());
                },
                () -> "actor=(" + actor.getRow() + "," + actor.getCol() + "), targetHp=" + target.getHp()
                        + ", mana=" + p1.getBudget()
        );
    }

    @Test
    void invalidStrategyUpdateThrowsIllegalArgumentException() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        placeMinion(game, game.getPlayer(1), 1, 1, 0, 100, "Unit", "done");

        runScenario(
                "actions",
                "invalid_strategy_update",
                "setPlayerStrategy(1, \"if (\")",
                "IllegalArgumentException",
                "Invalid strategy updates should surface as errors.",
                () -> assertThrows(IllegalArgumentException.class, () -> service.setPlayerStrategy(1, "if (")),
                () -> "IllegalArgumentException thrown"
        );
    }

    @Test
    void executeMinionStrategiesUsesProvidedStateActivePlayer() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);

        Minion p1Minion = placeMinion(game, p1, 4, 4, 0, 100, "P1Unit", "move down");
        Minion p2Minion = placeMinion(game, p2, 6, 6, 0, 100, "P2Unit", "move up");
        game.setActivePlayerId(2);

        runScenario(
                "actions",
                "state_scoped_strategy_execution",
                "executeMinionStrategies(game) with activePlayer=2",
                "only P2 acts",
                "Provided GameState active player should control execution.",
                () -> {
                    service.executeMinionStrategies(game);
                    assertPosition(p1Minion, 4, 4);
                    assertPosition(p2Minion, 5, 6);
                    assertTrue(game.getBattleLog().stream().anyMatch(entry -> "move".equals(entry.getActionType())));
                },
                () -> "P1=(" + p1Minion.getRow() + "," + p1Minion.getCol() + "), P2=("
                        + p2Minion.getRow() + "," + p2Minion.getCol() + ")"
        );
    }
}
