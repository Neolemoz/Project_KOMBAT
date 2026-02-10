package main.backend.logic;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ConfigLoader {
    private Map<String, Long> settings = new HashMap<>();

    public void loadConfig(String filePath) {
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                // ข้ามบรรทัดว่างหรือ comment
                if (line.trim().isEmpty() || line.trim().startsWith("#") || line.trim().startsWith("[")) continue;

                String[] parts = line.split("=");
                if (parts.length == 2) {
                    // Parse เป็น Long
                    settings.put(parts[0].trim(), Long.parseLong(parts[1].trim()));
                }
            }
        } catch (IOException | NumberFormatException e) {
            e.printStackTrace();
        }
    }

    public long get(String key) { return settings.getOrDefault(key, 0L); }
    // แถม method สำหรับดึงค่า int ถ้าจำเป็น
    public int getInt(String key) { return settings.getOrDefault(key, 0L).intValue(); }
}