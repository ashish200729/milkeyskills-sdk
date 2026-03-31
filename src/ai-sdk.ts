import { getCapability, resolveMode, resolveRequestedMode } from "./capabilities";
import { getToolDescriptors } from "./tooling";
import type { AISDKTool, InlineToolOptions } from "./types";

export const aiSdk = {
  capabilities: getCapability("ai-sdk.inline"),
  resolveMode({ mode }: { mode?: "auto" | "inline" | "hosted" } = {}) {
    return resolveMode(
      "ai-sdk.inline",
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
  }: InlineToolOptions & { mode?: "auto" | "inline" | "hosted" }): Record<string, AISDKTool> {
    aiSdk.resolveMode({ mode });
    return Object.fromEntries(
      getToolDescriptors(allowedTools).map((descriptor) => [
        descriptor.alias,
        {
          description: descriptor.description,
          inputSchema: descriptor.inputSchema,
          execute: async (input: unknown) => {
            const response = await client.callTool({
              name: descriptor.canonicalName,
              arguments:
                input && typeof input === "object"
                  ? (input as Record<string, unknown>)
                  : {},
            });
            return response.structured_content ?? response.content;
          },
        },
      ]),
    );
  },
};
