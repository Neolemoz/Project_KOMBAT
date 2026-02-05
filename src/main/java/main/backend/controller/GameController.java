package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // อนุญาตให้หน้าเว็บยิงเข้ามาได้
public class GameController {

    @Autowired
    private GameService gameService;

    // 1. ส่งข้อมูลกระดานให้หน้าเว็บ
    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    // 2. รับคำสั่งซื้อพื้นที่
    @PostMapping("/buy")
    public String buyHex(@RequestParam int playerId, @RequestParam int row, @RequestParam int col) {
        boolean success = gameService.buyHex(playerId, row, col);
        return success ? "SUCCESS" : "FAIL";
    }

    // 3. จบเทิร์น (คำนวณเงิน + บอทเดิน)
    @PostMapping("/end-turn")
    public String endTurn() {
        gameService.endTurn();
        return "TURN ENDED";
    }

    @PostMapping("/reset")
    public String resetGame() {
        gameService.init(); // เรียกฟังก์ชัน init เพื่อล้างกระดานใหม่
        return "GAME RESET";
    }
}