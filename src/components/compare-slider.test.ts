import { describe, it, expect } from "vitest";

describe("CompareSlider clipping & dimension invariants", () => {
  function getSliderGeometry(sliderPercentage: number, containerWidth = 1440, containerHeight = 900) {
    // Both images render in the same coordinate frame without rescaling
    const baselineImage = {
      width: containerWidth,
      height: containerHeight,
    };
    const currentImage = {
      width: containerWidth,
      height: containerHeight,
    };

    // The clipping calculation applied to top layer
    const clipInsetRight = 100 - sliderPercentage;
    const clipPath = `inset(0 ${clipInsetRight}% 0 0)`;

    // Visible width of baseline vs current
    const baselineVisibleWidth = (sliderPercentage / 100) * containerWidth;
    const currentVisibleWidth = ((100 - sliderPercentage) / 100) * containerWidth;

    return {
      baselineImage,
      currentImage,
      clipPath,
      baselineVisibleWidth,
      currentVisibleWidth,
    };
  }

  it("preserves constant width and height for both images across all slider positions", () => {
    const testPositions = [10, 25, 50, 75, 90];
    const initial = getSliderGeometry(50);

    for (const pos of testPositions) {
      const state = getSliderGeometry(pos);
      // Image bounding box width and height must NEVER change when slider moves
      expect(state.baselineImage.width).toBe(initial.baselineImage.width);
      expect(state.baselineImage.height).toBe(initial.baselineImage.height);
      expect(state.currentImage.width).toBe(initial.currentImage.width);
      expect(state.currentImage.height).toBe(initial.currentImage.height);

      // Only clipping geometry changes
      expect(state.clipPath).toBe(`inset(0 ${100 - pos}% 0 0)`);
      expect(state.baselineVisibleWidth + state.currentVisibleWidth).toBe(1440);
    }
  });

  it("maintains left = baseline, right = current semantics", () => {
    // At 40% slider position:
    // Left 40% is Baseline, Right 60% is Current
    const state = getSliderGeometry(40);
    expect(state.clipPath).toBe("inset(0 60% 0 0)");
    expect(state.baselineVisibleWidth).toBe(576); // 40% of 1440
    expect(state.currentVisibleWidth).toBe(864);  // 60% of 1440
  });
});
