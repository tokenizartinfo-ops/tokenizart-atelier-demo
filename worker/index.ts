interface Env {
  ASSETS: Fetcher;
  DEMO_ASSETS: R2Bucket;
}

const ASSET_ID = /^[a-z0-9][a-z0-9-]{2,120}$/;

const DISPLAY_ASSET_KEYS: Record<string, string> = {
  "onboarding-activation-email-sanitized": "companion/public-discovery/onboarding/onboarding-activation-email-sanitized.png",
  "voucher-shop-public-products": "companion/public-discovery/vouchers/voucher-shop-public-products.png",
  "voucher-consumption-rules": "companion/public-discovery/vouchers/voucher-consumption-rules.png",
  "ipfs-metadata-anatomy": "companion/public-discovery/artwork/ipfs-metadata-anatomy.png",
};

function securityHeaders(headers = new Headers()): Headers {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self' https://companion.tokenizart.info https://companion-staging.tokenizart.info"
  );
  return headers;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: securityHeaders(new Headers({ "content-type": "application/json; charset=utf-8" })),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "tokenizart-atelier-demo", mutation: "simulation_only" });
    }

    if (url.pathname.startsWith("/api/manual-asset/")) {
      const assetId = decodeURIComponent(url.pathname.slice("/api/manual-asset/".length));
      if (!ASSET_ID.test(assetId)) return json({ error: "invalid_asset_id" }, 400);

      const object = DISPLAY_ASSET_KEYS[assetId]
        ? await env.DEMO_ASSETS.get(DISPLAY_ASSET_KEYS[assetId])
        : await env.DEMO_ASSETS.get(`companion/manual-atelier/native-microsteps/${assetId}.png`) ??
          await env.DEMO_ASSETS.get(`companion/manual-atelier/native-icons/${assetId}.png`);
      if (!object) return json({ error: "asset_not_found" }, 404);

      const headers = securityHeaders(new Headers());
      object.writeHttpMetadata(headers);
      headers.set("content-type", "image/png");
      headers.set("cache-control", "public, max-age=86400, immutable");
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    const response = await env.ASSETS.fetch(request);
    const headers = securityHeaders(new Headers(response.headers));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
} satisfies ExportedHandler<Env>;
