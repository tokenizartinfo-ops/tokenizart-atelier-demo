import { describe, expect, it } from "vitest";
import { classifyVisualLayout, focusImageStyle, needsVisualDetail } from "./visualPresentation";

describe("adaptive visual presentation", () => {
  it("classifies wide and tall assets without treating normal screens as exceptional", () => {
    expect(classifyVisualLayout(1268, 76)).toBe("panoramic");
    expect(classifyVisualLayout(400, 1000)).toBe("portrait");
    expect(classifyVisualLayout(1280, 720)).toBe("standard");
    expect(classifyVisualLayout(0, 0)).toBe("unresolved");
    expect(needsVisualDetail(3000, 380)).toBe(true);
    expect(needsVisualDetail(1200, 800)).toBe(false);
  });

  it("builds a bounded focus lens from hotspot percentages", () => {
    expect(focusImageStyle({
      x_pct: 60,
      y_pct: 20,
      width_pct: 14,
      height_pct: 18,
      label: { es: "Accion", en: "Action", pt: "Acao" },
    })).toEqual({
      width: "514%",
      left: "50%",
      top: "50%",
      transform: "translate(-67.0%, -29.0%)",
    });
    expect(focusImageStyle({
      x_pct: -20,
      y_pct: 95,
      width_pct: 200,
      height_pct: 50,
      label: { es: "Pantalla", en: "Screen", pt: "Tela" },
    })).toEqual({
      width: "125%",
      left: "50%",
      top: "50%",
      transform: "translate(-80.0%, -100.0%)",
    });
  });
});
