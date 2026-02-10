package main.backend.controller;

import main.backend.model.GameState;
import main.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // เพิ่ม import นี้
import org.springframework.web.bind.annotation.*;

import java.util.Map; // เพิ่ม import นี้

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

    // แก้ไข: เปลี่ยน return type เป็น ResponseEntity เพื่อระบุ Status Code ได้
    @PostMapping("/buy")
    public ResponseEntity<String> buyHex(@RequestParam int playerId, @RequestParam int row, @RequestParam int col) {
        boolean success = gameService.buyHex(playerId, row, col);
        if (success) {
            return ResponseEntity.ok("SUCCESS");
        } else {
            return ResponseEntity.badRequest().body("FAIL");
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

    // --- ส่วนที่เพิ่มใหม่สำหรับ Minion Type ---

    @PostMapping("/define-minion")
    public ResponseEntity<String> defineMinion(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            int hp = Integer.parseInt(payload.get("hp").toString()); // กันเหนียวกรณีส่งมาเป็น String/Long
            int def = Integer.parseInt(payload.get("defense").toString());
            String script = (String) payload.get("script");

            boolean success = gameService.defineMinionType(name, hp, def, script);
            return success ? ResponseEntity.ok("DEFINED") : ResponseEntity.badRequest().body("ERROR: Limit Reached or Invalid Script");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ERROR: Invalid Payload");
        }
    }

    // แก้ไข: ลบ /spawn อันเก่าออก แล้วเหลือแค่อันนี้อันเดียวที่รับ typeName
    @PostMapping("/spawn")
    public ResponseEntity<String> spawnMinion(@RequestParam int playerId,
                                              @RequestParam int row,
                                              @RequestParam int col,
                                              @RequestParam String typeName) {
        // เรียกใช้ function spawnMinion แบบใหม่ใน GameService
        boolean success = gameService.spawnMinion(playerId, row, col, typeName);

        if (success) {
            return ResponseEntity.ok("SPAWNED");
        } else {
            return ResponseEntity.badRequest().body("FAIL: Invalid Pos, No Money, or Max Spawns Reached");
        }
    }
}