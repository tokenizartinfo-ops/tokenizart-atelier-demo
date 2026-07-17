import type { DemoContext, Language } from "./types";

export const DEMO_BRIDGE_SCHEMA = "tokenizart.demo_atelier_message.v1";
export const DEMO_BRIDGE_VERSION = "1.0.0";

export const DEMO_BRIDGE_ALLOWED_ORIGINS = new Set([
  "https://companion.tokenizart.info",
  "https://companion-staging.tokenizart.info",
]);

export const DEMO_BRIDGE_MESSAGE_TYPES = [
  "demo.ready",
  "demo.step.changed",
  "demo.error.shown",
  "demo.flow.completed",
  "demo.reset",
  "demo.explain.requested",
] as const;

export const COMPANION_BRIDGE_MESSAGE_TYPES = [
  "companion.bridge.ready",
  "companion.explanation.available",
] as const;

export type DemoBridgeMessageType = typeof DEMO_BRIDGE_MESSAGE_TYPES[number];
export type CompanionBridgeMessageType = typeof COMPANION_BRIDGE_MESSAGE_TYPES[number];

export interface DemoBridgeMessage {
  schema: typeof DEMO_BRIDGE_SCHEMA;
  version: typeof DEMO_BRIDGE_VERSION;
  type: DemoBridgeMessageType;
  scenario_id: string;
  flow: string;
  step_id: string;
  language: Language;
  synthetic_fixture_id: string;
  error_code?: string;
}

export interface CompanionBridgeMessage extends Omit<DemoBridgeMessage, "type" | "error_code"> {
  type: CompanionBridgeMessageType;
}

interface PostMessageTarget {
  postMessage(message: unknown, targetOrigin: string): void;
}

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{1,120}$/i;

function originOf(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function resolveDemoBridgeOrigin(search: string, referrer: string): string {
  const requestedOrigin = originOf(new URLSearchParams(search).get("return_origin") || "");
  const referrerOrigin = originOf(referrer);
  if (!requestedOrigin || requestedOrigin !== referrerOrigin) return "";
  return DEMO_BRIDGE_ALLOWED_ORIGINS.has(requestedOrigin) ? requestedOrigin : "";
}

export function createDemoBridgeMessage(
  type: DemoBridgeMessageType,
  context: DemoContext,
  stepId: string,
): DemoBridgeMessage | null {
  if (!DEMO_BRIDGE_MESSAGE_TYPES.includes(type)) return null;
  if (![context.scenarioId, context.flow, stepId, context.fixtureId].every((value) => SAFE_ID.test(value))) return null;
  if (!(["es", "en", "pt"] as string[]).includes(context.language)) return null;
  if (context.errorCode && !SAFE_ID.test(context.errorCode)) return null;

  const message: DemoBridgeMessage = {
    schema: DEMO_BRIDGE_SCHEMA,
    version: DEMO_BRIDGE_VERSION,
    type,
    scenario_id: context.scenarioId,
    flow: context.flow,
    step_id: stepId,
    language: context.language,
    synthetic_fixture_id: context.fixtureId,
  };
  if (type === "demo.error.shown" && context.errorCode) message.error_code = context.errorCode;
  return message;
}

export function postDemoBridgeMessage(
  target: PostMessageTarget | null,
  targetOrigin: string,
  type: DemoBridgeMessageType,
  context: DemoContext,
  stepId: string,
): boolean {
  if (!target || !DEMO_BRIDGE_ALLOWED_ORIGINS.has(targetOrigin)) return false;
  const message = createDemoBridgeMessage(type, context, stepId);
  if (!message) return false;
  target.postMessage(message, targetOrigin);
  return true;
}

export function isCompanionBridgeMessage(value: unknown): value is CompanionBridgeMessage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  const allowedFields = new Set([
    "schema",
    "version",
    "type",
    "scenario_id",
    "flow",
    "step_id",
    "language",
    "synthetic_fixture_id",
  ]);
  if (message.schema !== DEMO_BRIDGE_SCHEMA || message.version !== DEMO_BRIDGE_VERSION) return false;
  if (!COMPANION_BRIDGE_MESSAGE_TYPES.includes(message.type as CompanionBridgeMessageType)) return false;
  if (![message.scenario_id, message.flow, message.step_id, message.synthetic_fixture_id].every((value) => typeof value === "string" && SAFE_ID.test(value))) return false;
  if (!(["es", "en", "pt"] as unknown[]).includes(message.language)) return false;
  return Object.keys(message).every((key) => allowedFields.has(key));
}
