import { assign, setup } from "xstate";
import manual from "./data/atelier-manual-native-microsteps.v1.json";
import iconAtlas from "./data/atelier-manual-native-icon-atlas.v1.json";
import type { CertifyActorId, CertifyTypeId, CertifyVisibility, DemoCertification, DemoContext, DemoMintReceipt, DemoNfcReceipt, DemoPrivacyReceipt, DemoTransferReceipt, DemoVoucherReceipt, Language, ManualContract, MintActorId, MintMode, NfcActorId, NfcTagState, PrivacyCertifyId, PrivacyPreviewAudience, TransferDestinationType, VoucherBalances, VoucherProductId } from "./types";

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
    currentOwnerRef: "OWNER-DEMO-ALEX",
    galleryVisible: false,
    certifyVisible: true,
    mintDraft: {
      actorId: "owner_artist",
      mode: "single",
      reviewConfirmed: false,
      signatureConfirmed: false,
    },
    mintReceipts: [],
    nfcDraft: {
      actorId: "owner_artist",
      tagState: "ready_to_link",
      scanConfirmed: false,
      signatureConfirmed: false,
    },
    nfcReceipts: [],
    transferDraft: {
      destinationType: "tokenizart_user",
      recipientVerified: false,
      externalWarningAccepted: false,
      signatureConfirmed: false,
    },
    transferReceipts: [],
    privacyDraft: {
      galleryVisible: true,
      technicalSheetVisible: true,
      certifyVisibility: {
        authenticity: true,
        exhibition: true,
        condition: false,
      },
      previewAudience: "visitor",
      ownerConfirmed: false,
    },
    privacyReceipts: [],
    voucherDraft: {
      productId: "starter_kit",
      creditConfirmed: false,
    },
    voucherReceipts: [],
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
  | { type: "SET_NFC_DRAFT"; actorId?: NfcActorId; tagState?: NfcTagState; scanConfirmed?: boolean; signatureConfirmed?: boolean }
  | { type: "SET_TRANSFER_DRAFT"; destinationType?: TransferDestinationType; recipientVerified?: boolean; externalWarningAccepted?: boolean; signatureConfirmed?: boolean }
  | { type: "SET_PRIVACY_DRAFT"; galleryVisible?: boolean; technicalSheetVisible?: boolean; certifyId?: PrivacyCertifyId; certifyVisible?: boolean; previewAudience?: PrivacyPreviewAudience; ownerConfirmed?: boolean }
  | { type: "SET_VOUCHER_DRAFT"; productId?: VoucherProductId; creditConfirmed?: boolean }
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

const voucherProducts: Record<VoucherProductId, { priceUsd: number; credited: VoucherBalances }> = {
  starter_kit: { priceUsd: 20, credited: { mint: 1, certify: 2, nfc: 0 } },
  mint: { priceUsd: 8, credited: { mint: 1, certify: 0, nfc: 0 } },
  certify: { priceUsd: 8, credited: { mint: 0, certify: 1, nfc: 0 } },
  nfc: { priceUsd: 10, credited: { mint: 0, certify: 0, nfc: 1 } },
};

function completionError(context: DemoContext): string | null {
  const { flow, world } = context;
  if (["account_wallet", "carga_obra", "mint", "certify", "chip", "transferencia", "privacy", "vouchers"].includes(flow) && world.accountStatus !== "active") {
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
  if (flow === "chip" && world.nfcDraft.tagState === "not_tokenizart") return "nfc_not_tokenizart";
  if (flow === "chip" && world.nfcDraft.tagState === "linked_artwork") return "nfc_already_linked";
  if (flow === "chip" && !world.nfcDraft.scanConfirmed) return "nfc_scan_required";
  if (flow === "chip" && world.vouchers.nfc <= 0) return "missing_voucher";
  if (flow === "chip" && !world.nfcDraft.signatureConfirmed) return "nfc_confirmation_required";
  if (flow === "transferencia" && !world.transferDraft.recipientVerified) return "transfer_recipient_required";
  if (flow === "transferencia" && world.transferDraft.destinationType === "external_wallet" && !world.transferDraft.externalWarningAccepted) {
    return "transfer_external_warning_required";
  }
  if (flow === "transferencia" && !world.transferDraft.signatureConfirmed) return "transfer_confirmation_required";
  if (flow === "privacy" && world.artworkStatus === "none") return "privacy_artwork_required";
  if (flow === "privacy" && !world.privacyDraft.ownerConfirmed) return "privacy_confirmation_required";
  if (flow === "vouchers" && !world.voucherDraft.creditConfirmed) return "voucher_confirmation_required";
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
    const sequence = String(world.nfcReceipts.length + 1).padStart(3, "0");
    const receipt: DemoNfcReceipt = {
      receiptId: `NFC-DEMO-${sequence}`,
      actorId: world.nfcDraft.actorId,
      tagState: "linked_artwork",
      vouchersConsumed: 1,
      networkRef: "gnosis-simulated",
      tagRef: `TAG-DEMO-${sequence}`,
      certificationRef: `CERT-NFC-DEMO-${sequence}`,
      tokenRef: `TOKEN-DEMO-${sequence}`,
      transactionRef: `TX-DEMO-NFC-${sequence}`,
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.nfcReceipts = [...world.nfcReceipts, receipt];
  }
  if (context.flow === "transferencia") {
    world.artworkStatus = "transferred";
    const sequence = String(world.transferReceipts.length + 1).padStart(3, "0");
    const external = world.transferDraft.destinationType === "external_wallet";
    const receipt: DemoTransferReceipt = {
      receiptId: `TRANSFER-DEMO-${sequence}`,
      destinationType: world.transferDraft.destinationType,
      previousOwnerRef: world.currentOwnerRef,
      newOwnerRef: external ? "OWNER-DEMO-EXTERNAL" : "OWNER-DEMO-COLLECTOR",
      destinationWalletRef: external ? "0xEXTERNAL-DEMO-0001" : "WALLET-DEMO-COLLECTOR",
      atelierManagement: external ? "outside_atelier" : "inside_atelier",
      vouchersConsumed: 0,
      networkRef: "gnosis-simulated",
      tokenRef: `TOKEN-DEMO-${sequence}`,
      transactionRef: `TX-DEMO-TRANSFER-${sequence}`,
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.currentOwnerRef = receipt.newOwnerRef;
    world.transferReceipts = [...world.transferReceipts, receipt];
  }
  if (context.flow === "privacy") {
    world.galleryVisible = world.privacyDraft.galleryVisible;
    const certifyIds: PrivacyCertifyId[] = ["authenticity", "exhibition", "condition"];
    const publicCertifyIds = world.privacyDraft.galleryVisible
      ? certifyIds.filter((id) => world.privacyDraft.certifyVisibility[id])
      : [];
    world.certifyVisible = publicCertifyIds.length > 0;
    const sequence = String(world.privacyReceipts.length + 1).padStart(3, "0");
    const receipt: DemoPrivacyReceipt = {
      receiptId: `PRIVACY-DEMO-${sequence}`,
      galleryVisible: world.privacyDraft.galleryVisible,
      technicalSheetVisible: world.privacyDraft.galleryVisible && world.privacyDraft.technicalSheetVisible,
      publicCertifyIds,
      ownerOnlyCertifyIds: certifyIds.filter((id) => !publicCertifyIds.includes(id)),
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.privacyReceipts = [...world.privacyReceipts, receipt];
  }
  if (context.flow === "vouchers") {
    const product = voucherProducts[world.voucherDraft.productId];
    const resultingBalances: VoucherBalances = {
      mint: world.vouchers.mint + product.credited.mint,
      certify: world.vouchers.certify + product.credited.certify,
      nfc: world.vouchers.nfc + product.credited.nfc,
    };
    const sequence = String(world.voucherReceipts.length + 1).padStart(3, "0");
    const receipt: DemoVoucherReceipt = {
      receiptId: `VOUCHER-DEMO-${sequence}`,
      productId: world.voucherDraft.productId,
      priceUsd: product.priceUsd,
      priceVerifiedAt: "2026-07-14",
      credited: { ...product.credited },
      resultingBalances,
      sourceUrl: "https://tokenizart.com/es/shop/",
      completedAt: "2026-07-17T12:00:00.000Z",
    };
    world.vouchers = resultingBalances;
    world.voucherReceipts = [...world.voucherReceipts, receipt];
  }
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
        SET_NFC_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              nfcDraft: {
                actorId: event.actorId ?? context.world.nfcDraft.actorId,
                tagState: event.tagState ?? context.world.nfcDraft.tagState,
                scanConfirmed: event.scanConfirmed ?? context.world.nfcDraft.scanConfirmed,
                signatureConfirmed: event.signatureConfirmed ?? context.world.nfcDraft.signatureConfirmed,
              },
            },
          })),
        },
        SET_TRANSFER_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              transferDraft: {
                destinationType: event.destinationType ?? context.world.transferDraft.destinationType,
                recipientVerified: event.recipientVerified ?? context.world.transferDraft.recipientVerified,
                externalWarningAccepted: event.externalWarningAccepted ?? context.world.transferDraft.externalWarningAccepted,
                signatureConfirmed: event.signatureConfirmed ?? context.world.transferDraft.signatureConfirmed,
              },
            },
          })),
        },
        SET_PRIVACY_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              privacyDraft: {
                galleryVisible: event.galleryVisible ?? context.world.privacyDraft.galleryVisible,
                technicalSheetVisible: event.technicalSheetVisible ?? context.world.privacyDraft.technicalSheetVisible,
                certifyVisibility: event.certifyId
                  ? { ...context.world.privacyDraft.certifyVisibility, [event.certifyId]: event.certifyVisible ?? context.world.privacyDraft.certifyVisibility[event.certifyId] }
                  : context.world.privacyDraft.certifyVisibility,
                previewAudience: event.previewAudience ?? context.world.privacyDraft.previewAudience,
                ownerConfirmed: event.ownerConfirmed ?? context.world.privacyDraft.ownerConfirmed,
              },
            },
          })),
        },
        SET_VOUCHER_DRAFT: {
          actions: assign(({ context, event }) => ({
            ...context,
            world: {
              ...context.world,
              voucherDraft: {
                productId: event.productId ?? context.world.voucherDraft.productId,
                creditConfirmed: event.creditConfirmed ?? context.world.voucherDraft.creditConfirmed,
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
  const nfcActorIds: NfcActorId[] = ["owner_artist", "authorized_certifier"];
  const nfcTagStates: NfcTagState[] = ["ready_to_link", "linked_artwork", "not_tokenizart"];
  const transferDestinationTypes: TransferDestinationType[] = ["tokenizart_user", "external_wallet"];
  const privacyPreviewAudiences: PrivacyPreviewAudience[] = ["owner", "visitor"];
  const privacyCertifyIds: PrivacyCertifyId[] = ["authenticity", "exhibition", "condition"];
  const voucherProductIds: VoucherProductId[] = ["starter_kit", "mint", "certify", "nfc"];
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
  const nfcDraft = next.world.nfcDraft;
  next.world.nfcDraft = {
    actorId: nfcActorIds.includes(nfcDraft?.actorId) ? nfcDraft.actorId : "owner_artist",
    tagState: nfcTagStates.includes(nfcDraft?.tagState) ? nfcDraft.tagState : "ready_to_link",
    scanConfirmed: nfcDraft?.scanConfirmed === true,
    signatureConfirmed: nfcDraft?.signatureConfirmed === true,
  };
  next.world.nfcReceipts = Array.isArray(next.world.nfcReceipts)
    ? next.world.nfcReceipts.filter((item) => (
      typeof item?.receiptId === "string"
      && nfcActorIds.includes(item.actorId)
      && item.tagState === "linked_artwork"
      && item.networkRef === "gnosis-simulated"
    ))
    : [];
  const transferDraft = next.world.transferDraft;
  next.world.currentOwnerRef = typeof next.world.currentOwnerRef === "string" && next.world.currentOwnerRef
    ? next.world.currentOwnerRef
    : "OWNER-DEMO-ALEX";
  next.world.transferDraft = {
    destinationType: transferDestinationTypes.includes(transferDraft?.destinationType) ? transferDraft.destinationType : "tokenizart_user",
    recipientVerified: transferDraft?.recipientVerified === true,
    externalWarningAccepted: transferDraft?.externalWarningAccepted === true,
    signatureConfirmed: transferDraft?.signatureConfirmed === true,
  };
  next.world.transferReceipts = Array.isArray(next.world.transferReceipts)
    ? next.world.transferReceipts.filter((item) => (
      typeof item?.receiptId === "string"
      && transferDestinationTypes.includes(item.destinationType)
      && item.vouchersConsumed === 0
      && item.networkRef === "gnosis-simulated"
    ))
    : [];
  const privacyDraft = next.world.privacyDraft;
  const legacyGalleryVisible = next.world.galleryVisible === true;
  const legacyCertifyVisible = next.world.certifyVisible === true;
  next.world.privacyDraft = {
    galleryVisible: privacyDraft ? privacyDraft.galleryVisible === true : legacyGalleryVisible,
    technicalSheetVisible: privacyDraft?.technicalSheetVisible !== false,
    certifyVisibility: {
      authenticity: privacyDraft ? privacyDraft.certifyVisibility?.authenticity === true : legacyCertifyVisible,
      exhibition: privacyDraft ? privacyDraft.certifyVisibility?.exhibition === true : legacyCertifyVisible,
      condition: privacyDraft ? privacyDraft.certifyVisibility?.condition === true : legacyCertifyVisible,
    },
    previewAudience: privacyPreviewAudiences.includes(privacyDraft?.previewAudience) ? privacyDraft.previewAudience : "visitor",
    ownerConfirmed: privacyDraft?.ownerConfirmed === true,
  };
  next.world.privacyReceipts = Array.isArray(next.world.privacyReceipts)
    ? next.world.privacyReceipts.filter((item) => (
      typeof item?.receiptId === "string"
      && Array.isArray(item.publicCertifyIds)
      && item.publicCertifyIds.every((id) => privacyCertifyIds.includes(id))
      && Array.isArray(item.ownerOnlyCertifyIds)
      && item.ownerOnlyCertifyIds.every((id) => privacyCertifyIds.includes(id))
    ))
    : [];
  const voucherDraft = next.world.voucherDraft;
  next.world.voucherDraft = {
    productId: voucherProductIds.includes(voucherDraft?.productId) ? voucherDraft.productId : "starter_kit",
    creditConfirmed: voucherDraft?.creditConfirmed === true,
  };
  next.world.voucherReceipts = Array.isArray(next.world.voucherReceipts)
    ? next.world.voucherReceipts.filter((item) => (
      typeof item?.receiptId === "string"
      && voucherProductIds.includes(item.productId)
      && item.priceVerifiedAt === "2026-07-14"
      && item.sourceUrl === "https://tokenizart.com/es/shop/"
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
