import {
  MilkeyConfigError,
  MilkeyProblemError,
  MilkeyResponseError,
  MilkeyTimeoutError,
} from "./errors";
import { toCanonicalToolName } from "./tooling";
import type {
  GetSkillInput,
  GetSkillReferenceInput,
  MilkeyClient,
  MilkeyClientConfig,
  ProblemDetails,
  RequestOptions,
  ResolveSkillInput,
  SkillReferenceListResponse,
  SkillReferenceResponse,
  SkillResponse,
  ToolCallRequest,
  ToolCallResponse,
  ToolDefinition,
  ResolveSkillResponse,
} from "./types";

const defaultTimeoutMs = 30_000;

export function createClient(config: MilkeyClientConfig): MilkeyClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = normalizeApiKey(config.apiKey);

  const fetchImpl = config.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new MilkeyConfigError("A global fetch implementation is required.");
  }

  const timeoutMs = normalizeTimeoutMs(config.timeoutMs);
  const defaultHeaders = config.headers ?? {};
  const userAgent = config.userAgent ?? "@milkey/sdk";

  async function request<T>(
    path: string,
    init: RequestInit,
    options?: RequestOptions,
  ): Promise<T> {
    const timeoutController = new AbortController();
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeoutController.signal])
      : timeoutController.signal;
    const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);

    try {
      const response = await fetchImpl(new URL(path, `${baseUrl}/`), {
        ...init,
        signal,
        headers: {
          Accept: "application/json, application/problem+json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          ...defaultHeaders,
          ...options?.headers,
          ...init.headers,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/problem+json")) {
          throw new MilkeyProblemError(JSON.parse(body) as ProblemDetails);
        }
        throw new MilkeyResponseError(response.status, body);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (timeoutController.signal.aborted && !options?.signal?.aborted) {
        throw new MilkeyTimeoutError(timeoutMs, path);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    baseUrl,
    apiKey,
    timeoutMs,
    getMcpUrl() {
      return `${baseUrl}/mcp`;
    },
    async listTools(options) {
      const payload = await request<{ items: ToolDefinition[] }>(
        "v1/tools",
        { method: "GET" },
        options,
      );
      return payload.items;
    },
    async callTool(requestBody, options) {
      const payload = await request<ToolCallResponse>(
        "v1/tools/call",
        {
          method: "POST",
          body: JSON.stringify({
            name: toCanonicalToolName(requestBody.name),
            arguments: requestBody.arguments ?? {},
          } satisfies ToolCallRequest),
        },
        options,
      );
      return payload;
    },
    async resolveSkill(input, options) {
      return request<ResolveSkillResponse>(
        "v1/skill-resolutions",
        {
          method: "POST",
          body: JSON.stringify(
            stripUndefined({
              query: input.query,
              category: input.category,
            }),
          ),
        },
        options,
      );
    },
    async getSkill(input, options) {
      return request<SkillResponse>(
        buildQueryPath(`v1/skills/${encodeURIComponent(input.slug)}`, {
          topic: input.topic,
          tokens: input.tokens,
        }),
        { method: "GET" },
        options,
      );
    },
    async listSkillReferences(slug, options) {
      return request<SkillReferenceListResponse>(
        `v1/skills/${encodeURIComponent(slug)}/references`,
        { method: "GET" },
        options,
      );
    },
    async getSkillReference(input, options) {
      const [skillSlug, referenceSlug] = splitReferenceSlug(input.slug);
      return request<SkillReferenceResponse>(
        buildQueryPath(
          `v1/skills/${encodeURIComponent(skillSlug)}/references/${encodeURIComponent(
            referenceSlug,
          )}`,
          {
            tokens: input.tokens,
          },
        ),
        { method: "GET" },
        options,
      );
    },
  };
}

function normalizeBaseUrl(rawBaseUrl: unknown): string {
  if (typeof rawBaseUrl !== "string") {
    throw new MilkeyConfigError("Milkey baseUrl is required.");
  }
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) {
    throw new MilkeyConfigError("Milkey baseUrl is required.");
  }
  return trimmed.replace(/\/+$/, "");
}

function normalizeApiKey(rawApiKey: unknown): string {
  if (typeof rawApiKey !== "string") {
    throw new MilkeyConfigError("Milkey API key is required.");
  }

  const trimmed = rawApiKey.trim();
  if (!trimmed) {
    throw new MilkeyConfigError("Milkey API key is required.");
  }

  return trimmed;
}

function normalizeTimeoutMs(timeoutMs: number | undefined): number {
  if (timeoutMs === undefined) {
    return defaultTimeoutMs;
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new MilkeyConfigError(
      `Milkey timeoutMs must be a positive number. Received: ${timeoutMs}`,
    );
  }

  return timeoutMs;
}

function buildQueryPath(
  path: string,
  query: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const serialized = search.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function splitReferenceSlug(fullSlug: string): [string, string] {
  const index = fullSlug.indexOf("/");
  if (index <= 0 || index === fullSlug.length - 1) {
    throw new MilkeyConfigError(
      `Reference slug must be in the format skill-slug/reference-slug. Received: ${fullSlug}`,
    );
  }
  return [fullSlug.slice(0, index), fullSlug.slice(index + 1)];
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
