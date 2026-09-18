import { describe, expect, it } from "vitest";
import { incidentAnalysisSchema } from "./provider";

describe("AI analysis schema", () => {
  it("accepts structured output", () => {
    const parsed = incidentAnalysisSchema.parse({
      severity: "high",
      category: "visual",
      title: "Checkout CTA disappeared",
      summary: "The primary checkout button is no longer visible on mobile.",
      likelyCause: "A responsive layout change may have hidden the CTA.",
      evidence: ["CTA selector was present in baseline"],
      confidence: 0.91,
    });
    expect(parsed.confidence).toBe(0.91);
  });

  it("rejects invented schema", () => {
    expect(() =>
      incidentAnalysisSchema.parse({
        severity: "extreme",
        category: "visual",
        title: "x",
        summary: "y",
        likelyCause: "z",
        evidence: [],
        confidence: 2,
      }),
    ).toThrow();
  });
});
