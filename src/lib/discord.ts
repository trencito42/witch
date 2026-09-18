export function isValidDiscordWebhookUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:") return false;
    if (!["discord.com", "discordapp.com"].includes(url.hostname)) return false;
    return /^\/api\/webhooks\/\d+\/[\w-]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function maskDiscordWebhookUrl(input: string): string {
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/");
    const id = parts[3] ?? "";
    return `https://${url.hostname}/api/webhooks/${id.slice(0, 6)}…/****`;
  } catch {
    return "discord webhook";
  }
}

export async function sendDiscordWebhook(input: {
  webhookUrl: string;
  title: string;
  description: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
  url?: string;
}) {
  if (!isValidDiscordWebhookUrl(input.webhookUrl)) {
    throw new Error("Invalid Discord webhook URL");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(input.webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Witch",
        embeds: [
          {
            title: input.title.slice(0, 180),
            description: input.description.slice(0, 1500),
            color: input.color,
            url: input.url,
            fields: input.fields.slice(0, 8).map((field) => ({
              name: field.name.slice(0, 80),
              value: field.value.slice(0, 400),
              inline: field.inline ?? false,
            })),
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`Discord webhook HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
