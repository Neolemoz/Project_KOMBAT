/**
 * Strategy validation — delegates to backend POST /api/strategy/validate.
 * Free-text strategy UX does not imply runtime behavior on the server;
 * see TODO in validateStrategy if gameplay integration is added later.
 */
import { validateStrategy as validateStrategyApi } from "../api/strategyApi"

/**
 * @param {{ gameId?: string|null, minionType?: string, strategy?: string }} payload
 * @returns {Promise<unknown>} Parsed JSON body from backend (shape depends on server)
 */
export async function validateStrategy(payload) {
  return validateStrategyApi(payload)
}
