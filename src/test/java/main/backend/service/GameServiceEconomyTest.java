package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Player;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

class GameServiceEconomyTest extends GameServiceTestSupport {

    @Test
    void shouldValidateEconomyRulesAndExportReports() {
        List<ScenarioResult> results = new ArrayList<>();
        results.add(testInitialTurnEconomyAppliedOnInit());
        results.add(testTurnEconomyUsesConfiguredFormula());
        results.add(testTurnEconomyRespectsMaxBudgetCap());
        finalizeReport("economy", results);
    }

    private ScenarioResult testInitialTurnEconomyAppliedOnInit() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);

        boolean passed = Math.abs(p1.getBudget() - 10090.0) < 0.000001
                && Math.abs(p2.getBudget() - 10000.0) < 0.000001
                && game.getPlayerTurnCount(1) == 1
                && game.getPlayerTurnCount(2) == 0;

        return new ScenarioResult(
                "init_economy",
                "service init",
                "P1=10090,P2=10000,turns=(1,0)",
                "P1=" + formatNumber(p1.getBudget()) + ",P2=" + formatNumber(p2.getBudget())
                        + ",turns=(" + game.getPlayerTurnCount(1) + "," + game.getPlayerTurnCount(2) + ")",
                passed,
                "GameService applies opening turn economy to player 1 during initialization."
        );
    }

    private ScenarioResult testTurnEconomyUsesConfiguredFormula() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        game.nextTurn();
        game.setPlayerTurnCount(1, 1);
        p1.setBudget(1000);

        double expectedInterest = game.calculateInterest(1090, 2);
        double expectedBudget = 1090 + expectedInterest;

        service.applyTurnEconomy();

        boolean passed = Math.abs(p1.getBudget() - expectedBudget) < 0.000001;

        return new ScenarioResult(
                "turn_interest",
                "budget=1000, add turn budget 90, then interest at player turn 2",
                "budget=" + formatNumber(expectedBudget),
                "budget=" + formatNumber(p1.getBudget()),
                passed,
                "Economy should apply base turn budget first, then interest from the configured formula."
        );
    }

    private ScenarioResult testTurnEconomyRespectsMaxBudgetCap() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        game.nextTurn();
        game.setPlayerTurnCount(1, 1);
        p1.setBudget(game.getMaxBudget() - 10);

        service.applyTurnEconomy();

        boolean passed = Math.abs(p1.getBudget() - game.getMaxBudget()) < 0.000001;

        return new ScenarioResult(
                "turn_budget_cap",
                "budget=max-10 before economy",
                "budget=" + game.getMaxBudget(),
                "budget=" + formatNumber(p1.getBudget()),
                passed,
                "Budget should never exceed configured max after turn economy."
        );
    }
}
