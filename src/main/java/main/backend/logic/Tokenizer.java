package main.backend.logic;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Tokenizer {
    // กฎการตัดคำ: จับคู่คำ (Identifiers), ตัวเลข, หรือสัญลักษณ์พิเศษ
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*|\\d+|[(){}=+\\-*/%<>]");

    public static List<String> tokenize(String script) {
        List<String> tokens = new ArrayList<>();
        // ลบ Comment (ถ้ามี) และบรรทัดใหม่
        String cleanScript = script.replaceAll("#.*", "").replace("\n", " ");

        Matcher m = TOKEN_PATTERN.matcher(cleanScript);
        while (m.find()) {
            tokens.add(m.group());
        }
        return tokens;
    }
}