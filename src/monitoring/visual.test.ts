import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ImageNormalizeError, normalizeScreenshot } from "./image";
import { compareScreenshots } from "./visual";
import { extractBoundingBoxes } from "./regions";
import { MAX_SNAPSHOT_BYTES } from "@/lib/constants";

async function solidPng(width: number, height: number, color: { r: number; g: number; b: number }) {
  return sharp({
    create: { width, height, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

describe("normalizeScreenshot", () => {
  it("keeps a small png decodable", async () => {
    const input = await solidPng(200, 120, { r: 12, g: 24, b: 48 });
    const result = await normalizeScreenshot(input, 50_000);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeGreaterThan(0);
    expect(result.buffer.byteLength).toBeLessThanOrEqual(50_000);
  });

  it("recompresses oversized screenshots instead of truncating bytes", async () => {
    const noise = Buffer.alloc(1600 * 1000 * 3);
    for (let i = 0; i < noise.length; i += 1) noise[i] = (i * 37) % 256;
    const input = await sharp(noise, { raw: { width: 1600, height: 1000, channels: 3 } })
      .png({ compressionLevel: 0 })
      .toBuffer();
    expect(input.byteLength).toBeGreaterThan(40_000);
    const result = await normalizeScreenshot(input, 40_000);
    await expect(sharp(result.buffer).metadata()).resolves.toMatchObject({
      width: expect.any(Number),
      height: expect.any(Number),
    });
    expect(result.buffer.byteLength).toBeLessThanOrEqual(40_000);
  });

  it("rejects garbage bytes", async () => {
    await expect(normalizeScreenshot(Buffer.from("not-an-image"), MAX_SNAPSHOT_BYTES)).rejects.toBeInstanceOf(
      ImageNormalizeError,
    );
  });
});

describe("visual comparison", () => {
  it("extracts a bounding box for a localized change", async () => {
    const baseline = await solidPng(200, 120, { r: 255, g: 255, b: 255 });
    const currentRaw = await sharp({
      create: { width: 200, height: 120, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite([{ input: await solidPng(40, 40, { r: 0, g: 0, b: 0 }), left: 20, top: 20 }])
      .png()
      .toBuffer();
    const diff = await compareScreenshots(baseline, currentRaw, "HIGH");
    expect(diff.boundingBox).toBeTruthy();
    expect(diff.boundingBox!.width).toBeGreaterThan(0);
    expect(diff.changedPixels).toBeGreaterThan(0);
  });

  it("masks ignore regions so cookie-banner noise is not a visual incident", async () => {
    const baseline = await solidPng(200, 120, { r: 255, g: 255, b: 255 });
    const noisy = await sharp({
      create: { width: 200, height: 120, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite([{ input: await solidPng(200, 20, { r: 0, g: 0, b: 0 }), left: 0, top: 100 }])
      .png()
      .toBuffer();
    const unmasked = await compareScreenshots(baseline, noisy, "HIGH");
    const masked = await compareScreenshots(baseline, noisy, "HIGH", [
      { x: 0, y: 90, width: 200, height: 30, reason: "cookie" },
    ]);
    expect(unmasked.aboveThreshold).toBe(true);
    expect(masked.filteredChangedPixels).toBeLessThan(unmasked.changedPixels);
    expect(masked.aboveThreshold).toBe(false);
  });
});

describe("bounding boxes", () => {
  it("clusters changed cells", () => {
    const map = Buffer.alloc(40 * 20);
    for (let y = 2; y < 8; y += 1) {
      for (let x = 2; x < 8; x += 1) map[y * 40 + x] = 1;
    }
    const boxes = extractBoundingBoxes(map, 40, 20, 4);
    expect(boxes[0]?.width).toBeGreaterThan(0);
  });
});
