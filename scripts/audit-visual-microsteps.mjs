#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBaseUrl = "https://demo-atelier-staging.tokenizart.info";
const defaultOutputDir = path.join(repoRoot, "output", "visual-qa");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function flagsFor(asset) {
  const flags = [];
  if (asset.http_status !== 200) flags.push("unavailable");
  if (asset.aspect_ratio > 2.4) flags.push("panoramic");
  if (asset.aspect_ratio > 0 && asset.aspect_ratio < 0.45) flags.push("portrait");
  if (asset.width < 500 || asset.height < 220) flags.push("small_source");
  if (!asset.hotspot_count) flags.push("no_focus_hotspot");
  return flags;
}

function priorityFor(flags) {
  const weights = { unavailable: 100, small_source: 4, panoramic: 3, portrait: 3, no_focus_hotspot: 2 };
  return flags.reduce((total, flag) => total + (weights[flag] || 0), 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function renderHtml(report) {
  const cards = report.assets.map((asset) => `
    <article data-flow="${escapeHtml(asset.flow)}" data-flags="${escapeHtml(asset.flags.join(" "))}" data-priority="${asset.priority}">
      <div class="media"><img loading="lazy" src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.title)}"></div>
      <div class="copy"><div class="chips"><span>${escapeHtml(asset.flow)}</span><span>${asset.width}x${asset.height}</span><span>${asset.aspect_ratio.toFixed(2)}:1</span></div>
      <h2>${escapeHtml(asset.title)}</h2><code>${escapeHtml(asset.step_id)}</code><p>${asset.flags.length ? asset.flags.map((flag) => `<b>${escapeHtml(flag)}</b>`).join("") : "<i>sin alertas automaticas</i>"}</p></div>
    </article>`).join("");
  const flowOptions = Object.keys(report.summary.by_flow).map((flow) => `<option value="${escapeHtml(flow)}">${escapeHtml(flow)}</option>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demo Atelier - QA visual</title><style>
  :root{font-family:Inter,Segoe UI,sans-serif;color:#17242d;background:#f4f7f8}*{box-sizing:border-box}body{margin:0}header{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #dce5e8;padding:18px 24px}h1{margin:0 0 5px;font-size:24px;letter-spacing:0}header p{margin:0;color:#60717c}nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}select,label{min-height:38px;border:1px solid #cad7dc;background:white;padding:0 10px}label{display:flex;align-items:center;gap:7px}main{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}article{background:#fff;border:1px solid #dce5e8;border-radius:6px;overflow:hidden}article[hidden]{display:none}.media{height:210px;overflow:auto;background:#eef3f4;display:grid;place-items:center}.media img{display:block;max-width:none;height:180px;width:auto}.copy{padding:14px}.chips{display:flex;gap:5px;flex-wrap:wrap}.chips span,.copy b{font-size:11px;background:#e7f8f6;color:#087b87;padding:3px 6px}.copy b{display:inline-block;margin:3px 4px 0 0;background:#fff2e8;color:#8b421f}h2{font-size:16px;margin:12px 0 7px;letter-spacing:0}code{font-size:11px;overflow-wrap:anywhere;color:#536670}.copy p{margin:10px 0 0}footer{padding:18px 24px;color:#60717c}@media(max-width:600px){header{padding:14px}main{padding:10px;grid-template-columns:1fr}.media{height:180px}.media img{height:150px}}
  </style></head><body><header><h1>Demo Atelier - QA visual</h1><p>${report.summary.total_assets} pasos auditados. ${report.summary.needs_review} requieren revision visual prioritaria.</p><nav><select id="flow"><option value="">Todos los flujos</option>${flowOptions}</select><select id="flag"><option value="">Todas las condiciones</option><option>panoramic</option><option>portrait</option><option>small_source</option><option>no_focus_hotspot</option><option>unavailable</option></select><label><input id="priority" type="checkbox">Solo prioritarios</label></nav></header><main>${cards}</main><footer>Reporte tecnico. Una alerta automatica no invalida el asset; indica que necesita inspeccion humana o composicion adaptativa.</footer><script>
  const cards=[...document.querySelectorAll('article')];const filter=()=>{const flow=document.querySelector('#flow').value;const flag=document.querySelector('#flag').value;const priority=document.querySelector('#priority').checked;for(const card of cards){card.hidden=!!((flow&&card.dataset.flow!==flow)||(flag&&!card.dataset.flags.split(' ').includes(flag))||(priority&&Number(card.dataset.priority)<3));}};document.querySelectorAll('select,input').forEach((control)=>control.addEventListener('change',filter));
  </script></body></html>`;
}

async function inspectAsset(asset, baseUrl) {
  const url = `${baseUrl}/api/manual-asset/${encodeURIComponent(asset.asset_id)}`;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dimensions = pngDimensions(buffer) || { width: 0, height: 0 };
  const inspected = {
    ...asset,
    url,
    http_status: response.status,
    mime_type: response.headers.get("content-type") || "",
    bytes: buffer.length,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    ...dimensions,
    aspect_ratio: dimensions.height ? dimensions.width / dimensions.height : 0,
  };
  inspected.flags = flagsFor(inspected);
  inspected.priority = priorityFor(inspected.flags);
  return inspected;
}

async function main() {
  const baseUrl = argValue("--base-url", defaultBaseUrl).replace(/\/$/, "");
  const outputDir = path.resolve(argValue("--output-dir", defaultOutputDir));
  const manual = JSON.parse(await fs.readFile(path.join(repoRoot, "src", "data", "atelier-manual-native-microsteps.v1.json"), "utf8"));
  const atlas = JSON.parse(await fs.readFile(path.join(repoRoot, "src", "data", "atelier-manual-native-icon-atlas.v1.json"), "utf8"));
  const manualAssets = Object.entries(manual.flows).flatMap(([flow, definition]) => definition.steps.map((step) => ({
    flow, step_id: step.step_id, asset_id: step.asset_id, title: step.copy?.es?.title || step.step_id,
    source_slide: step.source_slide, hotspot_count: (step.hotspots || []).length,
  })));
  const actionAssets = atlas.icons.filter((icon) => icon.context === "atelier_action").map((icon) => ({
    flow: "action_overview", step_id: icon.icon_id, asset_id: icon.asset_id, title: icon.copy?.es?.title || icon.icon_id,
    source_slide: icon.source_slide, hotspot_count: 1,
  }));
  const requested = [...manualAssets, ...actionAssets];
  const assets = [];
  for (let index = 0; index < requested.length; index += 12) {
    assets.push(...await Promise.all(requested.slice(index, index + 12).map((asset) => inspectAsset(asset, baseUrl))));
  }
  assets.sort((left, right) => right.priority - left.priority || left.flow.localeCompare(right.flow) || left.step_id.localeCompare(right.step_id));
  const groupedByHash = assets.reduce((groups, asset) => {
    const group = groups.get(asset.sha256) || [];
    group.push(asset);
    groups.set(asset.sha256, group);
    return groups;
  }, new Map());
  const duplicateGroups = [...groupedByHash.values()].filter((group) => group.length > 1)
    .map((group) => group.map((asset) => ({ flow: asset.flow, step_id: asset.step_id, asset_id: asset.asset_id })));
  const flowNames = [...Object.keys(manual.flows), "action_overview"];
  const byFlow = Object.fromEntries(flowNames.map((flow) => {
    const flowAssets = assets.filter((asset) => asset.flow === flow);
    return [flow, {
      total: flowAssets.length,
      needs_review: flowAssets.filter((asset) => asset.priority >= 3).length,
      panoramic: flowAssets.filter((asset) => asset.flags.includes("panoramic")).length,
      small_source: flowAssets.filter((asset) => asset.flags.includes("small_source")).length,
      without_focus_hotspot: flowAssets.filter((asset) => asset.flags.includes("no_focus_hotspot")).length,
    }];
  }));
  const report = {
    schema: "tokenizart.demo_atelier_visual_qa.v1",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    summary: {
      total_assets: assets.length,
      unavailable: assets.filter((asset) => asset.flags.includes("unavailable")).length,
      needs_review: assets.filter((asset) => asset.priority >= 3).length,
      panoramic: assets.filter((asset) => asset.flags.includes("panoramic")).length,
      portrait: assets.filter((asset) => asset.flags.includes("portrait")).length,
      small_source: assets.filter((asset) => asset.flags.includes("small_source")).length,
      without_focus_hotspot: assets.filter((asset) => asset.flags.includes("no_focus_hotspot")).length,
      duplicate_payload_groups: duplicateGroups.length,
      by_flow: byFlow,
    },
    duplicate_payload_groups: duplicateGroups,
    assets,
  };
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "visual-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outputDir, "index.html"), renderHtml(report), "utf8");
  process.stdout.write(`${JSON.stringify({ ok: report.summary.unavailable === 0, output_dir: outputDir, ...report.summary }, null, 2)}\n`);
  if (report.summary.unavailable > 0 || report.summary.total_assets !== 151) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
