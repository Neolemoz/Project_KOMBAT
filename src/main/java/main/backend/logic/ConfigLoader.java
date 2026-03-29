package main.backend.logic;

import org.springframework.stereotype.Component; // เพิ่ม import
import java.util.HashMap;
import java.util.Map;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

@Component
public class ConfigLoader {
    private Map<String, Long> config = new HashMap<>();

    public ConfigLoader() {
        load("config.txt");
    }

    public void load(String filename) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("=");
                if (parts.length == 2) {
                    config.put(parts[0].trim(), Long.parseLong(parts[1].trim()));
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
            // ควรกำหนดค่า Default กันตายไว้ถ้าโหลดไฟล์ไม่ได้
            config.put("init_budget", 10000L);
            config.put("max_turns", 40L);
            config.put("max_spawns", 10L);
            config.put("spawn_cost", 100L);
            config.put("init_hp", 1000L);
            config.put("hex_purchase_cost", 100L);
            config.put("interest_pct", 5L);
            config.put("turn_budget", 100L);
            config.put("max_budget", 50000L);
        }
    }

    public long get(String key) {
        return config.getOrDefault(key, 0L);
    }
}
