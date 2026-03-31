import { getCapability, resolveMode, resolveRequestedMode } from "./capabilities";
import { getToolDescriptors, toCanonicalToolName, toProviderAlias } from "./tooling";
import type {
  CanonicalToolName,
  InlineToolOptions,
  MilkeyClient,
  MilkeyToolExecution,
} from "./types";

type Delivery = "auto" | "hosted" | "inline";
const mcpBeta = "mcp-client-2025-04-04";

async function executeToolUse(
  block: { id: string; name: string; input: Record<string, unknown> },
  client: MilkeyClient,
): Promise<MilkeyToolExecution> {
  const canonicalName = toCanonicalToolName(block.name as CanonicalToolName);
  const alias = toProviderAlias(canonicalName);
  const response = await client.callTool({
    name: canonicalName,
    arguments: block.input,
  });

  return {
    canonicalName,
    alias,
    response,
  };
}

export const anthropic = {
  mcpBeta,
  capabilities: getCapability("anthropic.messages"),
  resolveMode({
    mode,
    delivery,
  }: {
    mode?: Delivery;
    delivery?: Delivery;
  } = {}) {
    const requestedMode = resolveRequestedMode({
      mode,
      delivery,
      fallback: "auto",
    });
    return resolveMode("anthropic.messages", requestedMode);
  },
  tools({
    client,
    allowedTools,
    mode,
    delivery = "auto",
  }: InlineToolOptions & { mode?: Delivery; delivery?: Delivery }) {
    const resolved = anthropic.resolveMode({ mode, delivery });
    if (resolved.selectedMode !== "inline") {
      return {
        mcp_servers: [
          {
            type: "url",
            url: client.getMcpUrl(),
            name: "milkey",
            authorization_token: client.apiKey,
          },
        ],
        tools: [
          {
            type: "mcp_toolset",
            mcp_server_name: "milkey",
            default_config: {
              enabled: false,
            },
            configs: Object.fromEntries(
              getToolDescriptors(allowedTools).map((descriptor) => [
                descriptor.canonicalName,
                { enabled: true },
              ]),
            ),
          },
        ],
      };
    }

    return {
      tools: getToolDescriptors(allowedTools).map((descriptor) => ({
        name: descriptor.alias,
        description: descriptor.description,
        input_schema: descriptor.inputSchema,
      })),
    };
  },
  config({
    client,
    allowedTools,
    mode,
    delivery = "auto",
  }: InlineToolOptions & { mode?: Delivery; delivery?: Delivery }) {
    const resolved = anthropic.resolveMode({ mode, delivery });
    const config = anthropic.tools({ client, allowedTools, mode, delivery });
    return resolved.selectedMode === "inline"
      ? config
      : {
          betas: [mcpBeta],
          ...config,
        };
  },
  async messages(
    blocks: Array<{ id: string; name: string; input: Record<string, unknown> }>,
    client: MilkeyClient,
  ) {
    const results = [];
    for (const block of blocks) {
      const execution = await executeToolUse(block, client);
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(
          execution.response.structured_content ?? execution.response.content,
        ),
      });
    }
    return results;
  },
};
