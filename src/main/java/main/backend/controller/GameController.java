package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // อนุญาตให้หน้าเว็บ (JS) ยิงเข้ามาได้
public class GameController {

    @Autowired
    private GameService gameService;

    // 1. หน้าบ้านขอดูกระดาน (GET /api/state)
    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
        // Spring จะแปลง Object GameState เป็น JSON ให้เองอัตโนมัติ
    }

    // 2. หน้าบ้านสั่งซื้อพื้นที่ (POST /api/buy)
    @PostMapping("/buy")
    public String buyHex(@RequestParam int playerId, @RequestParam int row, @RequestParam int col) {
        boolean success = gameService.buyHex(playerId, row, col);
        return success ? "SUCCESS" : "FAIL";
    }

    // 3. หน้าบ้านกดจบเทิร์น (POST /api/end-turn)
    @PostMapping("/end-turn")
    public String endTurn() {
        gameService.endTurn();
        return "TURN ENDED";
    }
}