public double calculateInterest(double m, double b, int t) {
    if (m < 1) return 0; // งบน้อยกว่า 1 ไม่คิดดอกเบี้ย [cite: 110]
    double r = b * Math.log10(m) * Math.log(t); [cite: 111]
    return m * r / 100.0; [cite: 109]
}