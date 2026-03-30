import type {
  CanonicalToolName,
  ProviderToolAlias,
  PublicToolName,
  ToolDescriptor,
} from "./types";

const descriptors: ToolDescriptor[] = [
  {
    canonicalName: "resolve-skill",
    alias: "milkey_resolve_skill",
    description:
      "Resolve the best matching Milkey skill for a technical query using the authenticated Milkey account.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query using concise technical keywords such as stack, domain, and task.",
        },
        category: {
          type: "string",
          description: "Optional Milkey skill category preference.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    canonicalName: "get-skill",
    alias: "milkey_get_skill",
    description:
      "Fetch the authoritative content for a Milkey skill previously selected by resolve-skill.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Exact Milkey skill slug.",
        },
        topic: {
          type: "string",
          description: "Optional sub-topic within the skill.",
        },
        tokens: {
          type: "integer",
          description: "Optional token budget between 1000 and 20000.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    canonicalName: "get-skill-reference",
    alias: "milkey_get_skill_reference",
    description:
      "Fetch a specific reference document for a Milkey skill using the full reference slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Full reference slug in the format skill-slug/reference-slug.",
        },
        tokens: {
          type: "integer",
          description: "Optional token budget between 1000 and 20000.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
];

const byCanonical = new Map<CanonicalToolName, ToolDescriptor>();
const byAlias = new Map<ProviderToolAlias, ToolDescriptor>();

for (const descriptor of descriptors) {
  byCanonical.set(descriptor.canonicalName, descriptor);
  byAlias.set(descriptor.alias, descriptor);
}

export function getToolDescriptors(
  allowedTools?: CanonicalToolName[],
): ToolDescriptor[] {
  if (!allowedTools || allowedTools.length === 0) {
    return [...descriptors];
  }

  return allowedTools.map((name) => {
    const descriptor = byCanonical.get(name);
    if (!descriptor) {
      throw new Error(`Unsupported Milkey tool: ${name}`);
    }
    return descriptor;
  });
}

export function toCanonicalToolName(name: PublicToolName): CanonicalToolName {
  if (byCanonical.has(name as CanonicalToolName)) {
    return name as CanonicalToolName;
  }

  const descriptor = byAlias.get(name as ProviderToolAlias);
  if (!descriptor) {
    throw new Error(`Unsupported Milkey tool alias: ${name}`);
  }
  return descriptor.canonicalName;
}

export function toProviderAlias(name: PublicToolName): ProviderToolAlias {
  if (byAlias.has(name as ProviderToolAlias)) {
    return name as ProviderToolAlias;
  }

  const descriptor = byCanonical.get(name as CanonicalToolName);
  if (!descriptor) {
    throw new Error(`Unsupported Milkey tool name: ${name}`);
  }
  return descriptor.alias;
}
