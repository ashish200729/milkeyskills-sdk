import { getToolDescriptors, toCanonicalToolName, toProviderAlias } from "./tooling";
import type {
  CanonicalToolName,
  InlineToolOptions,
  MilkeyClient,
  MilkeyToolExecution,
  OpenAIFunctionCallItem,
  OpenAIHostedDeliveryOptions,
} from "./types";

type Delivery = "auto" | "hosted" | "inline";

function hostedTools({
  client,
  allowedTools,
  approvalMode = "never",
  serverDescription = "Milkey skills infrastructure for resolving and fetching AI agent skills.",
  serverLabel = "milkey",
}: OpenAIHostedDeliveryOptions) {
  return [
    {
      type: "mcp",
      server_label: serverLabel,
      server_description: serverDescription,
      server_url: client.getMcpUrl(),
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
      },
      allowed_tools: allowedTools ?? [
        "resolve-skill",
        "get-skill",
        "get-skill-reference",
      ],
      require_approval: approvalMode,
    },
  ];
}

function inlineTools({ allowedTools }: InlineToolOptions) {
  return getToolDescriptors(allowedTools).map((descriptor) => ({
    type: "function",
    name: descriptor.alias,
    description: descriptor.description,
    parameters: descriptor.inputSchema,
    strict: true,
  }));
}

async function outputsFromResponse(
  response: { output?: unknown[] },
  client: MilkeyClient,
): Promise<Array<{ type: "function_call_output"; call_id: string; output: string }>> {
  const items = Array.isArray(response.output) ? response.output : [];
  const outputs: Array<{
    type: "function_call_output";
    call_id: string;
    output: string;
  }> = [];

  for (const item of items) {
    if (!isOpenAIFunctionCallItem(item)) {
      continue;
    }
    if (!item.call_id) {
      continue;
    }

    const execution = await executeOpenAIFunctionCall(item, client);
    outputs.push({
      type: "function_call_output",
      call_id: item.call_id,
      output: JSON.stringify(
        execution.response.structured_content ?? execution.response.content,
      ),
    });
  }

  return outputs;
}

async function executeOpenAIFunctionCall(
  item: OpenAIFunctionCallItem,
  client: MilkeyClient,
): Promise<MilkeyToolExecution> {
  const canonicalName = toCanonicalToolName(item.name as CanonicalToolName);
  const alias = toProviderAlias(canonicalName);
  const response = await client.callTool({
    name: canonicalName,
    arguments: JSON.parse(item.arguments),
  });

  return {
    canonicalName,
    alias,
    response,
  };
}

function isOpenAIFunctionCallItem(value: unknown): value is OpenAIFunctionCallItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.arguments === "string" &&
    typeof candidate.call_id === "string"
  );
}

export const openai = {
  responses: {
    tools({
      client,
      allowedTools,
      delivery = "auto",
      approvalMode = "never",
    }: InlineToolOptions & { delivery?: Delivery; approvalMode?: "never" | "always" }) {
      return delivery === "inline"
        ? inlineTools({ client, allowedTools })
        : hostedTools({ client, allowedTools, approvalMode });
    },
    outputs: outputsFromResponse,
  },
  chat: {
    tools({
      client,
      allowedTools,
      delivery = "inline",
    }: InlineToolOptions & { delivery?: Delivery }) {
      return delivery === "hosted"
        ? hostedTools({ client, allowedTools })
        : getToolDescriptors(allowedTools).map((descriptor) => ({
            type: "function",
            function: {
              name: descriptor.alias,
              description: descriptor.description,
              parameters: descriptor.inputSchema,
              strict: true,
            },
          }));
    },
    async messages(
      message: { tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> },
      client: MilkeyClient,
    ) {
      const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
      const messages = [];

      for (const toolCall of toolCalls) {
        const execution = await executeOpenAIFunctionCall(
          {
            call_id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          },
          client,
        );
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(
            execution.response.structured_content ?? execution.response.content,
          ),
        });
      }

      return messages;
    },
  },
  realtime: {
    tools({
      client,
      allowedTools,
      approvalMode = "never",
    }: OpenAIHostedDeliveryOptions) {
      return hostedTools({ client, allowedTools, approvalMode });
    },
  },
};
