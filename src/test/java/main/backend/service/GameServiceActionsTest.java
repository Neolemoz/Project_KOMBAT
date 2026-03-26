package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

class GameServiceActionsTest extends GameServiceTestSupport {

    @Test
    void shouldValidateActionRulesAndExportReports() {
        List<ScenarioResult> results = new ArrayList<>();
        results.add(testValidMoveCostsOneMana());
        results.add(testInvalidMoveStillCostsOneMana());
        results.add(testShootUsesExpenditurePlusOneAndDealsExpectedDamage());
        results.add(testShootHasMinimumDamageOfOne());
        results.add(testShootCanHitAlly());
        results.add(testDoneStopsFollowingActions());
        results.add(testEachMinionCanMoveOnlyOnceEvenIfScriptRequestsMore());
        results.add(testEachMinionCanShootOnlyOnceEvenIfScriptRequestsMore());
        results.add(testMoveThenShootCanBothResolveInOneScript());
        results.add(testLowBudgetBlocksMoveAndStopsFurtherExecution());
        finalizeReport("actions", results);
    }

    private ScenarioResult testValidMoveCostsOneMana() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        Minion mover = placeMinion(game, p1, 4, 4, 3, 100, "Walker", "move down");

        service.executeMinionStrategies(null);

        boolean passed = mover.getRow() == 5
                && mover.getCol() == 4
                && p1.getBudget() == beforeBudget - 1;

        return new ScenarioResult(
                "move_valid",
                "move down from (4,4)",
                "pos=(5,4), mana -1",
                "pos=(" + mover.getRow() + "," + mover.getCol() + "), mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "A valid move should shift one hex and always cost 1 mana."
        );
    }

    private ScenarioResult testInvalidMoveStillCostsOneMana() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        Minion edge = placeMinion(game, p1, 1, 1, 3, 100, "Edge", "move up");

        service.executeMinionStrategies(null);

        boolean passed = edge.getRow() == 1
                && edge.getCol() == 1
                && p1.getBudget() == beforeBudget - 1;

        return new ScenarioResult(
                "move_invalid_border",
                "move up from board edge",
                "pos=(1,1), mana -1",
                "pos=(" + edge.getRow() + "," + edge.getCol() + "), mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "An invalid move should be a no-op on position but still spend 1 mana."
        );
    }

    private ScenarioResult testShootUsesExpenditurePlusOneAndDealsExpectedDamage() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        double beforeBudget = p1.getBudget();

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 20");
        Minion target = placeMinion(game, p2, 5, 4, 5, 100, "Target", "done");

        service.executeMinionStrategies(null);

        boolean passed = target.getHp() == 85 && p1.getBudget() == beforeBudget - 21;

        return new ScenarioResult(
                "shoot_damage_cost",
                "shoot down 20 into defense 5",
                "targetHp=85, mana -21",
                "targetHp=" + target.getHp() + ", mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "Shoot cost should be expenditure + 1, damage should be max(1, expenditure - defense)."
        );
    }

    private ScenarioResult testShootHasMinimumDamageOfOne() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 3");
        Minion target = placeMinion(game, p2, 5, 4, 10, 100, "Tank", "done");

        service.executeMinionStrategies(null);

        boolean passed = target.getHp() == 99;

        return new ScenarioResult(
                "shoot_min_damage",
                "shoot down 3 into defense 10",
                "targetHp=99",
                "targetHp=" + target.getHp(),
                passed,
                "Shoot damage should never drop below 1."
        );
    }

    private ScenarioResult testShootCanHitAlly() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 10");
        Minion ally = placeMinion(game, p1, 5, 4, 4, 100, "Ally", "done");

        service.executeMinionStrategies(null);

        boolean passed = ally.getHp() == 94;

        return new ScenarioResult(
                "shoot_friendly_fire",
                "shoot ally with expenditure 10 into defense 4",
                "allyHp=94",
                "allyHp=" + ally.getHp(),
                passed,
                "Current rules allow friendly fire, so ally should still take max(1, 10 - 4) damage."
        );
    }

    private ScenarioResult testDoneStopsFollowingActions() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        Minion minion = placeMinion(game, p1, 4, 4, 0, 100, "Stopper", "done move down shoot down 10");

        service.executeMinionStrategies(null);

        boolean passed = minion.getRow() == 4
                && minion.getCol() == 4
                && Math.abs(p1.getBudget() - beforeBudget) < 0.000001;

        return new ScenarioResult(
                "done_stops_actions",
                "done move down shoot down 10",
                "pos=(4,4), mana -0",
                "pos=(" + minion.getRow() + "," + minion.getCol() + "), mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "done should stop any later actions in the same minion script."
        );
    }

    private ScenarioResult testEachMinionCanMoveOnlyOnceEvenIfScriptRequestsMore() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        double beforeBudget = p1.getBudget();

        Minion minion = placeMinion(game, p1, 4, 4, 0, 100, "Runner", "move down move down");

        service.executeMinionStrategies(null);

        boolean passed = minion.getRow() == 5
                && minion.getCol() == 4
                && Math.abs(p1.getBudget() - (beforeBudget - 1)) < 0.000001;

        return new ScenarioResult(
                "move_once_per_minion",
                "move down move down",
                "pos=(5,4), mana -1",
                "pos=(" + minion.getRow() + "," + minion.getCol() + "), mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "GameService currently allows at most one move command per minion execution."
        );
    }

    private ScenarioResult testEachMinionCanShootOnlyOnceEvenIfScriptRequestsMore() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        double beforeBudget = p1.getBudget();

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 10 shoot down 10");
        Minion target = placeMinion(game, p2, 5, 4, 0, 100, "Target", "done");

        service.executeMinionStrategies(null);

        boolean passed = target.getHp() == 90 && Math.abs(p1.getBudget() - (beforeBudget - 11)) < 0.000001;

        return new ScenarioResult(
                "shoot_once_per_minion",
                "shoot down 10 shoot down 10",
                "targetHp=90, mana -11",
                "targetHp=" + target.getHp() + ", mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "GameService currently allows at most one shoot command per minion execution."
        );
    }

    private ScenarioResult testMoveThenShootCanBothResolveInOneScript() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        double beforeBudget = p1.getBudget();

        Minion actor = placeMinion(game, p1, 4, 4, 0, 100, "Combo", "move down shoot down 10");
        Minion target = placeMinion(game, p2, 6, 4, 0, 100, "Victim", "done");

        service.executeMinionStrategies(null);

        boolean passed = actor.getRow() == 5
                && actor.getCol() == 4
                && target.getHp() == 90
                && Math.abs(p1.getBudget() - (beforeBudget - 12)) < 0.000001;

        return new ScenarioResult(
                "move_then_shoot_combo",
                "move down then shoot down 10",
                "actor=(5,4), targetHp=90, mana -12",
                "actor=(" + actor.getRow() + "," + actor.getCol() + "), targetHp=" + target.getHp()
                        + ", mana -" + formatNumber(beforeBudget - p1.getBudget()),
                passed,
                "One move and one shoot can both happen in the same script execution."
        );
    }

    private ScenarioResult testLowBudgetBlocksMoveAndStopsFurtherExecution() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);
        p1.setBudget(0);

        Minion actor = placeMinion(game, p1, 4, 4, 0, 100, "Poor", "move down shoot down 10");
        Minion target = placeMinion(game, p2, 5, 4, 0, 100, "Victim", "done");

        service.executeMinionStrategies(null);

        boolean passed = actor.getRow() == 4 && target.getHp() == 100;

        return new ScenarioResult(
                "budget_block_move",
                "budget=0 then move down shoot down 10",
                "actor stays, targetHp=100",
                "actor=(" + actor.getRow() + "," + actor.getCol() + "), targetHp=" + target.getHp(),
                passed,
                "A failed move from low budget sets the minion execution into blocked/done state."
        );
    }
}
