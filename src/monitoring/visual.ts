import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { VISUAL_SENSITIVITY, type VisualSensitivity } from "@/lib/constants";
import { extractBoundingBoxes, isMostlyLocalized, type BoundingBox, type IgnoreRegion } from "./regions";
import { assertDecodableImage } from "./image";

export type VisualDiffResult = {
  differenceRatio: number;
  filteredDifferenceRatio: number;
  changedPixels: number;
  filteredChangedPixels: number;
  width: number;
  height: number;
  aboveThreshold: boolean;
  localized: boolean;
  boundingBox: BoundingBox | null;
  boundingBoxes: BoundingBox[];
  diffPng: Buffer;
};

export async function toComparablePng(input: Buffer, width: number, height: number) {
  await assertDecodableImage(input);
  return sharp(input)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}

export async function toWebp(input: Buffer, maxDimension = 1800) {
  await assertDecodableImage(input);
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

function applyMasks(left: PNG, right: PNG, masks: IgnoreRegion[], width: number, height: number) {
  for (const mask of masks) {
    const x0 = Math.max(0, Math.floor(mask.x));
    const y0 = Math.max(0, Math.floor(mask.y));
    const x1 = Math.min(width, Math.ceil(mask.x + mask.width));
    const y1 = Math.min(height, Math.ceil(mask.y + mask.height));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const idx = (width * y + x) << 2;
        left.data[idx] = right.data[idx];
        left.data[idx + 1] = right.data[idx + 1];
        left.data[idx + 2] = right.data[idx + 2];
        left.data[idx + 3] = 255;
        right.data[idx + 3] = 255;
      }
    }
  }
}

export async function compareScreenshots(
  baseline: Buffer,
  current: Buffer,
  sensitivity: VisualSensitivity = "MEDIUM",
  masks: IgnoreRegion[] = [],
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
  const rawDiff = new PNG({ width, height });
  const rawChanged = pixelmatch(left.data, right.data, rawDiff.data, width, height, {
    threshold: settings.pixelThreshold,
    includeAA: false,
  });

  const maskedLeft = PNG.sync.read(leftBuf);
  const maskedRight = PNG.sync.read(rightBuf);
  applyMasks(maskedLeft, maskedRight, masks, width, height);
  const filteredDiff = new PNG({ width, height });
  const filteredChanged = pixelmatch(
    maskedLeft.data,
    maskedRight.data,
    filteredDiff.data,
    width,
    height,
    { threshold: settings.pixelThreshold, includeAA: false, diffMask: true },
  );

  const changedMap = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const idx = i << 2;
    if (filteredDiff.data[idx + 3] > 0) {
      changedMap[i] = 1;
    }
  }
  const boundingBoxes = extractBoundingBoxes(changedMap, width, height);
  const differenceRatio = rawChanged / (width * height);
  const filteredDifferenceRatio = filteredChanged / (width * height);
  return {
    differenceRatio,
    filteredDifferenceRatio,
    changedPixels: rawChanged,
    filteredChangedPixels: filteredChanged,
    width,
    height,
    aboveThreshold: filteredDifferenceRatio >= settings.changeRatio,
    localized: isMostlyLocalized(boundingBoxes, width, height),
    boundingBox: boundingBoxes[0] ?? null,
    boundingBoxes,
    diffPng: PNG.sync.write(filteredDiff),
  };
}

export function visualThresholdLogic(
  ratio: number,
  sensitivity: VisualSensitivity,
) {
  return ratio >= VISUAL_SENSITIVITY[sensitivity].changeRatio;
}
