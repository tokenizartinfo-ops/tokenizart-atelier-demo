import { describe, expect, it } from "vitest";
import {
  DEMO_LANGUAGE_STORAGE_KEY,
  DEMO_REFERENCE_VIEW_STORAGE_KEY,
} from "./App";
import { ui } from "./i18n";

describe("shared locale and verified Atelier reference", () => {
  it("shares the language preference with Companion and keeps the selected view in session", () => {
    expect(DEMO_LANGUAGE_STORAGE_KEY).toBe("tokenizart.preferred-language.v1");
    expect(DEMO_REFERENCE_VIEW_STORAGE_KEY).toBe("tokenizart.demo-atelier.reference-view.v1");
  });

  it("localizes the comparison controls in Spanish, English and Portuguese", () => {
    expect([ui.es.practiceView, ui.en.practiceView, ui.pt.practiceView]).toHaveLength(3);
    expect([ui.es.verifiedAtelierView, ui.en.verifiedAtelierView, ui.pt.verifiedAtelierView]).toHaveLength(3);
    expect([ui.es.bothViews, ui.en.bothViews, ui.pt.bothViews]).toHaveLength(3);
    expect(new Set([ui.es.practiceView, ui.en.practiceView, ui.pt.practiceView]).size).toBe(3);
  });
});
