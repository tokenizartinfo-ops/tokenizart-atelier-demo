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
