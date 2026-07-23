import {
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  FolderOpen,
  Image as ImageIcon,
  ListChecks,
  Nfc,
  Play,
  ShieldCheck,
  TicketCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { artworkTypeLabel } from "./fixtures";
import type { DemoEvent } from "./demoMachine";
import type { DemoArtwork, DemoContext, Language, ManualStep } from "./types";

type DemoSend = (event: DemoEvent) => void;

const INTERACTIVE_FLOWS = new Set([
  "carga_obra",
  "mint",
  "certify",
  "chip",
  "transferencia",
  "privacy",
  "public_gallery_traceability",
]);

export function usesInteractiveAtelierSurface(flow: string): boolean {
  return INTERACTIVE_FLOWS.has(flow);
}

const copy = {
  es: {
    administration: "Administración",
    ownArtwork: "Obras propias",
    editArtwork: "Editar obra de práctica",
    mainData: "Datos principales",
    technicalSheet: "Ficha técnica",
    owner: "Propietario",
    title: "Nombre de la obra",
    author: "Autor",
    country: "País de creación",
    type: "Tipo de obra",
    gallery: "Mostrar en Gallery",
    exhibited: "Expuesta",
    exhibitionPlace: "Lugar de exposición",
    description: "Descripción",
    mainImage: "Imagen principal",
    supportingImages: "Imágenes secundarias",
    popularName: "Denominación popular",
    style: "Estilo / tendencia",
    theme: "Temática",
    technique: "Técnica",
    support: "Soporte",
    dimensions: "Dimensiones",
    width: "Ancho",
    height: "Alto",
    depth: "Profundidad",
    period: "Época",
    year: "Año",
    creationPlace: "Lugar de creación",
    province: "Provincia",
    series: "Serie",
    value: "Valor declarado USD",
    notes: "Notas",
    existingSheet: "Ficha preexistente",
    livePreview: "Vista dinámica de la misma obra",
    preload: "Precargada",
    minted: "Minteada",
    certified: "Certificada",
    tagged: "NFC vinculado",
    galleryVisible: "Visible en Gallery",
    ownerOnly: "Solo owner",
    currentAction: "Acción en práctica",
    synthetic: "Simulación, sin acciones reales",
    voucher: "Voucher disponible",
    network: "Red simulada",
    ownerView: "Vista owner",
    visitorView: "Vista visitante",
    certifyHistory: "Historia Certify",
    noCertify: "Todavía no se agregó un Certify en esta sesión.",
    publicTraceability: "Trazabilidad pública",
    ownMode: "Obras propias",
    ownModeBody: "Carga una obra de la que eres owner.",
    managedMode: "Obras gestionadas",
    managedModeBody: "Carga por delegación explícita del owner.",
    selected: "Seleccionado",
    openForm: "Abrir formulario de carga",
    stageMain: "1. Datos principales",
    stageMainBody: "Identidad, autor, visibilidad, descripción e imágenes.",
    stageTechnical: "2. Ficha técnica",
    stageTechnicalBody: "Técnica, medidas, época, serie, valor y documentación.",
    loadedList: "Obras precargadas",
    delegatingOwner: "Owner delegante",
    managedContinuity: "El owner y el gestor autorizado conservan acceso dentro de Administración.",
    draft: "Borrador",
    notLoaded: "Aún no precargada",
    reverse: "Reverso",
    detail: "Detalle",
    newLoad: "Nueva carga de obra",
  },
  en: {
    administration: "Administration",
    ownArtwork: "Own artworks",
    editArtwork: "Edit practice artwork",
    mainData: "Main data",
    technicalSheet: "Technical sheet",
    owner: "Owner",
    title: "Artwork name",
    author: "Author",
    country: "Country of creation",
    type: "Artwork type",
    gallery: "Show in Gallery",
    exhibited: "Exhibited",
    exhibitionPlace: "Exhibition place",
    description: "Description",
    mainImage: "Main image",
    supportingImages: "Supporting images",
    popularName: "Popular name",
    style: "Style / trend",
    theme: "Theme",
    technique: "Technique",
    support: "Support",
    dimensions: "Dimensions",
    width: "Width",
    height: "Height",
    depth: "Depth",
    period: "Period",
    year: "Year",
    creationPlace: "Place of creation",
    province: "Province",
    series: "Series",
    value: "Declared value USD",
    notes: "Notes",
    existingSheet: "Existing sheet",
    livePreview: "Live view of the same artwork",
    preload: "Preloaded",
    minted: "Minted",
    certified: "Certified",
    tagged: "NFC linked",
    galleryVisible: "Visible in Gallery",
    ownerOnly: "Owner only",
    currentAction: "Practice action",
    synthetic: "Simulation, no real actions",
    voucher: "Available voucher",
    network: "Simulated network",
    ownerView: "Owner view",
    visitorView: "Visitor view",
    certifyHistory: "Certify history",
    noCertify: "No Certify has been added in this session yet.",
    publicTraceability: "Public traceability",
    ownMode: "Own artworks",
    ownModeBody: "Load an artwork you own.",
    managedMode: "Managed artworks",
    managedModeBody: "Load under the owner's explicit delegation.",
    selected: "Selected",
    openForm: "Open load form",
    stageMain: "1. Main data",
    stageMainBody: "Identity, author, visibility, description and images.",
    stageTechnical: "2. Technical sheet",
    stageTechnicalBody: "Technique, dimensions, period, series, value and documents.",
    loadedList: "Preloaded artworks",
    delegatingOwner: "Delegating owner",
    managedContinuity: "The owner and authorized manager keep access inside Administration.",
    draft: "Draft",
    notLoaded: "Not preloaded yet",
    reverse: "Reverse",
    detail: "Detail",
    newLoad: "New artwork load",
  },
  pt: {
    administration: "Administração",
    ownArtwork: "Obras próprias",
    editArtwork: "Editar obra de prática",
    mainData: "Dados principais",
    technicalSheet: "Ficha técnica",
    owner: "Proprietário",
    title: "Nome da obra",
    author: "Autor",
    country: "País de criação",
    type: "Tipo de obra",
    gallery: "Mostrar na Gallery",
    exhibited: "Exposta",
    exhibitionPlace: "Local de exposição",
    description: "Descrição",
    mainImage: "Imagem principal",
    supportingImages: "Imagens secundárias",
    popularName: "Denominação popular",
    style: "Estilo / tendência",
    theme: "Temática",
    technique: "Técnica",
    support: "Suporte",
    dimensions: "Dimensões",
    width: "Largura",
    height: "Altura",
    depth: "Profundidade",
    period: "Época",
    year: "Ano",
    creationPlace: "Local de criação",
    province: "Província",
    series: "Série",
    value: "Valor declarado USD",
    notes: "Notas",
    existingSheet: "Ficha preexistente",
    livePreview: "Vista dinâmica da mesma obra",
    preload: "Pré-carregada",
    minted: "Minteada",
    certified: "Certificada",
    tagged: "NFC vinculado",
    galleryVisible: "Visível na Gallery",
    ownerOnly: "Somente owner",
    currentAction: "Ação em prática",
    synthetic: "Simulação, sem ações reais",
    voucher: "Voucher disponível",
    network: "Rede simulada",
    ownerView: "Vista owner",
    visitorView: "Vista visitante",
    certifyHistory: "Histórico Certify",
    noCertify: "Ainda não foi adicionado um Certify nesta sessão.",
    publicTraceability: "Rastreabilidade pública",
    ownMode: "Obras próprias",
    ownModeBody: "Carregue uma obra da qual você é owner.",
    managedMode: "Obras gerenciadas",
    managedModeBody: "Carregue por delegação explícita do owner.",
    selected: "Selecionado",
    openForm: "Abrir formulário de carga",
    stageMain: "1. Dados principais",
    stageMainBody: "Identidade, autor, visibilidade, descrição e imagens.",
    stageTechnical: "2. Ficha técnica",
    stageTechnicalBody: "Técnica, medidas, época, série, valor e documentos.",
    loadedList: "Obras pré-carregadas",
    delegatingOwner: "Owner delegante",
    managedContinuity: "O owner e o gestor autorizado mantêm acesso dentro da Administração.",
    draft: "Rascunho",
    notLoaded: "Ainda não pré-carregada",
    reverse: "Verso",
    detail: "Detalhe",
    newLoad: "Nova carga de obra",
  },
} satisfies Record<Language, Record<string, string>>;

function update(send: DemoSend, patch: Partial<DemoArtwork>) {
  send({ type: "UPDATE_ARTWORK", patch });
}

function localizedPatch(artwork: DemoArtwork, field: "description" | "style" | "theme" | "technique" | "support" | "period" | "series" | "notes", language: Language, value: string): Partial<DemoArtwork> {
  return { [field]: { ...artwork[field], [language]: value } };
}

function ArtworkImages({ artwork, language }: { artwork: DemoArtwork; language: Language }) {
  const c = copy[language];
  return (
    <section className="atelier-image-fields">
      <div className="atelier-field-label">{c.mainImage}</div>
      <div className="atelier-main-image">
        <img src={artwork.images[0].assetPath} alt={`${artwork.title} · ${c.mainImage}`} />
        <span><ImageIcon size={16} />{artwork.images[0].imageId}</span>
      </div>
      <div className="atelier-field-label">{c.supportingImages}</div>
      <div className="atelier-supporting-images">
        {artwork.images.slice(1).map((image) => (
          <div key={image.imageId}>
            <img src={image.assetPath} alt={`${artwork.title} · ${image.role}`} style={{ objectPosition: image.objectPosition }} />
            <small>{image.role === "reverse" ? c.reverse : c.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function MainDataForm({ context, send }: { context: DemoContext; send: DemoSend }) {
  const { language } = context;
  const artwork = context.world.artwork;
  const c = copy[language];
  return (
    <div className="atelier-form-grid">
      <label className="wide">{c.owner}<span className="atelier-owner-input"><UserRound size={18} />{artwork.ownerDisplayName}</span></label>
      <label>{c.title}<input value={artwork.title} onChange={(event) => update(send, { title: event.target.value })} /></label>
      <label>{c.country}<input value={artwork.countryName[language]} readOnly /></label>
      <label>{c.author}<input value={artwork.author} onChange={(event) => update(send, { author: event.target.value })} /></label>
      <label>{c.type}<input value={artworkTypeLabel(artwork.type, language)} readOnly /></label>
      <label className="atelier-check"><input type="checkbox" checked={artwork.galleryVisible} onChange={(event) => update(send, { galleryVisible: event.target.checked })} />{c.gallery}</label>
      <label className="atelier-check"><input type="checkbox" checked={artwork.exhibited} onChange={(event) => update(send, { exhibited: event.target.checked })} />{c.exhibited}</label>
      {artwork.exhibited && <label className="wide">{c.exhibitionPlace}<input value={artwork.exhibitionPlace} onChange={(event) => update(send, { exhibitionPlace: event.target.value })} /></label>}
      <label className="wide">{c.description}<textarea value={artwork.description[language]} onChange={(event) => update(send, localizedPatch(artwork, "description", language, event.target.value))} /></label>
      <div className="wide"><ArtworkImages artwork={artwork} language={language} /></div>
    </div>
  );
}

function TechnicalForm({ context, send }: { context: DemoContext; send: DemoSend }) {
  const { language } = context;
  const artwork = context.world.artwork;
  const c = copy[language];
  return (
    <div className="atelier-form-grid technical">
      <label>{c.popularName}<input value={artwork.popularName} onChange={(event) => update(send, { popularName: event.target.value })} /></label>
      <label>{c.style}<input value={artwork.style[language]} onChange={(event) => update(send, localizedPatch(artwork, "style", language, event.target.value))} /></label>
      <label>{c.theme}<input value={artwork.theme[language]} onChange={(event) => update(send, localizedPatch(artwork, "theme", language, event.target.value))} /></label>
      <label>{c.technique}<input value={artwork.technique[language]} onChange={(event) => update(send, localizedPatch(artwork, "technique", language, event.target.value))} /></label>
      <label>{c.support}<input value={artwork.support[language]} onChange={(event) => update(send, localizedPatch(artwork, "support", language, event.target.value))} /></label>
      <fieldset className="wide dimensions-field">
        <legend>{c.dimensions}</legend>
        <label>{c.width}<input inputMode="decimal" value={artwork.widthCm} onChange={(event) => update(send, { widthCm: event.target.value })} /></label>
        <label>{c.height}<input inputMode="decimal" value={artwork.heightCm} onChange={(event) => update(send, { heightCm: event.target.value })} /></label>
        <label>{c.depth}<input inputMode="decimal" value={artwork.depthCm} onChange={(event) => update(send, { depthCm: event.target.value })} /></label>
      </fieldset>
      <label>{c.period}<input value={artwork.period[language]} onChange={(event) => update(send, localizedPatch(artwork, "period", language, event.target.value))} /></label>
      <label>{c.year}<input inputMode="numeric" value={artwork.creationYear} onChange={(event) => update(send, { creationYear: event.target.value })} /></label>
      <label>{c.creationPlace}<input value={artwork.creationPlace} onChange={(event) => update(send, { creationPlace: event.target.value })} /></label>
      <label>{c.province}<input value={artwork.province} onChange={(event) => update(send, { province: event.target.value })} /></label>
      <label>{c.series}<input value={artwork.series[language]} onChange={(event) => update(send, localizedPatch(artwork, "series", language, event.target.value))} /></label>
      <label>{c.value}<input inputMode="decimal" value={artwork.declaredValueUsd} onChange={(event) => update(send, { declaredValueUsd: event.target.value })} /></label>
      <label className="wide">{c.notes}<textarea value={artwork.notes[language]} onChange={(event) => update(send, localizedPatch(artwork, "notes", language, event.target.value))} /></label>
      <label className="wide">{c.existingSheet}<span className="atelier-file-input"><FileCheck2 size={18} />{artwork.existingSheetFileName}</span></label>
    </div>
  );
}

function TechnicalSummary({ context }: { context: DemoContext }) {
  const { language } = context;
  const artwork = context.world.artwork;
  const c = copy[language];
  const dimensions = [artwork.widthCm, artwork.heightCm, artwork.depthCm].filter(Boolean).join(" × ");
  const facts = [
    [c.popularName, artwork.popularName],
    [c.style, artwork.style[language]],
    [c.theme, artwork.theme[language]],
    [c.technique, `${artwork.technique[language]} · ${artwork.support[language]}`],
    [c.dimensions, `${dimensions} cm`],
    [c.year, artwork.creationYear],
    [c.creationPlace, `${artwork.creationPlace}, ${artwork.province}`],
    [c.series, artwork.series[language]],
  ];
  return (
    <section className="atelier-artwork-detail">
      <div className="atelier-artwork-hero">
        <img src={artwork.images[0].assetPath} alt={artwork.title} />
        <div>
          <span className="atelier-object-type">{artworkTypeLabel(artwork.type, language)}</span>
          <h3>{artwork.title}</h3>
          <p>{artwork.author}</p>
          <div className="atelier-status-row"><span><Check size={15} />{c.preload}</span>{artwork.galleryVisible && <span><Eye size={15} />{c.galleryVisible}</span>}</div>
        </div>
      </div>
      <h4>{c.technicalSheet}</h4>
      <div className="atelier-facts">{facts.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="atelier-description"><small>{c.description}</small><p>{artwork.description[language]}</p></div>
      <ArtworkImages artwork={artwork} language={language} />
    </section>
  );
}

function LoadModeScreen({ context, send }: { context: DemoContext; send: DemoSend }) {
  const c = copy[context.language];
  const mode = context.world.loadDraft.mode;
  const choices = [
    { id: "own", icon: UserRound, title: c.ownMode, body: c.ownModeBody },
    { id: "managed", icon: FolderOpen, title: c.managedMode, body: c.managedModeBody },
  ] as const;

  return (
    <section className="atelier-mode-screen">
      {choices.map((choice) => {
        const Icon = choice.icon;
        const active = mode === choice.id;
        return (
          <button
            type="button"
            key={choice.id}
            className={active ? "active" : ""}
            aria-pressed={active}
            onClick={() => send({ type: "SET_LOAD_DRAFT", mode: choice.id })}
          >
            <Icon size={26} />
            <span><strong>{choice.title}</strong><small>{choice.body}</small></span>
            {active && <b><Check size={15} />{c.selected}</b>}
          </button>
        );
      })}
    </section>
  );
}

function OpenLoadScreen({ context, send }: { context: DemoContext; send: DemoSend }) {
  const c = copy[context.language];
  const artwork = context.world.artwork;
  return (
    <section className="atelier-open-load">
      <div className="atelier-open-load-artwork">
        <img src={artwork.images[0].assetPath} alt={artwork.title} />
        <span><small>{context.world.loadDraft.mode === "own" ? c.ownMode : c.managedMode}</small><strong>{artwork.title}</strong><em>{artwork.author}</em></span>
      </div>
      <button type="button" onClick={() => send({ type: "NEXT" })}><Play size={18} />{c.openForm}</button>
    </section>
  );
}

function LoadStagesScreen({ context }: { context: DemoContext }) {
  const c = copy[context.language];
  return (
    <section className="atelier-load-stages">
      <div><span>1</span><ImageIcon size={24} /><strong>{c.stageMain}</strong><p>{c.stageMainBody}</p></div>
      <i aria-hidden="true" />
      <div><span>2</span><FileCheck2 size={24} /><strong>{c.stageTechnical}</strong><p>{c.stageTechnicalBody}</p></div>
    </section>
  );
}

function LoadedArtworkScreen({ context }: { context: DemoContext }) {
  const c = copy[context.language];
  const artwork = context.world.artwork;
  return (
    <section className="atelier-loaded-list">
      <h4><ListChecks size={20} />{c.loadedList}</h4>
      <article>
        <img src={artwork.images[0].assetPath} alt={artwork.title} />
        <div><span className="atelier-object-type">{artworkTypeLabel(artwork.type, context.language)}</span><strong>{artwork.title}</strong><small>{artwork.author}</small></div>
        <b><Check size={15} />{c.preload}</b>
      </article>
    </section>
  );
}

function ManagedLoadScreen({ context, send, final = false }: { context: DemoContext; send: DemoSend; final?: boolean }) {
  const c = copy[context.language];
  return (
    <section className="atelier-managed-screen">
      <div className="atelier-managed-owner">
        <FolderOpen size={28} />
        <span><small>{c.delegatingOwner}</small><strong>{context.world.loadDraft.delegatingOwnerDisplayName}</strong></span>
      </div>
      {!final && (
        <label>
          {c.delegatingOwner}
          <select
            value={context.world.loadDraft.delegatingOwnerDisplayName}
            onChange={(event) => send({ type: "SET_LOAD_DRAFT", mode: "managed", delegatingOwnerDisplayName: event.target.value })}
          >
            <option>Gabriel Mucchiut (owner demo)</option>
            <option>María Torres (owner sintético)</option>
          </select>
        </label>
      )}
      <p>{c.managedContinuity}</p>
      <TechnicalSummary context={context} />
    </section>
  );
}

function CargaSurface({ context, step, send }: { context: DemoContext; step: ManualStep; send: DemoSend }) {
  const c = copy[context.language];
  const technical = step.order >= 10 && step.order <= 14;
  const review = step.order >= 15 && step.order <= 16;
  const editing = step.order === 17;
  const saved = step.order === 18;
  const loadedList = step.order === 19;
  const managed = step.order >= 20;
  const content = step.order === 1
    ? <LoadModeScreen context={context} send={send} />
    : step.order === 2
      ? <OpenLoadScreen context={context} send={send} />
      : step.order === 3
        ? <LoadStagesScreen context={context} />
        : technical
          ? <TechnicalForm context={context} send={send} />
          : review || saved
            ? <TechnicalSummary context={context} />
            : editing
              ? <MainDataForm context={context} send={send} />
              : loadedList
                ? <LoadedArtworkScreen context={context} />
                : managed
                  ? (step.order === 20
                    ? <LoadModeScreen context={context} send={send} />
                    : <ManagedLoadScreen context={context} send={send} final={step.order === 22} />)
                  : <MainDataForm context={context} send={send} />;
  return (
    <div className="atelier-surface">
      <div className="atelier-appbar"><span>Tokenizart Atelier</span><div><strong>{c.administration}</strong><small>{c.synthetic}</small></div></div>
      <div className="atelier-window">
        <div className="atelier-window-heading"><div><small>{context.world.loadDraft.mode === "managed" ? c.managedMode : c.ownArtwork}</small><h3>{review || saved || loadedList ? context.world.artwork.title : step.order <= 3 ? c.newLoad : c.editArtwork}</h3></div><span className="atelier-demo-seal">{c.livePreview}</span></div>
        {step.order >= 4 && step.order <= 14 && <div className="atelier-tabs"><span className={!technical ? "active" : ""}>{c.mainData}</span><span className={technical ? "active" : ""}>{c.technicalSheet}</span></div>}
        {content}
      </div>
    </div>
  );
}

function statusLabels(context: DemoContext): string[] {
  const c = copy[context.language];
  const labels = context.world.artworkStatus === "none"
    ? [c.notLoaded]
    : context.world.artworkStatus === "draft"
      ? [c.draft]
      : [c.preload];
  if (["minted", "certified", "tagged", "transferred"].includes(context.world.artworkStatus)) labels.push(c.minted);
  if (["certified", "tagged", "transferred"].includes(context.world.artworkStatus)) labels.push(c.certified);
  if (context.world.artworkStatus === "tagged") labels.push(c.tagged);
  return labels;
}

function OperationSurface({ context, step }: { context: DemoContext; step: ManualStep }) {
  const { language, world } = context;
  const artwork = world.artwork;
  const c = copy[language];
  const privacyAudience = world.privacyDraft.previewAudience;
  const visitorHidden = context.flow === "privacy" && privacyAudience === "visitor" && !world.privacyDraft.galleryVisible;
  const lastMint = world.mintReceipts.at(-1);
  const flowDetail = {
    mint: <><Fingerprint size={22} /><span><strong>{c.voucher}: {world.vouchers.mint}</strong><small>{c.network}: Gnosis Chain</small></span></>,
    certify: <><BadgeCheck size={22} /><span><strong>{c.voucher}: {world.vouchers.certify}</strong><small>{c.certifyHistory}: {world.certifications.length}</small></span></>,
    chip: <><Nfc size={22} /><span><strong>{world.nfcDraft.tagState.replaceAll("_", " ")}</strong><small>{c.voucher}: {world.vouchers.nfc}</small></span></>,
    transferencia: <><WalletCards size={22} /><span><strong>{world.currentOwnerRef}</strong><small>{world.transferDraft.destinationType.replaceAll("_", " ")}</small></span></>,
    privacy: <>{privacyAudience === "owner" ? <ShieldCheck size={22} /> : <Eye size={22} />}<span><strong>{privacyAudience === "owner" ? c.ownerView : c.visitorView}</strong><small>{world.privacyDraft.galleryVisible ? c.galleryVisible : c.ownerOnly}</small></span></>,
    public_gallery_traceability: <><Eye size={22} /><span><strong>{c.publicTraceability}</strong><small>{c.galleryVisible}</small></span></>,
  }[context.flow] ?? <><FileCheck2 size={22} /><span><strong>{c.currentAction}</strong></span></>;

  return (
    <div className="atelier-surface">
      <div className="atelier-appbar"><span>Tokenizart Atelier</span><div><strong>{context.flow === "public_gallery_traceability" ? "Gallery" : c.administration}</strong><small>{c.synthetic}</small></div></div>
      <div className="atelier-window operation">
        {visitorHidden ? (
          <div className="atelier-hidden-state"><EyeOff size={34} /><strong>{c.ownerOnly}</strong><p>{artwork.title}</p></div>
        ) : (
          <>
            <div className="atelier-operation-layout">
              <div className="atelier-operation-image"><img src={artwork.images[0].assetPath} alt={artwork.title} /></div>
              <div className="atelier-operation-copy">
                <span className="atelier-object-type">{artworkTypeLabel(artwork.type, language)}</span>
                <h3>{artwork.title}</h3>
                <p>{artwork.author}</p>
                <div className="atelier-status-row">{statusLabels(context).map((label) => <span key={label}><Check size={15} />{label}</span>)}</div>
                <dl>
                  <div><dt>{c.technique}</dt><dd>{artwork.technique[language]}</dd></div>
                  <div><dt>{c.dimensions}</dt><dd>{artwork.widthCm} × {artwork.heightCm} cm</dd></div>
                  <div><dt>{c.year}</dt><dd>{artwork.creationYear}</dd></div>
                  {lastMint && <div><dt>Token</dt><dd>{lastMint.tokenRef}</dd></div>}
                </dl>
              </div>
            </div>
            <div className="atelier-action-strip">{flowDetail}<b>{step.order}</b></div>
            <div className="atelier-live-step"><small>{c.currentAction}</small><strong>{step.copy[language].title}</strong><p>{step.copy[language].body}</p></div>
            {context.flow === "certify" && <section className="atelier-certify-history"><h4>{c.certifyHistory}</h4>{world.certifications.length ? world.certifications.map((item) => <div key={item.certificationId}><BadgeCheck size={18} /><span><strong>{item.typeId}</strong><small>{item.certificationId} · {item.visibility}</small></span></div>) : <p>{c.noCertify}</p>}</section>}
          </>
        )}
      </div>
    </div>
  );
}

export function AtelierSurface({ context, step, send }: { context: DemoContext; step: ManualStep; send: DemoSend }) {
  if (context.flow === "carga_obra") return <CargaSurface context={context} step={step} send={send} />;
  return <OperationSurface context={context} step={step} />;
}
