import pino from "pino";

const secretKeys = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "smtp_pass",
  "smtp_password",
];

function redact(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (secretKeys.some((part) => key.toLowerCase().includes(part))) {
        output[key] = "[redacted]";
      } else {
        output[key] = redact(nested);
      }
    }
    return output;
  }
  return value;
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "witch" },
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "headers.cookie",
      "headers.authorization",
    ],
    remove: true,
  },
  formatters: {
    log(object) {
      return redact(object) as Record<string, unknown>;
    },
  },
});

export function childLogger(bindings: Record<string, string | number | undefined>) {
  return logger.child(bindings);
}
