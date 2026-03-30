import { getToolDescriptors } from "./tooling";
import type { AISDKTool, InlineToolOptions } from "./types";

export const aiSdk = {
  tools({ client, allowedTools }: InlineToolOptions): Record<string, AISDKTool> {
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
