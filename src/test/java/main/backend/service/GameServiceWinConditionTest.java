package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Minion;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameServiceWinConditionTest extends GameServiceTestSupport {

    @AfterAll
    static void writeReport() {
        new GameServiceWinConditionTest().writeScenarioReport("win-condition");
    }

    @Test
    void destroyingLastSpawnedEnemyWinsImmediately() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        placeMinion(game, game.getPlayer(1), 4, 4, 0, 100, "Shooter", "shoot down 200");
        placeMinion(game, game.getPlayer(2), 5, 4, 0, 100, "OnlyEnemy", "done");

        runScenario(
                "win-condition",
                "instant_win_on_last_enemy",
                "kill enemy's last spawned minion",
                "winner=1",
                "Removing the last spawned enemy should end the game immediately.",
                () -> {
                    assertEquals(0, service.checkWinner());
                    service.executeMinionStrategies(null);
                    assertEquals(1, service.checkWinner());
                    assertTrue(game.isGameOver());
                },
                () -> "winner=" + service.checkWinner()
        );
    }

    @Test
    void determineWinnerUsesAliveCountThenHpThenBudgetAtTurnLimit() throws Exception {
        GameService aliveService = newService();
        GameState aliveGame = aliveService.getGameState();
        placeMinion(aliveGame, aliveGame.getPlayer(1), 1, 1, 0, 100, "P1A", "done");
        placeMinion(aliveGame, aliveGame.getPlayer(1), 1, 2, 0, 100, "P1B", "done");
        placeMinion(aliveGame, aliveGame.getPlayer(2), 8, 8, 0, 100, "P2A", "done");
        aliveGame.setPlayerTurnCount(1, aliveGame.getMaxTurns());
        aliveGame.setPlayerTurnCount(2, aliveGame.getMaxTurns());
        GameService hpService = newService();
        GameState hpGame = hpService.getGameState();
        Minion hpP1 = placeMinion(hpGame, hpGame.getPlayer(1), 1, 1, 0, 100, "P1", "done");
        Minion hpP2 = placeMinion(hpGame, hpGame.getPlayer(2), 8, 8, 0, 100, "P2", "done");
        hpP1.setHp(80);
        hpP2.setHp(90);
        hpGame.setPlayerTurnCount(1, hpGame.getMaxTurns());
        hpGame.setPlayerTurnCount(2, hpGame.getMaxTurns());
        GameService budgetService = newService();
        GameState budgetGame = budgetService.getGameState();
        Minion budgetP1 = placeMinion(budgetGame, budgetGame.getPlayer(1), 1, 1, 0, 100, "P1", "done");
        Minion budgetP2 = placeMinion(budgetGame, budgetGame.getPlayer(2), 8, 8, 0, 100, "P2", "done");
        budgetP1.setHp(90);
        budgetP2.setHp(90);
        budgetGame.getPlayer(1).setBudget(500);
        budgetGame.getPlayer(2).setBudget(400);
        budgetGame.setPlayerTurnCount(1, budgetGame.getMaxTurns());
        budgetGame.setPlayerTurnCount(2, budgetGame.getMaxTurns());

        runScenario(
                "win-condition",
                "endgame_tiebreakers",
                "max turns with alive-count, hp, budget comparisons",
                "alive->1, hp->2, budget->1",
                "Winner should use alive count, then HP, then budget.",
                () -> {
                    assertEquals(1, aliveService.determineWinner(aliveGame));
                    assertEquals(2, hpService.determineWinner(hpGame));
                    assertEquals(1, budgetService.determineWinner(budgetGame));
                },
                () -> "alive->" + aliveService.determineWinner(aliveGame)
                        + ", hp->" + hpService.determineWinner(hpGame)
                        + ", budget->" + budgetService.determineWinner(budgetGame)
        );
    }

    @Test
    void determineWinnerReturnsDrawWhenEverythingIsEqualAtTurnLimit() throws Exception {
        GameService service = newService();
        GameState game = service.getGameState();

        placeMinion(game, game.getPlayer(1), 1, 1, 0, 100, "P1", "done");
        placeMinion(game, game.getPlayer(2), 8, 8, 0, 100, "P2", "done");
        game.setPlayerTurnCount(1, game.getMaxTurns());
        game.setPlayerTurnCount(2, game.getMaxTurns());
        game.getPlayer(1).setBudget(300);
        game.getPlayer(2).setBudget(300);

        runScenario(
                "win-condition",
                "endgame_draw",
                "max turns with equal alive count, hp, and budget",
                "winner=3",
                "Winner should be draw when all tiebreakers are equal.",
                () -> assertEquals(3, service.determineWinner(game)),
                () -> "winner=" + service.determineWinner(game)
        );
    }
}
