import type { DemoContext, Language } from "./types";

export const DEMO_BRIDGE_SCHEMA = "tokenizart.demo_atelier_message.v1";
export const DEMO_BRIDGE_VERSION = "1.1.0";

export const DEMO_BRIDGE_ALLOWED_ORIGINS = new Set([
  "https://companion.tokenizart.info",
  "https://companion-staging.tokenizart.info",
]);

export const DEMO_BRIDGE_MESSAGE_TYPES = [
  "demo.ready",
  "demo.step.changed",
  "demo.practice.changed",
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

export type DemoPracticeState =
  | { kind: "navigation_filter"; value: "visitor" | "user" | "own.all" | "own.minted" | "own.to_mint" | "own.certified" | "own.pending_certify" | "managed.minted" | "managed.to_mint" | "managed.certified" | "managed.without_certify" | "received.pending" | "received.tagged" | "received.completed" | "received.rejected" | "requested.pending" | "requested.completed" }
  | { kind: "gallery_endpoint"; value: "metadata" | "image" | "nft" | "transaction" }
  | { kind: "action_focus"; value: "load" | "mint" | "chip" | "certify" | "transfer" | "privacy" };

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
  practice_state?: DemoPracticeState;
}

export interface CompanionBridgeMessage extends Omit<DemoBridgeMessage, "type" | "error_code" | "practice_state"> {
  type: CompanionBridgeMessageType;
}

interface PostMessageTarget {
  postMessage(message: unknown, targetOrigin: string): void;
}

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{1,120}$/i;

const PRACTICE_VALUES = {
  navigation_filter: new Set(["visitor", "user", "own.all", "own.minted", "own.to_mint", "own.certified", "own.pending_certify", "managed.minted", "managed.to_mint", "managed.certified", "managed.without_certify", "received.pending", "received.tagged", "received.completed", "received.rejected", "requested.pending", "requested.completed"]),
  gallery_endpoint: new Set(["metadata", "image", "nft", "transaction"]),
  action_focus: new Set(["load", "mint", "chip", "certify", "transfer", "privacy"]),
} as const;

const PRACTICE_KIND_BY_FLOW = {
  atelier_navigation: "navigation_filter",
  public_gallery_traceability: "gallery_endpoint",
  action_overview: "action_focus",
} as const;

const PRACTICE_STATE_BY_SELECTION: Record<string, DemoPracticeState> = {
  "navigation.visitor-mode": { kind: "navigation_filter", value: "visitor" },
  "navigation.user-mode": { kind: "navigation_filter", value: "user" },
  "navigation.own-all": { kind: "navigation_filter", value: "own.all" },
  "navigation.own-minted": { kind: "navigation_filter", value: "own.minted" },
  "navigation.own-to-mint": { kind: "navigation_filter", value: "own.to_mint" },
  "navigation.own-certified": { kind: "navigation_filter", value: "own.certified" },
  "navigation.own-pending-certify": { kind: "navigation_filter", value: "own.pending_certify" },
  "navigation.managed-minted": { kind: "navigation_filter", value: "managed.minted" },
  "navigation.managed-to-mint": { kind: "navigation_filter", value: "managed.to_mint" },
  "navigation.managed-certified": { kind: "navigation_filter", value: "managed.certified" },
  "navigation.managed-without-certify": { kind: "navigation_filter", value: "managed.without_certify" },
  "navigation.received-pending": { kind: "navigation_filter", value: "received.pending" },
  "navigation.received-tagged": { kind: "navigation_filter", value: "received.tagged" },
  "navigation.received-completed": { kind: "navigation_filter", value: "received.completed" },
  "navigation.received-rejected": { kind: "navigation_filter", value: "received.rejected" },
  "navigation.requested-pending": { kind: "navigation_filter", value: "requested.pending" },
  "navigation.requested-completed": { kind: "navigation_filter", value: "requested.completed" },
  "gallery.read-ipfs-metadata": { kind: "gallery_endpoint", value: "metadata" },
  "gallery.open-ipfs-image": { kind: "gallery_endpoint", value: "image" },
  "gallery.read-nft-token": { kind: "gallery_endpoint", value: "nft" },
  "gallery.read-transaction-receipt": { kind: "gallery_endpoint", value: "transaction" },
  "atelier_action.load": { kind: "action_focus", value: "load" },
  "atelier_action.mint": { kind: "action_focus", value: "mint" },
  "atelier_action.chip": { kind: "action_focus", value: "chip" },
  "atelier_action.certify": { kind: "action_focus", value: "certify" },
  "atelier_action.transfer": { kind: "action_focus", value: "transfer" },
  "atelier_action.privacy": { kind: "action_focus", value: "privacy" },
};

export function isDemoPracticeStateForFlow(flow: string, state: unknown): state is DemoPracticeState {
  if (!state || typeof state !== "object" || Array.isArray(state)) return false;
  const value = state as Record<string, unknown>;
  if (Object.keys(value).length !== 2 || typeof value.kind !== "string" || typeof value.value !== "string") return false;
  const expectedKind = PRACTICE_KIND_BY_FLOW[flow as keyof typeof PRACTICE_KIND_BY_FLOW];
  if (!expectedKind || value.kind !== expectedKind) return false;
  return PRACTICE_VALUES[expectedKind].has(value.value as never);
}

export function practiceStateForSelection(flow: string, selectionId: string): DemoPracticeState | null {
  const state = PRACTICE_STATE_BY_SELECTION[selectionId];
  return state && isDemoPracticeStateForFlow(flow, state) ? state : null;
}

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
  practiceState?: DemoPracticeState | null,
): DemoBridgeMessage | null {
  if (!DEMO_BRIDGE_MESSAGE_TYPES.includes(type)) return null;
  if (![context.scenarioId, context.flow, stepId, context.fixtureId].every((value) => SAFE_ID.test(value))) return null;
  if (!(["es", "en", "pt"] as string[]).includes(context.language)) return null;
  if (context.errorCode && !SAFE_ID.test(context.errorCode)) return null;
  if (practiceState && !isDemoPracticeStateForFlow(context.flow, practiceState)) return null;

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
  if (practiceState) message.practice_state = practiceState;
  return message;
}

export function postDemoBridgeMessage(
  target: PostMessageTarget | null,
  targetOrigin: string,
  type: DemoBridgeMessageType,
  context: DemoContext,
  stepId: string,
  practiceState?: DemoPracticeState | null,
): boolean {
  if (!target || !DEMO_BRIDGE_ALLOWED_ORIGINS.has(targetOrigin)) return false;
  const message = createDemoBridgeMessage(type, context, stepId, practiceState);
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
