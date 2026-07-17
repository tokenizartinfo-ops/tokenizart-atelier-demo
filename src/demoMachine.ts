import { assign, setup } from "xstate";
import manual from "./data/atelier-manual-native-microsteps.v1.json";
import iconAtlas from "./data/atelier-manual-native-icon-atlas.v1.json";
import type { DemoContext, Language, ManualContract } from "./types";

const manualBase = manual as ManualContract;
const actionIcons = iconAtlas.icons.filter((icon) => icon.context === "atelier_action");

export const manualContract: ManualContract = {
  ...manualBase,
  flows: {
    ...manualBase.flows,
    action_overview: {
      source_slides: [57],
      description: "Native action icon atlas for Load, Mint, NFC, Certify, Transfer and Privacy.",
      steps: actionIcons.map((icon, index) => ({
        step_id: icon.icon_id,
        order: index + 1,
        manual_step: icon.semantic_key,
        source_slide: icon.source_slide,
        asset_id: icon.asset_id,
        copy: icon.copy,
      })),
    },
  },
};

export const initialContext: DemoContext = {
  language: "es",
  flow: "onboarding",
  stepIndex: 0,
  scenarioId: "first-artwork",
  fixtureId: "painting-river-001",
  errorCode: null,
  world: {
    accountStatus: "not_created",
    walletStatus: "not_created",
    artworkStatus: "none",
    artworkTitle: "Ecos del río",
    artworkAuthor: "Alex Rivera",
    artworkType: "painting",
    galleryVisible: false,
    certifyVisible: true,
    vouchers: { mint: 2, certify: 2, nfc: 1 },
    events: [],
  },
};

type DemoEvent =
  | { type: "SELECT_FLOW"; flow: string }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "SET_FIXTURE"; fixtureId: string; artworkType: DemoContext["world"]["artworkType"] }
  | { type: "UPDATE_ARTWORK"; title?: string; author?: string }
  | { type: "INJECT_ERROR"; code: string }
  | { type: "RESOLVE_ERROR" }
  | { type: "COMPLETE_STEP" }
  | { type: "RESET" };

function finalIndex(flow: string): number {
  return Math.max(0, (manualContract.flows[flow]?.steps.length ?? 1) - 1);
}

function completionError(context: DemoContext): string | null {
  const { flow, world } = context;
  if (["account_wallet", "carga_obra", "mint", "certify", "chip", "transferencia"].includes(flow) && world.accountStatus !== "active") {
    return "account_required";
  }
  if (["mint", "certify", "chip", "transferencia"].includes(flow) && world.walletStatus !== "backed_up") {
    return "wallet_required";
  }
  if (flow === "mint" && world.artworkStatus !== "loaded") return "artwork_not_ready";
  if (["certify", "chip", "transferencia"].includes(flow) && !["minted", "certified", "tagged"].includes(world.artworkStatus)) {
    return "artwork_not_minted";
  }
  if (flow === "mint" && world.vouchers.mint <= 0) return "missing_voucher";
  if (flow === "certify" && world.vouchers.certify <= 0) return "missing_voucher";
  if (flow === "chip" && world.vouchers.nfc <= 0) return "missing_voucher";
  return null;
}

function completeFlow(context: DemoContext): DemoContext {
  const completionEvent = `${context.flow}.completed`;
  if (context.world.events.includes(completionEvent)) return { ...context, errorCode: null };

  const errorCode = completionError(context);
  if (errorCode) return { ...context, errorCode };

  const world = { ...context.world, vouchers: { ...context.world.vouchers }, events: [...context.world.events] };

  if (context.flow === "onboarding") world.accountStatus = "active";
  if (context.flow === "account_wallet") world.walletStatus = "backed_up";
  if (context.flow === "carga_obra") world.artworkStatus = "loaded";
  if (context.flow === "mint") {
    world.artworkStatus = "minted";
    world.vouchers.mint -= 1;
  }
  if (context.flow === "certify") {
    world.artworkStatus = "certified";
    world.vouchers.certify -= 1;
  }
  if (context.flow === "chip") {
    world.artworkStatus = "tagged";
    world.vouchers.nfc -= 1;
  }
  if (context.flow === "transferencia") world.artworkStatus = "transferred";
  world.events.push(completionEvent);
  return { ...context, world, errorCode: null };
}

export const demoMachine = setup({
  types: {
    context: {} as DemoContext,
    input: {} as DemoContext | undefined,
    events: {} as DemoEvent,
  },
}).createMachine({
  id: "demo-atelier",
  initial: "practicing",
  context: ({ input }) => input ?? initialContext,
  states: {
    practicing: {
      on: {
        SELECT_FLOW: {
          actions: assign(({ context, event }) => ({ ...context, flow: event.flow, stepIndex: 0, errorCode: null })),
        },
        NEXT: {
          actions: assign(({ context }) => ({ ...context, stepIndex: Math.min(finalIndex(context.flow), context.stepIndex + 1) })),
        },
        PREVIOUS: {
          actions: assign(({ context }) => ({ ...context, stepIndex: Math.max(0, context.stepIndex - 1), errorCode: null })),
        },
        SET_LANGUAGE: { actions: assign(({ context, event }) => ({ ...context, language: event.language })) },
        SET_FIXTURE: {
          actions: assign(({ context, event }) => ({
            ...context,
            fixtureId: event.fixtureId,
            world: { ...context.world, artworkType: event.artworkType },
          })),
        },
        UPDATE_ARTWORK: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              artworkTitle: event.title ?? context.world.artworkTitle,
              artworkAuthor: event.author ?? context.world.artworkAuthor,
              artworkStatus: context.world.artworkStatus === "none" ? "draft" : context.world.artworkStatus,
            },
          })),
        },
        INJECT_ERROR: { actions: assign(({ context, event }) => ({ ...context, errorCode: event.code })) },
        RESOLVE_ERROR: { actions: assign(({ context }) => ({ ...context, errorCode: null })) },
        COMPLETE_STEP: { actions: assign(({ context }) => completeFlow(context)) },
        RESET: { actions: assign(() => structuredClone(initialContext)) },
      },
    },
  },
});

export function safeRestore(raw: string | null): DemoContext | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as DemoContext;
    if (!manualContract.flows[parsed.flow]) return undefined;
    if (!(["es", "en", "pt"] as string[]).includes(parsed.language)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
