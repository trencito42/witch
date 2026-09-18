export function isNextNavigationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}
