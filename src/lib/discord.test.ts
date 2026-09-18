import { describe, expect, it } from "vitest";
import { isValidDiscordWebhookUrl, maskDiscordWebhookUrl } from "./discord";

describe("discord webhook validation", () => {
  it("accepts discord webhook urls", () => {
    expect(
      isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwx"),
    ).toBe(true);
  });

  it("rejects non-discord urls", () => {
    expect(isValidDiscordWebhookUrl("https://example.com/api/webhooks/1/abc")).toBe(false);
    expect(isValidDiscordWebhookUrl("http://discord.com/api/webhooks/1/abc")).toBe(false);
  });

  it("masks secrets", () => {
    const masked = maskDiscordWebhookUrl(
      "https://discord.com/api/webhooks/123456789012345678/super-secret-token",
    );
    expect(masked).not.toContain("super-secret-token");
    expect(masked).toContain("****");
  });
});
