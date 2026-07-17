import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { contextFromSearch, demoMachine, initialContext, manualContract, safeRestore } from "./demoMachine";

describe("Demo Atelier contracts", () => {
  it("exposes all approved flows and excludes manual annotations", () => {
    expect(Object.keys(manualContract.flows)).toHaveLength(12);
    const slides = Object.values(manualContract.flows).flatMap((flow) => flow.source_slides);
    expect(slides).not.toContain(100);
    expect(slides).not.toContain(101);
  });

  it("contains localized copy and sanitized asset ids", () => {
    const steps = Object.values(manualContract.flows).flatMap((flow) => flow.steps);
    expect(steps.length).toBeGreaterThanOrEqual(149);
    for (const step of steps) {
      expect(step.copy.es.title).toBeTruthy();
      expect(step.copy.en.title).toBeTruthy();
      expect(step.copy.pt.title).toBeTruthy();
      expect(step.asset_id).toMatch(/^[a-z0-9][a-z0-9-]+$/);
    }
  });

  it("keeps transfer voucher-free", () => {
    const context = structuredClone(initialContext);
    context.flow = "transferencia";
    context.stepIndex = manualContract.flows.transferencia.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "minted";
    context.world.transferDraft = {
      destinationType: "tokenizart_user",
      recipientVerified: true,
      externalWarningAccepted: false,
      signatureConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;
    expect(result.vouchers).toEqual({ mint: 2, certify: 2, nfc: 1 });
    expect(result.artworkStatus).toBe("transferred");
    expect(result.currentOwnerRef).toBe("OWNER-DEMO-COLLECTOR");
    expect(result.transferReceipts).toEqual([expect.objectContaining({
      receiptId: "TRANSFER-DEMO-001",
      destinationType: "tokenizart_user",
      previousOwnerRef: "OWNER-DEMO-ALEX",
      newOwnerRef: "OWNER-DEMO-COLLECTOR",
      atelierManagement: "inside_atelier",
      vouchersConsumed: 0,
      transactionRef: "TX-DEMO-TRANSFER-001",
    })]);
  });

  it("consumes the matching voucher only on completed eligible flows", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
    context.world.mintDraft.reviewConfirmed = true;
    context.world.mintDraft.signatureConfirmed = true;
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("minted");
    expect(actor.getSnapshot().context.world.vouchers.mint).toBe(1);
    expect(actor.getSnapshot().context.world.vouchers.certify).toBe(2);
  });

  it("blocks an action when its prerequisites are missing", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("account_required");
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("none");
    expect(actor.getSnapshot().context.world.events).not.toContain("mint.completed");
  });

  it("keeps completed actions idempotent", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
    context.world.mintDraft.reviewConfirmed = true;
    context.world.mintDraft.signatureConfirmed = true;
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.world.vouchers.mint).toBe(1);
    expect(actor.getSnapshot().context.world.events.filter((event) => event === "mint.completed")).toHaveLength(1);
  });

  it("requires review and simulated signature before Mint", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
    const actor = createActor(demoMachine, { input: context }).start();

    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("mint_review_required");
    actor.send({ type: "SET_MINT_DRAFT", reviewConfirmed: true });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("mint_confirmation_required");
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("loaded");
  });

  it("records an authorized batch Mint and consumes two vouchers exactly once", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
    context.world.mintDraft = {
      actorId: "authorized_manager",
      mode: "batch",
      reviewConfirmed: true,
      signatureConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.artworkStatus).toBe("minted");
    expect(result.vouchers.mint).toBe(0);
    expect(result.mintReceipts).toEqual([expect.objectContaining({
      receiptId: "MINT-DEMO-001",
      actorId: "authorized_manager",
      mode: "batch",
      artworkCount: 2,
      vouchersConsumed: 2,
      networkRef: "gnosis-simulated",
      tokenRef: "TOKEN-DEMO-001",
      transactionRef: "TX-DEMO-MINT-001",
      metadataRef: "IPFS-DEMO-001",
    })]);
  });

  it("blocks batch Mint when only one Mint voucher is available", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
    context.world.vouchers.mint = 1;
    context.world.mintDraft = {
      actorId: "owner_artist",
      mode: "batch",
      reviewConfirmed: true,
      signatureConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });

    expect(actor.getSnapshot().context.errorCode).toBe("missing_voucher");
    expect(actor.getSnapshot().context.world.mintReceipts).toHaveLength(0);
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("loaded");
  });

  it("normalizes legacy sessions without Mint, NFC, transfer, privacy, voucher or Certify result fields", () => {
    const legacy = structuredClone(initialContext) as any;
    delete legacy.world.mintDraft;
    delete legacy.world.mintReceipts;
    delete legacy.world.nfcDraft;
    delete legacy.world.nfcReceipts;
    delete legacy.world.currentOwnerRef;
    delete legacy.world.transferDraft;
    delete legacy.world.transferReceipts;
    delete legacy.world.privacyDraft;
    delete legacy.world.privacyReceipts;
    delete legacy.world.voucherDraft;
    delete legacy.world.voucherReceipts;
    delete legacy.world.certifyDraft;
    delete legacy.world.certifications;
    const restored = safeRestore(JSON.stringify(legacy));

    expect(restored?.world.mintDraft).toEqual({
      actorId: "owner_artist",
      mode: "single",
      reviewConfirmed: false,
      signatureConfirmed: false,
    });
    expect(restored?.world.mintReceipts).toEqual([]);
    expect(restored?.world.nfcDraft).toEqual({
      actorId: "owner_artist",
      tagState: "ready_to_link",
      scanConfirmed: false,
      signatureConfirmed: false,
    });
    expect(restored?.world.nfcReceipts).toEqual([]);
    expect(restored?.world.currentOwnerRef).toBe("OWNER-DEMO-ALEX");
    expect(restored?.world.transferDraft).toEqual({
      destinationType: "tokenizart_user",
      recipientVerified: false,
      externalWarningAccepted: false,
      signatureConfirmed: false,
    });
    expect(restored?.world.transferReceipts).toEqual([]);
    expect(restored?.world.privacyDraft).toEqual({
      galleryVisible: false,
      technicalSheetVisible: true,
      certifyVisibility: { authenticity: true, exhibition: true, condition: true },
      previewAudience: "visitor",
      ownerConfirmed: false,
    });
    expect(restored?.world.privacyReceipts).toEqual([]);
    expect(restored?.world.voucherDraft).toEqual({ productId: "starter_kit", creditConfirmed: false });
    expect(restored?.world.voucherReceipts).toEqual([]);
    expect(restored?.world.certifyDraft).toEqual({ actorId: "expert", typeId: "authenticity", visibility: "public" });
    expect(restored?.world.certifications).toEqual([]);
  });

  it("records a synthetic Certify actor, evidence and owner visibility exactly once", () => {
    const context = structuredClone(initialContext);
    context.flow = "certify";
    context.stepIndex = manualContract.flows.certify.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "minted";
    context.world.certifyDraft = {
      actorId: "gallery_museum",
      typeId: "exhibition",
      visibility: "owner",
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.artworkStatus).toBe("certified");
    expect(result.certifyVisible).toBe(false);
    expect(result.vouchers.certify).toBe(1);
    expect(result.certifications).toEqual([expect.objectContaining({
      certificationId: "CERT-DEMO-001",
      actorId: "gallery_museum",
      typeId: "exhibition",
      visibility: "owner",
      evidenceAssetId: "evidence-exhibition-demo",
    })]);
  });

  it("requires a mobile scan and simulated signature before NFC linking", () => {
    const context = structuredClone(initialContext);
    context.flow = "chip";
    context.stepIndex = manualContract.flows.chip.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "minted";
    const actor = createActor(demoMachine, { input: context }).start();

    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("nfc_scan_required");
    actor.send({ type: "SET_NFC_DRAFT", scanConfirmed: true });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("nfc_confirmation_required");
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("minted");
  });

  it.each([
    ["linked_artwork", "nfc_already_linked"],
    ["not_tokenizart", "nfc_not_tokenizart"],
  ] as const)("blocks the %s NFC state without consuming a voucher", (tagState, errorCode) => {
    const context = structuredClone(initialContext);
    context.flow = "chip";
    context.stepIndex = manualContract.flows.chip.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "minted";
    context.world.nfcDraft = { actorId: "owner_artist", tagState, scanConfirmed: true, signatureConfirmed: true };
    const actor = createActor(demoMachine, { input: context }).start();

    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe(errorCode);
    expect(actor.getSnapshot().context.world.vouchers.nfc).toBe(1);
    expect(actor.getSnapshot().context.world.nfcReceipts).toHaveLength(0);
  });

  it("links a Ready to link tag and creates one deterministic NFC receipt", () => {
    const context = structuredClone(initialContext);
    context.flow = "chip";
    context.stepIndex = manualContract.flows.chip.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "certified";
    context.world.nfcDraft = {
      actorId: "authorized_certifier",
      tagState: "ready_to_link",
      scanConfirmed: true,
      signatureConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.artworkStatus).toBe("tagged");
    expect(result.vouchers.nfc).toBe(0);
    expect(result.nfcReceipts).toEqual([expect.objectContaining({
      receiptId: "NFC-DEMO-001",
      actorId: "authorized_certifier",
      tagState: "linked_artwork",
      vouchersConsumed: 1,
      networkRef: "gnosis-simulated",
      tagRef: "TAG-DEMO-001",
      certificationRef: "CERT-NFC-DEMO-001",
      tokenRef: "TOKEN-DEMO-001",
      transactionRef: "TX-DEMO-NFC-001",
    })]);
    expect(result.events.filter((event) => event === "chip.completed")).toHaveLength(1);
  });

  it("requires recipient, external boundary and simulated signature in order", () => {
    const context = structuredClone(initialContext);
    context.flow = "transferencia";
    context.stepIndex = manualContract.flows.transferencia.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "tagged";
    context.world.transferDraft.destinationType = "external_wallet";
    const actor = createActor(demoMachine, { input: context }).start();

    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("transfer_recipient_required");
    actor.send({ type: "SET_TRANSFER_DRAFT", recipientVerified: true });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("transfer_external_warning_required");
    actor.send({ type: "SET_TRANSFER_DRAFT", externalWarningAccepted: true });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("transfer_confirmation_required");
    expect(actor.getSnapshot().context.world.transferReceipts).toHaveLength(0);
  });

  it("records the external-wallet boundary without consuming vouchers", () => {
    const context = structuredClone(initialContext);
    context.flow = "transferencia";
    context.stepIndex = manualContract.flows.transferencia.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "certified";
    context.world.transferDraft = {
      destinationType: "external_wallet",
      recipientVerified: true,
      externalWarningAccepted: true,
      signatureConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.vouchers).toEqual({ mint: 2, certify: 2, nfc: 1 });
    expect(result.transferReceipts).toEqual([expect.objectContaining({
      destinationType: "external_wallet",
      newOwnerRef: "OWNER-DEMO-EXTERNAL",
      destinationWalletRef: "0xEXTERNAL-DEMO-0001",
      atelierManagement: "outside_atelier",
      vouchersConsumed: 0,
    })]);
  });

  it("requires an artwork and explicit owner confirmation before changing privacy", () => {
    const missingArtwork = structuredClone(initialContext);
    missingArtwork.flow = "privacy";
    missingArtwork.stepIndex = manualContract.flows.privacy.steps.length - 1;
    missingArtwork.world.accountStatus = "active";
    const actor = createActor(demoMachine, { input: missingArtwork }).start();

    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.errorCode).toBe("privacy_artwork_required");

    const missingConfirmation = structuredClone(missingArtwork);
    missingConfirmation.world.artworkStatus = "certified";
    const confirmedActor = createActor(demoMachine, { input: missingConfirmation }).start();
    confirmedActor.send({ type: "COMPLETE_STEP" });
    expect(confirmedActor.getSnapshot().context.errorCode).toBe("privacy_confirmation_required");
    expect(confirmedActor.getSnapshot().context.world.privacyReceipts).toHaveLength(0);
  });

  it("records partial public visibility while the owner retains every Certify", () => {
    const context = structuredClone(initialContext);
    context.flow = "privacy";
    context.stepIndex = manualContract.flows.privacy.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.artworkStatus = "certified";
    context.world.privacyDraft = {
      galleryVisible: true,
      technicalSheetVisible: true,
      certifyVisibility: { authenticity: true, exhibition: true, condition: false },
      previewAudience: "visitor",
      ownerConfirmed: true,
    };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.galleryVisible).toBe(true);
    expect(result.certifyVisible).toBe(true);
    expect(result.privacyReceipts).toEqual([expect.objectContaining({
      receiptId: "PRIVACY-DEMO-001",
      galleryVisible: true,
      technicalSheetVisible: true,
      publicCertifyIds: ["authenticity", "exhibition"],
      ownerOnlyCertifyIds: ["condition"],
    })]);
    expect(result.events.filter((event) => event === "privacy.completed")).toHaveLength(1);
  });

  it("hides the complete public artwork view when Gallery is disabled", () => {
    const context = structuredClone(initialContext);
    context.flow = "privacy";
    context.stepIndex = manualContract.flows.privacy.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.artworkStatus = "tagged";
    context.world.privacyDraft.galleryVisible = false;
    context.world.privacyDraft.ownerConfirmed = true;
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    const receipt = actor.getSnapshot().context.world.privacyReceipts[0];

    expect(receipt.publicCertifyIds).toEqual([]);
    expect(receipt.ownerOnlyCertifyIds).toEqual(["authenticity", "exhibition", "condition"]);
    expect(receipt.technicalSheetVisible).toBe(false);
  });

  it("requires an active account and explicit confirmation before simulated voucher credit", () => {
    const inactive = structuredClone(initialContext);
    inactive.flow = "vouchers";
    inactive.stepIndex = manualContract.flows.vouchers.steps.length - 1;
    inactive.world.voucherDraft.creditConfirmed = true;
    const inactiveActor = createActor(demoMachine, { input: inactive }).start();
    inactiveActor.send({ type: "COMPLETE_STEP" });
    expect(inactiveActor.getSnapshot().context.errorCode).toBe("account_required");

    const unconfirmed = structuredClone(inactive);
    unconfirmed.world.accountStatus = "active";
    unconfirmed.world.voucherDraft.creditConfirmed = false;
    const unconfirmedActor = createActor(demoMachine, { input: unconfirmed }).start();
    unconfirmedActor.send({ type: "COMPLETE_STEP" });
    expect(unconfirmedActor.getSnapshot().context.errorCode).toBe("voucher_confirmation_required");
    expect(unconfirmedActor.getSnapshot().context.world.voucherReceipts).toHaveLength(0);
  });

  it("credits the Starter Kit exactly once using the dated public Shop snapshot", () => {
    const context = structuredClone(initialContext);
    context.flow = "vouchers";
    context.stepIndex = manualContract.flows.vouchers.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.voucherDraft = { productId: "starter_kit", creditConfirmed: true };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.vouchers).toEqual({ mint: 3, certify: 4, nfc: 1 });
    expect(result.voucherReceipts).toEqual([expect.objectContaining({
      receiptId: "VOUCHER-DEMO-001",
      productId: "starter_kit",
      priceUsd: 20,
      priceVerifiedAt: "2026-07-14",
      credited: { mint: 1, certify: 2, nfc: 0 },
      resultingBalances: { mint: 3, certify: 4, nfc: 1 },
      sourceUrl: "https://tokenizart.com/es/shop/",
    })]);
    expect(result.events.filter((event) => event === "vouchers.completed")).toHaveLength(1);
  });

  it("credits an individual Chip voucher without changing Mint or Certify", () => {
    const context = structuredClone(initialContext);
    context.flow = "vouchers";
    context.stepIndex = manualContract.flows.vouchers.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.voucherDraft = { productId: "nfc", creditConfirmed: true };
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    const result = actor.getSnapshot().context.world;

    expect(result.vouchers).toEqual({ mint: 2, certify: 2, nfc: 2 });
    expect(result.voucherReceipts[0]).toEqual(expect.objectContaining({ productId: "nfc", priceUsd: 10 }));
  });

  it("accepts only allowlisted deep-link context", () => {
    const linked = contextFromSearch("?flow=certify&step=certify.attach-evidence&lang=pt&scenario=first-artwork&fixture=sculpture-signal-001");
    expect(linked.flow).toBe("certify");
    expect(manualContract.flows.certify.steps[linked.stepIndex].step_id).toBe("certify.attach-evidence");
    expect(linked.language).toBe("pt");
    expect(linked.fixtureId).toBe("sculpture-signal-001");

    const blocked = contextFromSearch("?flow=admin&step=../../secret&lang=xx&scenario=owner-live&fixture=private-wallet");
    expect(blocked.flow).toBe("onboarding");
    expect(blocked.language).toBe("es");
    expect(blocked.scenarioId).toBe("first-artwork");
    expect(blocked.fixtureId).toBe("painting-river-001");
  });
});
