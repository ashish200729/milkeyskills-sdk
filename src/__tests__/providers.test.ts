import { describe, expect, it, vi } from "vitest";

import { aiSdk } from "../ai-sdk";
import { anthropic } from "../anthropic";
import { createClient } from "../client";
import { gemini } from "../gemini";
import { openai } from "../openai";

describe("provider adapters", () => {
  const client = createClient({
    baseUrl: "https://api.milkey.ai",
    apiKey: "mk_sk_test_secret",
    fetch: vi.fn(async (_url, init) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      return new Response(
        JSON.stringify({
          tool: body.name,
          content: "ok",
          structured_content: { result: "ok" },
          is_error: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as unknown as typeof fetch,
  });

  it("builds anthropic hosted config", () => {
    const config = anthropic.tools({ client });
    const firstTool = config.tools?.[0] as { type: string } | undefined;

    expect(config.mcp_servers).toHaveLength(1);
    expect(config.mcp_servers?.[0]?.url).toBe("https://api.milkey.ai/mcp");
    expect(firstTool?.type).toBe("mcp_toolset");
  });

  it("builds anthropic request config with required MCP beta", () => {
    const config = anthropic.config({ client, delivery: "hosted" }) as {
      betas: string[];
      mcp_servers?: Array<{ url: string }>;
    };

    expect(config.betas).toEqual(["mcp-client-2025-04-04"]);
    expect(config.mcp_servers?.[0]?.url).toBe("https://api.milkey.ai/mcp");
  });

  it("builds gemini function declarations", () => {
    const tools = gemini.tools({ client });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.functionDeclarations).toHaveLength(3);
    expect(tools[0]?.functionDeclarations?.[0]?.name).toBe(
      "milkey_resolve_skill",
    );
  });

  it("builds gemini official SDK config", () => {
    const config = gemini.config({
      client,
      allowedTools: ["resolve-skill"],
      functionCallingMode: "ANY",
      allowedFunctionNames: ["milkey_resolve_skill"],
    });

    expect(config.tools).toHaveLength(1);
    expect(config.toolConfig).toEqual({
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: ["milkey_resolve_skill"],
      },
    });
  });

  it("builds gemini interactions hosted config", () => {
    const config = gemini.interactions.config({ client, mode: "auto" });

    expect(config.tools).toEqual([
      {
        type: "mcp_server",
        name: "milkey",
        url: "https://api.milkey.ai/mcp",
        headers: {
          Authorization: "Bearer mk_sk_test_secret",
        },
      },
    ]);
  });

  it("builds ai sdk tools and executes through the Milkey client", async () => {
    const tools = aiSdk.tools({ client });
    const result = await tools.milkey_resolve_skill.execute({
      query: "postgres",
    });

    expect(Object.keys(tools)).toContain("milkey_resolve_skill");
    expect(result).toEqual({ result: "ok" });
  });

  it("resolves provider best-path modes predictably", () => {
    expect(openai.responses.resolveMode().selectedMode).toBe("hosted");
    expect(openai.chat.resolveMode().selectedMode).toBe("inline");
    expect(anthropic.resolveMode().selectedMode).toBe("hosted");
    expect(gemini.generateContent.resolveMode().selectedMode).toBe("inline");
    expect(gemini.interactions.resolveMode().selectedMode).toBe("hosted");
    expect(aiSdk.resolveMode().selectedMode).toBe("inline");
  });

  it("builds anthropic tool results from tool use blocks", async () => {
    const results = await anthropic.messages(
      [
        {
          id: "toolu_123",
          name: "milkey_resolve_skill",
          input: { query: "postgres" },
        },
      ],
      client,
    );

    expect(results).toEqual([
      {
        type: "tool_result",
        tool_use_id: "toolu_123",
        content: JSON.stringify({ result: "ok" }),
      },
    ]);
  });

  it("builds gemini function response parts", async () => {
    const result = await gemini.parts(
      [
        {
          id: "gem_call_1",
          name: "milkey_resolve_skill",
          args: { query: "postgres" },
        },
      ],
      client,
    );

    expect(result).toEqual({
      role: "user",
      parts: [
        {
          functionResponse: {
            id: "gem_call_1",
            name: "milkey_resolve_skill",
            response: {
              result: { result: "ok" },
            },
          },
        },
      ],
    });
  });

  it("extracts gemini function calls from response helpers", () => {
    const response = {
      functionCalls: [
        {
          id: "gem_call_2",
          name: "milkey_resolve_skill",
          args: { query: "postgres" },
        },
      ],
    };

    expect(gemini.extractFunctionCalls(response)).toEqual([
      {
        id: "gem_call_2",
        name: "milkey_resolve_skill",
        args: { query: "postgres" },
      },
    ]);
  });

  it("builds gemini follow-up contents with model response and tool response", async () => {
    const toolResponse = await gemini.parts(
      [
        {
          id: "gem_call_3",
          name: "milkey_resolve_skill",
          args: { query: "postgres" },
        },
      ],
      client,
    );

    const contents = gemini.followUpContents(
      [
        {
          role: "user",
          parts: [{ text: "Find a skill for postgres" }],
        },
      ],
      {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                {
                  functionCall: {
                    id: "gem_call_3",
                    name: "milkey_resolve_skill",
                    args: { query: "postgres" },
                  },
                },
              ],
            },
          },
        ],
      },
      toolResponse,
    );

    expect(contents).toEqual([
      {
        role: "user",
        parts: [{ text: "Find a skill for postgres" }],
      },
      {
        role: "model",
        parts: [
          {
            functionCall: {
              id: "gem_call_3",
              name: "milkey_resolve_skill",
              args: { query: "postgres" },
            },
          },
        ],
      },
      toolResponse,
    ]);
  });

  it("rejects unsupported provider/mode combinations", () => {
    expect(() => gemini.tools({ client, mode: "hosted" })).toThrowError(
      "gemini.generate-content does not support hosted mode.",
    );
    expect(() => aiSdk.tools({ client, mode: "hosted" })).toThrowError(
      "ai-sdk.inline does not support hosted mode.",
    );
  });
});
