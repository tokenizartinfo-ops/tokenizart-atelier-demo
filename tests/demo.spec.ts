import { expect, test } from "@playwright/test";

const localDemo = !process.env.DEMO_BASE_URL || /^https?:\/\/(127\.0\.0\.1|localhost)/.test(process.env.DEMO_BASE_URL);

test("opens the dynamic artwork flow and keeps one coherent artwork across actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Demo Atelier" })).toBeVisible();
  await expect(page.getByText("Nada de esto ejecuta acciones reales.")).toBeVisible();

  await page.getByRole("button", { name: /Cargar obra/ }).click();
  await expect(page.getByText("Datos de práctica")).toBeVisible();
  await expect(page.getByRole("button", { name: /Obras propias/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: /Abrir formulario de carga/ }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByLabel("Nombre de la obra")).toHaveValue("Curvas");
  await expect(page.getByLabel("Autor")).toHaveValue("Jorge Norberto Leporace");
  await expect(page.locator(".atelier-main-image img")).toHaveAttribute("src", "/fixtures/curvas.png");

  await page.getByLabel("Nombre de la obra").fill("Curvas del Sur");
  await page.getByRole("button", { name: /^Mint/ }).click();
  await expect(page.locator(".operation-artwork-card").getByText("Curvas del Sur", { exact: true })).toBeVisible();
  await expect(page.locator(".operation-artwork-card").getByText("Jorge Norberto Leporace", { exact: true })).toBeVisible();
});

test("renders the complete technical sheet in the selected language", async ({ page }) => {
  await page.goto("/?flow=carga_obra&step=carga-obra.review-loaded-artwork&lang=en&scenario=first-artwork&fixture=painting-river-001");
  await expect(page.locator(".atelier-artwork-detail").getByRole("heading", { name: "Curvas" })).toBeVisible();
  await expect(page.locator(".atelier-artwork-detail").getByText("Jorge Norberto Leporace", { exact: true })).toBeVisible();
  await expect(page.locator(".atelier-artwork-detail").getByText("Personal collection", { exact: true })).toBeVisible();
  await expect(page.locator(".atelier-artwork-detail img").first()).toHaveAttribute("src", "/fixtures/curvas.png");
});

test("keeps Atelier first and synchronizes the local guide with every step", async ({ page }) => {
  await page.goto("/?flow=onboarding&lang=es&scenario=first-artwork");
  await expect(page.locator(".guide-panel")).toHaveCount(0);
  await expect(page.locator(".simulation-workspace")).toBeVisible();
  await expect(page.locator(".coach-heading").getByText("Paso actual", { exact: true })).toBeVisible();

  const explanation = page.locator(".coach-summary > p");
  const firstExplanation = await explanation.innerText();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(explanation).not.toHaveText(firstExplanation);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("changes language without changing the selected flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Smart Wallet/ }).click();
  await page.locator("select").selectOption("en");
  await expect(page.getByRole("heading", { name: "Atelier Demo" })).toBeVisible();
  await expect(page.getByText("Practice data")).toBeVisible();
  await expect(page.getByText("Create the Smart Wallet", { exact: true }).last()).toBeVisible();
});

test("renders onboarding, Smart Wallet and voucher phases with decision states", async ({ page }) => {
  const scenarios = [
    {
      url: "/?flow=onboarding&step=onboarding.complete-profile&lang=es&scenario=first-artwork",
      counter: "10 / 10",
      phase: "Activacion y perfil",
      legend: "Estados del alta de usuario",
      state: "Usuario listo",
    },
    {
      url: "/?flow=account_wallet&step=account-wallet-enter-user-space&lang=es&scenario=first-artwork",
      counter: "9 / 9",
      phase: "Ingreso a Atelier",
      legend: "Estados de Smart Wallet",
      state: "Lista para usar Atelier",
    },
    {
      url: "/?flow=vouchers&step=vouchers.understand-consumption&lang=es&scenario=first-artwork",
      counter: "7 / 7",
      phase: "Acreditacion y consumo",
      legend: "Estados de vouchers",
      state: "Transferencia sin voucher",
    },
  ];

  for (const scenario of scenarios) {
    await page.goto(scenario.url);
    await expect(page.getByText(scenario.counter, { exact: true })).toBeVisible();
    await expect(page.getByText(scenario.phase, { exact: true })).toBeVisible();
    await page.getByText("Estado de la práctica y referencias", { exact: true }).click();
    await expect(page.getByText(scenario.legend, { exact: true })).toBeVisible();
    await expect(page.getByText(scenario.state, { exact: true })).toBeVisible();
  }
});

test("opens an allowlisted deep link from Companion", async ({ page }) => {
  await page.goto("/?flow=certify&step=certify.attach-evidence&lang=en&scenario=first-artwork&fixture=painting-river-001");
  await expect(page.locator(".simulation-header").getByRole("heading", { name: "Attach relevant evidence" })).toBeVisible();
  await expect(page.getByText("11 / 15")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Atelier Demo" })).toBeVisible();
});

test("adds a focused readable detail to a panoramic manual asset", async ({ page }, testInfo) => {
  if (localDemo) {
    await page.route("**/api/manual-asset/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="559" height="145"><rect width="559" height="145" fill="#fff"/><rect x="40" y="25" width="479" height="95" fill="#9ee8ef"/><text x="64" y="82" font-size="25">Datos copiados</text></svg>',
      });
    });
  }
  await page.goto("/?flow=account_wallet&step=account-wallet-copy-confirmed&lang=es&scenario=first-artwork");
  const manualVisual = page.locator(".manual-visual");
  await expect(manualVisual).toHaveAttribute("data-visual-layout", "panoramic");
  await manualVisual.locator(".visual-view-controls > button").nth(1).click();
  await expect(page.getByRole("img", { name: /Detalle guiado/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("panoramic-focus-detail.png"), fullPage: true });
});

test("adds focused navigation to a standard manual asset with multiple fields", async ({ page }, testInfo) => {
  if (localDemo) {
    await page.route("**/api/manual-asset/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="660" height="330"><rect width="660" height="330" fill="#fff"/><rect x="20" y="14" width="614" height="126" fill="#dff5f7"/><rect x="20" y="185" width="614" height="126" fill="#f4f7f9"/></svg>',
      });
    });
  }
  await page.goto("/?flow=carga_obra&step=carga-obra.choose-country-type&lang=es&scenario=first-artwork");
  await page.getByText("Comparar con el manual verificado", { exact: true }).click();
  const manualVisual = page.locator(".manual-visual");
  await expect(manualVisual).toHaveAttribute("data-visual-layout", "standard");
  const controls = manualVisual.locator(".visual-view-controls");
  await expect(controls.getByText("Pais de creacion", { exact: true })).toBeVisible();
  await controls.locator(":scope > button").nth(1).click();
  await controls.getByRole("button", { name: "Siguiente detalle" }).click();
  await expect(controls.getByText("Tipo de obra", { exact: true })).toBeVisible();
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        certifyDraft: {
          actorId: "expert",
          typeId: "authenticity",
          visibility: "public",
          requestConfirmed: false,
          certifierAccepted: false,
          description: {
            es: "Informe de autenticidad de práctica referido a la obra Curvas.",
            en: "Practice authenticity report concerning the artwork Curvas.",
            pt: "Relatório de autenticidade de prática referente à obra Curvas.",
          },
          evidenceAttached: false,
          evidenceFileName: "informe-autenticidad-demo.pdf",
          credentialPrepared: false,
          signatureConfirmed: false,
        },
        certifications: [],
        vouchers: { mint: 1, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed"],
      },
    }));
  });

  await page.goto("/?flow=certify&step=certify.choose-certifier&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Galería \/ museo/ }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("¿Qué hecho respalda?").selectOption("exhibition");
  await page.getByRole("button", { name: /Solo owner/ }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("Confirmo el envío de esta solicitud sintética.").check();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("El certificador acepta trabajar sobre esta solicitud.").check();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("Descripción del hecho certificado").fill("La obra Curvas participó en la exhibición sintética de práctica.");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Adjuntar evidencia sintética" }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Usar credencial sintética de práctica" }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("Confirmo el registro Certify simulado.").check();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".certify-result");
  await expect(result.getByText("Certify agregado a la historia de la obra")).toBeVisible();
  await expect(result.getByText("Galería / museo", { exact: true })).toBeVisible();
  await expect(result.getByText("Exhibición", { exact: true })).toBeVisible();
  await expect(result.getByText("CERT-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("Simulación educativa: no se escribieron datos en Atelier, blockchain ni IPFS.")).toBeVisible();
  const finalState = page.locator(".final-artwork-state");
  await expect(finalState.getByText("museo@demo.invalid", { exact: true })).toBeVisible();
  await expect(finalState.getByRole("button", { name: /CERT-DEMO-001 · Archivo o evidencia IPFS/ })).toBeVisible();
  await expect(finalState.getByRole("button", { name: /CERT-DEMO-001 · Documentacion Certify en IPFS/ })).toBeVisible();
  await expect(finalState.getByRole("button", { name: /CERT-DEMO-001 · Comprobante de transaccion Certify/ })).toBeVisible();
  await expect(finalState.getByRole("button", { name: /CERT-DEMO-001 · Ver detalle del Certify/ })).toBeVisible();
  await finalState.getByRole("button", { name: "Gallery pública" }).click();
  await finalState.getByRole("tab", { name: "Certificaciones (0)" }).click();
  await expect(finalState.getByText("Todavía no hay Certify visibles en esta vista.")).toBeVisible();
  await finalState.getByRole("button", { name: "Administración" }).click();
  await finalState.getByRole("tab", { name: "Certificaciones (1)" }).click();
  await expect(finalState.getByText("museo@demo.invalid", { exact: true })).toBeVisible();
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "authorized_manager", mode: "batch", reviewConfirmed: true, credentialPrepared: true, signatureConfirmed: true },
        mintReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 2, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed"],
      },
    }));
  });

  await page.goto("/?flow=mint&step=mint.batch-verify-statuses&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".mint-result");
  await expect(result.getByText("Mint simulado finalizado")).toBeVisible();
  await expect(result.getByText("Gestor autorizado", { exact: true })).toBeVisible();
  await expect(result.getByText("Lote de dos obras", { exact: true })).toBeVisible();
  await expect(result.getByText("TOKEN-DEMO-001", { exact: true })).toBeVisible();
  await expect(result.getByText("TX-DEMO-MINT-001", { exact: true })).toBeVisible();
  await expect(result.getByText("IPFS-DEMO-001", { exact: true })).toBeVisible();
  const finalState = page.locator(".final-artwork-state");
  await expect(finalState.getByText("Curvas", { exact: true }).first()).toBeVisible();
  await expect(finalState.getByRole("button", { name: "NFT / token" })).toBeVisible();
  await expect(finalState.getByRole("button", { name: "Imagen principal IPFS" })).toBeVisible();
  await expect(finalState.getByRole("button", { name: "Metadata IPFS" })).toBeVisible();
  await expect(finalState.getByRole("button", { name: "Comprobante blockchain" })).toBeVisible();
  await finalState.getByRole("button", { name: "Comprobante blockchain" }).click();
  await expect(finalState.getByText("TX-DEMO-MINT-001", { exact: true })).toBeVisible();
  await finalState.getByRole("button", { name: "Gallery pública" }).click();
  await expect(finalState.getByText("Así se proyecta en Gallery")).toBeVisible();
  await expect(page.getByRole("button", { name: /Completado/ })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("mint-result.png"), fullPage: true });
});

test("completes a safe synthetic NFC link", async ({ page }, testInfo) => {
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: true, signatureConfirmed: true },
        mintReceipts: [],
        nfcDraft: { actorId: "authorized_certifier", tagState: "ready_to_link", scanConfirmed: true, signatureConfirmed: true },
        nfcReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 1, certify: 1, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed", "certify.completed"],
      },
    }));
  });

  await page.goto("/?flow=chip&step=chip.interpret-reading-states&lang=es&scenario=first-artwork");
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

test("keeps every adaptive practice surface focused on the current microstep", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tokenizart.demo-atelier.session.v1", JSON.stringify({
      language: "es",
      flow: "account_wallet",
      stepIndex: 0,
      scenarioId: "first-artwork",
      fixtureId: "painting-river-001",
      errorCode: null,
      world: {
        accountStatus: "active",
        walletStatus: "backed_up",
        artworkStatus: "loaded",
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: false, signatureConfirmed: false },
        mintReceipts: [],
        nfcDraft: { actorId: "owner_artist", tagState: "ready_to_link", scanConfirmed: false, signatureConfirmed: false },
        nfcReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 2, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed"],
      },
    }));
  });

  const cases = [
    { url: "/?flow=account_wallet&step=account-wallet.distinguish-access-wallet&lang=es", text: "Acceso a Atelier", actions: 0 },
    { url: "/?flow=mint&step=mint.review-voucher&lang=es", text: "Disponibles", actions: 0 },
    { url: "/?flow=mint&step=mint.batch-select-artworks&lang=es", text: "Obras seleccionadas para el lote", actions: 0 },
    { url: "/?flow=chip&step=chip.scan-tag&lang=es", text: "Ready to link", actions: 1 },
    { url: "/?flow=chip&step=chip.review-wallet-voucher&lang=es", text: "Voucher NFC disponible", actions: 0 },
    { url: "/?flow=transferencia&step=transferencia.enter-recipient-email&lang=es", text: "Destino de la transferencia", actions: 1 },
    { url: "/?flow=transferencia&step=transferencia.verify-blockchain-record&lang=es", text: "TX-DEMO-TRANSFER-001", actions: 0 },
    { url: "/?flow=privacy&step=privacy.toggle-gallery&lang=es", text: "Mostrar obra en Gallery", actions: 1 },
    { url: "/?flow=privacy&step=privacy.all-certify-visible&lang=es", text: "Comparar lo que ve cada persona", actions: 1 },
    { url: "/?flow=vouchers&step=vouchers.check-shop-prices&lang=es", text: "USD 20.00", actions: 0 },
    { url: "/?flow=vouchers&step=vouchers.compare-starter-kit&lang=es", text: "Elegir una adquisición de práctica", actions: 1 },
    { url: "/?flow=vouchers&step=vouchers.understand-consumption&lang=es", text: "Quién consume cada voucher", actions: 1 },
    { url: "/?flow=atelier_navigation&step=navigation.own-minted&lang=es", text: "Filtros de Obras Propias", actions: 1 },
    { url: "/?flow=atelier_navigation&step=navigation.contacts&lang=es", text: "Datos sintéticos de navegación", actions: 0 },
    { url: "/?flow=public_gallery_traceability&step=gallery.choose-traceability-endpoint&lang=es", text: "Elegir una referencia pública", actions: 1 },
    { url: "/?flow=public_gallery_traceability&step=gallery.read-ipfs-metadata&lang=es", text: "bafy...metadata-demo-255", actions: 0 },
    { url: "/?flow=action_overview&step=atelier_action.chip&lang=es", text: "Conecta el objeto físico", actions: 0 },
  ];

  for (const item of cases) {
    await page.goto(item.url);
    await expect(page.getByText(item.text, { exact: false }).first()).toBeVisible();
    await expect(page.locator("[data-practice-action]")).toHaveCount(item.actions);
  }

  await page.goto("/?flow=chip&step=chip.interpret-reading-states&lang=es");
  await page.getByRole("button", { name: /Tag no válido/ }).click();
  await expect(page.locator(".phone-simulation").getByText("This is not a Tokenizart NFC tag", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Tag disponible/ }).click();
  await expect(page.locator(".phone-simulation").getByText("Ready to link", { exact: true })).toBeVisible();
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-GABRIEL",
        galleryVisible: false,
        certifyVisible: true,
        mintDraft: { actorId: "owner_artist", mode: "single", reviewConfirmed: true, signatureConfirmed: true },
        mintReceipts: [],
        nfcDraft: { actorId: "owner_artist", tagState: "ready_to_link", scanConfirmed: true, signatureConfirmed: true },
        nfcReceipts: [],
        transferDraft: { destinationType: "external_wallet", recipientVerified: true, externalWarningAccepted: true, signatureConfirmed: true },
        transferReceipts: [],
        certifyDraft: { actorId: "expert", typeId: "authenticity", visibility: "public" },
        certifications: [],
        vouchers: { mint: 1, certify: 1, nfc: 0 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed", "mint.completed", "certify.completed", "chip.completed"],
      },
    }));
  });

  await page.goto("/?flow=transferencia&step=transferencia.verify-blockchain-record&lang=es&scenario=first-artwork");
  await expect(page.getByRole("heading", { name: "Verificar el registro de transferencia", exact: true })).toBeVisible();
  await expect(page.getByText("Resultado y verificacion", { exact: true })).toBeVisible();
  await page.getByText("Estado de la práctica y referencias", { exact: true }).click();
  await expect(page.getByText("Estados posibles de Transferencia", { exact: true })).toBeVisible();

  await page.goto("/?flow=transferencia&step=transferencia.external-wallet-boundary&lang=es&scenario=first-artwork");
  await expect(page.getByText("Recuperacion o salida externa", { exact: true })).toBeVisible();
  await expect(page.getByText(/fuera de Atelier/i).first()).toBeVisible();
  await page.getByRole("button", { name: /Completar paso/ }).click();

  const result = page.locator(".transfer-result");
  await expect(result.getByText("Titularidad transferida en la simulación")).toBeVisible();
  await expect(result.getByText("OWNER-DEMO-GABRIEL", { exact: true })).toBeVisible();
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-GABRIEL",
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

  await page.goto("/?flow=privacy&step=privacy.understand-owner-control&lang=es&scenario=first-artwork");
  await expect(page.getByRole("heading", { name: "Entender quien decide la visibilidad", exact: true })).toBeVisible();
  await expect(page.getByText("Decision de visibilidad", { exact: true })).toBeVisible();

  await page.goto("/?flow=privacy&step=privacy.all-certify-visible&lang=es&scenario=first-artwork");
  await page.getByText("Estado de la práctica y referencias", { exact: true }).click();
  const preview = page.getByTestId("privacy-preview");
  await expect(preview.getByText("Vista visitante", { exact: true })).toBeVisible();
  await expect(preview.getByText("Autenticidad", { exact: true })).toBeVisible();
  await expect(preview.getByText(/Exhibici/)).toBeVisible();
  await expect(preview.getByText(/Estado de conservaci/)).toHaveCount(0);

  await page.getByRole("button", { name: /Vista owner/ }).click();
  await expect(preview.getByText(/Estado de conservaci/)).toBeVisible();
  await expect(preview.getByText("Solo owner", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Vista visitante/ }).click();

  await page.goto("/?flow=privacy&step=privacy.partial-restriction&lang=es&scenario=first-artwork");
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
        artworkTitle: "Curvas",
        artworkAuthor: "Jorge Norberto Leporace",
        artworkType: "painting",
        currentOwnerRef: "OWNER-DEMO-GABRIEL",
        galleryVisible: false,
        certifyVisible: true,
        voucherDraft: { productId: "starter_kit", creditConfirmed: false },
        voucherReceipts: [],
        vouchers: { mint: 2, certify: 2, nfc: 1 },
        events: ["onboarding.completed", "account_wallet.completed", "carga_obra.completed"],
      },
    }));
  });

  await page.goto("/?flow=vouchers&step=vouchers.check-shop-prices&lang=es&scenario=first-artwork");
  await expect(page.getByText(/verificado: 2026-07-14/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir Shop oficial/ })).toHaveAttribute("href", "https://tokenizart.com/es/shop/");

  await page.goto("/?flow=vouchers&step=vouchers.compare-starter-kit&lang=es&scenario=first-artwork");
  await page.getByRole("button", { name: /Voucher Chip/ }).click();
  await expect(page.getByText("+0 Mint · +0 Certify · +1 NFC")).toBeVisible();

  await page.goto("/?flow=vouchers&step=vouchers.understand-consumption&lang=es&scenario=first-artwork");
  await expect(page.locator(".voucher-consumption").getByText(/No consume vouchers/)).toBeVisible();
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
  const runtimeDemoOrigin = "https://demo-atelier-staging.tokenizart.info";
  const iframeUrl = new URL(runtimeDemoOrigin);
  iframeUrl.search = new URLSearchParams({
    flow: "atelier_navigation",
    step: "navigation.own-all",
    lang: "es",
    scenario: "first-artwork",
    fixture: "painting-river-001",
    return_origin: companionOrigin,
  }).toString();

  if (localDemo) {
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
          const acknowledgement = event.data && {
            schema: event.data.schema,
            version: event.data.version,
            scenario_id: event.data.scenario_id,
            flow: event.data.flow,
            step_id: event.data.step_id,
            language: event.data.language,
            synthetic_fixture_id: event.data.synthetic_fixture_id,
          };
          if (event.data && event.data.type === "demo.ready") {
            event.source.postMessage({ ...acknowledgement, type: "companion.bridge.ready" }, event.origin);
          }
          if (event.data && event.data.type === "demo.explain.requested") {
            event.source.postMessage({ ...acknowledgement, type: "companion.explanation.available" }, event.origin);
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

  await demoFrame.getByRole("button", { name: /Filtrar Obras Propias minteadas/ }).click();
  await expect.poll(async () => page.evaluate(() => {
    const events = (window as unknown as { demoEvents: Array<{ type?: string; practice_state?: { kind?: string; value?: string } }> }).demoEvents;
    return events.some((item) => item.type === "demo.practice.changed" && item.practice_state?.kind === "navigation_filter" && item.practice_state?.value === "own.minted");
  })).toBe(true);

  await demoFrame.getByRole("button", { name: "Ampliar con el Companion" }).click();
  await expect.poll(async () => page.evaluate(() => (window as unknown as { demoEvents: Array<{ type?: string }> }).demoEvents.map((item) => item.type))).toContain("demo.explain.requested");
  await expect(demoFrame.getByText("Explicacion del Companion lista")).toBeVisible();

  const envelopes = await page.evaluate(() => (window as unknown as { demoEvents: Array<Record<string, unknown>> }).demoEvents);
  expect(envelopes.every((item) => !Object.hasOwn(item, "owner_context") && !Object.hasOwn(item, "real_email") && !Object.hasOwn(item, "real_wallet"))).toBe(true);
  expect(envelopes.every((item) => !Object.hasOwn(item, "text") && !Object.hasOwn(item, "query"))).toBe(true);
});
