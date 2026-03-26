package main.backend.logic;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Tokenizer {
    private String input;

    public Tokenizer(String input) {
        this.input = input;
    }

    public List<String> tokenize() {
        List<String> tokens = new ArrayList<>();

        // Regex:
        // Group 1: Comment (# ตามด้วยตัวอักษรอะไรก็ได้จนจบเกี่ยว)
        // Group 2: Identifier (ตัวแปร/คำสั่ง)
        // Group 3: Number (ตัวเลข)
        // Group 4: Operator/Symbol
        String regex = "(#.*)|([a-zA-Z][a-zA-Z0-9]*)|(\\d+)|([=+\\-*/%^(){}])";

        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(input);
        int lastEnd = 0;

        while (matcher.find()) {
            String skipped = input.substring(lastEnd, matcher.start());
            if (!skipped.isBlank()) {
                throw new RuntimeException("Unexpected token: " + skipped.trim());
            }

            // ถ้าเจอ Group 1 (Comment) ให้ข้ามไป ไม่ต้องเพิ่มเข้า tokens
            if (matcher.group(1) != null) {
                lastEnd = matcher.end();
                continue;
            }

            // ดึงเฉพาะส่วนที่ตรงกับ Regex (Group 2, 3 หรือ 4)
            String token = matcher.group();
            tokens.add(token);
            lastEnd = matcher.end();
        }

        String trailing = input.substring(lastEnd);
        if (!trailing.isBlank()) {
            throw new RuntimeException("Unexpected token: " + trailing.trim());
        }

        return tokens;
    }
}
