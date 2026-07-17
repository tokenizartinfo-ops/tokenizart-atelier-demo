import { describe, expect, it, vi } from "vitest";
import { initialContext } from "./demoMachine";
import {
  createDemoBridgeMessage,
  isCompanionBridgeMessage,
  postDemoBridgeMessage,
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
      version: "1.0.0",
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
      version: "1.0.0",
      type: "companion.bridge.ready",
      scenario_id: "first-artwork",
      flow: "onboarding",
      step_id: "onboarding.choose-registration",
      language: "es",
      synthetic_fixture_id: "painting-river-001",
    })).toBe(true);
    expect(isCompanionBridgeMessage({
      schema: "tokenizart.demo_atelier_message.v1",
      version: "1.0.0",
      type: "companion.navigate",
      scenario_id: "first-artwork",
      flow: "mint",
      step_id: "mint.success",
      language: "es",
      synthetic_fixture_id: "painting-river-001",
    })).toBe(false);
  });
});
