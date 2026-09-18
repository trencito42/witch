export function trustedOrigins(): string[] {
  const extras = (process.env.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\/$/, ""));

  return [
    ...new Set([
      "https://witch.pw",
      "https://www.witch.pw",
      "http://witch.pw",
      "http://localhost:3003",
      "http://127.0.0.1:3003",
      ...configured,
      ...extras,
    ]),
  ];
}
