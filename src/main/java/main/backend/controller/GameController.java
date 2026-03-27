package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @PostMapping("/start")
    public GameState startGame(@RequestBody(required = false) Map<String, Object> payload) {
        String mode = payload == null ? "duel" : parseString(payload, "mode", false, "duel");
        gameService.setGameMode(mode.toLowerCase());
        gameService.init();
        gameService.clearDefinedMinionTypes();
        return gameService.getGameState();
    }

    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    @PostMapping("/minion_type")
    public boolean defineMinionType(@RequestBody Map<String, Object> payload) {
        boolean result = gameService.defineMinionType(
                parseString(payload, "name", true, null),
                parseInt(payload, "hp"),
                parseInt(payload, "defense"),
                parseString(payload, "script", true, null)
        );
        return result;
    }

    @PostMapping({"/validate", "/strategy/validate"})
    public Map<String, Object> validateScript(@RequestBody Map<String, String> payload) {
        String strategy = payload == null ? null : payload.get("strategy");
        if ((strategy == null || strategy.isBlank()) && payload != null) {
            strategy = payload.get("script");
        }
        return gameService.validateStrategyInput(strategy);
    }

    @GetMapping("/winner")
    public int checkWinner() {
        return gameService.checkWinner();
    }

    @PostMapping("/endturn")
    public GameState endTurnRest() {
        gameService.endTurn();
        return gameService.getGameState();
    }

    @PostMapping("/buy")
    public GameState buyHexRest(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        gameService.buyHex(playerId, parseInt(payload, "row"), parseInt(payload, "col"));
        return gameService.getGameState();
    }

    @PostMapping("/spawn")
    public GameState spawnMinionRest(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = parseInt(payload, "row");
        int col = parseInt(payload, "col");
        if (payload.containsKey("minionType")) {
            gameService.spawnMinion(playerId, row, col, parseString(payload, "minionType", true, null));
        } else {
            long defense = parseLong(payload, "defense");
            gameService.spawnMinion(
                    playerId,
                    row,
                    col,
                    defense,
                    parseString(payload, "strategy", true, null),
                    parseString(payload, "name", false, "Minion")
            );
        }
        return gameService.getGameState();
    }

    @PostMapping("/bot-turn")
    public GameState botTurnRest() {
        gameService.playBotTurn();
        return gameService.getGameState();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequest(IllegalArgumentException error) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error.getMessage());
        body.put("message", error.getMessage());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        return body;
    }

    private String parseString(Map<String, Object> payload, String key, boolean required, String defaultValue) {
        if (payload == null || !payload.containsKey(key) || payload.get(key) == null) {
            if (required) throw new IllegalArgumentException("Missing required field: " + key);
            return defaultValue;
        }
        String value = String.valueOf(payload.get(key)).trim();
        if (required && value.isBlank()) {
            throw new IllegalArgumentException("Field must not be blank: " + key);
        }
        return value.isBlank() ? defaultValue : value;
    }

    private int parseInt(Map<String, Object> payload, String key) {
        long value = parseLong(payload, key);
        if (value < Integer.MIN_VALUE || value > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Field out of range for int: " + key);
        }
        return (int) value;
    }

    private long parseLong(Map<String, Object> payload, String key) {
        if (payload == null || !payload.containsKey(key) || payload.get(key) == null) {
            throw new IllegalArgumentException("Missing required field: " + key);
        }
        Object raw = payload.get(key);
        if (raw instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Invalid numeric field: " + key);
        }
    }
}
