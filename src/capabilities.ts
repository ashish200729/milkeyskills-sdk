import { MilkeyConfigError } from "./errors";

export type AdapterMode = "auto" | "hosted" | "inline";
export type ResolvedMode = Exclude<AdapterMode, "auto">;
export type CapabilityVariant =
  | "openai.chat"
  | "openai.responses"
  | "openai.realtime"
  | "anthropic.messages"
  | "gemini.generate-content"
  | "gemini.interactions"
  | "ai-sdk.inline";

export interface AdapterCapability {
  provider: "openai" | "anthropic" | "gemini" | "ai-sdk";
  variant: CapabilityVariant;
  supportsHostedMcp: boolean;
  supportsInlineTools: boolean;
  recommendedMode: ResolvedMode;
  fallbackMode?: ResolvedMode;
  notes: string[];
}

export interface ModeResolution {
  requestedMode: AdapterMode;
  selectedMode: ResolvedMode;
  capability: AdapterCapability;
}

const capabilityTable: Record<CapabilityVariant, AdapterCapability> = {
  "openai.chat": {
    provider: "openai",
    variant: "openai.chat",
    supportsHostedMcp: true,
    supportsInlineTools: true,
    recommendedMode: "inline",
    fallbackMode: "hosted",
    notes: [
      "Inline is the most portable path across OpenAI-compatible chat providers.",
      "Hosted MCP is best supported on the Responses API.",
    ],
  },
  "openai.responses": {
    provider: "openai",
    variant: "openai.responses",
    supportsHostedMcp: true,
    supportsInlineTools: true,
    recommendedMode: "hosted",
    fallbackMode: "inline",
    notes: [
      "Responses is the best native hosted MCP path for OpenAI.",
    ],
  },
  "openai.realtime": {
    provider: "openai",
    variant: "openai.realtime",
    supportsHostedMcp: true,
    supportsInlineTools: false,
    recommendedMode: "hosted",
    notes: [
      "Realtime currently uses hosted MCP configuration.",
    ],
  },
  "anthropic.messages": {
    provider: "anthropic",
    variant: "anthropic.messages",
    supportsHostedMcp: true,
    supportsInlineTools: true,
    recommendedMode: "hosted",
    fallbackMode: "inline",
    notes: [
      "Hosted MCP is the best native Anthropic path when beta support is enabled.",
    ],
  },
  "gemini.generate-content": {
    provider: "gemini",
    variant: "gemini.generate-content",
    supportsHostedMcp: false,
    supportsInlineTools: true,
    recommendedMode: "inline",
    notes: [
      "Use official Gemini function calling for generateContent.",
    ],
  },
  "gemini.interactions": {
    provider: "gemini",
    variant: "gemini.interactions",
    supportsHostedMcp: true,
    supportsInlineTools: false,
    recommendedMode: "hosted",
    notes: [
      "Remote MCP in Gemini is available on the Interactions API.",
      "Requires Streamable HTTP servers and currently does not work with Gemini 3 models.",
    ],
  },
  "ai-sdk.inline": {
    provider: "ai-sdk",
    variant: "ai-sdk.inline",
    supportsHostedMcp: false,
    supportsInlineTools: true,
    recommendedMode: "inline",
    notes: [
      "Inline tools are the simplest zero-dependency path inside AI SDK flows.",
    ],
  },
};

export function getCapability(variant: CapabilityVariant): AdapterCapability {
  return capabilityTable[variant];
}

export function resolveMode(
  variant: CapabilityVariant,
  requestedMode: AdapterMode = "auto",
): ModeResolution {
  const capability = getCapability(variant);

  if (requestedMode === "auto") {
    return {
      requestedMode,
      selectedMode: capability.recommendedMode,
      capability,
    };
  }

  if (requestedMode === "hosted" && !capability.supportsHostedMcp) {
    throw new MilkeyConfigError(
      `${variant} does not support hosted mode. Recommended mode is ${capability.recommendedMode}.`,
    );
  }

  if (requestedMode === "inline" && !capability.supportsInlineTools) {
    throw new MilkeyConfigError(
      `${variant} does not support inline mode. Recommended mode is ${capability.recommendedMode}.`,
    );
  }

  return {
    requestedMode,
    selectedMode: requestedMode,
    capability,
  };
}

export function resolveRequestedMode({
  mode,
  delivery,
  fallback,
}: {
  mode?: AdapterMode;
  delivery?: AdapterMode;
  fallback: AdapterMode;
}): AdapterMode {
  if (mode && delivery && mode !== delivery) {
    throw new MilkeyConfigError(
      `Conflicting mode values received: mode=${mode}, delivery=${delivery}. Pass only one or keep them aligned.`,
    );
  }

  return mode ?? delivery ?? fallback;
}
