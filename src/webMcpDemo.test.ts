import { describe, expect, it } from "vitest";
import { initialContext } from "./demoMachine";
import { currentStepResult, listFlowsResult, registerDemoWebMcpTools } from "./webMcpDemo";

describe("synthetic Atelier WebMCP pilot", () => {
  it("returns only a simulated step without owner, wallet or voucher state", () => {
    const result = currentStepResult(initialContext);
    const parsed = JSON.parse(result);
    expect(parsed).toMatchObject({ status: "ok", simulation: true, flow: "onboarding" });
    expect(result).not.toContain("OWNER-DEMO-GABRIEL");
    expect(result).not.toContain("walletStatus");
    expect(result).not.toContain("vouchers");
  });

  it("registers two read-only tools with no parameters and aborts on cleanup", async () => {
    const entries: Array<{ tool: any; signal: AbortSignal }> = [];
    const modelContext = {
      async registerTool(tool: any, options: { signal: AbortSignal }) {
        entries.push({ tool, signal: options.signal });
      },
    };
    const cleanup = registerDemoWebMcpTools(modelContext, () => initialContext);
    expect(entries.map(({ tool }) => tool.name)).toEqual(["tokenizart_demo_current_step", "tokenizart_demo_list_flows"]);
    for (const { tool } of entries) {
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, consequentialHint: false });
      expect(tool.inputSchema).toEqual({ type: "object", properties: {}, additionalProperties: false });
      expect(JSON.parse(await tool.execute()).simulation).toBe(true);
    }
    expect(JSON.parse(listFlowsResult()).flows.length).toBeGreaterThan(5);
    cleanup();
    expect(entries.every(({ signal }) => signal.aborted)).toBe(true);
  });

  it("does nothing when the browser does not expose WebMCP", () => {
    expect(() => registerDemoWebMcpTools(undefined, () => initialContext)()).not.toThrow();
  });
});
