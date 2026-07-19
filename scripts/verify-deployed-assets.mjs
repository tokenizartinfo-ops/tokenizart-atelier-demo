import { readFile } from "node:fs/promises";

const baseUrl = (process.env.DEMO_BASE_URL ?? "https://demo-atelier-staging.tokenizart.info").replace(/\/$/, "");
const manual = JSON.parse(await readFile(new URL("../src/data/atelier-manual-native-microsteps.v1.json", import.meta.url), "utf8"));
const atlas = JSON.parse(await readFile(new URL("../src/data/atelier-manual-native-icon-atlas.v1.json", import.meta.url), "utf8"));

const assetIds = new Set();
for (const flow of Object.values(manual.flows)) {
  for (const step of flow.steps) assetIds.add(step.display_asset_id || step.asset_id);
}
for (const icon of atlas.icons) assetIds.add(icon.asset_id);

const pending = [...assetIds];
const failures = [];

async function worker() {
  while (pending.length) {
    const assetId = pending.shift();
    const response = await fetch(`${baseUrl}/api/manual-asset/${encodeURIComponent(assetId)}`);
    const bytes = Number(response.headers.get("content-length") ?? 0);
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/png") || (bytes > 0 && bytes < 100)) {
      failures.push({ assetId, status: response.status, contentType, bytes });
      continue;
    }

    if (!bytes) {
      const body = await response.arrayBuffer();
      if (body.byteLength < 100) failures.push({ assetId, status: response.status, contentType, bytes: body.byteLength });
    } else {
      await response.body?.cancel();
    }
  }
}

await Promise.all(Array.from({ length: Math.min(12, pending.length) }, worker));

if (failures.length) {
  console.error(JSON.stringify({ ok: false, checked: assetIds.size, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: assetIds.size, baseUrl }, null, 2));
