package main.backend.service;

import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

class GameServiceWinConditionTest extends GameServiceTestSupport {

    @Test
    void shouldValidateWinConditionsAndExportReports() {
        List<ScenarioResult> results = new ArrayList<>();
        results.add(testDestroyingLastSpawnedEnemyWinsImmediately());
        results.add(testMaxTurnsWinnerUsesAliveCountThenHpThenBudget());
        results.add(testMaxTurnsCanEndInDraw());
        finalizeReport("win-condition", results);
    }

    private ScenarioResult testDestroyingLastSpawnedEnemyWinsImmediately() {
        GameService service = newService();
        GameState game = service.getGameState();
        Player p1 = game.getPlayer(1);
        Player p2 = game.getPlayer(2);

        placeMinion(game, p1, 4, 4, 0, 100, "Shooter", "shoot down 200");
        placeMinion(game, p2, 5, 4, 0, 100, "OnlyEnemy", "done");

        int winnerBefore = service.checkWinner();
        service.executeMinionStrategies(null);
        int winnerAfter = service.checkWinner();

        boolean passed = winnerBefore == 0 && winnerAfter == 1 && game.isGameOver();

        return new ScenarioResult(
                "instant_win_on_last_enemy",
                "kill enemy's last spawned minion",
                "winner=1",
                "winner=" + winnerAfter,
                passed,
                "Once a player has spawned and all their minions are dead, the opponent should win immediately."
        );
    }

    private ScenarioResult testMaxTurnsWinnerUsesAliveCountThenHpThenBudget() {
        GameService aliveService = newService();
        GameState aliveGame = aliveService.getGameState();
        placeMinion(aliveGame, aliveGame.getPlayer(1), 1, 1, 0, 100, "P1A", "done");
        placeMinion(aliveGame, aliveGame.getPlayer(1), 1, 2, 0, 100, "P1B", "done");
        placeMinion(aliveGame, aliveGame.getPlayer(2), 8, 8, 0, 100, "P2A", "done");
        aliveGame.setPlayerTurnCount(1, aliveGame.getMaxTurns());
        aliveGame.setPlayerTurnCount(2, aliveGame.getMaxTurns());
        int aliveWinner = aliveService.determineWinner();

        GameService hpService = newService();
        GameState hpGame = hpService.getGameState();
        Minion hpP1 = placeMinion(hpGame, hpGame.getPlayer(1), 1, 1, 0, 100, "P1", "done");
        Minion hpP2 = placeMinion(hpGame, hpGame.getPlayer(2), 8, 8, 0, 100, "P2", "done");
        hpP1.setHp(80);
        hpP2.setHp(90);
        hpGame.setPlayerTurnCount(1, hpGame.getMaxTurns());
        hpGame.setPlayerTurnCount(2, hpGame.getMaxTurns());
        int hpWinner = hpService.determineWinner();

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
        int budgetWinner = budgetService.determineWinner();

        boolean passed = aliveWinner == 1 && hpWinner == 2 && budgetWinner == 1;

        return new ScenarioResult(
                "endgame_tiebreakers",
                "max turns with alive-count, hp, budget comparisons",
                "alive->1, hp->2, budget->1",
                "alive->" + aliveWinner + ", hp->" + hpWinner + ", budget->" + budgetWinner,
                passed,
                "At max turns, winner order is alive minions, then total HP, then remaining budget."
        );
    }

    private ScenarioResult testMaxTurnsCanEndInDraw() {
        GameService service = newService();
        GameState game = service.getGameState();

        placeMinion(game, game.getPlayer(1), 1, 1, 0, 100, "P1", "done");
        placeMinion(game, game.getPlayer(2), 8, 8, 0, 100, "P2", "done");
        game.setPlayerTurnCount(1, game.getMaxTurns());
        game.setPlayerTurnCount(2, game.getMaxTurns());
        game.getPlayer(1).setBudget(300);
        game.getPlayer(2).setBudget(300);

        int winner = service.determineWinner();
        boolean passed = winner == 3;

        return new ScenarioResult(
                "endgame_draw",
                "max turns with equal alive count, hp, and budget",
                "winner=3",
                "winner=" + winner,
                passed,
                "Backend uses winner=3 to represent a draw."
        );
    }
}
