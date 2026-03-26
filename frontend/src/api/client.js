export async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    })

    const text = await response.text()
    let data = text // เก็บค่าดั้งเดิมเป็นข้อความไว้ก่อน

    if (text) {
        try {
            data = JSON.parse(text) // พยายามแปลงเป็น JSON
        } catch (error) {
            // ถ้าแปลงไม่ได้ (เช่น Spring Boot ส่งมาเป็น Plain Text ธรรมดา) ก็ปล่อย data ให้เป็นข้อความเหมือนเดิม
        }
    }

    if (!response.ok) {
        const message =
            (data && (data.error || data.message)) ||
            (typeof data === 'string' ? data : `Request failed with status ${response.status}`)
        throw new Error(message)
    }

    return data
}