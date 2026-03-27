package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Player;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GameServiceEconomyTest extends GameServiceTestSupport {

    @AfterAll
    static void writeReport() {
        new GameServiceEconomyTest().writeScenarioReport("economy");
    }

    @Test
    void initAppliesOpeningEconomyOnlyToPlayerOne() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        runScenario(
                "economy",
                "init_economy",
                "service init",
                "P1=10090,P2=10000,turns=(1,0)",
                "Opening economy should apply only to player 1 on init.",
                () -> {
                    assertDoubleEquals(10090, game.getPlayer(1).getBudget());
                    assertDoubleEquals(10000, game.getPlayer(2).getBudget());
                    assertEquals(1, game.getPlayerTurnCount(1));
                    assertEquals(0, game.getPlayerTurnCount(2));
                },
                () -> "P1=" + game.getPlayer(1).getBudget()
                        + ",P2=" + game.getPlayer(2).getBudget()
                        + ",turns=(" + game.getPlayerTurnCount(1) + "," + game.getPlayerTurnCount(2) + ")"
        );
    }

    @Test
    void applyTurnEconomyUsesConfiguredTurnBudgetAndInterestFormula() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        game.nextTurn();
        game.setPlayerTurnCount(1, 1);
        p1.setBudget(1000);

        double expectedInterest = game.calculateInterest(1090, 2);
        double expectedBudget = 1090 + expectedInterest;

        runScenario(
                "economy",
                "turn_interest",
                "budget=1000 then apply economy on player turn 2",
                "budget=" + expectedBudget,
                "Turn economy should add base budget and then interest.",
                () -> {
                    service.applyTurnEconomy(game);
                    assertDoubleEquals(expectedBudget, p1.getBudget());
                    assertDoubleEquals(expectedInterest, game.getInterestByPlayer().get(1));
                    assertEquals(2, game.getPlayerTurnCount(1));
                },
                () -> "budget=" + p1.getBudget() + ",interest=" + game.getInterestByPlayer().get(1)
        );
    }

    @Test
    void applyTurnEconomyRespectsMaxBudgetCap() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        game.nextTurn();
        game.setPlayerTurnCount(1, 1);
        p1.setBudget(game.getMaxBudget() - 10);

        runScenario(
                "economy",
                "turn_budget_cap",
                "budget=max-10 then apply economy",
                "budget=" + game.getMaxBudget(),
                "Budget should never exceed configured max.",
                () -> {
                    service.applyTurnEconomy(game);
                    assertDoubleEquals(game.getMaxBudget(), p1.getBudget());
                },
                () -> "budget=" + p1.getBudget()
        );
    }

    @Test
    void applyTurnEconomyUsesProvidedStatesActivePlayer() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);

        game.setActivePlayerId(2);
        game.setPlayerTurnCount(2, 0);
        p1.setBudget(500);
        p2.setBudget(700);

        double expectedInterest = game.calculateInterest(790, 1);
        double expectedBudget = 790 + expectedInterest;

        runScenario(
                "economy",
                "state_scoped_economy_player",
                "activePlayer=2, applyTurnEconomy(game)",
                "only P2 budget changes",
                "State-scoped economy should use provided state's active player.",
                () -> {
                    service.applyTurnEconomy(game);
                    assertDoubleEquals(500, p1.getBudget());
                    assertDoubleEquals(expectedBudget, p2.getBudget());
                    assertEquals(1, game.getPlayerTurnCount(2));
                },
                () -> "P1=" + p1.getBudget() + ",P2=" + p2.getBudget()
                        + ",turns=(" + game.getPlayerTurnCount(1) + "," + game.getPlayerTurnCount(2) + ")"
        );
    }

    @Test
    void applyTurnEconomyRunsOnlyOncePerStateTurnAndPlayer() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);

        game.nextTurn();
        game.setPlayerTurnCount(1, 1);
        p1.setBudget(1000);

        runScenario(
                "economy",
                "economy_runs_once_per_turn",
                "applyTurnEconomy(game) twice in same turn",
                "budget changes only once",
                "Economy guard should block double application in same turn.",
                () -> {
                    service.applyTurnEconomy(game);
                    double afterFirstApply = p1.getBudget();
                    service.applyTurnEconomy(game);
                    assertDoubleEquals(afterFirstApply, p1.getBudget());
                },
                () -> "budget=" + p1.getBudget()
        );
    }
}
