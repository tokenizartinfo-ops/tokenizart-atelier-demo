import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { contextFromSearch, demoMachine, initialContext, manualContract } from "./demoMachine";

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
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.world.vouchers).toEqual({ mint: 2, certify: 2, nfc: 1 });
    expect(actor.getSnapshot().context.world.artworkStatus).toBe("transferred");
  });

  it("consumes the matching voucher only on completed eligible flows", () => {
    const context = structuredClone(initialContext);
    context.flow = "mint";
    context.stepIndex = manualContract.flows.mint.steps.length - 1;
    context.world.accountStatus = "active";
    context.world.walletStatus = "backed_up";
    context.world.artworkStatus = "loaded";
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
    const actor = createActor(demoMachine, { input: context }).start();
    actor.send({ type: "COMPLETE_STEP" });
    actor.send({ type: "COMPLETE_STEP" });
    expect(actor.getSnapshot().context.world.vouchers.mint).toBe(1);
    expect(actor.getSnapshot().context.world.events.filter((event) => event === "mint.completed")).toHaveLength(1);
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
