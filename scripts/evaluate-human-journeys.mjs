#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.DEMO_BASE_URL ?? "https://demo-atelier-staging.tokenizart.info").replace(/\/$/, "");
const outputDir = path.join(repoRoot, "output", "human-journeys-staging");
const journeys = [
  { flow: "onboarding", expectedSteps: 10 },
  { flow: "account_wallet", expectedSteps: 9 },
  { flow: "carga_obra", expectedSteps: 22 },
  { flow: "mint", expectedSteps: 15 },
  { flow: "certify", expectedSteps: 15 },
  { flow: "chip", expectedSteps: 26 },
  { flow: "transferencia", expectedSteps: 12 },
  { flow: "privacy", expectedSteps: 6 },
  { flow: "vouchers", expectedSteps: 7 },
];

async function inspectStep(page) {
  await page.locator(".manual-visual img").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const image = document.querySelector(".manual-visual img");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });

  return page.evaluate(() => {
    const first = (selector) => document.querySelector(selector);
    const fontSize = (selector) => {
      const element = first(selector);
      return element ? Number.parseFloat(getComputedStyle(element).fontSize) : null;
    };
    const image = first(".manual-visual img");
    return {
      title: first(".simulation-header h2")?.textContent?.trim() ?? "",
      practice_title: first(".practice-step-focus strong")?.textContent?.trim() ?? "",
      coach: first(".coach-summary > p")?.textContent?.trim() ?? "",
      image_src: image?.getAttribute("src") ?? "",
      image_width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
      image_height: image instanceof HTMLImageElement ? image.naturalHeight : 0,
      practice_font_px: {
        heading: fontSize(".practice-heading strong"),
        current_step: fontSize(".practice-step-focus strong"),
        label: fontSize(".practice-fields label"),
        input: fontSize(".practice-fields input, .practice-fields select"),
        supporting: fontSize(".practice-fields small"),
      },
      horizontal_overflow_px: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      practice_action_count: document.querySelectorAll("[data-practice-action]").length,
    };
  });
}

function fontFailures(step) {
  const limits = { heading: 15, current_step: 14, label: 14, input: 14, supporting: 12 };
  return Object.entries(step.practice_font_px)
    .filter(([key, value]) => value !== null && value < limits[key])
    .map(([key, value]) => ({ key, value, expected: limits[key] }));
}

async function runJourney(browser, journey, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${baseUrl}/?flow=${journey.flow}&lang=es&scenario=first-artwork`, { waitUntil: "networkidle" });
  const counter = await page.locator(".progress-block span").innerText();
  const total = Number(counter.split("/")[1]?.trim());
  const steps = [];

  for (let index = 0; index < total; index += 1) {
    const step = await inspectStep(page);
    steps.push({ index: index + 1, ...step, font_failures: fontFailures(step) });
    if (index < total - 1) await page.locator(".step-navigation.compact .primary").click();
  }

  await page.close();
  return {
    flow: journey.flow,
    viewport,
    expected_steps: journey.expectedSteps,
    observed_steps: total,
    missing_images: steps.filter((step) => !step.image_width || !step.image_height).length,
    mismatched_step_focus: steps.filter((step) => step.title !== step.practice_title).length,
    duplicate_adjacent_coach: steps.slice(1).filter((step, index) => step.coach === steps[index].coach).length,
    font_failures: steps.flatMap((step) => step.font_failures.map((failure) => ({ step: step.index, ...failure }))),
    horizontal_overflow_steps: steps.filter((step) => step.horizontal_overflow_px > 1).length,
    multiple_practice_action_steps: steps.filter((step) => step.practice_action_count > 1).length,
    steps,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 412, height: 915 }]) {
      for (const journey of journeys) results.push(await runJourney(browser, journey, viewport));
    }
  } finally {
    await browser.close();
  }

  const summary = {
    schema: "tokenizart.demo_atelier_human_journeys.v1",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    journeys: results.length,
    steps_checked: results.reduce((total, result) => total + result.observed_steps, 0),
    missing_images: results.reduce((total, result) => total + result.missing_images, 0),
    mismatched_step_focus: results.reduce((total, result) => total + result.mismatched_step_focus, 0),
    duplicate_adjacent_coach: results.reduce((total, result) => total + result.duplicate_adjacent_coach, 0),
    font_failures: results.reduce((total, result) => total + result.font_failures.length, 0),
    horizontal_overflow_steps: results.reduce((total, result) => total + result.horizontal_overflow_steps, 0),
    multiple_practice_action_steps: results.reduce((total, result) => total + result.multiple_practice_action_steps, 0),
    step_count_failures: results.filter((result) => result.expected_steps !== result.observed_steps).length,
  };
  const report = { ...summary, results };
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (summary.missing_images || summary.mismatched_step_focus || summary.font_failures || summary.horizontal_overflow_steps || summary.multiple_practice_action_steps || summary.step_count_failures) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
