import { assign, setup } from "xstate";
import manual from "./data/atelier-manual-native-microsteps.v1.json";
import iconAtlas from "./data/atelier-manual-native-icon-atlas.v1.json";
import type { CertifyActorId, CertifyTypeId, CertifyVisibility, DemoCertification, DemoContext, DemoMintReceipt, Language, ManualContract, MintActorId, MintMode } from "./types";

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
    mintDraft: {
      actorId: "owner_artist",
      mode: "single",
      reviewConfirmed: false,
      signatureConfirmed: false,
    },
    mintReceipts: [],
    certifyDraft: {
      actorId: "expert",
      typeId: "authenticity",
      visibility: "public",
    },
    certifications: [],
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
  | { type: "SET_MINT_DRAFT"; actorId?: MintActorId; mode?: MintMode; reviewConfirmed?: boolean; signatureConfirmed?: boolean }
  | { type: "SET_CERTIFY_DRAFT"; actorId?: CertifyActorId; typeId?: CertifyTypeId; visibility?: CertifyVisibility }
  | { type: "INJECT_ERROR"; code: string }
  | { type: "RESOLVE_ERROR" }
  | { type: "COMPLETE_STEP" }
  | { type: "RESET" };

function finalIndex(flow: string): number {
  return Math.max(0, (manualContract.flows[flow]?.steps.length ?? 1) - 1);
}

function mintVoucherRequirement(context: DemoContext): number {
  return context.world.mintDraft.mode === "batch" ? 2 : 1;
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
  if (flow === "mint" && !world.mintDraft.reviewConfirmed) return "mint_review_required";
  if (flow === "mint" && world.vouchers.mint < mintVoucherRequirement(context)) return "missing_voucher";
  if (flow === "mint" && !world.mintDraft.signatureConfirmed) return "mint_confirmation_required";
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
    const vouchersConsumed = mintVoucherRequirement(context);
    world.vouchers.mint -= vouchersConsumed;
    const sequence = String(world.mintReceipts.length + 1).padStart(3, "0");
    const receipt: DemoMintReceipt = {
      receiptId: `MINT-DEMO-${sequence}`,
      actorId: world.mintDraft.actorId,
      mode: world.mintDraft.mode,
      artworkCount: world.mintDraft.mode === "batch" ? 2 : 1,
      vouchersConsumed,
      networkRef: "gnosis-simulated",
      tokenRef: `TOKEN-DEMO-${sequence}`,
      transactionRef: `TX-DEMO-MINT-${sequence}`,
      metadataRef: `IPFS-DEMO-${sequence}`,
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.mintReceipts = [...world.mintReceipts, receipt];
  }
  if (context.flow === "certify") {
    world.artworkStatus = "certified";
    world.certifyVisible = world.certifyDraft.visibility === "public";
    world.vouchers.certify -= 1;
    const certification: DemoCertification = {
      certificationId: `CERT-DEMO-${String(world.certifications.length + 1).padStart(3, "0")}`,
      actorId: world.certifyDraft.actorId,
      typeId: world.certifyDraft.typeId,
      visibility: world.certifyDraft.visibility,
      evidenceAssetId: `evidence-${world.certifyDraft.typeId}-demo`,
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.certifications = [...world.certifications, certification];
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
        SET_MINT_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              mintDraft: {
                actorId: event.actorId ?? context.world.mintDraft.actorId,
                mode: event.mode ?? context.world.mintDraft.mode,
                reviewConfirmed: event.reviewConfirmed ?? context.world.mintDraft.reviewConfirmed,
                signatureConfirmed: event.signatureConfirmed ?? context.world.mintDraft.signatureConfirmed,
              },
            },
          })),
        },
        SET_CERTIFY_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              certifyDraft: {
                actorId: event.actorId ?? context.world.certifyDraft.actorId,
                typeId: event.typeId ?? context.world.certifyDraft.typeId,
                visibility: event.visibility ?? context.world.certifyDraft.visibility,
              },
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
    return normalizeContext(parsed);
  } catch {
    return undefined;
  }
}

export function contextFromSearch(search: string, base: DemoContext = initialContext): DemoContext {
  const next = normalizeContext(base);
  const params = new URLSearchParams(search);
  const requestedFlow = params.get("flow") ?? "";
  const requestedLanguage = params.get("lang") ?? "";
  const requestedStep = params.get("step") ?? "";
  const requestedScenario = params.get("scenario") ?? "";
  const requestedFixture = params.get("fixture") ?? "";

  if (manualContract.flows[requestedFlow]) {
    next.flow = requestedFlow;
    next.stepIndex = 0;
    const stepIndex = manualContract.flows[requestedFlow].steps.findIndex((step) => step.step_id === requestedStep);
    if (stepIndex >= 0) next.stepIndex = stepIndex;
  }
  if ((["es", "en", "pt"] as string[]).includes(requestedLanguage)) next.language = requestedLanguage as Language;
  if (requestedScenario === "first-artwork") next.scenarioId = requestedScenario;
  if (["painting-river-001", "sculpture-signal-001", "sports-shirt-001"].includes(requestedFixture)) next.fixtureId = requestedFixture;
  next.errorCode = null;
  return next;
}

function normalizeContext(context: DemoContext): DemoContext {
  const next = structuredClone(context);
  const mintActorIds: MintActorId[] = ["owner_artist", "authorized_manager"];
  const mintModes: MintMode[] = ["single", "batch"];
  const actorIds: CertifyActorId[] = ["owner_artist", "expert", "gallery_museum"];
  const typeIds: CertifyTypeId[] = ["authenticity", "condition", "exhibition", "additional_report"];
  const visibilities: CertifyVisibility[] = ["public", "owner"];
  const draft = next.world.certifyDraft;
  const mintDraft = next.world.mintDraft;
  next.world.mintDraft = {
    actorId: mintActorIds.includes(mintDraft?.actorId) ? mintDraft.actorId : "owner_artist",
    mode: mintModes.includes(mintDraft?.mode) ? mintDraft.mode : "single",
    reviewConfirmed: mintDraft?.reviewConfirmed === true,
    signatureConfirmed: mintDraft?.signatureConfirmed === true,
  };
  next.world.mintReceipts = Array.isArray(next.world.mintReceipts)
    ? next.world.mintReceipts.filter((item) => (
      typeof item?.receiptId === "string"
      && mintActorIds.includes(item.actorId)
      && mintModes.includes(item.mode)
      && item.networkRef === "gnosis-simulated"
    ))
    : [];
  next.world.certifyDraft = {
    actorId: actorIds.includes(draft?.actorId) ? draft.actorId : "expert",
    typeId: typeIds.includes(draft?.typeId) ? draft.typeId : "authenticity",
    visibility: visibilities.includes(draft?.visibility) ? draft.visibility : "public",
  };
  next.world.certifications = Array.isArray(next.world.certifications)
    ? next.world.certifications.filter((item) => (
      typeof item?.certificationId === "string"
      && actorIds.includes(item.actorId)
      && typeIds.includes(item.typeId)
      && visibilities.includes(item.visibility)
    ))
    : [];
  return next;
}
