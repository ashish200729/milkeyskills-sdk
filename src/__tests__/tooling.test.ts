import { describe, expect, it } from "vitest";

import { toCanonicalToolName, toProviderAlias } from "../tooling";

describe("tooling", () => {
  it("maps canonical names to provider aliases", () => {
    expect(toProviderAlias("resolve-skill")).toBe("milkey_resolve_skill");
    expect(toProviderAlias("get-skill")).toBe("milkey_get_skill");
    expect(toProviderAlias("get-skill-reference")).toBe(
      "milkey_get_skill_reference",
    );
  });

  it("maps provider aliases back to canonical names", () => {
    expect(toCanonicalToolName("milkey_resolve_skill")).toBe("resolve-skill");
    expect(toCanonicalToolName("milkey_get_skill")).toBe("get-skill");
    expect(toCanonicalToolName("milkey_get_skill_reference")).toBe(
      "get-skill-reference",
    );
  });
});
