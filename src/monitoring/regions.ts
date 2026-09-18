export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IgnoreRegion = BoundingBox & { reason?: string };

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export function extractBoundingBoxes(
  changed: Uint8Array | Buffer,
  width: number,
  height: number,
  minPixels = 48,
  maxRegions = 6,
): BoundingBox[] {
  const cell = 12;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const heat = new Uint32Array(cols * rows);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (changed[y * width + x]) {
        heat[Math.floor(y / cell) * cols + Math.floor(x / cell)] += 1;
      }
    }
  }

  const visited = new Set<string>();
  const regions: (BoundingBox & { pixels: number })[] = [];

  const neighbors = (cx: number, cy: number) => {
    const out: Array<[number, number]> = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (heat[ny * cols + nx] > 0) out.push([nx, ny]);
      }
    }
    return out;
  };

  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      if (heat[cy * cols + cx] === 0) continue;
      const start = cellKey(cx, cy);
      if (visited.has(start)) continue;
      const stack = [[cx, cy] as [number, number]];
      visited.add(start);
      let minX = cx;
      let minY = cy;
      let maxX = cx;
      let maxY = cy;
      let pixels = 0;
      while (stack.length) {
        const [x, y] = stack.pop()!;
        pixels += heat[y * cols + x];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        for (const [nx, ny] of neighbors(x, y)) {
          const key = cellKey(nx, ny);
          if (visited.has(key)) continue;
          visited.add(key);
          stack.push([nx, ny]);
        }
      }
      if (pixels >= minPixels) {
        regions.push({
          x: minX * cell,
          y: minY * cell,
          width: Math.min(width - minX * cell, (maxX - minX + 1) * cell),
          height: Math.min(height - minY * cell, (maxY - minY + 1) * cell),
          pixels,
        });
      }
    }
  }

  return regions
    .sort((a, b) => b.pixels - a.pixels)
    .slice(0, maxRegions)
    .map(({ x, y, width: w, height: h }) => ({ x, y, width: w, height: h }));
}

export function regionArea(box: BoundingBox) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

export function isMostlyLocalized(boxes: BoundingBox[], width: number, height: number) {
  if (!boxes.length) return true;
  const covered = boxes.reduce((sum, box) => sum + regionArea(box), 0);
  return covered / (width * height) < 0.35 && boxes.length <= 3;
}
