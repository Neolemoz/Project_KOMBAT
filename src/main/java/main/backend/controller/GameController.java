package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RestController           // ยังคง REST ไว้ด้วยสำหรับ /api/state และ /api/start
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private void broadcast() {
        messagingTemplate.convertAndSend("/topic/game", gameService.getGameState());
    }

    @PostMapping("/start")
    public GameState startGame(@RequestBody(required = false) Map<String, Object> payload) {
        String mode = (payload != null && payload.containsKey("mode"))
                ? (String) payload.get("mode")
                : "duel";
        gameService.setGameMode(mode.toLowerCase());
        gameService.init();
        gameService.clearDefinedMinionTypes();
        broadcast();
        return gameService.getGameState();
    }

    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    @PostMapping("/minion_type")
    public boolean defineMinionType(@RequestBody Map<String, Object> payload) {
        boolean result = gameService.defineMinionType(
                (String) payload.get("name"),
                (int)    payload.get("hp"),
                (int)    payload.get("defense"),
                (String) payload.get("script")
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

    // REST endpoints (fallback เมื่อ WebSocket ยังไม่ ready)
    @PostMapping("/endturn")
    public GameState endTurnRest() {
        gameService.endTurn();
        broadcast();
        return gameService.getGameState();
    }

    @PostMapping("/buy")
    public GameState buyHexRest(@RequestBody Map<String, Integer> payload) {
        int playerId = gameService.getCurrentPlayerId();
        gameService.buyHex(playerId, payload.get("row"), payload.get("col"));
        broadcast();
        return gameService.getGameState();
    }

    @PostMapping("/spawn")
    public GameState spawnMinionRest(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = (int) payload.get("row");
        int col = (int) payload.get("col");
        if (payload.containsKey("minionType")) {
            gameService.spawnMinion(playerId, row, col, (String) payload.get("minionType"));
        } else {
            long defense = Long.parseLong(payload.get("defense").toString());
            gameService.spawnMinion(
                    playerId,
                    row,
                    col,
                    defense,
                    (String) payload.get("strategy"),
                    payload.get("name") == null ? "Minion" : payload.get("name").toString()
            );
        }
        broadcast();
        return gameService.getGameState();
    }

    @PostMapping("/bot-turn")
    public GameState botTurnRest() {
        gameService.playBotTurn();
        broadcast();
        return gameService.getGameState();
    }

    @MessageMapping("/buy")
    public void buyHex(Map<String, Integer> payload) {
        int playerId = gameService.getCurrentPlayerId();
        gameService.buyHex(playerId, payload.get("row"), payload.get("col"));
        broadcast();
    }

    @MessageMapping("/spawn")
    public void spawnMinion(Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = (int) payload.get("row");
        int col = (int) payload.get("col");

        if (payload.containsKey("minionType")) {
            gameService.spawnMinion(playerId, row, col, (String) payload.get("minionType"));
        } else {
            long defense = Long.parseLong(payload.get("defense").toString());
            gameService.spawnMinion(
                    playerId,
                    row,
                    col,
                    defense,
                    (String) payload.get("strategy"),
                    payload.get("name") == null ? "Minion" : payload.get("name").toString()
            );
        }
        broadcast();
    }

    @MessageMapping("/endturn")
    public void endTurn() {
        gameService.endTurn();
        broadcast();
    }

    @MessageMapping("/strategy")
    public void submitStrategy(Map<String, Object> payload) {
        gameService.setPlayerStrategy(
                (int) payload.get("playerId"),
                (String) payload.get("script")
        );
        broadcast();
    }
}
