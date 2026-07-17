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
import type { CertifyActorId, CertifyTypeId, DemoContext, Language, ManualStep, MintActorId, MintMode, NfcActorId, NfcTagState } from "./types";

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
  mint_review_required: {
    es: { title: "Revisa la obra antes de Mint", body: "Confirma que título, autor, imágenes, ficha y visibilidad de práctica estén revisados. Mint no debe usarse como una edición rápida." },
    en: { title: "Review the artwork before Mint", body: "Confirm that the practice title, author, images, technical sheet, and visibility were reviewed. Mint is not a quick edit." },
    pt: { title: "Revise a obra antes do Mint", body: "Confirme que título, autor, imagens, ficha técnica e visibilidade de prática foram revisados. Mint não é uma edição rápida." },
  },
  mint_confirmation_required: {
    es: { title: "Falta la confirmación simulada", body: "Marca la confirmación de firma de wallet. Es un control didáctico: no ingreses una clave ni contraseña real." },
    en: { title: "Simulated confirmation is missing", body: "Confirm the simulated wallet signature. This is a learning control: do not enter a real key or password." },
    pt: { title: "Falta a confirmação simulada", body: "Confirme a assinatura simulada da wallet. É um controle didático: não insira chave nem senha real." },
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
  nfc_already_linked: {
    es: { title: "Este tag ya está vinculado", body: "La lectura abre una obra Tokenizart existente. No lo reutilices: verifica que sea la obra esperada o utiliza otro tag Ready to link." },
    en: { title: "This tag is already linked", body: "The scan opens an existing Tokenizart artwork. Do not reuse it: verify the artwork or use another Ready to link tag." },
    pt: { title: "Este tag já está vinculado", body: "A leitura abre uma obra Tokenizart existente. Não reutilize: confira a obra ou use outro tag Ready to link." },
  },
  nfc_scan_required: {
    es: { title: "Falta confirmar la lectura móvil", body: "Acerca el teléfono al tag de práctica y confirma la lectura. La demo no usa el NFC real del dispositivo." },
    en: { title: "Mobile scan confirmation is missing", body: "Bring the phone close to the practice tag and confirm the scan. The demo does not use the device's real NFC." },
    pt: { title: "Falta confirmar a leitura móvel", body: "Aproxime o celular do tag de prática e confirme a leitura. A demo não usa o NFC real do aparelho." },
  },
  nfc_confirmation_required: {
    es: { title: "Falta la firma simulada", body: "Confirma el cierre de wallet de práctica. Nunca ingreses una contraseña, clave privada o seed phrase en la demo." },
    en: { title: "Simulated signature is missing", body: "Confirm the practice wallet closure. Never enter a password, private key, or seed phrase in the demo." },
    pt: { title: "Falta a assinatura simulada", body: "Confirme o fechamento da wallet de prática. Nunca insira senha, chave privada ou seed phrase na demo." },
  },
};

const certifyActors: Record<CertifyActorId, Record<Language, { name: string; description: string }>> = {
  owner_artist: {
    es: { name: "Alex Rivera · owner/artista", description: "Declara un hecho propio sobre la obra." },
    en: { name: "Alex Rivera · owner/artist", description: "Declares a first-party fact about the artwork." },
    pt: { name: "Alex Rivera · owner/artista", description: "Declara um fato próprio sobre a obra." },
  },
  expert: {
    es: { name: "Perito Demo", description: "Aporta una evaluación profesional independiente." },
    en: { name: "Demo Expert", description: "Contributes an independent professional assessment." },
    pt: { name: "Perito Demo", description: "Fornece uma avaliação profissional independente." },
  },
  gallery_museum: {
    es: { name: "Museo Demo", description: "Documenta exhibición, custodia u otro hecho institucional." },
    en: { name: "Demo Museum", description: "Documents an exhibition, custody, or another institutional fact." },
    pt: { name: "Museu Demo", description: "Documenta exposição, custódia ou outro fato institucional." },
  },
};

const mintActors: Record<MintActorId, Record<Language, { name: string; description: string }>> = {
  owner_artist: {
    es: { name: "Alex Rivera · owner/artista", description: "Registra una obra propia previamente revisada." },
    en: { name: "Alex Rivera · owner/artist", description: "Registers a reviewed artwork they own." },
    pt: { name: "Alex Rivera · owner/artista", description: "Registra uma obra própria previamente revisada." },
  },
  authorized_manager: {
    es: { name: "Gestor Demo autorizado", description: "Prepara el Mint de una obra gestionada dentro del escenario sintético." },
    en: { name: "Authorized Demo Manager", description: "Prepares Mint for a managed artwork inside the synthetic scenario." },
    pt: { name: "Gestor Demo autorizado", description: "Prepara o Mint de uma obra gerenciada no cenário sintético." },
  },
};

const mintModes: Record<MintMode, Record<Language, { name: string; description: string }>> = {
  single: {
    es: { name: "Una obra", description: "Registra la identidad digital de la obra actual." },
    en: { name: "One artwork", description: "Registers the digital identity of the current artwork." },
    pt: { name: "Uma obra", description: "Registra a identidade digital da obra atual." },
  },
  batch: {
    es: { name: "Lote de 2 obras", description: "Simula dos obras revisadas y dos vouchers Mint." },
    en: { name: "Batch of 2 artworks", description: "Simulates two reviewed artworks and two Mint vouchers." },
    pt: { name: "Lote de 2 obras", description: "Simula duas obras revisadas e dois vouchers Mint." },
  },
};

const nfcActors: Record<NfcActorId, Record<Language, { name: string; description: string }>> = {
  owner_artist: {
    es: { name: "Alex Rivera · owner/artista", description: "Solicita y completa la vinculación de su obra dentro de la práctica." },
    en: { name: "Alex Rivera · owner/artist", description: "Requests and completes the artwork link inside the practice flow." },
    pt: { name: "Alex Rivera · owner/artista", description: "Solicita e conclui a vinculação da obra no fluxo de prática." },
  },
  authorized_certifier: {
    es: { name: "Certificador Demo autorizado", description: "Recibe la solicitud y acerca el teléfono al tag asignado." },
    en: { name: "Authorized Demo Certifier", description: "Receives the request and brings the phone close to the assigned tag." },
    pt: { name: "Certificador Demo autorizado", description: "Recebe a solicitação e aproxima o celular do tag atribuído." },
  },
};

const nfcTagStates: Record<NfcTagState, Record<Language, { name: string; description: string; systemMessage: string }>> = {
  ready_to_link: {
    es: { name: "Tag disponible", description: "Es un tag Tokenizart vacío y puede vincularse.", systemMessage: "Ready to link" },
    en: { name: "Available tag", description: "This is an empty Tokenizart tag and it can be linked.", systemMessage: "Ready to link" },
    pt: { name: "Tag disponível", description: "É um tag Tokenizart vazio e pode ser vinculado.", systemMessage: "Ready to link" },
  },
  linked_artwork: {
    es: { name: "Obra ya vinculada", description: "La lectura abre la obra asociada; el tag no debe reutilizarse.", systemMessage: "Obra Tokenizart vinculada" },
    en: { name: "Artwork already linked", description: "The scan opens the associated artwork; do not reuse the tag.", systemMessage: "Linked Tokenizart artwork" },
    pt: { name: "Obra já vinculada", description: "A leitura abre a obra associada; não reutilize o tag.", systemMessage: "Obra Tokenizart vinculada" },
  },
  not_tokenizart: {
    es: { name: "Tag no válido", description: "La plataforma no lo reconoce como un tag Tokenizart.", systemMessage: "This is not a Tokenizart NFC tag" },
    en: { name: "Invalid tag", description: "The platform does not recognize it as a Tokenizart tag.", systemMessage: "This is not a Tokenizart NFC tag" },
    pt: { name: "Tag inválido", description: "A plataforma não o reconhece como tag Tokenizart.", systemMessage: "This is not a Tokenizart NFC tag" },
  },
};

const certifyTypes: Record<CertifyTypeId, Record<Language, { name: string; evidence: string }>> = {
  authenticity: {
    es: { name: "Autenticidad", evidence: "Informe de autenticidad sintético con firma y referencia de la obra." },
    en: { name: "Authenticity", evidence: "Synthetic authenticity report with signature and artwork reference." },
    pt: { name: "Autenticidade", evidence: "Relatório sintético de autenticidade com assinatura e referência da obra." },
  },
  condition: {
    es: { name: "Estado de conservación", evidence: "Informe sintético de condición con observaciones y fotografías de detalle." },
    en: { name: "Condition", evidence: "Synthetic condition report with observations and detail photographs." },
    pt: { name: "Estado de conservação", evidence: "Relatório sintético de condição com observações e fotos de detalhe." },
  },
  exhibition: {
    es: { name: "Exhibición", evidence: "Constancia sintética de exhibición con institución, lugar y período." },
    en: { name: "Exhibition", evidence: "Synthetic exhibition record with institution, venue, and period." },
    pt: { name: "Exposição", evidence: "Comprovante sintético de exposição com instituição, local e período." },
  },
  additional_report: {
    es: { name: "Informe adicional", evidence: "Documento sintético que agrega un hecho relevante a la historia de la obra." },
    en: { name: "Additional report", evidence: "Synthetic document that adds a relevant fact to the artwork history." },
    pt: { name: "Relatório adicional", evidence: "Documento sintético que adiciona um fato relevante ao histórico da obra." },
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
    const draft = context.world.nfcDraft;
    const completed = context.world.events.includes("chip.completed");
    const selectedTag = nfcTagStates[draft.tagState][lang];
    return (
      <div className="practice-fields nfc-config">
        <fieldset>
          <legend>{t.nfcActor}</legend>
          <div className="actor-selector">
            {(Object.keys(nfcActors) as NfcActorId[]).map((actorId) => {
              const actor = nfcActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => send({ type: "SET_NFC_DRAFT", actorId })}><Nfc size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.nfcTagReading}</legend>
          <div className="nfc-state-selector">
            {(Object.keys(nfcTagStates) as NfcTagState[]).map((tagState) => {
              const tag = nfcTagStates[tagState][lang];
              return <button type="button" key={tagState} disabled={completed} className={draft.tagState === tagState ? "selected" : ""} onClick={() => send({ type: "SET_NFC_DRAFT", tagState, scanConfirmed: false, signatureConfirmed: false })}><Nfc size={17} /><span><strong>{tag.name}</strong><small>{tag.description}</small></span></button>;
            })}
          </div>
        </fieldset>
        <div className={`phone-simulation nfc-${draft.tagState}`}><Nfc size={38} /><strong>{selectedTag.systemMessage}</strong><small>{selectedTag.description}</small></div>
        <label className="confirmation-check"><input type="checkbox" disabled={completed || draft.tagState !== "ready_to_link"} checked={draft.scanConfirmed} onChange={(event) => send({ type: "SET_NFC_DRAFT", scanConfirmed: event.target.checked })} /><span>{t.confirmNfcScan}<small>{t.nfcScanHelp}</small></span></label>
        <label className="confirmation-check"><input type="checkbox" disabled={completed || draft.tagState !== "ready_to_link"} checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_NFC_DRAFT", signatureConfirmed: event.target.checked })} /><span>{t.confirmNfcSignature}<small>{t.signatureHelp}</small></span></label>
        <div className="transaction-preview"><Nfc size={25} /><span><strong>NFC {t.simulated}</strong><small>{context.world.artworkTitle} · {t.voucherCost}: 1 · {t.voucherAvailable}: {context.world.vouchers.nfc}</small></span></div>
        {!completed && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: draft.tagState === "linked_artwork" ? "nfc_already_linked" : draft.tagState === "not_tokenizart" ? "nfc_not_tokenizart" : "nfc_scan_required" })}><CircleAlert size={17} />{t.errorPractice}</button>}
      </div>
    );
  }

  if (context.flow === "certify") {
    const draft = context.world.certifyDraft;
    const completed = context.world.events.includes("certify.completed");
    return (
      <div className="practice-fields certify-config">
        <fieldset>
          <legend>{t.certifierRole}</legend>
          <div className="actor-selector">
            {(Object.keys(certifyActors) as CertifyActorId[]).map((actorId) => {
              const actor = certifyActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => send({ type: "SET_CERTIFY_DRAFT", actorId })}><BadgeCheck size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>
        <label>{t.certifyType}
          <select disabled={completed} value={draft.typeId} onChange={(event) => send({ type: "SET_CERTIFY_DRAFT", typeId: event.target.value as CertifyTypeId })}>
            {(Object.keys(certifyTypes) as CertifyTypeId[]).map((typeId) => <option key={typeId} value={typeId}>{certifyTypes[typeId][lang].name}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>{t.visibilityLabel}</legend>
          <div className="visibility-selector">
            <button type="button" disabled={completed} className={draft.visibility === "public" ? "selected" : ""} onClick={() => send({ type: "SET_CERTIFY_DRAFT", visibility: "public" })}><Eye size={17} />{t.publicVisibility}</button>
            <button type="button" disabled={completed} className={draft.visibility === "owner" ? "selected" : ""} onClick={() => send({ type: "SET_CERTIFY_DRAFT", visibility: "owner" })}><ShieldCheck size={17} />{t.ownerVisibility}</button>
          </div>
        </fieldset>
        <div className="evidence-preview"><FileCheck2 size={24} /><span><strong>{t.evidenceLabel}</strong><small>{certifyTypes[draft.typeId][lang].evidence}</small></span></div>
        <div className="transaction-preview"><Fingerprint size={25} /><span><strong>Certify {t.simulated}</strong><small>{context.world.artworkTitle} · {t.voucherAvailable}: {context.world.vouchers.certify}</small></span></div>
        {!completed && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: context.world.vouchers.certify ? "wrong_wallet_password" : "missing_voucher" })}><CircleAlert size={17} />{t.errorPractice}</button>}
      </div>
    );
  }

  if (context.flow === "mint") {
    const draft = context.world.mintDraft;
    const completed = context.world.events.includes("mint.completed");
    const voucherRequirement = draft.mode === "batch" ? 2 : 1;
    return (
      <div className="practice-fields mint-config">
        <fieldset>
          <legend>{t.mintActor}</legend>
          <div className="actor-selector">
            {(Object.keys(mintActors) as MintActorId[]).map((actorId) => {
              const actor = mintActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => send({ type: "SET_MINT_DRAFT", actorId })}><Fingerprint size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.mintMode}</legend>
          <div className="mode-selector">
            {(Object.keys(mintModes) as MintMode[]).map((mode) => {
              const option = mintModes[mode][lang];
              return <button type="button" key={mode} disabled={completed} className={draft.mode === mode ? "selected" : ""} onClick={() => send({ type: "SET_MINT_DRAFT", mode })}><Blocks size={18} /><span><strong>{option.name}</strong><small>{option.description}</small></span></button>;
            })}
          </div>
        </fieldset>
        <div className="mint-readiness">
          <strong>{t.reviewBeforeMint}</strong>
          <span><Check size={16} />{t.artworkDataReady}</span>
          <span><Check size={16} />{t.artworkImagesReady}</span>
          <span><Check size={16} />{t.artworkVisibilityReady}</span>
        </div>
        <label className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.reviewConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", reviewConfirmed: event.target.checked })} /><span>{t.confirmReview}</span></label>
        <label className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", signatureConfirmed: event.target.checked })} /><span>{t.confirmSignature}<small>{t.signatureHelp}</small></span></label>
        <div className="transaction-preview"><Fingerprint size={25} /><span><strong>Mint {t.simulated}</strong><small>{context.world.artworkTitle} · {t.voucherCost}: {voucherRequirement} · {t.voucherAvailable}: {context.world.vouchers.mint}</small></span></div>
        {!completed && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: context.world.vouchers.mint < voucherRequirement ? "missing_voucher" : "wrong_wallet_password" })}><CircleAlert size={17} />{t.errorPractice}</button>}
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

function MintCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "mint" || !context.world.events.includes("mint.completed")) return null;
  const receipt = context.world.mintReceipts.at(-1);
  if (!receipt) return null;
  const lang = context.language;
  const t = ui[lang];
  const actor = mintActors[receipt.actorId][lang];
  const mode = mintModes[receipt.mode][lang];
  const network = { es: "Gnosis Chain · simulada", en: "Gnosis Chain · simulated", pt: "Gnosis Chain · simulada" }[lang];
  const timeline = {
    es: ["Obra precargada", "Datos revisados", "Identidad digital"],
    en: ["Artwork preloaded", "Data reviewed", "Digital identity"],
    pt: ["Obra pré-carregada", "Dados revisados", "Identidade digital"],
  }[lang];

  return (
    <section className="completion-result mint-result" aria-live="polite">
      <div className="completion-heading"><Fingerprint size={28} /><div><strong>{t.mintCompleted}</strong><span>{receipt.receiptId}</span></div></div>
      <dl>
        <div><dt>{t.mintedBy}</dt><dd>{actor.name}</dd></div>
        <div><dt>{t.mintModeResult}</dt><dd>{mode.name}</dd></div>
        <div><dt>{t.networkLabel}</dt><dd>{network}</dd></div>
        <div><dt>{t.vouchersConsumed}</dt><dd>{receipt.vouchersConsumed}</dd></div>
        <div><dt>{t.tokenReference}</dt><dd>{receipt.tokenRef}</dd></div>
        <div><dt>{t.transactionReference}</dt><dd>{receipt.transactionRef}</dd></div>
        <div><dt>{t.metadataReference}</dt><dd>{receipt.metadataRef}</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealMint}</p>
    </section>
  );
}

function CertifyCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "certify" || !context.world.events.includes("certify.completed")) return null;
  const certification = context.world.certifications.at(-1);
  if (!certification) return null;
  const lang = context.language;
  const t = ui[lang];
  const actor = certifyActors[certification.actorId][lang];
  const type = certifyTypes[certification.typeId][lang];
  const visibility = certification.visibility === "public" ? t.publicVisibility : t.ownerVisibility;
  const timeline = {
    es: ["Obra precargada", "Identidad digital", "Certify"],
    en: ["Artwork preloaded", "Digital identity", "Certify"],
    pt: ["Obra pré-carregada", "Identidade digital", "Certify"],
  }[lang];

  return (
    <section className="completion-result" aria-live="polite">
      <div className="completion-heading"><BadgeCheck size={28} /><div><strong>{t.certifyCompleted}</strong><span>{t.traceabilityUpdated}</span></div></div>
      <dl>
        <div><dt>{t.certifyType}</dt><dd>{type.name}</dd></div>
        <div><dt>{t.certifiedBy}</dt><dd>{actor.name}</dd></div>
        <div><dt>{t.visibilityLabel}</dt><dd>{visibility}</dd></div>
        <div><dt>{t.receiptLabel}</dt><dd>{certification.certificationId}</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealTransaction}</p>
    </section>
  );
}

function NfcCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "chip" || !context.world.events.includes("chip.completed")) return null;
  const receipt = context.world.nfcReceipts.at(-1);
  if (!receipt) return null;
  const lang = context.language;
  const t = ui[lang];
  const actor = nfcActors[receipt.actorId][lang];
  const timeline = {
    es: ["Identidad digital", "Tag leído", "Obra y tag vinculados"],
    en: ["Digital identity", "Tag scanned", "Artwork and tag linked"],
    pt: ["Identidade digital", "Tag lido", "Obra e tag vinculados"],
  }[lang];

  return (
    <section className="completion-result nfc-result" aria-live="polite">
      <div className="completion-heading"><Nfc size={28} /><div><strong>{t.nfcCompleted}</strong><span>{receipt.receiptId}</span></div></div>
      <dl>
        <div><dt>{t.nfcLinkedBy}</dt><dd>{actor.name}</dd></div>
        <div><dt>{t.nfcFinalState}</dt><dd>{nfcTagStates[receipt.tagState][lang].name}</dd></div>
        <div><dt>{t.networkLabel}</dt><dd>Gnosis Chain · {t.simulated.toLowerCase()}</dd></div>
        <div><dt>{t.vouchersConsumed}</dt><dd>{receipt.vouchersConsumed}</dd></div>
        <div><dt>{t.nfcTagReference}</dt><dd>{receipt.tagRef}</dd></div>
        <div><dt>{t.nfcCertificationReference}</dt><dd>{receipt.certificationRef}</dd></div>
        <div><dt>{t.tokenReference}</dt><dd>{receipt.tokenRef}</dd></div>
        <div><dt>{t.transactionReference}</dt><dd>{receipt.transactionRef}</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealNfc}</p>
    </section>
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
  const flowCompleted = context.world.events.includes(`${context.flow}.completed`);

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
              <MintCompletion context={context} />
              <CertifyCompletion context={context} />
              <NfcCompletion context={context} />
              {activeError && <div className="error-panel"><CircleAlert size={22} /><div><strong>{activeError.title}</strong><p>{activeError.body}</p><button onClick={() => send({ type: "RESOLVE_ERROR" })}><Check size={17} />{t.resolve}</button></div></div>}
            </div>
          </section>

          <section className="step-navigation">
            <button className="secondary" disabled={context.stepIndex === 0} onClick={() => send({ type: "PREVIOUS" })}><ArrowLeft size={18} />{t.previous}</button>
            <button className="primary" disabled={flowCompleted && context.stepIndex === flow.steps.length - 1} onClick={() => {
              if (context.stepIndex === flow.steps.length - 1) send({ type: "COMPLETE_STEP" });
              else send({ type: "NEXT" });
            }}>{flowCompleted && context.stepIndex === flow.steps.length - 1 ? t.completed : context.stepIndex === flow.steps.length - 1 ? t.complete : t.next}<ArrowRight size={18} /></button>
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
