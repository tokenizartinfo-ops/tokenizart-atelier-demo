import { describe, expect, it, vi } from "vitest";
import { initialContext } from "./demoMachine";
import {
  createDemoBridgeMessage,
  isDemoPracticeStateForFlow,
  isCompanionBridgeMessage,
  postDemoBridgeMessage,
  practiceStateForContext,
  practiceStateForSelection,
  resolveDemoBridgeOrigin,
} from "./demoBridge";

describe("Demo Atelier A2UI bridge", () => {
  it("accepts only an allowlisted return origin matching the referrer", () => {
    expect(resolveDemoBridgeOrigin(
      "?return_origin=https%3A%2F%2Fcompanion-staging.tokenizart.info",
      "https://companion-staging.tokenizart.info/demo-atelier?flow=mint",
    )).toBe("https://companion-staging.tokenizart.info");
    expect(resolveDemoBridgeOrigin(
      "?return_origin=https%3A%2F%2Fcompanion-staging.tokenizart.info",
      "https://evil.example/embed",
    )).toBe("");
    expect(resolveDemoBridgeOrigin(
      "?return_origin=https%3A%2F%2Fevil.example",
      "https://evil.example/embed",
    )).toBe("");
  });

  it("creates a metadata-only allowlisted envelope", () => {
    const context = structuredClone(initialContext);
    context.flow = "certify";
    context.errorCode = "missing_voucher";
    const message = createDemoBridgeMessage("demo.error.shown", context, "certify.review-wallet-voucher");
    expect(message).toEqual({
      schema: "tokenizart.demo_atelier_message.v1",
      version: "1.2.0",
      type: "demo.error.shown",
      scenario_id: "first-artwork",
      flow: "certify",
      step_id: "certify.review-wallet-voucher",
      language: "es",
      synthetic_fixture_id: "painting-river-001",
      error_code: "missing_voucher",
    });
    const blockedFields = ["text", "real_email", "real_wallet", "password", "owner_context", "private_key", "raw_image"];
    expect(Object.keys(message || {}).some((key) => blockedFields.includes(key))).toBe(false);
  });

  it("emits only a flow-compatible allowlisted practice state", () => {
    const context = structuredClone(initialContext);
    context.flow = "atelier_navigation";
    expect(createDemoBridgeMessage(
      "demo.practice.changed",
      context,
      "navigation.own-all",
      { kind: "navigation_filter", value: "own.minted" },
    )).toMatchObject({
      version: "1.2.0",
      type: "demo.practice.changed",
      flow: "atelier_navigation",
      practice_state: { kind: "navigation_filter", value: "own.minted" },
    });
    expect(isDemoPracticeStateForFlow("atelier_navigation", { kind: "navigation_filter", value: "own.minted" })).toBe(true);
    expect(isDemoPracticeStateForFlow("atelier_navigation", { kind: "gallery_endpoint", value: "metadata" })).toBe(false);
  });

  it("fails closed for arbitrary or cross-flow practice values", () => {
    const context = structuredClone(initialContext);
    context.flow = "public_gallery_traceability";
    expect(createDemoBridgeMessage(
      "demo.practice.changed",
      context,
      "gallery.choose-traceability-endpoint",
      { kind: "gallery_endpoint", value: "https://evil.example/owner" } as never,
    )).toBeNull();
    expect(createDemoBridgeMessage(
      "demo.practice.changed",
      context,
      "gallery.choose-traceability-endpoint",
      { kind: "navigation_filter", value: "own.all" },
    )).toBeNull();
  });

  it("allowlists every synthetic operational choice only in its own flow", () => {
    const cases = [
      ["mint", "mint_actor:authorized_manager", { kind: "mint_actor", value: "authorized_manager" }],
      ["mint", "mint_mode:batch", { kind: "mint_mode", value: "batch" }],
      ["certify", "certify_actor:expert", { kind: "certify_actor", value: "expert" }],
      ["certify", "certify_type:exhibition", { kind: "certify_type", value: "exhibition" }],
      ["certify", "certify_visibility:owner", { kind: "certify_visibility", value: "owner" }],
      ["chip", "nfc_actor:authorized_certifier", { kind: "nfc_actor", value: "authorized_certifier" }],
      ["chip", "nfc_tag_state:not_tokenizart", { kind: "nfc_tag_state", value: "not_tokenizart" }],
      ["transferencia", "transfer_destination:external_wallet", { kind: "transfer_destination", value: "external_wallet" }],
      ["privacy", "privacy_gallery:hidden", { kind: "privacy_gallery", value: "hidden" }],
      ["privacy", "privacy_audience:visitor", { kind: "privacy_audience", value: "visitor" }],
      ["privacy", "privacy_certify:condition.owner", { kind: "privacy_certify", value: "condition.owner" }],
      ["vouchers", "voucher_product:certify", { kind: "voucher_product", value: "certify" }],
    ] as const;

    for (const [flow, selectionId, expected] of cases) {
      expect(practiceStateForSelection(flow, selectionId)).toEqual(expected);
      expect(isDemoPracticeStateForFlow(flow, expected)).toBe(true);
      expect(isDemoPracticeStateForFlow("action_overview", expected)).toBe(false);
    }
    expect(practiceStateForSelection("mint", "mint_mode:arbitrary")).toBeNull();
    expect(practiceStateForSelection("certify", "mint_mode:batch")).toBeNull();
  });

  it("derives a safe initial selection from the synthetic draft for an active step", () => {
    const context = structuredClone(initialContext);
    context.flow = "certify";
    context.world.certifyDraft.typeId = "exhibition";
    expect(practiceStateForContext(context, "certify.choose-type")).toEqual({
      kind: "certify_type",
      value: "exhibition",
    });
    expect(practiceStateForContext(context, "certify.submit-evidence")).toBeNull();
  });

  it("fails closed for an untrusted target origin", () => {
    const postMessage = vi.fn();
    expect(postDemoBridgeMessage(
      { postMessage },
      "https://evil.example",
      "demo.ready",
      structuredClone(initialContext),
      "onboarding.choose-registration",
    )).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("accepts only metadata-only Companion acknowledgements", () => {
    expect(isCompanionBridgeMessage({
      schema: "tokenizart.demo_atelier_message.v1",
      version: "1.2.0",
      type: "companion.bridge.ready",
      scenario_id: "first-artwork",
      flow: "onboarding",
      step_id: "onboarding.choose-registration",
      language: "es",
      synthetic_fixture_id: "painting-river-001",
    })).toBe(true);
    expect(isCompanionBridgeMessage({
      schema: "tokenizart.demo_atelier_message.v1",
      version: "1.2.0",
      type: "companion.navigate",
      scenario_id: "first-artwork",
      flow: "mint",
      step_id: "mint.success",
      language: "es",
      synthetic_fixture_id: "painting-river-001",
    })).toBe(false);
  });
});
