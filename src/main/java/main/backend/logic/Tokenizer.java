package main.backend.logic;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Tokenizer {
    private String input;

    // Constructor รับค่า String (โค้ดคำสั่ง)
    public Tokenizer(String input) {
        this.input = input;
    }

    // เมธอดแยกคำ (Tokenize)
    public List<String> tokenize() {
        List<String> tokens = new ArrayList<>();

        // Regex สำหรับจับคู่:
        // 1. คำสั่ง/ตัวแปร (ตัวอักษรนำหน้า): [a-zA-Z_] ตามด้วย \w*
        // 2. ตัวเลข: \d+
        // 3. สัญลักษณ์ต่างๆ: + - * / % ^ = ( ) { } < >
        String regex = "([a-zA-Z_]\\w*)|(\\d+)|([+=\\-*/%^(){}<>])";

        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(input);

        while (matcher.find()) {
            // ดึงเฉพาะส่วนที่ตรงกับ Regex (ตัดช่องว่างทิ้งอัตโนมัติ)
            String token = matcher.group();
            tokens.add(token);
        }

        return tokens;
    }
}