import {
  BadgeCheck,
  Check,
  CircleAlert,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  FolderOpen,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Info,
  KeyRound,
  ListChecks,
  LoaderCircle,
  Nfc,
  Play,
  Send,
  ShieldCheck,
  TicketCheck,
  Upload,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { artworkTypeLabel } from "./fixtures";
import type { DemoEvent } from "./demoMachine";
import iconAtlas from "./data/atelier-manual-native-icon-atlas.v1.json";
import type {
  CertifyActorId,
  CertifyTypeId,
  DemoArtwork,
  DemoCertification,
  DemoContext,
  DemoMintReceipt,
  Language,
  ManualStep,
  MintActorId,
  MintMode,
} from "./types";

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

const operationCopy = {
  es: {
    selectArtwork: "Seleccionar obra",
    selectedArtwork: "Obra seleccionada",
    reviewArtwork: "Revisión previa",
    reviewed: "Confirmo que revisé datos, imágenes, ficha técnica y visibilidad.",
    actor: "Actor de la operación",
    ownerArtist: "Owner / artista",
    ownerArtistMintHelp: "Registra una obra propia previamente revisada.",
    manager: "Gestor autorizado",
    managerHelp: "Actúa por una delegación de práctica explícita.",
    mintAction: "Mintear obra",
    mintActionHelp: "Abre la confirmación de Mint para esta obra precargada.",
    single: "Una obra",
    singleHelp: "Consume un Voucher Mint.",
    batch: "Lote de dos obras",
    batchHelp: "Consume un Voucher Mint por cada obra.",
    operationSummary: "Resumen de la operación",
    available: "Disponibles",
    required: "Requeridos",
    credential: "Credencial de transacción",
    credentialHelp: "La demo nunca solicita una clave real. Este control representa la credencial ingresada únicamente en Atelier.",
    prepareCredential: "Usar credencial sintética de práctica",
    credentialReady: "Credencial sintética preparada",
    finalConfirmation: "Confirmación final",
    confirmMint: "Confirmo el Mint simulado de esta obra.",
    waiting: "Esperando confirmación simulada de Gnosis Chain",
    success: "Mint simulado finalizado",
    successHelp: "La obra ahora puede mostrar identidad digital, comprobante y referencias técnicas sintéticas.",
    receipt: "Comprobante de Mint",
    token: "Token",
    transaction: "Transacción",
    metadata: "Metadata IPFS",
    noReceipt: "Completa el último paso para generar el comprobante sintético.",
    statusVerification: "Verificación del estado",
    mintedStatus: "Obra minteada",
    errorPractice: "Probar un error controlado",
    wrongCredential: "Credencial incorrecta",
    voucherMissing: "Voucher insuficiente",
    batchSelection: "Obras seleccionadas para el lote",
    secondSyntheticArtwork: "Composición geométrica de práctica",
    syntheticFixture: "Fixture sintético adicional",
    certifyAction: "Certificar obra",
    certifyActionHelp: "Inicia una solicitud Certify sobre la obra ya minteada.",
    certifier: "Quién certificará",
    expert: "Perito / especialista",
    expertHelp: "Aporta una conclusión técnica o profesional.",
    galleryMuseum: "Galería / museo",
    galleryMuseumHelp: "Documenta una exhibición, custodia u otro hecho institucional.",
    certifyType: "¿Qué hecho respalda?",
    authenticity: "Autenticidad",
    condition: "Estado de conservación",
    exhibition: "Exhibición",
    additionalReport: "Informe adicional",
    visibility: "Visibilidad del Certify",
    public: "Visible públicamente",
    ownerOnly: "Solo owner",
    requestReview: "Revisar solicitud",
    requestSummary: "La solicitud vincula obra, tipo y certificador. Enviarla no completa todavía el Certify.",
    confirmRequest: "Confirmo el envío de esta solicitud sintética.",
    requestSent: "Solicitud enviada",
    requestPending: "Pendiente de respuesta del certificador",
    requestRef: "Solicitud",
    certifierInbox: "Certificaciones recibidas",
    acceptRequest: "El certificador acepta trabajar sobre esta solicitud.",
    factDescription: "Descripción del hecho certificado",
    evidence: "Evidencia",
    attachEvidence: "Adjuntar evidencia sintética",
    attached: "Evidencia adjunta",
    certifyCredentialHelp: "La credencial pertenece al actor que ejecuta Certify y su voucher es el que se consume.",
    confirmCertify: "Confirmo el registro Certify simulado.",
    certifySuccess: "Certify agregado a la historia de la obra",
    traceability: "Historia verificable actualizada",
    certifiedBy: "Realizado por",
    consumed: "Voucher consumido",
    noRealAction: "Simulación educativa: no se escribieron datos en Atelier, blockchain ni IPFS.",
  },
  en: {
    selectArtwork: "Select artwork",
    selectedArtwork: "Selected artwork",
    reviewArtwork: "Prior review",
    reviewed: "I confirm that I reviewed the data, images, technical sheet, and visibility.",
    actor: "Operation actor",
    ownerArtist: "Owner / artist",
    ownerArtistMintHelp: "Registers a reviewed artwork they own.",
    manager: "Authorized manager",
    managerHelp: "Acts under an explicit practice delegation.",
    mintAction: "Mint artwork",
    mintActionHelp: "Opens the Mint confirmation for this preloaded artwork.",
    single: "One artwork",
    singleHelp: "Consumes one Mint Voucher.",
    batch: "Batch of two artworks",
    batchHelp: "Consumes one Mint Voucher per artwork.",
    operationSummary: "Operation summary",
    available: "Available",
    required: "Required",
    credential: "Transaction credential",
    credentialHelp: "The demo never requests a real password. This control represents the credential entered only inside Atelier.",
    prepareCredential: "Use a synthetic practice credential",
    credentialReady: "Synthetic credential ready",
    finalConfirmation: "Final confirmation",
    confirmMint: "I confirm this simulated artwork Mint.",
    waiting: "Waiting for simulated Gnosis Chain confirmation",
    success: "Simulated Mint completed",
    successHelp: "The artwork can now show a digital identity, receipt, and synthetic technical references.",
    receipt: "Mint receipt",
    token: "Token",
    transaction: "Transaction",
    metadata: "IPFS metadata",
    noReceipt: "Complete the final step to generate the synthetic receipt.",
    statusVerification: "Status verification",
    mintedStatus: "Minted artwork",
    errorPractice: "Try a controlled error",
    wrongCredential: "Wrong credential",
    voucherMissing: "Insufficient voucher",
    batchSelection: "Artworks selected for the batch",
    secondSyntheticArtwork: "Practice geometric composition",
    syntheticFixture: "Additional synthetic fixture",
    certifyAction: "Certify artwork",
    certifyActionHelp: "Starts a Certify request for the minted artwork.",
    certifier: "Who will certify",
    expert: "Expert / specialist",
    expertHelp: "Adds a technical or professional conclusion.",
    galleryMuseum: "Gallery / museum",
    galleryMuseumHelp: "Documents an exhibition, custody, or another institutional fact.",
    certifyType: "Which fact is supported?",
    authenticity: "Authenticity",
    condition: "Condition",
    exhibition: "Exhibition",
    additionalReport: "Additional report",
    visibility: "Certify visibility",
    public: "Publicly visible",
    ownerOnly: "Owner only",
    requestReview: "Review request",
    requestSummary: "The request links the artwork, type, and certifier. Sending it does not complete Certify yet.",
    confirmRequest: "I confirm this synthetic request submission.",
    requestSent: "Request sent",
    requestPending: "Awaiting the certifier's response",
    requestRef: "Request",
    certifierInbox: "Received certifications",
    acceptRequest: "The certifier accepts this request.",
    factDescription: "Description of the certified fact",
    evidence: "Evidence",
    attachEvidence: "Attach synthetic evidence",
    attached: "Evidence attached",
    certifyCredentialHelp: "The credential belongs to the actor performing Certify, whose voucher is consumed.",
    confirmCertify: "I confirm the simulated Certify registration.",
    certifySuccess: "Certify added to the artwork history",
    traceability: "Verifiable history updated",
    certifiedBy: "Performed by",
    consumed: "Voucher consumed",
    noRealAction: "Educational simulation: no data was written to Atelier, blockchain, or IPFS.",
  },
  pt: {
    selectArtwork: "Selecionar obra",
    selectedArtwork: "Obra selecionada",
    reviewArtwork: "Revisão prévia",
    reviewed: "Confirmo que revisei dados, imagens, ficha técnica e visibilidade.",
    actor: "Ator da operação",
    ownerArtist: "Owner / artista",
    ownerArtistMintHelp: "Registra uma obra própria previamente revisada.",
    manager: "Gestor autorizado",
    managerHelp: "Atua por delegação explícita de prática.",
    mintAction: "Mintear obra",
    mintActionHelp: "Abre a confirmação de Mint para esta obra pré-carregada.",
    single: "Uma obra",
    singleHelp: "Consome um Voucher Mint.",
    batch: "Lote de duas obras",
    batchHelp: "Consome um Voucher Mint por obra.",
    operationSummary: "Resumo da operação",
    available: "Disponíveis",
    required: "Necessários",
    credential: "Credencial da transação",
    credentialHelp: "A demo nunca solicita uma senha real. Este controle representa a credencial inserida somente no Atelier.",
    prepareCredential: "Usar credencial sintética de prática",
    credentialReady: "Credencial sintética pronta",
    finalConfirmation: "Confirmação final",
    confirmMint: "Confirmo o Mint simulado desta obra.",
    waiting: "Aguardando confirmação simulada da Gnosis Chain",
    success: "Mint simulado concluído",
    successHelp: "A obra agora pode mostrar identidade digital, comprovante e referências técnicas sintéticas.",
    receipt: "Comprovante de Mint",
    token: "Token",
    transaction: "Transação",
    metadata: "Metadata IPFS",
    noReceipt: "Conclua o último passo para gerar o comprovante sintético.",
    statusVerification: "Verificação do estado",
    mintedStatus: "Obra minteada",
    errorPractice: "Testar um erro controlado",
    wrongCredential: "Credencial incorreta",
    voucherMissing: "Voucher insuficiente",
    batchSelection: "Obras selecionadas para o lote",
    secondSyntheticArtwork: "Composição geométrica de prática",
    syntheticFixture: "Fixture sintético adicional",
    certifyAction: "Certificar obra",
    certifyActionHelp: "Inicia uma solicitação Certify sobre a obra já minteada.",
    certifier: "Quem certificará",
    expert: "Perito / especialista",
    expertHelp: "Acrescenta uma conclusão técnica ou profissional.",
    galleryMuseum: "Galeria / museu",
    galleryMuseumHelp: "Documenta uma exposição, custódia ou outro fato institucional.",
    certifyType: "Que fato é respaldado?",
    authenticity: "Autenticidade",
    condition: "Estado de conservação",
    exhibition: "Exposição",
    additionalReport: "Relatório adicional",
    visibility: "Visibilidade do Certify",
    public: "Visível publicamente",
    ownerOnly: "Somente owner",
    requestReview: "Revisar solicitação",
    requestSummary: "A solicitação vincula obra, tipo e certificador. Enviá-la ainda não completa o Certify.",
    confirmRequest: "Confirmo o envio desta solicitação sintética.",
    requestSent: "Solicitação enviada",
    requestPending: "Aguardando resposta do certificador",
    requestRef: "Solicitação",
    certifierInbox: "Certificações recebidas",
    acceptRequest: "O certificador aceita trabalhar nesta solicitação.",
    factDescription: "Descrição do fato certificado",
    evidence: "Evidência",
    attachEvidence: "Anexar evidência sintética",
    attached: "Evidência anexada",
    certifyCredentialHelp: "A credencial pertence ao ator que executa Certify e o voucher dele é consumido.",
    confirmCertify: "Confirmo o registro Certify simulado.",
    certifySuccess: "Certify adicionado ao histórico da obra",
    traceability: "Histórico verificável atualizado",
    certifiedBy: "Realizado por",
    consumed: "Voucher consumido",
    noRealAction: "Simulação educativa: nenhum dado foi escrito no Atelier, blockchain ou IPFS.",
  },
} satisfies Record<Language, Record<string, string>>;

const finalStateCopy = {
  es: {
    ownerView: "Administración",
    galleryView: "Gallery pública",
    artworkTab: "Obra",
    certificationsTab: "Certificaciones",
    finalState: "Resultado final simulado",
    finalStateHelp: "Compara cómo queda la misma obra dentro de tu administración y qué se proyecta públicamente.",
    ownerBoundary: "La vista owner conserva todos los datos y Certify de esta sesión sintética.",
    galleryBoundary: "Gallery muestra solo lo que el owner mantiene visible. Cambiar la vista no publica nada real.",
    galleryHidden: "Esta obra está oculta en Gallery",
    galleryHiddenHelp: "Sigue disponible para el owner dentro de Administración, pero un visitante no la ve.",
    publicProjection: "Así se proyecta en Gallery",
    technicalSheet: "Ficha técnica",
    technicalSheetHidden: "La ficha técnica está reservada para el owner.",
    mintedToken: "Minteada · Token",
    endpointInspector: "Referencia seleccionada",
    endpointHint: "Selecciona un icono para entender qué abre y qué dato verificable muestra.",
    noEndpoints: "Los endpoints aparecen después de completar el Mint simulado.",
    noCertifications: "Todavía no hay Certify visibles en esta vista.",
    performedBy: "Realizada por",
    evidence: "Evidencia",
    publicVisibility: "Público",
    ownerVisibility: "Solo owner",
    syntheticReference: "Referencia sintética, sin navegación externa",
    iconInfo: "Ver detalle del Certify",
    country: "País",
    exhibition: "Exposición",
    description: "Descripción",
    notes: "Notas",
  },
  en: {
    ownerView: "Administration",
    galleryView: "Public Gallery",
    artworkTab: "Artwork",
    certificationsTab: "Certifications",
    finalState: "Simulated final result",
    finalStateHelp: "Compare how the same artwork appears in your administration and what is projected publicly.",
    ownerBoundary: "The owner view keeps all data and Certify entries from this synthetic session.",
    galleryBoundary: "Gallery shows only what the owner keeps visible. Switching views publishes nothing real.",
    galleryHidden: "This artwork is hidden from Gallery",
    galleryHiddenHelp: "It remains available to the owner in Administration, but visitors cannot see it.",
    publicProjection: "This is how it appears in Gallery",
    technicalSheet: "Technical sheet",
    technicalSheetHidden: "The technical sheet is reserved for the owner.",
    mintedToken: "Minted · Token",
    endpointInspector: "Selected reference",
    endpointHint: "Select an icon to understand what it opens and which verifiable data it displays.",
    noEndpoints: "Endpoints appear after completing the simulated Mint.",
    noCertifications: "There are no Certify entries visible in this view yet.",
    performedBy: "Performed by",
    evidence: "Evidence",
    publicVisibility: "Public",
    ownerVisibility: "Owner only",
    syntheticReference: "Synthetic reference, no external navigation",
    iconInfo: "View Certify details",
    country: "Country",
    exhibition: "Exhibition",
    description: "Description",
    notes: "Notes",
  },
  pt: {
    ownerView: "Administração",
    galleryView: "Gallery pública",
    artworkTab: "Obra",
    certificationsTab: "Certificações",
    finalState: "Resultado final simulado",
    finalStateHelp: "Compare como a mesma obra fica na sua administração e o que é projetado publicamente.",
    ownerBoundary: "A vista owner conserva todos os dados e Certify desta sessão sintética.",
    galleryBoundary: "A Gallery mostra somente o que o owner mantém visível. Trocar a vista não publica nada real.",
    galleryHidden: "Esta obra está oculta na Gallery",
    galleryHiddenHelp: "Ela continua disponível para o owner na Administração, mas um visitante não a vê.",
    publicProjection: "Assim aparece na Gallery",
    technicalSheet: "Ficha técnica",
    technicalSheetHidden: "A ficha técnica está reservada ao owner.",
    mintedToken: "Minteada · Token",
    endpointInspector: "Referência selecionada",
    endpointHint: "Selecione um ícone para entender o que ele abre e qual dado verificável apresenta.",
    noEndpoints: "Os endpoints aparecem depois de concluir o Mint simulado.",
    noCertifications: "Ainda não há Certify visíveis nesta vista.",
    performedBy: "Realizado por",
    evidence: "Evidência",
    publicVisibility: "Público",
    ownerVisibility: "Somente owner",
    syntheticReference: "Referência sintética, sem navegação externa",
    iconInfo: "Ver detalhes do Certify",
    country: "País",
    exhibition: "Exposição",
    description: "Descrição",
    notes: "Notas",
  },
} satisfies Record<Language, Record<string, string>>;

type FinalStateTab = "artwork" | "certifications";
type FinalStateView = "owner" | "gallery";

const iconByAssetId = new Map(iconAtlas.icons.map((item) => [item.asset_id, item]));

function nativeIconContent(assetId: string, language: Language) {
  const icon = iconByAssetId.get(assetId);
  return icon?.copy[language] ?? { title: assetId, body: "" };
}

function certifyActorEmail(actorId: CertifyActorId): string {
  return {
    owner_artist: "owner@demo.invalid",
    expert: "perito@demo.invalid",
    gallery_museum: "museo@demo.invalid",
  }[actorId];
}

function NativePlatformIcon({ assetId, alt }: { assetId: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="native-platform-icon" role="img" aria-label={alt}>
      {failed
        ? <ImageIcon size={22} aria-hidden="true" />
        : <img src={`/api/manual-asset/${encodeURIComponent(assetId)}`} alt="" onError={() => setFailed(true)} />}
    </span>
  );
}

const mintActorCopy: Record<MintActorId, Record<Language, { name: string; help: string }>> = {
  owner_artist: {
    es: { name: operationCopy.es.ownerArtist, help: operationCopy.es.ownerArtistMintHelp },
    en: { name: operationCopy.en.ownerArtist, help: operationCopy.en.ownerArtistMintHelp },
    pt: { name: operationCopy.pt.ownerArtist, help: operationCopy.pt.ownerArtistMintHelp },
  },
  authorized_manager: {
    es: { name: operationCopy.es.manager, help: operationCopy.es.managerHelp },
    en: { name: operationCopy.en.manager, help: operationCopy.en.managerHelp },
    pt: { name: operationCopy.pt.manager, help: operationCopy.pt.managerHelp },
  },
};

const certifyActorCopy: Record<CertifyActorId, Record<Language, { name: string; help: string }>> = {
  owner_artist: {
    es: { name: operationCopy.es.ownerArtist, help: "Declara un hecho propio sobre la obra." },
    en: { name: operationCopy.en.ownerArtist, help: "Declares a first-party fact about the artwork." },
    pt: { name: operationCopy.pt.ownerArtist, help: "Declara um fato próprio sobre a obra." },
  },
  expert: {
    es: { name: operationCopy.es.expert, help: operationCopy.es.expertHelp },
    en: { name: operationCopy.en.expert, help: operationCopy.en.expertHelp },
    pt: { name: operationCopy.pt.expert, help: operationCopy.pt.expertHelp },
  },
  gallery_museum: {
    es: { name: operationCopy.es.galleryMuseum, help: operationCopy.es.galleryMuseumHelp },
    en: { name: operationCopy.en.galleryMuseum, help: operationCopy.en.galleryMuseumHelp },
    pt: { name: operationCopy.pt.galleryMuseum, help: operationCopy.pt.galleryMuseumHelp },
  },
};

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

function OperationArtworkCard({
  context,
  status,
  compact = false,
}: {
  context: DemoContext;
  status: string;
  compact?: boolean;
}) {
  const artwork = context.world.artwork;
  const c = copy[context.language];
  return (
    <article className={compact ? "operation-artwork-card compact" : "operation-artwork-card"}>
      <img src={artwork.images[0].assetPath} alt={artwork.title} />
      <div>
        <span className="atelier-object-type">{artworkTypeLabel(artwork.type, context.language)}</span>
        <strong>{artwork.title}</strong>
        <small>{artwork.author}</small>
        {!compact && (
          <dl>
            <div><dt>{c.technique}</dt><dd>{artwork.technique[context.language]}</dd></div>
            <div><dt>{c.dimensions}</dt><dd>{artwork.widthCm} × {artwork.heightCm} cm</dd></div>
            <div><dt>{c.year}</dt><dd>{artwork.creationYear}</dd></div>
          </dl>
        )}
      </div>
      <b><Check size={15} />{status}</b>
    </article>
  );
}

interface FinalReference {
  key: string;
  assetId?: string;
  label: string;
  body: string;
  value: string;
}

function ArtworkFinalStateSurface({
  context,
  defaultTab = "artwork",
  initialView = "owner",
}: {
  context: DemoContext;
  defaultTab?: FinalStateTab;
  initialView?: FinalStateView;
}) {
  const { language, world } = context;
  const artwork = world.artwork;
  const c = copy[language];
  const f = finalStateCopy[language];
  const mintReceipt = world.mintReceipts.at(-1);
  const [tab, setTab] = useState<FinalStateTab>(defaultTab);
  const [view, setView] = useState<FinalStateView>(initialView);
  const [activeImageId, setActiveImageId] = useState(artwork.images[0].imageId);
  const activeImage = artwork.images.find((image) => image.imageId === activeImageId) ?? artwork.images[0];
  const privacyReceipt = world.privacyReceipts.at(-1);
  const galleryVisible = privacyReceipt?.galleryVisible ?? artwork.galleryVisible;
  const visibleArtwork = view === "owner" || galleryVisible;
  const technicalSheetVisible = view === "owner" || (privacyReceipt?.technicalSheetVisible ?? true);
  const visibleCertifications = view === "owner"
    ? world.certifications
    : world.certifications.filter((item) => {
      if (item.visibility !== "public") return false;
      if (!privacyReceipt || item.typeId === "additional_report") return true;
      return privacyReceipt.publicCertifyIds.includes(item.typeId);
    });
  const isMinted = Boolean(mintReceipt) || ["minted", "certified", "tagged", "transferred"].includes(world.artworkStatus);
  const statusIcons = [
    artwork.exhibited && { assetId: "manual-native-icon-status-exhibited", label: nativeIconContent("manual-native-icon-status-exhibited", language).title },
    isMinted && { assetId: "manual-native-icon-status-minted", label: nativeIconContent("manual-native-icon-status-minted", language).title },
    world.certifications.length > 0 && { assetId: "manual-native-icon-status-provenance", label: nativeIconContent("manual-native-icon-status-provenance", language).title },
    world.nfcReceipts.length > 0 && { assetId: "manual-native-icon-status-nfc", label: nativeIconContent("manual-native-icon-status-nfc", language).title },
  ].filter(Boolean) as Array<{ assetId: string; label: string }>;
  const artworkReferences: FinalReference[] = mintReceipt ? [
    {
      key: "artwork-nft",
      assetId: "manual-native-icon-endpoint-nft",
      ...nativeIconContent("manual-native-icon-endpoint-nft", language),
      value: mintReceipt.tokenRef,
    },
    {
      key: "artwork-image-ipfs",
      assetId: "manual-native-icon-endpoint-image-ipfs",
      ...nativeIconContent("manual-native-icon-endpoint-image-ipfs", language),
      value: `IPFS-DEMO-IMAGE-${mintReceipt.receiptId.slice(-3)}`,
    },
    {
      key: "artwork-metadata-ipfs",
      assetId: "manual-native-icon-endpoint-metadata-ipfs",
      ...nativeIconContent("manual-native-icon-endpoint-metadata-ipfs", language),
      value: mintReceipt.metadataRef,
    },
    {
      key: "artwork-transaction",
      assetId: "manual-native-icon-endpoint-transaction",
      ...nativeIconContent("manual-native-icon-endpoint-transaction", language),
      value: mintReceipt.transactionRef,
    },
  ].map(({ title, ...item }) => ({ ...item, label: title })) : [];
  const certificationReferences = visibleCertifications.flatMap((certification) => {
    const sequence = certification.certificationId.slice(-3);
    const nativeReference = (key: string, assetId: string, value: string): FinalReference => {
      const content = nativeIconContent(assetId, language);
      return { key, assetId, label: content.title, body: content.body, value };
    };
    return [
      nativeReference(`${certification.certificationId}-file`, "manual-native-icon-certify-file-ipfs", certification.evidenceAssetId),
      nativeReference(`${certification.certificationId}-documentation`, "manual-native-icon-certify-documentation-ipfs", `IPFS-DEMO-CERTIFY-${sequence}`),
      nativeReference(`${certification.certificationId}-transaction`, "manual-native-icon-certify-transaction", certification.transactionRef),
      {
        key: `${certification.certificationId}-info`,
        label: f.iconInfo,
        body: certification.description,
        value: certification.certificationId,
      },
    ];
  });
  const references = [...artworkReferences, ...certificationReferences];
  const [selectedReferenceKey, setSelectedReferenceKey] = useState<string | null>(
    defaultTab === "certifications" ? certificationReferences[0]?.key ?? null : artworkReferences[0]?.key ?? null,
  );
  const selectedReference = references.find((item) => item.key === selectedReferenceKey) ?? artworkReferences[0] ?? certificationReferences[0];

  function changeView(nextView: FinalStateView) {
    setView(nextView);
    setTab("artwork");
    setSelectedReferenceKey(artworkReferences[0]?.key ?? null);
  }

  function changeTab(nextTab: FinalStateTab) {
    setTab(nextTab);
    setSelectedReferenceKey(nextTab === "certifications" ? certificationReferences[0]?.key ?? null : artworkReferences[0]?.key ?? null);
  }

  if (!visibleArtwork) {
    return (
      <section className="final-artwork-state">
        <div className="final-state-toolbar">
          <div><small>{f.finalState}</small><strong>{artwork.title}</strong></div>
          <div className="final-view-switch" role="group" aria-label={f.finalState}>
            <button type="button" onClick={() => changeView("owner")}>{f.ownerView}</button>
            <button type="button" className="active" aria-pressed="true">{f.galleryView}</button>
          </div>
        </div>
        <div className="atelier-hidden-state">
          <EyeOff size={34} />
          <strong>{f.galleryHidden}</strong>
          <p>{f.galleryHiddenHelp}</p>
          <button type="button" className="final-state-return" onClick={() => changeView("owner")}>{f.ownerView}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="final-artwork-state" aria-label={f.finalState}>
      <div className="final-state-toolbar">
        <div><small>{view === "gallery" ? f.publicProjection : f.finalState}</small><strong>{artwork.title}</strong><span>{f.finalStateHelp}</span></div>
        <div className="final-view-switch" role="group" aria-label={f.finalState}>
          <button type="button" className={view === "owner" ? "active" : ""} aria-pressed={view === "owner"} onClick={() => changeView("owner")}><ShieldCheck size={16} />{f.ownerView}</button>
          <button type="button" className={view === "gallery" ? "active" : ""} aria-pressed={view === "gallery"} onClick={() => changeView("gallery")}><GalleryHorizontalEnd size={16} />{f.galleryView}</button>
        </div>
      </div>
      <div className="final-state-boundary"><Info size={17} />{view === "owner" ? f.ownerBoundary : f.galleryBoundary}</div>
      <div className="final-state-main">
        <div className="final-artwork-media">
          <img src={activeImage.assetPath} alt={`${artwork.title} · ${activeImage.role}`} style={{ objectPosition: activeImage.objectPosition }} />
          <div className="final-image-strip" aria-label={c.supportingImages}>
            {artwork.images.map((image, index) => (
              <button type="button" key={image.imageId} className={image.imageId === activeImage.imageId ? "active" : ""} aria-label={`${c.supportingImages} ${index + 1}`} onClick={() => setActiveImageId(image.imageId)}>
                <img src={image.assetPath} alt="" style={{ objectPosition: image.objectPosition }} />
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="final-artwork-panel">
          <div className="final-state-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "artwork"} className={tab === "artwork" ? "active" : ""} onClick={() => changeTab("artwork")}>{f.artworkTab}</button>
            <button type="button" role="tab" aria-selected={tab === "certifications"} className={tab === "certifications" ? "active" : ""} onClick={() => changeTab("certifications")}>{f.certificationsTab} ({visibleCertifications.length})</button>
          </div>
          {tab === "artwork" ? (
            <div className="final-artwork-tab" role="tabpanel">
              <div className="final-artwork-heading">
                <div><h3>{artwork.title}</h3><p>{artwork.author}</p><small>{artworkTypeLabel(artwork.type, language)} · {artwork.countryName[language]} · {artwork.exhibited ? c.exhibited : c.preload}</small></div>
                <div className="final-status-icons">
                  {statusIcons.map((item) => <span key={item.assetId} title={item.label}><NativePlatformIcon assetId={item.assetId} alt={item.label} /><small>{item.label}</small></span>)}
                </div>
              </div>
              {technicalSheetVisible ? (
                <details className="final-technical-sheet" open>
                  <summary>{f.technicalSheet}</summary>
                  <dl>
                    <div><dt>{c.popularName}</dt><dd>{artwork.popularName}</dd></div>
                    <div><dt>{c.style}</dt><dd>{artwork.style[language]}</dd></div>
                    <div><dt>{c.theme}</dt><dd>{artwork.theme[language]}</dd></div>
                    <div><dt>{c.technique}</dt><dd>{artwork.technique[language]} · {artwork.support[language]}</dd></div>
                    <div><dt>{c.dimensions}</dt><dd>{artwork.widthCm} × {artwork.heightCm}{artwork.depthCm ? ` × ${artwork.depthCm}` : ""} cm</dd></div>
                    <div><dt>{c.year}</dt><dd>{artwork.creationYear}</dd></div>
                    <div><dt>{c.creationPlace}</dt><dd>{artwork.creationPlace}</dd></div>
                    <div><dt>{c.period}</dt><dd>{artwork.period[language]}</dd></div>
                    <div><dt>{c.series}</dt><dd>{artwork.series[language]}</dd></div>
                    <div><dt>{f.country}</dt><dd>{artwork.countryName[language]}</dd></div>
                    <div><dt>{f.exhibition}</dt><dd>{artwork.exhibitionPlace}</dd></div>
                    <div className="wide"><dt>{f.description}</dt><dd>{artwork.description[language]}</dd></div>
                    <div className="wide"><dt>{f.notes}</dt><dd>{artwork.notes[language]}</dd></div>
                  </dl>
                </details>
              ) : <div className="final-private-note"><EyeOff size={18} />{f.technicalSheetHidden}</div>}
              {mintReceipt && <div className="final-mint-state"><Fingerprint size={18} /><strong>{f.mintedToken}: {mintReceipt.tokenRef}</strong></div>}
              <section className="final-endpoints">
                <h4>{f.endpointInspector}</h4>
                {artworkReferences.length ? (
                  <div className="final-endpoint-buttons">
                    {artworkReferences.map((reference) => (
                      <button type="button" key={reference.key} className={selectedReference?.key === reference.key ? "active" : ""} aria-label={reference.label} title={reference.label} onClick={() => setSelectedReferenceKey(reference.key)}>
                        <NativePlatformIcon assetId={reference.assetId!} alt={reference.label} />
                      </button>
                    ))}
                  </div>
                ) : <p>{f.noEndpoints}</p>}
              </section>
            </div>
          ) : (
            <div className="final-certifications-tab" role="tabpanel">
              {visibleCertifications.length ? visibleCertifications.map((certification) => {
                const actor = certifyActorCopy[certification.actorId][language];
                const rowReferences = certificationReferences.filter((item) => item.key.startsWith(certification.certificationId));
                return (
                  <article key={certification.certificationId}>
                    <div className="final-certify-copy">
                      <span><small>{operationCopy[language].certifyType}</small><strong>{certifyTypeLabel(certification.typeId, language)}</strong></span>
                      <span><small>{f.performedBy}</small><strong>{certifyActorEmail(certification.actorId)}</strong><em>{actor.name}</em></span>
                      <p>{certification.description}</p>
                      <time dateTime={certification.completedAt}>{certification.completedAt.slice(0, 10)} · {certification.visibility === "public" ? f.publicVisibility : f.ownerVisibility}</time>
                    </div>
                    <div className="final-certify-endpoints" aria-label={`${f.evidence} · ${certification.certificationId}`}>
                      {rowReferences.map((reference) => (
                        <button type="button" key={reference.key} className={selectedReference?.key === reference.key ? "active" : ""} aria-label={`${certification.certificationId} · ${reference.label}`} title={reference.label} onClick={() => setSelectedReferenceKey(reference.key)}>
                          {reference.assetId ? <NativePlatformIcon assetId={reference.assetId} alt={reference.label} /> : <Info size={18} />}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              }) : <div className="final-empty-certify"><BadgeCheck size={25} /><p>{f.noCertifications}</p></div>}
            </div>
          )}
          <div className="final-reference-inspector" aria-live="polite">
            {selectedReference ? (
              <>
                <div>{selectedReference.assetId ? <NativePlatformIcon assetId={selectedReference.assetId} alt="" /> : <Info size={20} />}<span><strong>{selectedReference.label}</strong><small>{f.syntheticReference}</small></span></div>
                <p>{selectedReference.body}</p>
                <code>{selectedReference.value}</code>
              </>
            ) : <p>{f.endpointHint}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function OperationFrame({
  context,
  step,
  section,
  children,
}: {
  context: DemoContext;
  step: ManualStep;
  section: string;
  children: React.ReactNode;
}) {
  const c = copy[context.language];
  return (
    <div className="atelier-surface">
      <div className="atelier-appbar">
        <span>Tokenizart Atelier</span>
        <div><strong>{c.administration}</strong><small>{c.synthetic}</small></div>
      </div>
      <div className="atelier-window operation-flow">
        <div className="atelier-window-heading">
          <div><small>{section}</small><h3>{step.copy[context.language].title}</h3></div>
          <span className="atelier-demo-seal">{step.order}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChoiceButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; title: string; help: string; icon: typeof UserRound }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="atelier-choice-grid">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.id === value;
        return (
          <button
            type="button"
            key={option.id}
            className={selected ? "selected" : ""}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
          >
            <Icon size={21} />
            <span><strong>{option.title}</strong><small>{option.help}</small></span>
            {selected && <Check size={17} />}
          </button>
        );
      })}
    </div>
  );
}

function SimulatedCredential({
  prepared,
  help,
  language,
  onChange,
}: {
  prepared: boolean;
  help: string;
  language: Language;
  onChange: (prepared: boolean) => void;
}) {
  const localized = operationCopy[language];
  return (
    <section className="simulated-credential">
      <div><KeyRound size={25} /><span><strong>{localized.credential}</strong><small>{help}</small></span></div>
      <button type="button" className={prepared ? "selected" : ""} aria-pressed={prepared} onClick={() => onChange(!prepared)}>
        {prepared ? <Check size={17} /> : <ShieldCheck size={17} />}
        {prepared ? localized.credentialReady : localized.prepareCredential}
      </button>
    </section>
  );
}

function MintReceiptPanel({
  context,
  receipt,
}: {
  context: DemoContext;
  receipt?: DemoMintReceipt;
}) {
  const o = operationCopy[context.language];
  if (!receipt) {
    return <div className="operation-empty-receipt"><FileCheck2 size={28} /><strong>{o.receipt}</strong><p>{o.noReceipt}</p></div>;
  }
  return (
    <section className="operation-receipt completion-result mint-result" aria-live="polite">
      <div className="operation-result-heading"><BadgeCheck size={28} /><span><strong>{o.success}</strong><small>{receipt.receiptId}</small></span></div>
      <dl>
        <div><dt>{o.actor}</dt><dd>{mintActorCopy[receipt.actorId][context.language].name}</dd></div>
        <div><dt>{o.batchSelection}</dt><dd>{receipt.mode === "batch" ? o.batch : o.single}</dd></div>
        <div><dt>{o.token}</dt><dd>{receipt.tokenRef}</dd></div>
        <div><dt>{o.transaction}</dt><dd>{receipt.transactionRef}</dd></div>
        <div><dt>{o.metadata}</dt><dd>{receipt.metadataRef}</dd></div>
        <div><dt>{o.consumed}</dt><dd>{receipt.vouchersConsumed} Mint</dd></div>
      </dl>
      <p>{o.noRealAction}</p>
    </section>
  );
}

function MintSurface({
  context,
  step,
  send,
  onPracticeSelection,
}: {
  context: DemoContext;
  step: ManualStep;
  send: DemoSend;
  onPracticeSelection: (selectionId: string) => void;
}) {
  const o = operationCopy[context.language];
  const c = copy[context.language];
  const draft = context.world.mintDraft;
  const receipt = context.world.mintReceipts.at(-1);
  const voucherRequirement = draft.mode === "batch" ? 2 : 1;
  const mintActors = (Object.keys(mintActorCopy) as MintActorId[]).map((actorId) => ({
    id: actorId,
    title: mintActorCopy[actorId][context.language].name,
    help: mintActorCopy[actorId][context.language].help,
    icon: actorId === "owner_artist" ? UserRound : Users,
  }));
  const modes: Array<{ id: MintMode; title: string; help: string; icon: typeof UserRound }> = [
    { id: "single", title: o.single, help: o.singleHelp, icon: FileCheck2 },
    { id: "batch", title: o.batch, help: o.batchHelp, icon: ListChecks },
  ];
  let content: React.ReactNode;

  if (step.order === 1) {
    content = <><h4 className="operation-section-title">{o.selectArtwork}</h4><OperationArtworkCard context={context} status={c.preload} /></>;
  } else if (step.order === 2) {
    content = (
      <>
        <OperationArtworkCard context={context} status={c.preload} compact />
        <section className="operation-review">
          <h4><ClipboardCheck size={20} />{o.reviewArtwork}</h4>
          <div><span><Check size={16} />{context.world.artwork.title}</span><span><Check size={16} />{context.world.artwork.images.length} imágenes</span><span><Check size={16} />{context.world.artwork.technique[context.language]}</span></div>
          <label><input type="checkbox" checked={draft.reviewConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", reviewConfirmed: event.target.checked })} />{o.reviewed}</label>
        </section>
      </>
    );
  } else if (step.order === 3) {
    content = (
      <>
        <button type="button" className="atelier-primary-action"><Fingerprint size={20} /><span><strong>{o.mintAction}</strong><small>{o.mintActionHelp}</small></span></button>
        <fieldset className="atelier-operation-fieldset"><legend>{o.actor}</legend><ChoiceButtons value={draft.actorId} options={mintActors} onChange={(actorId) => {
          send({ type: "SET_MINT_DRAFT", actorId });
          onPracticeSelection(`mint_actor:${actorId}`);
        }} /></fieldset>
      </>
    );
  } else if (step.order === 4) {
    content = (
      <section className="operation-summary">
        <h4><TicketCheck size={20} />{o.operationSummary}</h4>
        <OperationArtworkCard context={context} status={o.selectedArtwork} compact />
        <dl><div><dt>{o.available}</dt><dd>{context.world.vouchers.mint} Mint</dd></div><div><dt>{o.required}</dt><dd>{voucherRequirement} Mint</dd></div><div><dt>{c.network}</dt><dd>Gnosis Chain · {c.synthetic}</dd></div></dl>
      </section>
    );
  } else if (step.order === 5) {
    content = <SimulatedCredential prepared={draft.credentialPrepared} help={o.credentialHelp} language={context.language} onChange={(credentialPrepared) => send({ type: "SET_MINT_DRAFT", credentialPrepared })} />;
  } else if (step.order === 6) {
    content = (
      <section className="operation-confirmation">
        <Fingerprint size={34} />
        <h4>{o.finalConfirmation}</h4>
        <p>{context.world.artwork.title} · {voucherRequirement} Voucher Mint · Gnosis Chain simulada</p>
        <label><input type="checkbox" checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", signatureConfirmed: event.target.checked })} />{o.confirmMint}</label>
      </section>
    );
  } else if (step.order === 7) {
    content = <section className="operation-waiting"><LoaderCircle size={42} /><strong>{o.waiting}</strong><div><i /></div><small>{context.world.artwork.title}</small></section>;
  } else if (step.order === 8) {
    content = <section className="operation-success"><BadgeCheck size={44} /><strong>{o.success}</strong><p>{o.successHelp}</p></section>;
  } else if (step.order === 9) {
    content = <MintReceiptPanel context={context} receipt={receipt} />;
  } else if (step.order === 10) {
    content = <><OperationArtworkCard context={context} status={o.mintedStatus} /><div className="operation-status-proof"><Fingerprint size={22} /><span><strong>{o.statusVerification}</strong><small>{receipt?.tokenRef ?? "TOKEN-DEMO-PREVIEW"} · {receipt?.transactionRef ?? "TX-DEMO-PREVIEW"}</small></span></div></>;
  } else if (step.order === 11) {
    content = (
      <section className="operation-error-lab">
        <CircleAlert size={34} />
        <h4>{o.errorPractice}</h4>
        <div><button type="button" onClick={() => send({ type: "INJECT_ERROR", code: "wrong_wallet_password" })}>{o.wrongCredential}</button><button type="button" onClick={() => send({ type: "INJECT_ERROR", code: "missing_voucher" })}>{o.voucherMissing}</button></div>
      </section>
    );
  } else if (step.order === 12) {
    content = <fieldset className="atelier-operation-fieldset"><legend>{o.batchSelection}</legend><ChoiceButtons value={draft.mode} options={modes} onChange={(mode) => {
      send({ type: "SET_MINT_DRAFT", mode });
      onPracticeSelection(`mint_mode:${mode}`);
    }} /></fieldset>;
  } else if (step.order === 13) {
    content = (
      <section className="batch-artwork-list">
        <h4>{o.batchSelection}</h4>
        <OperationArtworkCard context={context} status={o.selectedArtwork} compact />
        <article><div className="synthetic-artwork-placeholder"><ImageIcon size={26} /></div><span><strong>{o.secondSyntheticArtwork}</strong><small>{o.syntheticFixture}</small></span><b><Check size={15} />{o.selectedArtwork}</b></article>
        <label><input type="checkbox" checked={draft.reviewConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", reviewConfirmed: event.target.checked })} />{o.reviewed}</label>
      </section>
    );
  } else if (step.order === 14) {
    content = <section className="operation-summary"><h4><Fingerprint size={20} />{o.finalConfirmation}</h4><dl><div><dt>{o.batch}</dt><dd>2</dd></div><div><dt>{o.required}</dt><dd>2 Mint</dd></div><div><dt>{o.credential}</dt><dd>{draft.credentialPrepared ? o.credentialReady : o.prepareCredential}</dd></div></dl></section>;
  } else {
    content = <><MintReceiptPanel context={context} receipt={receipt} /><ArtworkFinalStateSurface context={context} defaultTab="artwork" initialView="owner" /></>;
  }

  return <OperationFrame context={context} step={step} section="Mint">{content}</OperationFrame>;
}

function certifyTypeLabel(typeId: CertifyTypeId, language: Language): string {
  const o = operationCopy[language];
  return {
    authenticity: o.authenticity,
    condition: o.condition,
    exhibition: o.exhibition,
    additional_report: o.additionalReport,
  }[typeId];
}

function evidenceFileName(typeId: CertifyTypeId): string {
  return {
    authenticity: "informe-autenticidad-demo.pdf",
    condition: "informe-conservacion-demo.pdf",
    exhibition: "constancia-exhibicion-demo.pdf",
    additional_report: "informe-adicional-demo.pdf",
  }[typeId];
}

function CertifyReceiptPanel({
  context,
  certification,
}: {
  context: DemoContext;
  certification?: DemoCertification;
}) {
  const o = operationCopy[context.language];
  if (!certification) {
    return <div className="operation-empty-receipt"><FileCheck2 size={28} /><strong>{o.certifySuccess}</strong><p>{o.noReceipt}</p></div>;
  }
  const actor = certifyActorCopy[certification.actorId][context.language];
  return (
    <section className="operation-receipt completion-result certify-result" aria-live="polite">
      <div className="operation-result-heading"><BadgeCheck size={28} /><span><strong>{o.certifySuccess}</strong><small>{certification.certificationId}</small></span></div>
      <dl>
        <div><dt>{o.certifyType}</dt><dd>{certifyTypeLabel(certification.typeId, context.language)}</dd></div>
        <div><dt>{o.certifiedBy}</dt><dd>{actor.name}</dd></div>
        <div><dt>{o.evidence}</dt><dd>{certification.evidenceFileName}</dd></div>
        <div><dt>{o.visibility}</dt><dd>{certification.visibility === "public" ? o.public : o.ownerOnly}</dd></div>
        <div><dt>{o.transaction}</dt><dd>{certification.transactionRef}</dd></div>
      </dl>
      <p>{certification.description}</p>
      <p>{o.noRealAction}</p>
    </section>
  );
}

function CertifySurface({
  context,
  step,
  send,
  onPracticeSelection,
}: {
  context: DemoContext;
  step: ManualStep;
  send: DemoSend;
  onPracticeSelection: (selectionId: string) => void;
}) {
  const o = operationCopy[context.language];
  const c = copy[context.language];
  const draft = context.world.certifyDraft;
  const certification = context.world.certifications.at(-1);
  const actors = (Object.keys(certifyActorCopy) as CertifyActorId[]).map((actorId) => ({
    id: actorId,
    title: certifyActorCopy[actorId][context.language].name,
    help: certifyActorCopy[actorId][context.language].help,
    icon: actorId === "owner_artist" ? UserRound : actorId === "expert" ? ClipboardCheck : Users,
  }));
  const description = draft.description[context.language];
  let content: React.ReactNode;

  if (step.order === 1) {
    content = <><h4 className="operation-section-title">{o.selectArtwork}</h4><OperationArtworkCard context={context} status={c.minted} /></>;
  } else if (step.order === 2) {
    content = <><OperationArtworkCard context={context} status={c.minted} compact /><button type="button" className="atelier-primary-action"><BadgeCheck size={20} /><span><strong>{o.certifyAction}</strong><small>{o.certifyActionHelp}</small></span></button></>;
  } else if (step.order === 3) {
    content = <fieldset className="atelier-operation-fieldset"><legend>{o.certifier}</legend><ChoiceButtons value={draft.actorId} options={actors} onChange={(actorId) => {
      send({ type: "SET_CERTIFY_DRAFT", actorId });
      onPracticeSelection(`certify_actor:${actorId}`);
    }} /></fieldset>;
  } else if (step.order === 4) {
    content = (
      <div className="certify-settings">
        <label>{o.certifyType}<select value={draft.typeId} onChange={(event) => {
          const typeId = event.target.value as CertifyTypeId;
          send({ type: "SET_CERTIFY_DRAFT", typeId, evidenceFileName: evidenceFileName(typeId), evidenceAttached: false });
          onPracticeSelection(`certify_type:${typeId}`);
        }}><option value="authenticity">{o.authenticity}</option><option value="condition">{o.condition}</option><option value="exhibition">{o.exhibition}</option><option value="additional_report">{o.additionalReport}</option></select></label>
        <fieldset><legend>{o.visibility}</legend><div><button type="button" className={draft.visibility === "public" ? "selected" : ""} onClick={() => {
          send({ type: "SET_CERTIFY_DRAFT", visibility: "public" });
          onPracticeSelection("certify_visibility:public");
        }}><Eye size={18} />{o.public}</button><button type="button" className={draft.visibility === "owner" ? "selected" : ""} onClick={() => {
          send({ type: "SET_CERTIFY_DRAFT", visibility: "owner" });
          onPracticeSelection("certify_visibility:owner");
        }}><ShieldCheck size={18} />{o.ownerOnly}</button></div></fieldset>
      </div>
    );
  } else if (step.order === 5 || step.order === 6) {
    content = (
      <section className="certify-request-review">
        <h4><Send size={20} />{o.requestReview}</h4>
        <OperationArtworkCard context={context} status={o.selectedArtwork} compact />
        <dl><div><dt>{o.certifier}</dt><dd>{certifyActorCopy[draft.actorId][context.language].name}</dd></div><div><dt>{o.certifyType}</dt><dd>{certifyTypeLabel(draft.typeId, context.language)}</dd></div><div><dt>{o.visibility}</dt><dd>{draft.visibility === "public" ? o.public : o.ownerOnly}</dd></div></dl>
        <p>{o.requestSummary}</p>
        <label><input type="checkbox" checked={draft.requestConfirmed} onChange={(event) => send({ type: "SET_CERTIFY_DRAFT", requestConfirmed: event.target.checked })} />{o.confirmRequest}</label>
      </section>
    );
  } else if (step.order === 7) {
    content = <section className="operation-success"><Send size={42} /><strong>{o.requestSent}</strong><p>{o.requestPending}</p><small>{o.requestRef}: REQUEST-DEMO-001</small></section>;
  } else if (step.order === 8) {
    content = <section className="certify-request-row"><div><Send size={22} /><span><strong>REQUEST-DEMO-001</strong><small>{context.world.artwork.title} · {certifyTypeLabel(draft.typeId, context.language)}</small></span></div><b>{o.requestPending}</b></section>;
  } else if (step.order === 9) {
    content = (
      <section className="certifier-inbox">
        <h4><BadgeCheck size={20} />{o.certifierInbox}</h4>
        <div><OperationArtworkCard context={context} status={o.requestPending} compact /><label><input type="checkbox" checked={draft.certifierAccepted} onChange={(event) => send({ type: "SET_CERTIFY_DRAFT", certifierAccepted: event.target.checked })} />{o.acceptRequest}</label></div>
      </section>
    );
  } else if (step.order === 10) {
    content = <label className="certify-description">{o.factDescription}<textarea value={description} onChange={(event) => send({ type: "SET_CERTIFY_DRAFT", description: { ...draft.description, [context.language]: event.target.value } })} /><small>{description.length} caracteres · {context.world.artwork.title}</small></label>;
  } else if (step.order === 11) {
    content = (
      <section className="certify-evidence">
        <div><Upload size={28} /><span><strong>{o.evidence}</strong><small>{draft.evidenceFileName}</small></span></div>
        <button type="button" className={draft.evidenceAttached ? "selected" : ""} aria-pressed={draft.evidenceAttached} onClick={() => send({ type: "SET_CERTIFY_DRAFT", evidenceAttached: !draft.evidenceAttached })}>{draft.evidenceAttached ? <Check size={17} /> : <Upload size={17} />}{draft.evidenceAttached ? o.attached : o.attachEvidence}</button>
      </section>
    );
  } else if (step.order === 12) {
    content = (
      <>
        <section className="operation-summary compact"><h4><TicketCheck size={20} />{o.operationSummary}</h4><dl><div><dt>{o.available}</dt><dd>{context.world.vouchers.certify} Certify</dd></div><div><dt>{o.required}</dt><dd>1 Certify</dd></div><div><dt>{o.certifiedBy}</dt><dd>{certifyActorCopy[draft.actorId][context.language].name}</dd></div></dl></section>
        <SimulatedCredential prepared={draft.credentialPrepared} help={o.certifyCredentialHelp} language={context.language} onChange={(credentialPrepared) => send({ type: "SET_CERTIFY_DRAFT", credentialPrepared })} />
      </>
    );
  } else if (step.order === 13) {
    content = <section className="operation-confirmation"><BadgeCheck size={34} /><h4>{o.finalConfirmation}</h4><p>{certifyTypeLabel(draft.typeId, context.language)} · {draft.evidenceFileName} · 1 Voucher Certify</p><label><input type="checkbox" checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_CERTIFY_DRAFT", signatureConfirmed: event.target.checked })} />{o.confirmCertify}</label></section>;
  } else if (step.order === 14) {
    content = <section className="operation-success"><BadgeCheck size={44} /><strong>{o.certifySuccess}</strong><p>{o.traceability}</p></section>;
  } else {
    content = <><CertifyReceiptPanel context={context} certification={certification} /><ArtworkFinalStateSurface context={context} defaultTab="certifications" initialView="owner" /></>;
  }

  return <OperationFrame context={context} step={step} section="Certify">{content}</OperationFrame>;
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

export function AtelierSurface({
  context,
  step,
  send,
  onPracticeSelection,
}: {
  context: DemoContext;
  step: ManualStep;
  send: DemoSend;
  onPracticeSelection: (selectionId: string) => void;
}) {
  if (context.flow === "carga_obra") return <CargaSurface context={context} step={step} send={send} />;
  if (context.flow === "mint") return <MintSurface context={context} step={step} send={send} onPracticeSelection={onPracticeSelection} />;
  if (context.flow === "certify") return <CertifySurface context={context} step={step} send={send} onPracticeSelection={onPracticeSelection} />;
  return <OperationSurface context={context} step={step} />;
}
