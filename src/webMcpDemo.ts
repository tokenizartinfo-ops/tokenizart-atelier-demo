import { manualContract } from "./demoMachine";
import type { DemoContext } from "./types";

type DemoTool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, never>; additionalProperties: false };
  annotations: { readOnlyHint: true; consequentialHint: false; untrustedContentHint: false };
  execute: () => Promise<string>;
};

export interface DemoModelContext {
  registerTool(tool: DemoTool, options: { signal: AbortSignal }): Promise<unknown>;
}

export function currentStepResult(context: DemoContext): string {
  const flow = manualContract.flows[context.flow];
  const step = flow?.steps[context.stepIndex];
  if (!flow || !step) return JSON.stringify({ status: "unavailable", simulation: true });
  const copy = step.copy[context.language];
  return JSON.stringify({
    status: "ok",
    simulation: true,
    flow: context.flow,
    step_id: step.step_id,
    step_number: step.order,
    total_steps: flow.steps.length,
    language: context.language,
    title: copy.title,
    explanation: copy.body,
  });
}

export function listFlowsResult(): string {
  return JSON.stringify({
    status: "ok",
    simulation: true,
    flows: Object.entries(manualContract.flows).map(([id, flow]) => ({ id, steps: flow.steps.length })),
  });
}

export function registerDemoWebMcpTools(modelContext: DemoModelContext | undefined, getContext: () => DemoContext): () => void {
  if (!modelContext) return () => {};
  const controller = new AbortController();
  const common = {
    inputSchema: { type: "object" as const, properties: {}, additionalProperties: false as const },
    annotations: { readOnlyHint: true as const, consequentialHint: false as const, untrustedContentHint: false as const },
  };
  void Promise.all([
    modelContext.registerTool({
      ...common,
      name: "tokenizart_demo_current_step",
      description: "Read the step currently visible in the synthetic Atelier demo. Does not access a real account or perform an action.",
      execute: async () => currentStepResult(getContext()),
    }, { signal: controller.signal }),
    modelContext.registerTool({
      ...common,
      name: "tokenizart_demo_list_flows",
      description: "List the educational flows in the synthetic Atelier demo. Does not access a real account or perform an action.",
      execute: async () => listFlowsResult(),
    }, { signal: controller.signal }),
  ]).catch(() => {
    // Experimental browser API: the ordinary demo remains usable when registration fails.
  });
  return () => controller.abort();
}
