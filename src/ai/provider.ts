import { z } from "zod";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const incidentAnalysisSchema = z.object({
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  category: z.enum([
    "uptime",
    "ssl",
    "performance",
    "visual",
    "element",
    "content",
    "javascript",
    "network",
    "redirect",
    "unknown",
  ]),
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(1200),
  likelyCause: z.string().min(1).max(1200),
  evidence: z.array(z.string().max(400)).max(12),
  confidence: z.number().min(0).max(1),
  observedFacts: z.array(z.string().max(400)).max(12).optional(),
  inference: z.string().max(1200).optional(),
});

export type IncidentAnalysis = z.infer<typeof incidentAnalysisSchema>;

export type IncidentAnalysisInput = {
  siteUrl: string;
  monitorType: string;
  title: string;
  summary: string;
  category: string;
  evidence: string[];
  visualDifferenceRatio?: number;
  httpStatus?: number | null;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
  observedFacts?: string[];
  images?: { baseline?: Buffer; current?: Buffer; diff?: Buffer };
};

export interface AIProvider {
  analyzeIncident(input: IncidentAnalysisInput): Promise<IncidentAnalysis>;
  usage?: { inputTokens?: number; outputTokens?: number; model: string; provider: string };
}

function modelSupportsVision(model: string) {
  return /gpt-4o|gpt-4\.1|vision|omni/i.test(model);
}

async function maybeVisionParts(
  input: IncidentAnalysisInput,
  enabled: boolean,
): Promise<Array<{ type: "image_url"; image_url: { url: string } }>> {
  if (!enabled || !input.images) return [];
  const sharp = (await import("sharp")).default;
  const parts: Array<{ type: "image_url"; image_url: { url: string } }> = [];
  for (const [label, buffer] of [
    ["baseline", input.images.baseline],
    ["current", input.images.current],
    ["diff", input.images.diff],
  ] as const) {
    if (!buffer) continue;
    try {
      const jpeg = await sharp(buffer)
        .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 42 })
        .toBuffer();
      if (jpeg.byteLength > 180_000) continue;
      parts.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${jpeg.toString("base64")}` },
      });
    } catch {
      logger.warn({ label }, "skipped undecodable AI image");
    }
  }
  return parts.slice(0, 3);
}

function cap(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

class OpenAICompatibleProvider implements AIProvider {
  usage?: AIProvider["usage"];
  constructor(
    private apiKey: string,
    private model: string,
    private baseURL?: string,
    private providerName = "openai",
  ) {}

  async analyzeIncident(input: IncidentAnalysisInput): Promise<IncidentAnalysis> {
    const env = getEnv();
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey, baseURL: this.baseURL });
    const payload = {
      siteUrl: cap(input.siteUrl, 300),
      monitorType: input.monitorType,
      title: cap(input.title, 180),
      summary: cap(input.summary, 800),
      category: input.category,
      observedFacts: (input.observedFacts ?? input.evidence).slice(0, 12).map((item) => cap(item, 300)),
      evidence: input.evidence.slice(0, 12).map((item) => cap(item, 300)),
      visualDifferenceRatio: input.visualDifferenceRatio,
      boundingBox: input.boundingBox ?? null,
      httpStatus: input.httpStatus,
      note: "Images are optional. If none are attached you cannot see pixels. Do not invent visual details.",
    };
    const vision = await maybeVisionParts(input, env.AI_VISION_ENABLED !== false && modelSupportsVision(this.model));
    const userContent = vision.length
      ? [{ type: "text" as const, text: JSON.stringify(payload).slice(0, env.AI_MAX_INPUT_CHARS) }, ...vision]
      : JSON.stringify(payload).slice(0, env.AI_MAX_INPUT_CHARS);
    const response = await client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You analyze website monitoring evidence for Witch. Return JSON only.
Separate observedFacts from inference. Never invent a deploy, developer, or CSS cause unless evidence proves it.
If you were not given screenshots, do not claim you inspected pixels. Keep confidence aligned to evidence.`,
        },
        { role: "user", content: userContent },
      ],
    });
    this.usage = {
      provider: this.providerName,
      model: this.model,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");
    return incidentAnalysisSchema.parse(JSON.parse(raw));
  }
}

export function getAIProvider(): AIProvider | null {
  const env = getEnv();
  if (!env.AI_API_KEY) return null;
  return new OpenAICompatibleProvider(
    env.AI_API_KEY,
    env.AI_MODEL,
    env.AI_BASE_URL,
    env.AI_PROVIDER,
  );
}

export async function analyzeIncidentSafe(input: IncidentAnalysisInput) {
  const provider = getAIProvider();
  if (!provider) return null;
  try {
    const analysis = await provider.analyzeIncident(input);
    return { analysis, usage: provider.usage };
  } catch (error) {
    logger.error({ err: error }, "AI analysis failed");
    return null;
  }
}
