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

    // ── helper: broadcast state หลังทุก action ──
    private void broadcast() {
        messagingTemplate.convertAndSend("/topic/game", gameService.getGameState());
    }

    // ─────────────────────────────────────────────
    // REST (ใช้ตอน setup ก่อนเกิม และ fallback)
    // ─────────────────────────────────────────────

    @PostMapping("/start")
    public GameState startGame(@RequestBody(required = false) Map<String, Object> payload) {
        String mode = (payload != null && payload.containsKey("mode"))
                ? (String) payload.get("mode")
                : "duel";
        gameService.setGameMode(mode.toLowerCase());
        gameService.init();
        broadcast();
        return gameService.getGameState();
    }

    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    @PostMapping("/minion_type")
    public boolean defineMinionType(@RequestBody Map<String, Object> payload) {
        // JSON numbers come in as Integer or Double — use Number to safely convert
        int hp      = ((Number) payload.get("hp")).intValue();
        int defense = ((Number) payload.get("defense")).intValue();
        boolean result = gameService.defineMinionType(
                (String) payload.get("name"),
                hp,
                defense,
                (String) payload.get("script")
        );
        return result;
    }

    @PostMapping("/validate")
    public Map<String, Object> validateScript(@RequestBody Map<String, String> payload) {
        try {
            gameService.validateScript(payload.get("script"));
            return Map.of("ok", true, "message", "Valid strategy");
        } catch (Exception e) {
            return Map.of("ok", false, "message", e.getMessage());
        }
    }

    @GetMapping("/winner")
    public int checkWinner() {
        return gameService.checkWinner();
    }

    // ── REST fallback endpoints ──

    @PostMapping("/endturn")
    public GameState endTurnRest() {
        gameService.endTurn();
        return gameService.getGameState();
    }

    @PostMapping("/spawn")
    public GameState spawnRest(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = ((Number) payload.get("row")).intValue();
        int col = ((Number) payload.get("col")).intValue();
        if (payload.containsKey("minionType")) {
            gameService.spawnMinion(playerId, row, col, (String) payload.get("minionType"));
        } else {
            long defense = ((Number) payload.get("defense")).longValue();
            gameService.spawnMinion(playerId, row, col, defense, (String) payload.get("strategy"));
        }
        return gameService.getGameState();
    }

    @PostMapping("/buy")
    public GameState buyRest(@RequestBody Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = ((Number) payload.get("row")).intValue();
        int col = ((Number) payload.get("col")).intValue();
        gameService.buyHex(playerId, row, col);
        return gameService.getGameState();
    }

    @PostMapping("/bot_turn")
    public GameState botTurn() {
        gameService.playBotTurn();
        return gameService.getGameState();
    }

    // ─────────────────────────────────────────────
    // WebSocket — client ส่งมาที่ /app/...
    // ─────────────────────────────────────────────

    // client ส่ง: { "row": 2, "col": 3 }
    @MessageMapping("/buy")
    public void buyHex(Map<String, Integer> payload) {
        int playerId = gameService.getCurrentPlayerId();
        gameService.buyHex(playerId, payload.get("row"), payload.get("col"));
        broadcast();
    }

    // client ส่ง: { "row": 1, "col": 1, "minionType": "Warrior" }
    //         หรือ: { "row": 1, "col": 1, "defense": 10, "strategy": "move up" }
    @MessageMapping("/spawn")
    public void spawnMinion(Map<String, Object> payload) {
        int playerId = gameService.getCurrentPlayerId();
        int row = (int) payload.get("row");
        int col = (int) payload.get("col");

        if (payload.containsKey("minionType")) {
            gameService.spawnMinion(playerId, row, col, (String) payload.get("minionType"));
        } else {
            long defense = Long.parseLong(payload.get("defense").toString());
            gameService.spawnMinion(playerId, row, col, defense, (String) payload.get("strategy"));
        }
        broadcast();
    }

    // client ส่ง: {} (ไม่มี body)
    @MessageMapping("/endturn")
    public void endTurn() {
        gameService.endTurn();
        broadcast();
    }

    // client ส่ง: { "playerId": 1, "script": "move up" }
    @MessageMapping("/strategy")
    public void submitStrategy(Map<String, Object> payload) {
        gameService.setPlayerStrategy(
                (int) payload.get("playerId"),
                (String) payload.get("script")
        );
        broadcast();
    }
}