import { apiFetch } from "./client"

export async function validateStrategy({ strategy }) {
  const data = await apiFetch("/api/strategy/validate", {
    method: "POST",
    body: JSON.stringify({
      strategy: strategy ?? "",
    }),
  })

  const isValid = data?.valid ?? data?.ok ?? false
  const errorMessage = data?.error ?? data?.message ?? null

  return {
    ...data,
    valid: isValid,
    ok: isValid,
    message: errorMessage ?? (isValid ? "Valid strategy" : null),
    error: errorMessage,
  }
}
