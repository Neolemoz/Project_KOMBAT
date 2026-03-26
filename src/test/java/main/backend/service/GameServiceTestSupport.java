package main.backend.service;

import main.backend.logic.ConfigLoader;
import main.backend.logic.Node;
import main.backend.logic.Parser;
import main.backend.logic.Tokenizer;
import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

abstract class GameServiceTestSupport {

    protected GameService newService() {
        return new GameService(new ConfigLoader());
    }

    protected Minion placeMinion(GameState game, Player owner, int row, int col, long defense, long maxHp, String name, String script) {
        Node strategy = parse(script);
        Minion minion = new Minion(owner, defense, maxHp, strategy);
        minion.setName(name);
        game.placeMinion(owner, minion, row, col);
        return minion;
    }

    protected Node parse(String script) {
        return new Parser(new Tokenizer(script).tokenize()).parse();
    }

    protected String formatNumber(double value) {
        if (Math.abs(value - Math.rint(value)) < 0.000001) {
            return Long.toString(Math.round(value));
        }
        return String.format("%.6f", value);
    }

    protected void finalizeReport(String category, List<ScenarioResult> results) {
        ScenarioReportWriter.printTable(category, results);
        ScenarioReportWriter.writeReport(category, results);
        for (ScenarioResult result : results) {
            assertTrue(result.passed(), () -> result.name() + " failed: " + result.details());
        }
    }
}
