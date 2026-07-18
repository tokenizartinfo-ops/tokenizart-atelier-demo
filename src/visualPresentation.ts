import type { Hotspot } from "./types";

export type VisualLayout = "standard" | "panoramic" | "portrait" | "unresolved";

const PANORAMIC_THRESHOLD = 2.4;
const PORTRAIT_THRESHOLD = 0.45;

export function classifyVisualLayout(width: number, height: number): VisualLayout {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return "unresolved";
  const aspect = width / height;
  if (aspect > PANORAMIC_THRESHOLD) return "panoramic";
  if (aspect < PORTRAIT_THRESHOLD) return "portrait";
  return "standard";
}

export function needsVisualDetail(width: number, height: number): boolean {
  return ["panoramic", "portrait"].includes(classifyVisualLayout(width, height));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function focusImageStyle(hotspot: Hotspot): Record<string, string> {
  const width = clamp(hotspot.width_pct, 4, 100);
  const centerX = clamp(hotspot.x_pct + hotspot.width_pct / 2, 0, 100);
  const centerY = clamp(hotspot.y_pct + hotspot.height_pct / 2, 0, 100);
  const zoom = clamp((72 / width) * 100, 125, 720);
  return {
    width: `${Math.round(zoom)}%`,
    left: "50%",
    top: "50%",
    transform: `translate(-${centerX.toFixed(1)}%, -${centerY.toFixed(1)}%)`,
  };
}
