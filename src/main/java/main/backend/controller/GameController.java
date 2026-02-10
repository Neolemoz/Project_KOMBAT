package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // อนุญาตให้หน้าเว็บเรียกใช้ API ได้
public class GameController {

    @Autowired
    private GameService gameService;

    // 1. เริ่มเกมใหม่
    @PostMapping("/start")
    public GameState startGame() {
        gameService.init();
        return gameService.getGameState();
    }

    // 2. ดึงสถานะเกมปัจจุบัน (ใช้ Polling จากหน้าเว็บ)
    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    // 3. ซื้อพื้นที่
    @PostMapping("/buy")
    public boolean buyHex(@RequestBody Map<String, Integer> payload) {
        int playerId = 1; // สมมติว่าเป็น Player 1 เสมอ (ในเฟสนี้)
        // หรือรับ playerId มาจาก payload ก็ได้
        return gameService.buyHex(playerId, payload.get("row"), payload.get("col"));
    }

    // 4. วาง Minion (แบบระบุ Type)
    @PostMapping("/spawn")
    public boolean spawnMinion(@RequestBody Map<String, Object> payload) {
        int playerId = 1;
        int row = (int) payload.get("row");
        int col = (int) payload.get("col");

        // เช็คว่าส่งมาเป็น typeName หรือ manual stats
        if (payload.containsKey("minionType")) {
            String typeName = (String) payload.get("minionType");
            return gameService.spawnMinion(playerId, row, col, typeName);
        } else {
            // กรณีส่งค่ามาเอง (Defense + Code)
            long defense = Long.parseLong(payload.get("defense").toString());
            String code = (String) payload.get("strategy");
            return gameService.spawnMinion(playerId, row, col, defense, code);
        }
    }

    // 5. กำหนดชนิด Minion (เรียกครั้งเดียวตอนเริ่ม หรือตอน Config)
    @PostMapping("/minion_type")
    public boolean defineMinionType(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        int hp = (int) payload.get("hp");
        int defense = (int) payload.get("defense");
        String script = (String) payload.get("script");

        return gameService.defineMinionType(name, hp, defense, script);
    }

    // 6. จบเทิร์น
    @PostMapping("/endturn")
    public GameState endTurn() {
        gameService.endTurn();
        return gameService.getGameState();
    }

    // 7. ตรวจสอบผู้ชนะ
    @GetMapping("/winner")
    public int checkWinner() {
        return gameService.checkWinner();
    }
}