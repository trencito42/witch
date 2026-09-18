import sharp from "sharp";
import { MAX_SNAPSHOT_BYTES } from "@/lib/constants";

export class ImageNormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageNormalizeError";
  }
}

export async function assertDecodableImage(input: Buffer) {
  try {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) {
      throw new ImageNormalizeError("Image has no dimensions");
    }
    await sharp(input).raw().toBuffer();
    return { width: meta.width, height: meta.height, format: meta.format };
  } catch (error) {
    if (error instanceof ImageNormalizeError) throw error;
    throw new ImageNormalizeError(
      error instanceof Error ? error.message : "Image is not decodable",
    );
  }
}

export async function normalizeScreenshot(
  input: Buffer,
  maxBytes = MAX_SNAPSHOT_BYTES,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  await assertDecodableImage(input);

  let width = 1440;
  let height = 900;
  let quality = 78;
  let scale = 1;
  let last: Buffer | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pipeline = sharp(input).rotate().resize({
      width: Math.max(320, Math.round(width * scale)),
      height: Math.max(240, Math.round(height * scale)),
      fit: "inside",
      withoutEnlargement: true,
    });
    const buffer =
      attempt === 0 && input.byteLength <= maxBytes
        ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
        : await pipeline.webp({ quality, effort: 4 }).toBuffer();
    const meta = await assertDecodableImage(buffer);
    last = buffer;
    width = meta.width;
    height = meta.height;
    if (buffer.byteLength <= maxBytes) {
      return { buffer, width, height };
    }
    quality = Math.max(40, quality - 10);
    scale *= 0.82;
  }

  if (last && last.byteLength <= maxBytes) {
    const meta = await assertDecodableImage(last);
    return { buffer: last, width: meta.width, height: meta.height };
  }
  throw new ImageNormalizeError("Screenshot exceeds storage limit after safe recompression");
}
