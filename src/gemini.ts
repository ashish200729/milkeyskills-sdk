import { getToolDescriptors, toCanonicalToolName, toProviderAlias } from "./tooling";
import type {
  CanonicalToolName,
  GeminiFunctionCall,
  InlineToolOptions,
  MilkeyClient,
  MilkeyToolExecution,
} from "./types";

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
  tools({ allowedTools }: InlineToolOptions) {
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
};
