package main.backend.logic;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ConfigLoader {
    private Map<String, Double> settings = new HashMap<>();

    public void loadConfig(String filePath) {
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("=");
                if (parts.length == 2) {
                    settings.put(parts[0].trim(), Double.parseDouble(parts[1].trim()));
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public double get(String key) { return settings.getOrDefault(key, 0.0); }
    public long getLong(String key) { return settings.getOrDefault(key, 0.0).longValue(); }
}