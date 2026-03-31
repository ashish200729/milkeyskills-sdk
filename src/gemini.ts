import { getCapability, resolveMode, resolveRequestedMode } from "./capabilities";
import { getToolDescriptors, toCanonicalToolName, toProviderAlias } from "./tooling";
import type {
  CanonicalToolName,
  GeminiFunctionCall,
  InlineToolOptions,
  MilkeyClient,
  MilkeyToolExecution,
} from "./types";

type GeminiFunctionCallingMode = "AUTO" | "ANY" | "NONE";
type GeminiContent = {
  role: string;
  parts: unknown[];
};
type GeminiGenerateContentResponse = {
  functionCalls?: Array<{ id?: string; name: string; args?: Record<string, unknown> }>;
  candidates?: Array<{
    content?: {
      role?: string;
      parts?: unknown[];
    };
  }>;
};

async function executeFunctionCall(
  call: GeminiFunctionCall,
  client: MilkeyClient,
): Promise<MilkeyToolExecution> {
  const canonicalName = toCanonicalToolName(call.name as CanonicalToolName);
  const alias = toProviderAlias(canonicalName);
  const response = await client.callTool({
    name: canonicalName,
    arguments: call.args,
  });

  return {
    canonicalName,
    alias,
    response,
  };
}

export const gemini = {
  capabilities: {
    generateContent: getCapability("gemini.generate-content"),
    interactions: getCapability("gemini.interactions"),
  },
  resolveMode({ mode }: { mode?: "auto" | "inline" | "hosted" } = {}) {
    return resolveMode(
      "gemini.generate-content",
      resolveRequestedMode({
        mode,
        fallback: "inline",
      }),
    );
  },
  tools({
    client,
    allowedTools,
    mode,
  }: InlineToolOptions & { mode?: "auto" | "inline" | "hosted" }) {
    return gemini.generateContent.tools({ client, allowedTools, mode });
  },
  config({
    client,
    allowedTools,
    mode,
    functionCallingMode,
    allowedFunctionNames,
  }: InlineToolOptions & {
    mode?: "auto" | "inline" | "hosted";
    functionCallingMode?: GeminiFunctionCallingMode;
    allowedFunctionNames?: string[];
  }) {
    return gemini.generateContent.config({
      client,
      allowedTools,
      mode,
      functionCallingMode,
      allowedFunctionNames,
    });
  },
  extractFunctionCalls(response: GeminiGenerateContentResponse): GeminiFunctionCall[] {
    return gemini.generateContent.extractFunctionCalls(response);
  },
  responseContent(response: GeminiGenerateContentResponse): GeminiContent {
    return gemini.generateContent.responseContent(response);
  },
  followUpContents(
    contents: GeminiContent[],
    response: GeminiGenerateContentResponse,
    toolResponse: GeminiContent,
  ): GeminiContent[] {
    return gemini.generateContent.followUpContents(contents, response, toolResponse);
  },
  async parts(calls: GeminiFunctionCall[], client: MilkeyClient) {
    const parts = [];
    for (const call of calls) {
      const execution = await executeFunctionCall(call, client);
      parts.push({
        functionResponse: {
          id: call.id,
          name: execution.alias,
          response: {
            result: execution.response.structured_content ?? execution.response.content,
          },
        },
      });
    }

    return {
      role: "user",
      parts,
    };
  },
  generateContent: {
    capabilities: getCapability("gemini.generate-content"),
    resolveMode({ mode }: { mode?: "auto" | "inline" | "hosted" } = {}) {
      const requestedMode = resolveRequestedMode({
        mode,
        fallback: "inline",
      });
      return resolveMode("gemini.generate-content", requestedMode);
    },
    tools({
      client,
      allowedTools,
      mode,
    }: InlineToolOptions & { mode?: "auto" | "inline" | "hosted" }) {
      gemini.generateContent.resolveMode({ mode });
      return [
        {
          functionDeclarations: getToolDescriptors(allowedTools).map((descriptor) => ({
            name: descriptor.alias,
            description: descriptor.description,
            parameters: descriptor.inputSchema,
          })),
        },
      ];
    },
    config({
      client,
      allowedTools,
      mode,
      functionCallingMode,
      allowedFunctionNames,
    }: InlineToolOptions & {
      mode?: "auto" | "inline" | "hosted";
      functionCallingMode?: GeminiFunctionCallingMode;
      allowedFunctionNames?: string[];
    }) {
      return {
        tools: gemini.generateContent.tools({ client, allowedTools, mode }),
        ...(functionCallingMode
          ? {
              toolConfig: {
                functionCallingConfig: {
                  mode: functionCallingMode,
                  ...(allowedFunctionNames?.length
                    ? { allowedFunctionNames }
                    : {}),
                },
              },
            }
          : {}),
      };
    },
    extractFunctionCalls(response: GeminiGenerateContentResponse): GeminiFunctionCall[] {
      if (Array.isArray(response.functionCalls) && response.functionCalls.length > 0) {
        return response.functionCalls.map((call) => ({
          id: call.id,
          name: call.name,
          args: call.args ?? {},
        }));
      }

      const parts = response.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) {
        return [];
      }

      return parts
        .filter(
          (
            part,
          ): part is {
            functionCall: { id?: string; name: string; args?: Record<string, unknown> };
          } =>
            Boolean(part) &&
            typeof part === "object" &&
            part !== null &&
            "functionCall" in part,
        )
        .map((part) => ({
          id: part.functionCall.id,
          name: part.functionCall.name,
          args: part.functionCall.args ?? {},
        }));
    },
    responseContent(response: GeminiGenerateContentResponse): GeminiContent {
      const candidate = response.candidates?.[0]?.content;
      if (!candidate) {
        throw new Error("Gemini did not return candidate content.");
      }

      return {
        role: candidate.role ?? "model",
        parts: candidate.parts ?? [],
      };
    },
    followUpContents(
      contents: GeminiContent[],
      response: GeminiGenerateContentResponse,
      toolResponse: GeminiContent,
    ): GeminiContent[] {
      return [...contents, gemini.generateContent.responseContent(response), toolResponse];
    },
  },
  interactions: {
    capabilities: getCapability("gemini.interactions"),
    resolveMode({ mode }: { mode?: "auto" | "inline" | "hosted" } = {}) {
      const requestedMode = resolveRequestedMode({
        mode,
        fallback: "auto",
      });
      return resolveMode("gemini.interactions", requestedMode);
    },
    tools({
      client,
      mode,
      serverName = "milkey",
      includeAuthorization = true,
    }: {
      client: MilkeyClient;
      mode?: "auto" | "inline" | "hosted";
      serverName?: string;
      includeAuthorization?: boolean;
    }) {
      gemini.interactions.resolveMode({ mode });
      return [
        {
          type: "mcp_server",
          name: serverName,
          url: client.getMcpUrl(),
          ...(includeAuthorization
            ? {
                headers: {
                  Authorization: `Bearer ${client.apiKey}`,
                },
              }
            : {}),
        },
      ];
    },
    config({
      client,
      mode,
      serverName = "milkey",
      includeAuthorization = true,
    }: {
      client: MilkeyClient;
      mode?: "auto" | "inline" | "hosted";
      serverName?: string;
      includeAuthorization?: boolean;
    }) {
      return {
        tools: gemini.interactions.tools({
          client,
          mode,
          serverName,
          includeAuthorization,
        }),
      };
    },
  },
};
