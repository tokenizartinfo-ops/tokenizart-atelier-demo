import { useEffect, useMemo, useState } from "react";
import { useMachine } from "@xstate/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Box,
  Check,
  CircleAlert,
  Eye,
  FileCheck2,
  Fingerprint,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  KeyRound,
  Languages,
  LogIn,
  MessageCircleQuestion,
  Nfc,
  RefreshCcw,
  Route,
  ShieldCheck,
  Shirt,
  Tag,
  TicketCheck,
  UserRoundPlus,
  WalletCards,
  X,
  ZoomIn,
} from "lucide-react";
import { contextFromSearch, demoMachine, initialContext, manualContract, safeRestore } from "./demoMachine";
import { flowLabels, ui } from "./i18n";
import type { DemoContext, Language, ManualStep } from "./types";

const SESSION_KEY = "tokenizart.demo-atelier.session.v1";

const flowIcons: Record<string, typeof Blocks> = {
  onboarding: UserRoundPlus,
  account_wallet: WalletCards,
  atelier_navigation: Route,
  carga_obra: ImageIcon,
  mint: Fingerprint,
  certify: FileCheck2,
  chip: Nfc,
  transferencia: ArrowRight,
  privacy: Eye,
  vouchers: TicketCheck,
  public_gallery_traceability: GalleryHorizontalEnd,
  action_overview: Blocks,
};

const flowOrder = [
  "onboarding",
  "account_wallet",
  "atelier_navigation",
  "carga_obra",
  "mint",
  "certify",
  "chip",
  "transferencia",
  "privacy",
  "vouchers",
  "public_gallery_traceability",
  "action_overview",
];

const errors: Record<string, Record<Language, { title: string; body: string }>> = {
  account_required: {
    es: { title: "Primero activa el usuario de práctica", body: "Completa el flujo Crear usuario. La demo conserva el avance de esta sesión y luego te deja continuar." },
    en: { title: "Activate the practice account first", body: "Complete the Create account flow. The demo keeps this session's progress and then lets you continue." },
    pt: { title: "Primeiro ative o usuário de prática", body: "Conclua o fluxo Criar usuário. A demo mantém o progresso desta sessão e depois permite continuar." },
  },
  wallet_required: {
    es: { title: "Primero prepara la Smart Wallet", body: "Completa el recorrido de Smart Wallet antes de simular una acción que necesita firma. Nunca se usa una clave real." },
    en: { title: "Prepare the Smart Wallet first", body: "Complete the Smart Wallet tour before simulating an action that needs a signature. No real password is ever used." },
    pt: { title: "Primeiro prepare a Smart Wallet", body: "Conclua o percurso da Smart Wallet antes de simular uma ação que exige assinatura. Nenhuma senha real é usada." },
  },
  artwork_not_ready: {
    es: { title: "La obra todavía no está lista", body: "Precarga y revisa la obra antes de simular Mint. El bloqueo evita registrar una identidad con información incompleta." },
    en: { title: "The artwork is not ready yet", body: "Preload and review the artwork before simulating Mint. This prevents registering an identity with incomplete information." },
    pt: { title: "A obra ainda não está pronta", body: "Pré-carregue e revise a obra antes de simular Mint. O bloqueio evita registrar uma identidade com dados incompletos." },
  },
  artwork_not_minted: {
    es: { title: "Primero necesitas una obra minteada", body: "Certify, vinculación NFC y transferencia parten de una obra que ya posee identidad digital registrada." },
    en: { title: "You need a minted artwork first", body: "Certify, NFC linking, and transfer start from an artwork that already has a registered digital identity." },
    pt: { title: "Primeiro você precisa de uma obra mintada", body: "Certify, vinculação NFC e transferência partem de uma obra que já possui identidade digital registrada." },
  },
  email_not_received: {
    es: { title: "El email no llegó", body: "Revisa spam, confirma que el email esté bien escrito y usa el reenvío simulado. No necesitas crear otra cuenta." },
    en: { title: "The email did not arrive", body: "Check spam, confirm the email is correct, and use the simulated resend. You do not need another account." },
    pt: { title: "O email não chegou", body: "Verifique o spam, confirme o email e use o reenvio simulado. Não é preciso criar outra conta." },
  },
  wrong_wallet_password: {
    es: { title: "Clave de wallet incorrecta", body: "La operación no avanza. En la demo puedes corregirla; en Atelier nunca compartas la clave por chat." },
    en: { title: "Wrong wallet password", body: "The operation does not proceed. You can fix it in the demo; never share the password in chat." },
    pt: { title: "Senha da wallet incorreta", body: "A operação não avança. Corrija na demo; nunca compartilhe a senha no chat." },
  },
  missing_voucher: {
    es: { title: "No hay voucher disponible", body: "Mint, Certify o NFC quedan bloqueados hasta disponer del voucher correspondiente. Transferencia no consume vouchers." },
    en: { title: "No voucher available", body: "Mint, Certify, or NFC stays blocked until the matching voucher is available. Transfer does not consume vouchers." },
    pt: { title: "Voucher indisponível", body: "Mint, Certify ou NFC fica bloqueado até existir o voucher correspondente. Transferência não consome vouchers." },
  },
  missing_required_field: {
    es: { title: "Falta un dato requerido", body: "La demo marca el campo sin perder lo que ya completaste. Puedes volver, corregir y continuar." },
    en: { title: "A required field is missing", body: "The demo marks the field without losing your progress. Go back, fix it, and continue." },
    pt: { title: "Falta um dado obrigatório", body: "A demo marca o campo sem perder seu progresso. Volte, corrija e continue." },
  },
  nfc_not_tokenizart: {
    es: { title: "Este tag no es de Tokenizart", body: "La lectura simulada muestra ‘This is not a Tokenizart NFC tag’. No intentes vincularlo como si fuera un tag válido." },
    en: { title: "This is not a Tokenizart tag", body: "The simulated reading says ‘This is not a Tokenizart NFC tag’. Do not try to link it as a valid tag." },
    pt: { title: "Este tag não é da Tokenizart", body: "A leitura simulada mostra ‘This is not a Tokenizart NFC tag’. Não tente vinculá-lo como tag válido." },
  },
};

function statusText(context: DemoContext, language: Language) {
  const status = context.world.artworkStatus;
  const map: Record<string, Record<Language, string>> = {
    none: { es: "Sin obra", en: "No artwork", pt: "Sem obra" },
    draft: { es: "Borrador", en: "Draft", pt: "Rascunho" },
    loaded: { es: "Precargada", en: "Preloaded", pt: "Pré-carregada" },
    minted: { es: "Minteada", en: "Minted", pt: "Mintada" },
    certified: { es: "Con Certify", en: "With Certify", pt: "Com Certify" },
    tagged: { es: "Vinculada a NFC", en: "NFC linked", pt: "Vinculada a NFC" },
    transferred: { es: "Transferida", en: "Transferred", pt: "Transferida" },
  };
  return map[status][language];
}

function PracticeFields({ context, send }: { context: DemoContext; send: (event: any) => void }) {
  const lang = context.language;
  const t = ui[lang];

  if (context.flow === "onboarding") {
    return (
      <div className="practice-fields">
        <label>{t.emailLabel}<input value="visitante.demo@ejemplo.test" readOnly /></label>
        <div className="fake-mail"><BadgeCheck size={20} /><span><strong>Tokenizart Atelier</strong><small>Activación simulada · código 482 731</small></span></div>
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "email_not_received" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (context.flow === "account_wallet") {
    return (
      <div className="practice-fields">
        <div className="wallet-preview"><KeyRound size={26} /><span><strong>Smart Wallet de práctica</strong><small>0xD3m0...8A71 · sin valor real</small></span><ShieldCheck size={22} /></div>
        <div className="safety-note"><ShieldCheck size={18} />{t.noSecrets}</div>
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "wrong_wallet_password" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (context.flow === "carga_obra") {
    return (
      <div className="practice-fields artwork-form">
        <div className="fixture-selector" aria-label="Fixtures">
          <button className={context.fixtureId === "painting-river-001" ? "selected" : ""} onClick={() => send({ type: "SET_FIXTURE", fixtureId: "painting-river-001", artworkType: "painting" })}><ImageIcon size={18} />Pintura</button>
          <button className={context.fixtureId === "sculpture-signal-001" ? "selected" : ""} onClick={() => send({ type: "SET_FIXTURE", fixtureId: "sculpture-signal-001", artworkType: "sculpture" })}><Box size={18} />Escultura</button>
          <button className={context.fixtureId === "sports-shirt-001" ? "selected" : ""} onClick={() => send({ type: "SET_FIXTURE", fixtureId: "sports-shirt-001", artworkType: "sports" })}><Shirt size={18} />Camiseta</button>
        </div>
        <label>{t.titleLabel}<input value={context.world.artworkTitle} onChange={(event) => send({ type: "UPDATE_ARTWORK", title: event.target.value })} /></label>
        <label>{t.authorLabel}<input value={context.world.artworkAuthor} onChange={(event) => send({ type: "UPDATE_ARTWORK", author: event.target.value })} /></label>
        <div className="upload-simulation"><ImageIcon size={22} /><span><strong>3 imágenes de práctica</strong><small>Frente · reverso/firma · detalle</small></span><Check size={18} /></div>
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "missing_required_field" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (context.flow === "vouchers") {
    return <VoucherBalances context={context} />;
  }

  if (context.flow === "privacy") {
    return (
      <div className="practice-fields privacy-controls">
        <label><span>Gallery</span><input type="checkbox" checked={context.world.galleryVisible} readOnly /></label>
        <label><span>Certify visibles</span><input type="checkbox" checked={context.world.certifyVisible} readOnly /></label>
        <p>Solo el owner decide qué permanece público. La demo no cambia una obra real.</p>
      </div>
    );
  }

  if (context.flow === "chip") {
    return (
      <div className="practice-fields">
        <div className="phone-simulation"><Nfc size={38} /><strong>Ready to link</strong><small>Tag de práctica vacío y listo</small></div>
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "nfc_not_tokenizart" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (["mint", "certify"].includes(context.flow)) {
    const balance = context.flow === "mint" ? context.world.vouchers.mint : context.world.vouchers.certify;
    return (
      <div className="practice-fields">
        <div className="transaction-preview"><Fingerprint size={25} /><span><strong>{context.flow === "mint" ? "Mint" : "Certify"} {t.simulated}</strong><small>{context.world.artworkTitle} · voucher disponible: {balance}</small></span></div>
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: balance ? "wrong_wallet_password" : "missing_voucher" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (context.flow === "transferencia") {
    return (
      <div className="practice-fields">
        <label>Destinatario sintético<input value="coleccionista.demo@ejemplo.test" readOnly /></label>
        <div className="safety-note"><Tag size={18} />Transferencia no consume vouchers. No se envía ninguna obra real.</div>
      </div>
    );
  }

  return (
    <div className="practice-fields">
      <div className="safety-note"><ShieldCheck size={18} />{t.realActionBlocked}. {t.freeMode}</div>
      <VoucherBalances context={context} compact />
    </div>
  );
}

function VoucherBalances({ context, compact = false }: { context: DemoContext; compact?: boolean }) {
  return (
    <div className={compact ? "voucher-row compact" : "voucher-row"}>
      {Object.entries(context.world.vouchers).map(([name, value]) => (
        <div key={name}><TicketCheck size={18} /><span>{name.toUpperCase()}</span><strong>{value}</strong></div>
      ))}
    </div>
  );
}

function ManualVisual({ step, language, onZoom }: { step: ManualStep; language: Language; onZoom: () => void }) {
  return (
    <div className="visual-stage">
      <img src={`/api/manual-asset/${encodeURIComponent(step.asset_id)}`} alt={step.copy[language].title} />
      {(step.hotspots ?? []).map((hotspot, index) => (
        <span
          className="hotspot"
          key={`${step.step_id}-${index}`}
          title={hotspot.label[language]}
          style={{ left: `${hotspot.x_pct}%`, top: `${hotspot.y_pct}%`, width: `${hotspot.width_pct}%`, height: `${hotspot.height_pct}%` }}
        />
      ))}
      <button className="icon-button zoom" onClick={onZoom} title="Ampliar imagen" aria-label="Ampliar imagen"><ZoomIn size={20} /></button>
    </div>
  );
}

function App() {
  const initial = useMemo(() => {
    const restored = safeRestore(sessionStorage.getItem(SESSION_KEY)) ?? structuredClone(initialContext);
    return contextFromSearch(window.location.search, restored);
  }, []);
  const [snapshot, send] = useMachine(demoMachine, { input: initial });
  const [zoomed, setZoomed] = useState(false);
  const context = snapshot.context;
  const lang = context.language;
  const t = ui[lang];
  const flow = manualContract.flows[context.flow];
  const step = flow.steps[context.stepIndex] ?? flow.steps[0];
  const progress = Math.round(((context.stepIndex + 1) / flow.steps.length) * 100);
  const activeError = context.errorCode ? errors[context.errorCode]?.[lang] : null;

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(context));
    document.documentElement.lang = lang;
  }, [context, lang]);

  useEffect(() => {
    if (window.parent === window) return;
    const allowed = new Set(["https://companion.tokenizart.info", "https://companion-staging.tokenizart.info"]);
    let origin = "";
    try { origin = document.referrer ? new URL(document.referrer).origin : ""; } catch { origin = ""; }
    if (!allowed.has(origin)) return;
    window.parent.postMessage({
      schema: "tokenizart.demo_atelier_message.v1",
      type: "demo.step.changed",
      scenario_id: context.scenarioId,
      flow: context.flow,
      step_id: step.step_id,
      language: lang,
      fixture_id: context.fixtureId,
    }, origin);
  }, [context.flow, context.fixtureId, context.scenarioId, lang, step.step_id]);

  function reset() {
    sessionStorage.removeItem(SESSION_KEY);
    send({ type: "RESET" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block"><span className="brand-mark">T</span><div><h1>{t.brand}</h1><p>{t.tagline}</p></div></div>
        <div className="top-actions">
          <label className="language-control"><Languages size={18} /><select value={lang} onChange={(event) => send({ type: "SET_LANGUAGE", language: event.target.value as Language })}><option value="es">ES</option><option value="en">EN</option><option value="pt">PT</option></select></label>
          <button className="icon-button" onClick={reset} title={t.reset} aria-label={t.reset}><RefreshCcw size={19} /></button>
        </div>
      </header>

      <div className="workspace">
        <aside className="flow-rail">
          <div className="rail-heading"><strong>{t.chooseFlow}</strong><small>{t.freeMode}</small></div>
          <nav>
            {flowOrder.map((flowId) => {
              const Icon = flowIcons[flowId] ?? Blocks;
              return <button key={flowId} className={flowId === context.flow ? "active" : ""} onClick={() => send({ type: "SELECT_FLOW", flow: flowId })}><Icon size={18} /><span>{flowLabels[flowId][lang]}</span><small>{manualContract.flows[flowId].steps.length}</small></button>;
            })}
          </nav>
        </aside>

        <main className="simulation-workspace">
          <section className="simulation-header">
            <div><span className="eyebrow">{flowLabels[context.flow][lang]}</span><h2>{step.copy[lang].title}</h2></div>
            <div className="progress-block"><span>{context.stepIndex + 1} / {flow.steps.length}</span><div><i style={{ width: `${progress}%` }} /></div></div>
          </section>

          <section className="simulation-grid">
            <div className="screen-zone">
              <ManualVisual step={step} language={lang} onZoom={() => setZoomed(true)} />
              <div className="visual-meta"><span>{t.source}: Manual Atelier 2026</span><span>{t.slide} {step.source_slide}</span><span>{step.step_id}</span></div>
            </div>
            <div className="practice-zone">
              <div className="practice-title"><LogIn size={20} /><strong>{t.demoData}</strong><span>{t.simulated}</span></div>
              <PracticeFields context={context} send={send} />
              {activeError && <div className="error-panel"><CircleAlert size={22} /><div><strong>{activeError.title}</strong><p>{activeError.body}</p><button onClick={() => send({ type: "RESOLVE_ERROR" })}><Check size={17} />{t.resolve}</button></div></div>}
            </div>
          </section>

          <section className="step-navigation">
            <button className="secondary" disabled={context.stepIndex === 0} onClick={() => send({ type: "PREVIOUS" })}><ArrowLeft size={18} />{t.previous}</button>
            <button className="primary" onClick={() => {
              if (context.stepIndex === flow.steps.length - 1) send({ type: "COMPLETE_STEP" });
              else send({ type: "NEXT" });
            }}>{context.stepIndex === flow.steps.length - 1 ? t.complete : t.next}<ArrowRight size={18} /></button>
          </section>
        </main>

        <aside className="guide-panel">
          <div className="guide-heading"><MessageCircleQuestion size={21} /><strong>{t.guide}</strong></div>
          <p>{step.copy[lang].body}</p>
          {step.copy[lang].next_question && <blockquote>{step.copy[lang].next_question}</blockquote>}
          <div className="world-status">
            <h3>{t.session}</h3>
            <dl>
              <div><dt>{t.account}</dt><dd>{context.world.accountStatus}</dd></div>
              <div><dt>{t.wallet}</dt><dd>{context.world.walletStatus}</dd></div>
              <div><dt>{t.artwork}</dt><dd>{statusText(context, lang)}</dd></div>
            </dl>
            <VoucherBalances context={context} compact />
          </div>
          <a className="companion-link" href={`https://companion-staging.tokenizart.info/beta?demo_flow=${encodeURIComponent(context.flow)}&demo_step=${encodeURIComponent(step.step_id)}&lang=${lang}`} target="_blank" rel="noreferrer"><MessageCircleQuestion size={18} />{t.explain}</a>
        </aside>
      </div>

      {zoomed && <div className="lightbox" role="dialog" aria-modal="true" aria-label={step.copy[lang].title}><button className="icon-button" onClick={() => setZoomed(false)} title="Cerrar" aria-label="Cerrar"><X size={22} /></button><img src={`/api/manual-asset/${encodeURIComponent(step.asset_id)}`} alt={step.copy[lang].title} /><div><strong>{step.copy[lang].title}</strong><span>{t.imageHint}</span></div></div>}
    </div>
  );
}

export default App;
