import { describe, expect, it } from "vitest";

import { internalUrl } from "./internal-url";

describe("internalUrl", () => {
  it("prefixes internal routes with the deployment base", () => {
    expect(internalUrl("about/", "/family-learning/")).toBe("/family-learning/about/");
    expect(internalUrl("/topics/luna/", "/family-learning")).toBe(
      "/family-learning/topics/luna/",
    );
  });

  it("supports root deployments and fragment links", () => {
    expect(internalUrl("#teme", "/")).toBe("/#teme");
  });
});

