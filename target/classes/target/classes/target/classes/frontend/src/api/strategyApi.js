import { apiFetch } from "./client"

export async function validateStrategy({ script }) {
    return apiFetch("/api/validate", {
        method: "POST",
        body: JSON.stringify({
            script: script ?? "",
        }),
    })
}