import { describe, expect, it, vi } from "vitest";

import { createClient } from "../client";
import { MilkeyToolCallError } from "../errors";
import { openai } from "../openai";

describe("openai adapters", () => {
  it("builds hosted response tools", () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    const tools = openai.responses.tools({ client });
    const hostedTool = tools[0] as { type: string; server_url: string };

    expect(tools).toHaveLength(1);
    expect(hostedTool.type).toBe("mcp");
    expect(hostedTool.server_url).toBe("https://api.milkey.ai/mcp");
  });

  it("builds inline chat tools with provider-safe aliases", () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    const tools = openai.chat.tools({ client });
    const firstTool = tools[0] as { function: { name: string } };

    expect(tools).toHaveLength(3);
    expect(firstTool.function.name).toBe("milkey_resolve_skill");
  });

  it("builds tool messages from assistant tool calls", async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      return new Response(
        JSON.stringify({
          tool: body.name,
          content: "ok",
          structured_content: { result: "ok", tool: body.name },
          is_error: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });

    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: fetchMock as typeof fetch,
    });

    const messages = await openai.chat.messages(
      {
        tool_calls: [
          {
            id: "call_123",
            function: {
              name: "milkey_resolve_skill",
              arguments: JSON.stringify({ query: "postgres performance" }),
            },
          },
        ],
      },
      client,
    );

    expect(messages).toEqual([
      {
        role: "tool",
        tool_call_id: "call_123",
        content: JSON.stringify({
          result: "ok",
          tool: "resolve-skill",
        }),
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("converts response function calls into function_call_output items", async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      return new Response(
        JSON.stringify({
          tool: body.name,
          content: "ok",
          structured_content: { slug: "database-optimizer" },
          is_error: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });

    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: fetchMock as typeof fetch,
    });

    const outputs = await openai.responses.outputs(
      {
        output: [
          {
            call_id: "call_456",
            name: "milkey_resolve_skill",
            arguments: JSON.stringify({ query: "postgres" }),
          },
        ],
      },
      client,
    );

    expect(outputs).toEqual([
      {
        type: "function_call_output",
        call_id: "call_456",
        output: JSON.stringify({ slug: "database-optimizer" }),
      },
    ]);
  });

  it("throws a typed error when tool arguments are invalid JSON", async () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    await expect(
      openai.chat.messages(
        {
          tool_calls: [
            {
              id: "call_bad_json",
              function: {
                name: "milkey_resolve_skill",
                arguments: "{bad json",
              },
            },
          ],
        },
        client,
      ),
    ).rejects.toBeInstanceOf(MilkeyToolCallError);
  });

  it("throws a typed error when tool arguments decode to a non-object", async () => {
    const client = createClient({
      baseUrl: "https://api.milkey.ai",
      apiKey: "mk_sk_test_secret",
      fetch: vi.fn() as unknown as typeof fetch,
    });

    await expect(
      openai.responses.outputs(
        {
          output: [
            {
              call_id: "call_array",
              name: "milkey_resolve_skill",
              arguments: JSON.stringify(["postgres"]),
            },
          ],
        },
        client,
      ),
    ).rejects.toBeInstanceOf(MilkeyToolCallError);
  });
});
