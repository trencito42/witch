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
};

export interface AIProvider {
  analyzeIncident(input: IncidentAnalysisInput): Promise<IncidentAnalysis>;
  usage?: { inputTokens?: number; outputTokens?: number; model: string; provider: string };
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
      evidence: input.evidence.slice(0, 12).map((item) => cap(item, 300)),
      visualDifferenceRatio: input.visualDifferenceRatio,
      httpStatus: input.httpStatus,
    };
    const response = await client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You analyze website monitoring evidence for Witch. Return JSON only.
Distinguish facts from inference. Never invent a developer, deploy, or CSS cause unless evidence proves it.
If confidence is low, say so. Do not blame people. Keep the tone calm and technical.`,
        },
        { role: "user", content: JSON.stringify(payload).slice(0, env.AI_MAX_INPUT_CHARS) },
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
