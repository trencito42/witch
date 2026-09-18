import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { VISUAL_SENSITIVITY, type VisualSensitivity } from "@/lib/constants";

export type VisualDiffResult = {
  differenceRatio: number;
  changedPixels: number;
  width: number;
  height: number;
  aboveThreshold: boolean;
  diffPng: Buffer;
};

export async function toComparablePng(input: Buffer, width: number, height: number) {
  return sharp(input)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}

export async function toWebp(input: Buffer, maxDimension = 1800) {
  return sharp(input)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 72 })
    .toBuffer();
}

export async function imageMeta(input: Buffer) {
  const info = await sharp(input).metadata();
  return {
    width: info.width ?? 0,
    height: info.height ?? 0,
  };
}

export async function compareScreenshots(
  baseline: Buffer,
  current: Buffer,
  sensitivity: VisualSensitivity = "MEDIUM",
): Promise<VisualDiffResult> {
  const settings = VISUAL_SENSITIVITY[sensitivity];
  const currentMeta = await sharp(current).metadata();
  const width = currentMeta.width ?? 1440;
  const height = currentMeta.height ?? 900;
  const [leftBuf, rightBuf] = await Promise.all([
    toComparablePng(baseline, width, height),
    toComparablePng(current, width, height),
  ]);
  const left = PNG.sync.read(leftBuf);
  const right = PNG.sync.read(rightBuf);
  const diff = new PNG({ width, height });
  const changedPixels = pixelmatch(left.data, right.data, diff.data, width, height, {
    threshold: settings.pixelThreshold,
    includeAA: false,
  });
  const differenceRatio = changedPixels / (width * height);
  return {
    differenceRatio,
    changedPixels,
    width,
    height,
    aboveThreshold: differenceRatio >= settings.changeRatio,
    diffPng: PNG.sync.write(diff),
  };
}

export function visualThresholdLogic(
  ratio: number,
  sensitivity: VisualSensitivity,
) {
  return ratio >= VISUAL_SENSITIVITY[sensitivity].changeRatio;
}
