package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // สำคัญ: ต้อง import อันนี้
import org.springframework.web.bind.annotation.*;

import java.util.Map; // สำคัญ: ต้อง import อันนี้

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @GetMapping("/state")
    public GameState getGameState() {
        return gameService.getGameState();
    }

    @PostMapping("/buy")
    public ResponseEntity<String> buyHex(@RequestParam int playerId, @RequestParam int row, @RequestParam int col) {
        boolean success = gameService.buyHex(playerId, row, col);
        if (success) {
            return ResponseEntity.ok("SUCCESS");
        } else {
            return ResponseEntity.badRequest().body("FAIL: Invalid Position or Insufficient Funds");
        }
    }

    // --- ส่วนที่เพิ่มใหม่สำหรับกำหนดชนิด Minion ---
    @PostMapping("/define-minion")
    public ResponseEntity<String> defineMinion(@RequestBody Map<String, Object> payload) {
        try {
            // รับค่าจาก JSON
            String name = (String) payload.get("name");
            // ใช้ parseDouble แล้ว cast เป็น int เพื่อความชัวร์ (บางที JS ส่งมาเป็นทศนิยม)
            int hp = (int) Double.parseDouble(payload.get("hp").toString());
            int def = (int) Double.parseDouble(payload.get("defense").toString());
            String script = (String) payload.get("script");

            boolean success = gameService.defineMinionType(name, hp, def, script);

            if (success) {
                return ResponseEntity.ok("DEFINED: " + name);
            } else {
                return ResponseEntity.badRequest().body("ERROR: Max Types Reached or Invalid Script");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("ERROR: Invalid JSON Payload");
        }
    }

    // --- ส่วนที่แก้ไข: Spawn Minion แบบระบุชนิด ---
    @PostMapping("/spawn")
    public ResponseEntity<String> spawnMinion(@RequestParam int playerId,
                                              @RequestParam int row,
                                              @RequestParam int col,
                                              @RequestParam String typeName) {
        // เรียกใช้ function spawnMinion ใน GameService (ต้องแก้ GameService ให้รับ typeName ด้วยนะ)
        boolean success = gameService.spawnMinion(playerId, row, col, typeName);

        if (success) {
            return ResponseEntity.ok("SPAWNED");
        } else {
            return ResponseEntity.badRequest().body("FAIL: Invalid Pos, No Money, Max Spawns, or Unknown Type");
        }
    }

    @PostMapping("/end-turn")
    public String endTurn() {
        gameService.endTurn();
        return "TURN ENDED";
    }

    @PostMapping("/reset")
    public String resetGame() {
        gameService.init();
        return "GAME RESET";
    }
}