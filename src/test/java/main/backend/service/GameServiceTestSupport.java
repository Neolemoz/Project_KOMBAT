package main.backend.service;

import main.backend.logic.ConfigLoader;
import main.backend.logic.Node;
import main.backend.logic.Parser;
import main.backend.logic.Tokenizer;
import main.backend.model.GameState;
import main.backend.model.Minion;
import main.backend.model.Player;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;

abstract class GameServiceTestSupport {
    private static final Map<String, List<ScenarioResult>> REPORT_RESULTS = new ConcurrentHashMap<>();

    protected GameService newService() {
        return new GameService(new ConfigLoader());
    }

    protected Minion placeMinion(
            GameState game,
            Player owner,
            int row,
            int col,
            long defense,
            long maxHp,
            String name,
            String script
    ) {
        Node strategy = parse(script);
        Minion minion = new Minion(owner, defense, maxHp, strategy);
        minion.setName(name);
        game.placeMinion(owner, minion, row, col);
        return minion;
    }

    protected Node parse(String script) {
        return new Parser(new Tokenizer(script).tokenize()).parse();
    }

    protected void assertPosition(Minion minion, int row, int col) {
        assertEquals(row, minion.getRow());
        assertEquals(col, minion.getCol());
    }

    protected void assertDoubleEquals(double expected, double actual) {
        assertEquals(expected, actual, 0.000001);
    }

    protected void runScenario(
            String category,
            String name,
            String input,
            String expected,
            String details,
            CheckedRunnable assertionBlock,
            ActualSupplier actualSupplier
    ) throws Exception {
        try {
            assertionBlock.run();
            recordScenario(category, new ScenarioResult(
                    name,
                    input,
                    expected,
                    actualSupplier.get(),
                    true,
                    details
            ));
        } catch (AssertionError | Exception error) {
            recordScenario(category, new ScenarioResult(
                    name,
                    input,
                    expected,
                    safeActual(actualSupplier),
                    false,
                    details + " Failure: " + error.getMessage()
            ));
            throw error;
        }
    }

    protected void writeScenarioReport(String category) {
        List<ScenarioResult> results = REPORT_RESULTS.getOrDefault(category, List.of());
        ScenarioReportWriter.printTable(category, results);
        ScenarioReportWriter.writeReport(category, results);
    }

    private void recordScenario(String category, ScenarioResult result) {
        REPORT_RESULTS
                .computeIfAbsent(category, ignored -> Collections.synchronizedList(new ArrayList<>()))
                .add(result);
    }

    private String safeActual(ActualSupplier actualSupplier) {
        try {
            return actualSupplier.get();
        } catch (Exception ignored) {
            return "Unable to capture actual result";
        }
    }

    @FunctionalInterface
    protected interface CheckedRunnable {
        void run() throws Exception;
    }

    @FunctionalInterface
    protected interface ActualSupplier {
        String get() throws Exception;
    }
}
