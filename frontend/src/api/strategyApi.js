import { apiFetch } from "./client"

export async function validateStrategy({ gameId, minionType, strategy }) {
  return apiFetch("/api/strategy/validate", {
    method: "POST",
    body: JSON.stringify({
      gameId: gameId ?? null,
      minionType: minionType ?? "",
      strategy: strategy ?? "",
    }),
  })
}
