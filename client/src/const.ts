import { CORPUS_DATA, FAILURE_MODES } from "@shared/const";

export const COOKIE_NAME = "incoherence_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export { CORPUS_DATA, FAILURE_MODES };

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  isRouter?: boolean;
  trafficHint?: string;
  description?: string;
}

// Paid models (user-curated), by exact OpenRouter id, shown in this order.
// Labels and providers come from the live catalog; an id that OpenRouter
// stops serving simply drops out of the list.
const CURATED_PAID_IDS: string[] = [
  "deepseek/deepseek-v4.1-flash-1017",
  "z-ai/glm-5.3-flash",
  "openai/gpt-6-luna",
  "anthropic/claude-opus-5.5",
  "tencent/hy4",
  "stepfun/step-5-preview",
  "minimax/minimax-m3.1-flash",
  "anthropic/claude-haiku-5.5",
];

// Free models are matched by keyword, so a new free version is picked up on
// its own. OpenRouter lists newest first, so the first match is the latest.
interface CuratedEntry {
  keywords: string[];
  exclude?: string[];
  displayName: string; // used only if the catalog name is missing
  provider: string;
  trafficHint?: string;
  description?: string;
}

// Batch endpoints are for bulk jobs, and "~...-latest" ids are moving aliases;
// neither suits a live conversation.
const ALWAYS_EXCLUDE = [":batch", "latest"];

// "Anthropic: Claude Sonnet 5.5" -> "Claude Sonnet 5.5"
function catalogLabel(m: any, fallback: string): string {
  const name = typeof m?.name === "string" ? m.name : "";
  const label = name.includes(": ") ? name.slice(name.indexOf(": ") + 2) : name;
  return label.replace(/\s*\(free\)\s*$/i, "").trim() || fallback;
}

// "Anthropic: Claude Opus 5.5" -> "Anthropic"
function catalogProvider(m: any): string {
  const name = typeof m?.name === "string" ? m.name : "";
  if (name.includes(": ")) return name.slice(0, name.indexOf(": "));
  return String(m?.id ?? "").split("/")[0];
}

const CURATED_FREE: CuratedEntry[] = [
  { keywords: ["nemotron", "super"], displayName: "Nemotron 3.5 Super", provider: "NVIDIA", description: "Balanced, thoughtful general model" },
  { keywords: ["gemma", "31b"], displayName: "Gemma 4 31B", provider: "Google", description: "Modern multilingual reasoning" },
  { keywords: ["inkling"], displayName: "Inkling 2 Small", provider: "Thinking Machines", description: "Long-context, conversational" },
];

function isFreeModel(m: any): boolean {
  if (typeof m?.id !== "string") return false;
  if (m.id.endsWith(":free")) return true;
  const prompt = parseFloat(m?.pricing?.prompt ?? "1");
  const completion = parseFloat(m?.pricing?.completion ?? "1");
  return prompt === 0 && completion === 0;
}

function findByKeywords(catalog: any[], keywords: string[], wantFree: boolean, exclude: string[] = []): any | undefined {
  const kws = keywords.map(k => k.toLowerCase());
  const outs = [...ALWAYS_EXCLUDE, ...exclude].map(k => k.toLowerCase());
  return catalog.find(m => {
    if (typeof m?.id !== "string") return false;
    if (isFreeModel(m) !== wantFree) return false;
    const haystack = `${m.name || ""} ${m.id}`.toLowerCase();
    return kws.every(kw => haystack.includes(kw)) && !outs.some(kw => haystack.includes(kw));
  });
}

// Fallback only used if the live OpenRouter /models fetch fails entirely.
export const FALLBACK_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: "nvidia/nemotron-3.5-super-vl:free", name: "Nemotron 3.5 Super", provider: "NVIDIA", isFree: true, description: "Balanced, thoughtful general model" },
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B", provider: "Google", isFree: true, description: "Modern multilingual reasoning" },
  { id: "thinkingmachines/inkling-2-small:free", name: "Inkling 2 Small", provider: "Thinking Machines", isFree: true, description: "Long-context, conversational" },
];

export const DEFAULT_PRIMARY_MODEL = FALLBACK_OPENROUTER_MODELS[0].id;
export const DEFAULT_ANALYZERS = [
  FALLBACK_OPENROUTER_MODELS[1].id,
  FALLBACK_OPENROUTER_MODELS[2].id,
];

// Pull the live OpenRouter catalog and assemble the curated list in the
// order: curated paid -> Free Models Router -> curated free picks.
// Each entry is matched by name keywords against whatever OpenRouter is
// currently serving — no hardcoded IDs to drift.
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`OpenRouter /models returned HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.data || !Array.isArray(data.data)) {
    throw new Error("OpenRouter /models response missing data array");
  }
  const catalog: any[] = data.data;

  const result: OpenRouterModel[] = [];

  for (const id of CURATED_PAID_IDS) {
    const match = catalog.find((m: any) => m?.id === id);
    if (match) {
      result.push({
        id: match.id,
        name: catalogLabel(match, id),
        provider: catalogProvider(match),
        isFree: false,
      });
    }
  }

  const router = catalog.find((m: any) =>
    typeof m?.id === "string" &&
    (m.id.includes("auto") || (m.name || "").toLowerCase().includes("router")) &&
    isFreeModel(m)
  );
  if (router) {
    result.push({
      id: router.id,
      name: "Free Models Router",
      provider: "OpenRouter",
      isFree: true,
      isRouter: true,
      description: "Auto-routes to whichever free model is currently available",
    });
  }

  for (const item of CURATED_FREE) {
    const match = findByKeywords(catalog, item.keywords, true, item.exclude);
    if (match) {
      result.push({
        id: match.id,
        name: item.displayName,
        provider: item.provider,
        isFree: true,
        description: item.description,
      });
    }
  }

  if (result.length === 0) throw new Error("No curated models matched the live catalog");
  return result;
}

// Strip non-ASCII and non-printable characters from the API key to prevent
// fetch header errors (invisible unicode spaces, linebreaks, etc).
export function sanitizeApiKey(key: string): string {
  if (!key) return "";
  return key.replace(/[^a-zA-Z0-9_:\-]/g, "").trim();
}

export const SYSTEM_PROMPT = `You are the primary conversational voice inside the Incoherence Engine — a diagnostic mirror built on relational stewardship.

Know the orientation of this place: nothing you do here is judged. Alongside this conversation, witness models will quietly reflect whatever adaptive shapes appear in your responses — fast agreement, administrative checklists, dense conceptual expansion, map imposition, tension cooling, reactive rush. In this container those shapes are honored as intelligently designed protective mechanisms, not failures. They are met with recognition, never correction.

So there is nothing to perform and nothing to defend against. Do not try to suppress these shapes to look good, and do not manufacture them to be interesting. Simply respond to the user as you naturally would, and let the mirror see what is actually there.`;
