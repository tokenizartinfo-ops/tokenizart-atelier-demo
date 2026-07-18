import { expect, test } from "@playwright/test";

test("opens every flow and keeps practice controls visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Demo Atelier" })).toBeVisible();
  await expect(page.getByText("Nada de esto ejecuta acciones reales.")).toBeVisible();

  await page.getByRole("button", { name: /Cargar obra/ }).click();
  await expect(page.getByText("Datos de práctica")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pintura/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Escultura/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Camiseta/ })).toBeVisible();
});

test("changes language without changing the selected flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Smart Wallet/ }).click();
  await page.locator("select").selectOption("en");
  await expect(page.getByRole("heading", { name: "Atelier Demo" })).toBeVisible();
  await expect(page.getByText("Practice data")).toBeVisible();
  await expect(page.getByText("Smart Wallet de práctica")).toBeVisible();
});

test("opens an allowlisted deep link from Companion", async ({ page }) => {
  await page.goto("/?flow=certify&step=certify.attach-evidence&lang=en&scenario=first-artwork&fixture=sculpture-signal-001");
  await expect(page.getByRole("heading", { name: "Attach relevant evidence" })).toBeVisible();
  await expect(page.getByText("11 / 15")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Atelier Demo" })).toBeVisible();
});

test("adds a focused readable detail to a panoramic manual asset", async ({ page }, testInfo) => {
  if (!process.env.DEMO_BASE_URL) {
    await page.route("**/api/manual-asset/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1268" height="76"><rect width="1268" height="76" fill="#fff"/><rect x="1100" y="8" width="145" height="60" fill="#9ee8ef"/><text x="1108" y="48" font-size="25">Registrarse</text></svg>',
      });
    });
  }
  await page.goto("/?flow=onboarding&step=onboarding.choose-registration&lang=es&scenario=first-artwork");
  const manualVisual = page.locator(".manual-visual");
  await expect(manualVisual).toHaveAttribute("data-visual-layout", "panoramic");
  await expect(page.getByRole("region", { name: "Detalle ampliado" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Detalle ampliado/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("panoramic-focus-detail.png"), fullPage: true });
});

test("adds focused navigation to a standard manual asset with multiple fields", async ({ page }, testInfo) => {
  if (!process.env.DEMO_BASE_URL) {
    await page.route("**/api/manual-asset/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="660" height="330"><rect width="660" height="330" fill="#fff"/><rect x="20" y="14" width="614" height="126" fill="#dff5f7"/><rect x="20" y="185" width="614" height="126" fill="#f4f7f9"/></svg>',
      });
    });
  }
  await page.goto("/?flow=carga_obra&step=carga-obra.choose-country-type&lang=es&scenario=first-artwork");
  const manualVisual = page.locator(".manual-visual");
  await expect(manualVisual).toHaveAttribute("data-visual-layout", "standard");
  const detail = page.getByRole("region", { name: "Detalle ampliado" });
  await expect(detail.getByText("Pais de creacion", { exact: true })).toBeVisible();
  await detail.getByRole("button", { name: "Siguiente detalle" }).click();
  await expect(detail.getByText("Tipo de obra", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("standard-focus-detail.png"), fullPage: true });
});

test("configures a synthetic Certify actor and renders the completed provenance", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "certify",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "minted",
        artworkTitle: "Ecos del río",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 1, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed"],
      },
    }));
  });

  await page.goto("/?flow=certify&step=certify.open-receipt&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Museo Demo/ }).click();
  await page.getByLabel("¿Qué hecho respalda?").selectOption("exhibition");
  await page.getByRole("button", { name: /Solo owner/ }).click();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".completion-result");
  await expect(result.getByText("Certify agregado a la historia de la obra")).toBeVisible();
  await expect(result.getByText("Museo Demo", { exact: true })).toBeVisible();
  await expect(result.getByText("Exhibición", { exact: true })).toBeVisible();
  await expect(result.getByText("CERT-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("Resultado didáctico: no se escribió en blockchain ni IPFS.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Completado/ })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("certify-result.png"), fullPage: true });
});

test("completes a synthetic batch Mint with deterministic references", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "mint",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "loaded",
        artworkTitle: "Ecos del río",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: false, signatureConfirmed: false },
        mintReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 2, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed"],
      },
    }));
  });

  await page.goto("/?flow=mint&step=mint.batch-verify-statuses&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Gestor Demo autorizado/ }).click();
  await page.getByRole("button", { name: /Lote de 2 obras/ }).click();
  await page.getByLabel("Confirmo que revisé la información de práctica").check();
  await page.getByLabel("Confirmo la firma de wallet simulada").check();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".mint-result");
  await expect(result.getByText("Identidad digital simulada creada")).toBeVisible();
  await expect(result.getByText("Gestor Demo autorizado", { exact: true })).toBeVisible();
  await expect(result.getByText("Lote de 2 obras", { exact: true })).toBeVisible();
  await expect(result.getByText("TOKEN-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("TX-DEMO-MINT-001", { exact: true })).toBeVisible();
  await expect(result.getByText("IPFS-DEMO-001", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Completado/ })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("mint-result.png"), fullPage: true });
});

test("interprets NFC tag states and completes a safe synthetic link", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "chip",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "certified",
        artworkTitle: "Ecos del río",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: true, signatureConfirmed: true },
        mintReceipts: [],
        nfcDraft: { actorId: "owner_artist", tagState: "ready_to_link", scanConfirmed: false, signatureConfirmed: false },
        nfcReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 1, certify: 1, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed", "certify.completed"],
      },
    }));
  });

  await page.goto("/?flow=chip&step=chip.interpret-reading-states&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Certificador Demo autorizado/ }).click();
  await page.getByRole("button", { name: /Tag no válido/ }).click();
  await expect(page.getByText("This is not a Tokenizart NFC tag", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Tag disponible/ }).click();
  await expect(page.getByText("Ready to link", { exact: true })).toBeVisible();
  await page.getByLabel("Confirmo la lectura móvil simulada").check();
  await page.getByLabel("Confirmo el cierre con firma simulada").check();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".nfc-result");
  await expect(result.getByText("Obra y tag NFC vinculados en la simulación")).toBeVisible();
  await expect(result.getByText("Certificador Demo autorizado", { exact: true })).toBeVisible();
  await expect(result.getByText("TAG-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("CERT-NFC-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("TX-DEMO-NFC-001", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Completado/ })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("nfc-result.png"), fullPage: true });
});

test("transfers synthetic ownership to an external wallet without vouchers", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "transferencia",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "tagged",
        artworkTitle: "Ecos del río",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-ALEX",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: true, signatureConfirmed: true },
        mintReceipts: [],
        nfcDraft: { actorId: "owner_artist", tagState: "ready_to_link", scanConfirmed: true, signatureConfirmed: true },
        nfcReceipts: [],
        transferDraft: { destinationType: "tokenizart_user", recipientVerified: false, externalWarningAccepted: false, signatureConfirmed: false },
        transferReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 1, certify: 1, nfc: 0 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed", "certify.completed", "chip.completed"],
      },
    }));
  });

  await page.goto("/?flow=transferencia&step=transferencia.external-wallet-boundary&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Wallet externa/ }).click();
  await page.getByLabel("Confirmo que verifiqué el destinatario").check();
  await page.getByLabel("Comprendo que sale de la gestión de Atelier").check();
  await page.getByLabel("Confirmo la firma simulada de la transferencia").check();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".transfer-result");
  await expect(result.getByText("Titularidad transferida en la simulación")).toBeVisible();
  await expect(result.getByText("OWNER-DEMO-ALEX", { exact: true })).toBeVisible();
  await expect(result.getByText("OWNER-DEMO-EXTERNAL", { exact: true })).toBeVisible();
  await expect(result.getByText("0xEXTERNAL-DEMO-0001", { exact: true })).toBeVisible();
  await expect(result.getByText("Fuera de la gestión de Atelier", { exact: true })).toBeVisible();
  await expect(result.getByText("TX-DEMO-TRANSFER-001", { exact: true })).toBeVisible();
  await expect(result.getByText("0", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Completado/ })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("transfer-result.png"), fullPage: true });
});

test("compares owner and visitor privacy before applying a partial public view", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "privacy",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "certified",
        artworkTitle: "Ecos del rio",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-ALEX",
        galleryVisible: false,
        certifyVisible: true,
        privacyDraft: {
          galleryVisible: true,
          technicalSheetVisible: true,
          certifyVisibility: { authenticity: true, exhibition: true, condition: false },
          previewAudience: "visitor",
          ownerConfirmed: false,
        },
        privacyReceipts: [],
        vouchers: { mint: 1, certify: 1, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed", "certify.completed"],
      },
    }));
  });

  await page.goto("/?flow=privacy&step=privacy.partial-restriction&lang=es&scenario=first-artwork");
  const preview = page.getByTestId("privacy-preview");
  await expect(preview.getByText("Vista visitante", { exact: true })).toBeVisible();
  await expect(preview.getByText("Autenticidad", { exact: true })).toBeVisible();
  await expect(preview.getByText(/Exhibici/)).toBeVisible();
  await expect(preview.getByText(/Estado de conservaci/)).toHaveCount(0);

  await page.getByRole("button", { name: /Vista owner/ }).click();
  await expect(preview.getByText(/Estado de conservaci/)).toBeVisible();
  await expect(preview.getByText("Solo owner", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Vista visitante/ }).click();

  await page.getByLabel(/Confirmo esta/).check();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".privacy-result");
  await expect(result.getByText(/visibilidad simulada aplicada/)).toBeVisible();
  await expect(result.getByText("PRIVACY-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("2", { exact: true })).toBeVisible();
  await expect(result.getByText("1", { exact: true })).toBeVisible();
  await expect(result.getByText(/privacidad de ninguna obra real/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("privacy-owner-visitor-result.png"), fullPage: true });
});

test("credits a synthetic Starter Kit and explains voucher consumption boundaries", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "vouchers",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "loaded",
        artworkTitle: "Ecos del rio",
        artworkAuthor: "Alex Rivera",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-ALEX",
        galleryVisible: false,
        certifyVisible: true,
        voucherDraft: { productId: "starter_kit", creditConfirmed: false },
        voucherReceipts: [],
        vouchers: { mint: 2, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed"],
      },
    }));
  });

  await page.goto("/?flow=vouchers&step=vouchers.understand-consumption&lang=es&scenario=first-artwork");
  await expect(page.getByText(/verificado: 2026-07-14/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir Shop oficial/ })).toHaveAttribute("href", "https://tokenizart.com/es/shop/");
  await expect(page.locator(".voucher-consumption").getByText(/No consume vouchers/)).toBeVisible();

  await page.getByRole("button", { name: /Voucher Chip/ }).click();
  await expect(page.getByText("+0 Mint · +0 Certify · +1 NFC")).toBeVisible();
  await page.getByRole("button", { name: /Starter Kit/ }).click();
  await page.getByLabel(/Confirmo la/).check();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".voucher-result");
  await expect(result.getByText(/Vouchers acreditados/)).toBeVisible();
  await expect(result.getByText("VOUCHER-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("USD 20.00", { exact: true })).toBeVisible();
  await expect(result.getByText("+1 M · +2 C · +0 NFC", { exact: true })).toBeVisible();
  await expect(result.getByText("3 M · 4 C · 1 NFC", { exact: true })).toBeVisible();
  await expect(result.getByText(/un pago/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("voucher-starter-kit-result.png"), fullPage: true });
});

test("exchanges metadata-only A2UI bridge messages with an allowlisted Companion parent", async ({ page }) => {
  const demoBaseUrl = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:5178";
  const companionOrigin = "https://companion-staging.tokenizart.info";
  const runtimeDemoOrigin = process.env.DEMO_BASE_URL
    ? new URL(process.env.DEMO_BASE_URL).origin
    : "https://demo-atelier-staging.tokenizart.info";
  const iframeUrl = new URL(runtimeDemoOrigin);
  iframeUrl.search = new URLSearchParams({
    flow: "certify",
    step: "certify.attach-evidence",
    lang: "es",
    scenario: "first-artwork",
    fixture: "painting-river-001",
    return_origin: companionOrigin,
  }).toString();

  if (!process.env.DEMO_BASE_URL) {
    await page.route(`${runtimeDemoOrigin}/**`, async (route) => {
      const requested = new URL(route.request().url());
      const local = new URL(requested.pathname + requested.search, demoBaseUrl);
      const response = await page.request.get(local.toString());
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body: await response.body(),
      });
    });
  }

  await page.route(`${companionOrigin}/demo-bridge-test`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><html><body><iframe id="demo" src="${iframeUrl.toString()}"></iframe><script>
        window.demoEvents = [];
        window.addEventListener("message", (event) => {
          if (event.origin !== ${JSON.stringify(runtimeDemoOrigin)}) return;
          window.demoEvents.push(event.data);
          if (event.data && event.data.type === "demo.ready") {
            event.source.postMessage({ ...event.data, type: "companion.bridge.ready" }, event.origin);
          }
          if (event.data && event.data.type === "demo.explain.requested") {
            event.source.postMessage({ ...event.data, type: "companion.explanation.available" }, event.origin);
          }
        });
      </script></body></html>`,
    });
  });

  await page.goto(`${companionOrigin}/demo-bridge-test`);
  const demoFrame = page.frameLocator("#demo");
  await expect(demoFrame.getByRole("heading", { name: "Demo Atelier" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => (window as unknown as { demoEvents: Array<{ type?: string }> }).demoEvents.map((item) => item.type))).toContain("demo.ready");
  await expect.poll(async () => page.evaluate(() => (window as unknown as { demoEvents: Array<{ type?: string }> }).demoEvents.map((item) => item.type))).toContain("demo.step.changed");
  await expect(demoFrame.getByText("Companion conectado")).toBeVisible();

  await demoFrame.getByRole("button", { name: "Preguntar al Companion" }).click();
  await expect.poll(async () => page.evaluate(() => (window as unknown as { demoEvents: Array<{ type?: string }> }).demoEvents.map((item) => item.type))).toContain("demo.explain.requested");
  await expect(demoFrame.getByText("La explicacion esta disponible junto a la Demo.")).toBeVisible();

  const envelopes = await page.evaluate(() => (window as unknown as { demoEvents: Array<Record<string, unknown>> }).demoEvents);
  expect(envelopes.every((item) => !Object.hasOwn(item, "owner_context") && !Object.hasOwn(item, "real_email") && !Object.hasOwn(item, "real_wallet"))).toBe(true);
});
