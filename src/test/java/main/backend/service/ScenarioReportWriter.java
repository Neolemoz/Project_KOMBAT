package main.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

final class ScenarioReportWriter {
    private static final Path REPORT_DIR = Path.of("target", "test-reports");

    private ScenarioReportWriter() {
    }

    static void writeReport(String category, List<ScenarioResult> results) {
        try {
            Files.createDirectories(REPORT_DIR);
            Files.writeString(REPORT_DIR.resolve(category + ".md"), toMarkdown(category, results));
            Files.writeString(REPORT_DIR.resolve(category + ".csv"), toCsv(results));
        } catch (IOException e) {
            throw new RuntimeException("Failed to write test report for " + category, e);
        }
    }

    static void printTable(String category, List<ScenarioResult> results) {
        System.out.println();
        System.out.println("=== " + category + " ===");
        System.out.println("| Scenario | Input | Expected | Actual | Result |");
        System.out.println("|---|---|---|---|---|");
        for (ScenarioResult result : results) {
            System.out.printf(
                    "| %s | %s | %s | %s | %s |%n",
                    sanitize(result.name()),
                    sanitize(result.input()),
                    sanitize(result.expected()),
                    sanitize(result.actual()),
                    result.passed() ? "PASS" : "FAIL"
            );
        }
        System.out.println();
    }

    private static String toMarkdown(String category, List<ScenarioResult> results) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(category).append(System.lineSeparator()).append(System.lineSeparator());
        builder.append("| Scenario | Input | Expected | Actual | Result |").append(System.lineSeparator());
        builder.append("|---|---|---|---|---|").append(System.lineSeparator());
        for (ScenarioResult result : results) {
            builder.append("| ")
                    .append(sanitize(result.name())).append(" | ")
                    .append(sanitize(result.input())).append(" | ")
                    .append(sanitize(result.expected())).append(" | ")
                    .append(sanitize(result.actual())).append(" | ")
                    .append(result.passed() ? "PASS" : "FAIL")
                    .append(" |")
                    .append(System.lineSeparator());
        }
        return builder.toString();
    }

    private static String toCsv(List<ScenarioResult> results) {
        StringBuilder builder = new StringBuilder();
        builder.append("scenario,input,expected,actual,result,details").append(System.lineSeparator());
        for (ScenarioResult result : results) {
            builder.append(csv(result.name())).append(",")
                    .append(csv(result.input())).append(",")
                    .append(csv(result.expected())).append(",")
                    .append(csv(result.actual())).append(",")
                    .append(csv(result.passed() ? "PASS" : "FAIL")).append(",")
                    .append(csv(result.details()))
                    .append(System.lineSeparator());
        }
        return builder.toString();
    }

    private static String sanitize(String value) {
        return value == null ? "" : value.replace("|", "/").replace("\n", " ");
    }

    private static String csv(String value) {
        String safe = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + safe + "\"";
    }
}
