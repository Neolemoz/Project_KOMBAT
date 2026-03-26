package main.backend.service;

record ScenarioResult(
        String name,
        String input,
        String expected,
        String actual,
        boolean passed,
        String details
) {
}
