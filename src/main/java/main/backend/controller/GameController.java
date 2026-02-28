package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @PostMapping("/start")
    public GameState startGame() {
        gameService.init();
        return gameService.getGameState();
    }

    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    @PostMapping("/buy")
    public boolean buyHex(@RequestBody Map<String, Integer> payload) {
        int playerId = payload.getOrDefault("playerId", gameService.getCurrentPlayerId());
        return gameService.buyHex(playerId, payload.get("row"), payload.get("col"));
    }

    @PostMapping("/spawn")
    public boolean spawnMinion(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = (int) payload.get("row");
        int col = (int) payload.get("col");
        if (payload.containsKey("minionType")) {
            return gameService.spawnMinion(playerId, row, col, (String) payload.get("minionType"));
        } else {
            long defense = Long.parseLong(payload.get("defense").toString());
            return gameService.spawnMinion(playerId, row, col, defense, (String) payload.get("strategy"));
        }
    }

    @PostMapping("/minion_type")
    public boolean defineMinionType(@RequestBody Map<String, Object> payload) {
        return gameService.defineMinionType(
                (String) payload.get("name"),
                (int)    payload.get("hp"),
                (int)    payload.get("defense"),
                (String) payload.get("script")
        );
    }

    @PostMapping("/endturn")
    public GameState endTurn() {
        gameService.endTurn();
        return gameService.getGameState();
    }

    @GetMapping("/winner")
    public int checkWinner() {
        return gameService.checkWinner();
    }

    @PostMapping("/strategy")
    public GameState submitStrategy(@RequestBody Map<String, Object> payload) {
        gameService.setPlayerStrategy((int) payload.get("playerId"), (String) payload.get("script"));
        return gameService.getGameState();
    }
}