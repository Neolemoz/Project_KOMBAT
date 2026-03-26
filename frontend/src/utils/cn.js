/** Join class names; skips falsy values. */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ")
}
