import { describe, expect, it } from "vitest";
import decisions from "./data/atelier-visual-qa-decisions.v1.json";
import manual from "./data/atelier-manual-native-microsteps.v1.json";
import atlas from "./data/atelier-manual-native-icon-atlas.v1.json";

const runtimeAssetIds = new Set([
  ...Object.values(manual.flows).flatMap((flow) => flow.steps.map((step) => step.asset_id)),
  ...atlas.icons.map((icon) => icon.asset_id),
]);

describe("visual QA decisions", () => {
  it("references unique runtime assets with explicit rationale", () => {
    const assetIds = decisions.decisions.map((decision) => decision.asset_id);

    expect(new Set(assetIds).size).toBe(assetIds.length);
    for (const decision of decisions.decisions) {
      expect(decision.status).toBe("accepted");
      expect(decision.reason.length).toBeGreaterThan(40);
      expect(runtimeAssetIds.has(decision.asset_id)).toBe(true);
    }
  });
});
