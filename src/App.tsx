import { useEffect, useMemo, useState } from "react";
import { useMachine } from "@xstate/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Check,
  CircleAlert,
  Eye,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  GalleryHorizontalEnd,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Languages,
  ListFilter,
  MessageCircleQuestion,
  Nfc,
  PackageCheck,
  RefreshCcw,
  Route,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tag,
  TicketCheck,
  UserRoundPlus,
  Users,
  WalletCards,
  X,
  ZoomIn,
} from "lucide-react";
import { AtelierSurface, usesInteractiveAtelierSurface } from "./AtelierSurface";
import { contextFromSearch, demoMachine, initialContext, manualContract, safeRestore } from "./demoMachine";
import { isCompanionBridgeMessage, postDemoBridgeMessage, practiceStateForContext, practiceStateForSelection, resolveDemoBridgeOrigin } from "./demoBridge";
import type { DemoPracticeState } from "./demoBridge";
import { flowLabels, ui } from "./i18n";
import { classifyVisualLayout, focusImageStyle, needsVisualDetail } from "./visualPresentation";
import type { CertifyActorId, CertifyTypeId, DemoContext, Language, ManualStep, MintActorId, MintMode, NfcActorId, NfcTagState, PrivacyCertifyId, PrivacyPreviewAudience, TransferDestinationType, VoucherBalances as VoucherBalanceValues, VoucherProductId } from "./types";

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

const nativeFlowIconAssets: Partial<Record<string, string>> = {
  carga_obra: "manual-native-action-load",
  mint: "manual-native-action-mint",
  certify: "manual-native-action-certify",
  chip: "manual-native-action-chip",
  transferencia: "manual-native-action-transfer",
  privacy: "manual-native-action-privacy",
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

function FlowIconMark({ flowId, size = 20 }: { flowId: string; size?: number }) {
  const assetId = nativeFlowIconAssets[flowId];
  const FallbackIcon = flowIcons[flowId] ?? Blocks;
  const [nativeAssetFailed, setNativeAssetFailed] = useState(false);

  if (!assetId || nativeAssetFailed) return <FallbackIcon size={size} aria-hidden="true" />;

  return (
    <span className="native-flow-icon" style={{ width: size + 8, height: size + 8 }} aria-hidden="true">
      <img src={`/api/manual-asset/${encodeURIComponent(assetId)}`} alt="" onError={() => setNativeAssetFailed(true)} />
    </span>
  );
}

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
  mint_credential_required: {
    es: { title: "Prepara la credencial sintética", body: "Usa el control de práctica dentro de la pantalla Mint. La demo no solicita ni conserva una clave real." },
    en: { title: "Prepare the synthetic credential", body: "Use the practice control inside the Mint screen. The demo never requests or stores a real password." },
    pt: { title: "Prepare a credencial sintética", body: "Use o controle de prática na tela Mint. A demo não solicita nem armazena uma senha real." },
  },
  certify_request_required: {
    es: { title: "Falta confirmar la solicitud", body: "Revisa obra, tipo y certificador antes de simular el envío de la solicitud Certify." },
    en: { title: "The request is not confirmed", body: "Review the artwork, type, and certifier before simulating the Certify request submission." },
    pt: { title: "Falta confirmar a solicitação", body: "Revise obra, tipo e certificador antes de simular o envio da solicitação Certify." },
  },
  certify_acceptance_required: {
    es: { title: "El certificador aún no aceptó", body: "En Certificaciones recibidas, confirma que el actor elegido acepta trabajar sobre la solicitud." },
    en: { title: "The certifier has not accepted yet", body: "In Received certifications, confirm that the selected actor accepts the request." },
    pt: { title: "O certificador ainda não aceitou", body: "Em Certificações recebidas, confirme que o ator selecionado aceita a solicitação." },
  },
  certify_description_required: {
    es: { title: "Describe el hecho certificado", body: "Explica de manera concreta qué hecho respalda el Certify y cuál es su alcance." },
    en: { title: "Describe the certified fact", body: "Explain clearly which fact Certify supports and its scope." },
    pt: { title: "Descreva o fato certificado", body: "Explique claramente qual fato o Certify respalda e qual é o seu alcance." },
  },
  certify_evidence_required: {
    es: { title: "Falta adjuntar evidencia", body: "Agrega el archivo sintético de práctica que respalda la descripción antes de confirmar Certify." },
    en: { title: "Evidence is missing", body: "Attach the synthetic practice file supporting the description before confirming Certify." },
    pt: { title: "Falta anexar evidência", body: "Anexe o arquivo sintético de prática que respalda a descrição antes de confirmar Certify." },
  },
  certify_credential_required: {
    es: { title: "Prepara la credencial del certificador", body: "Usa únicamente la credencial sintética de práctica. El actor que ejecuta Certify es quien firma y consume su voucher." },
    en: { title: "Prepare the certifier credential", body: "Use only the synthetic practice credential. The actor performing Certify signs and consumes their voucher." },
    pt: { title: "Prepare a credencial do certificador", body: "Use somente a credencial sintética de prática. O ator que executa Certify assina e consome seu voucher." },
  },
  certify_confirmation_required: {
    es: { title: "Falta la confirmación final de Certify", body: "Confirma el registro sintético después de revisar descripción, evidencia, actor y voucher." },
    en: { title: "Final Certify confirmation is missing", body: "Confirm the synthetic registration after reviewing description, evidence, actor, and voucher." },
    pt: { title: "Falta a confirmação final do Certify", body: "Confirme o registro sintético depois de revisar descrição, evidência, ator e voucher." },
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
  transfer_recipient_required: {
    es: { title: "Verifica el destinatario", body: "Confirma que el usuario o wallet de práctica sea el destino correcto antes de transferir la titularidad." },
    en: { title: "Verify the recipient", body: "Confirm that the practice user or wallet is the correct destination before transferring ownership." },
    pt: { title: "Verifique o destinatário", body: "Confirme que o usuário ou wallet de prática seja o destino correto antes de transferir a titularidade." },
  },
  transfer_external_warning_required: {
    es: { title: "Acepta el límite de wallet externa", body: "Fuera de Atelier la información permanece en blockchain/IPFS, pero la obra deja de gestionarse desde esa cuenta de Atelier." },
    en: { title: "Accept the external-wallet boundary", body: "Outside Atelier, information remains on blockchain/IPFS, but the artwork is no longer managed from that Atelier account." },
    pt: { title: "Aceite o limite da wallet externa", body: "Fora do Atelier, a informação permanece em blockchain/IPFS, mas a obra deixa de ser gerenciada por essa conta Atelier." },
  },
  transfer_confirmation_required: {
    es: { title: "Falta la firma simulada", body: "Confirma la firma de wallet de práctica. La demo no recibe credenciales ni ejecuta la transferencia real." },
    en: { title: "Simulated signature is missing", body: "Confirm the practice wallet signature. The demo receives no credentials and performs no real transfer." },
    pt: { title: "Falta a assinatura simulada", body: "Confirme a assinatura da wallet de prática. A demo não recebe credenciais nem executa a transferência real." },
  },
  privacy_artwork_required: {
    es: { title: "Primero necesitas una obra", body: "La privacidad se administra sobre una obra propia. Precarga la obra de práctica antes de configurar su visibilidad." },
    en: { title: "You need an artwork first", body: "Privacy is managed on an owned artwork. Preload the practice artwork before configuring visibility." },
    pt: { title: "Primeiro você precisa de uma obra", body: "A privacidade é gerenciada sobre uma obra própria. Pré-carregue a obra de prática antes de configurar a visibilidade." },
  },
  privacy_confirmation_required: {
    es: { title: "Falta la confirmación del owner", body: "Revisa la comparación owner/visitante y confirma conscientemente qué quedará público." },
    en: { title: "Owner confirmation is missing", body: "Review the owner/visitor comparison and consciously confirm what will remain public." },
    pt: { title: "Falta a confirmação do owner", body: "Revise a comparação owner/visitante e confirme conscientemente o que ficará público." },
  },
  voucher_confirmation_required: {
    es: { title: "Falta confirmar la acreditación simulada", body: "Revisa el producto, el precio fechado y los vouchers de práctica que se agregarán. No se realiza una compra real." },
    en: { title: "Simulated credit confirmation is missing", body: "Review the product, dated price, and practice vouchers that will be added. No real purchase is made." },
    pt: { title: "Falta confirmar o crédito simulado", body: "Revise o produto, o preço datado e os vouchers de prática que serão adicionados. Nenhuma compra real é feita." },
  },
};

const certifyActors: Record<CertifyActorId, Record<Language, { name: string; description: string }>> = {
  owner_artist: {
    es: { name: "Owner/artista de práctica", description: "Declara un hecho propio sobre la obra." },
    en: { name: "Practice owner/artist", description: "Declares a first-party fact about the artwork." },
    pt: { name: "Owner/artista de prática", description: "Declara um fato próprio sobre a obra." },
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
    es: { name: "Owner/artista de práctica", description: "Registra una obra propia previamente revisada." },
    en: { name: "Practice owner/artist", description: "Registers a reviewed artwork they own." },
    pt: { name: "Owner/artista de prática", description: "Registra uma obra própria previamente revisada." },
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
    es: { name: "Owner/artista de práctica", description: "Solicita y completa la vinculación de su obra dentro de la práctica." },
    en: { name: "Practice owner/artist", description: "Requests and completes the artwork link inside the practice flow." },
    pt: { name: "Owner/artista de prática", description: "Solicita e conclui a vinculação da obra no fluxo de prática." },
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

const transferDestinations: Record<TransferDestinationType, Record<Language, { name: string; description: string }>> = {
  tokenizart_user: {
    es: { name: "Usuario Tokenizart", description: "La obra pasa a otro usuario y permanece gestionable dentro de Atelier." },
    en: { name: "Tokenizart user", description: "The artwork moves to another user and remains manageable inside Atelier." },
    pt: { name: "Usuário Tokenizart", description: "A obra passa para outro usuário e continua gerenciável no Atelier." },
  },
  external_wallet: {
    es: { name: "Wallet externa", description: "La titularidad sale del entorno gestionable por la cuenta de Atelier." },
    en: { name: "External wallet", description: "Ownership leaves the environment managed by the Atelier account." },
    pt: { name: "Wallet externa", description: "A titularidade sai do ambiente gerenciado pela conta Atelier." },
  },
};

const privacyCertifyIds: PrivacyCertifyId[] = ["authenticity", "exhibition", "condition"];

const voucherProducts: Record<VoucherProductId, Record<Language, { name: string; description: string }> & { priceUsd: number; credited: VoucherBalanceValues }> = {
  starter_kit: {
    priceUsd: 20,
    credited: { mint: 1, certify: 2, nfc: 0 },
    es: { name: "Starter Kit", description: "1 Voucher Mint, 2 Vouchers Certify y Toolbox con chip NFC, etiqueta VOID e instrucciones." },
    en: { name: "Starter Kit", description: "1 Mint Voucher, 2 Certify Vouchers, and a Toolbox with NFC chip, VOID label, and instructions." },
    pt: { name: "Starter Kit", description: "1 Voucher Mint, 2 Vouchers Certify e Toolbox com chip NFC, etiqueta VOID e instruções." },
  },
  mint: {
    priceUsd: 8,
    credited: { mint: 1, certify: 0, nfc: 0 },
    es: { name: "Voucher Mint", description: "Habilita una operación Mint individual; el lote requiere uno por obra." },
    en: { name: "Mint Voucher", description: "Enables one individual Mint operation; a batch requires one per artwork." },
    pt: { name: "Voucher Mint", description: "Habilita uma operação Mint individual; o lote exige um por obra." },
  },
  certify: {
    priceUsd: 8,
    credited: { mint: 0, certify: 1, nfc: 0 },
    es: { name: "Voucher Certify", description: "Lo consume el actor que ejecuta y firma la certificación." },
    en: { name: "Certify Voucher", description: "Consumed by the actor who executes and signs the certification." },
    pt: { name: "Voucher Certify", description: "Consumido pelo ator que executa e assina a certificação." },
  },
  nfc: {
    priceUsd: 10,
    credited: { mint: 0, certify: 0, nfc: 1 },
    es: { name: "Voucher Chip", description: "Corresponde al flujo de vinculación NFC; no es el chip físico por sí solo." },
    en: { name: "Chip Voucher", description: "Applies to the NFC linking flow; it is not the physical chip by itself." },
    pt: { name: "Voucher Chip", description: "Corresponde ao fluxo de vinculação NFC; não é apenas o chip físico." },
  },
};
const voucherProductIds: VoucherProductId[] = ["starter_kit", "mint", "certify", "nfc"];

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

const adaptivePracticeCopy = {
  es: {
    accessCredential: "Acceso a Atelier",
    accessCredentialHelp: "Permite entrar a la cuenta de usuario.",
    walletCredential: "Autorización de wallet",
    walletCredentialHelp: "Confirma acciones blockchain dentro del flujo guiado.",
    publicAddress: "Dirección pública",
    publicAddressHelp: "Se puede usar para identificar la wallet y recibir activos.",
    privateCredential: "Clave privada",
    privateCredentialHelp: "Es secreta: no se comparte ni se pega en el chat.",
    browserStorageOff: "No guardar en el navegador",
    copiedSafely: "Datos de recuperación guardados fuera del chat",
    selectedArtwork: "Obra seleccionada",
    mintVoucher: "Voucher Mint disponible",
    waitingBlockchain: "Confirmación blockchain en curso",
    mintReceipt: "Comprobante Mint simulado",
    mintedStatus: "La obra ya muestra identidad digital",
    toolboxReady: "Toolbox de práctica preparado",
    mobileReady: "Móvil compatible y app Tokenizart listos",
    nfcRequest: "Solicitud de vinculación NFC",
    pendingRequest: "Solicitud pendiente de revisión",
    mobileApp: "Aplicación móvil Tokenizart",
    nfcVoucher: "Voucher NFC disponible",
    nfcReceipt: "Comprobante NFC simulado",
  },
  en: {
    accessCredential: "Atelier access",
    accessCredentialHelp: "Lets the user sign in to their account.",
    walletCredential: "Wallet authorization",
    walletCredentialHelp: "Confirms blockchain actions inside the guided flow.",
    publicAddress: "Public address",
    publicAddressHelp: "It can identify the wallet and receive assets.",
    privateCredential: "Private key",
    privateCredentialHelp: "It is secret: never share it or paste it into chat.",
    browserStorageOff: "Do not save in the browser",
    copiedSafely: "Recovery data stored outside the chat",
    selectedArtwork: "Selected artwork",
    mintVoucher: "Available Mint voucher",
    waitingBlockchain: "Blockchain confirmation in progress",
    mintReceipt: "Simulated Mint receipt",
    mintedStatus: "The artwork now shows a digital identity",
    toolboxReady: "Practice Toolbox ready",
    mobileReady: "Compatible phone and Tokenizart app ready",
    nfcRequest: "NFC linking request",
    pendingRequest: "Request awaiting review",
    mobileApp: "Tokenizart mobile app",
    nfcVoucher: "Available NFC voucher",
    nfcReceipt: "Simulated NFC receipt",
  },
  pt: {
    accessCredential: "Acesso ao Atelier",
    accessCredentialHelp: "Permite entrar na conta do usuário.",
    walletCredential: "Autorização da wallet",
    walletCredentialHelp: "Confirma ações blockchain dentro do fluxo guiado.",
    publicAddress: "Endereço público",
    publicAddressHelp: "Pode identificar a wallet e receber ativos.",
    privateCredential: "Chave privada",
    privateCredentialHelp: "É secreta: nunca compartilhe nem cole no chat.",
    browserStorageOff: "Não salvar no navegador",
    copiedSafely: "Dados de recuperação guardados fora do chat",
    selectedArtwork: "Obra selecionada",
    mintVoucher: "Voucher Mint disponível",
    waitingBlockchain: "Confirmação blockchain em andamento",
    mintReceipt: "Comprovante Mint simulado",
    mintedStatus: "A obra agora mostra uma identidade digital",
    toolboxReady: "Toolbox de prática preparado",
    mobileReady: "Celular compatível e app Tokenizart prontos",
    nfcRequest: "Solicitação de vinculação NFC",
    pendingRequest: "Solicitação aguardando revisão",
    mobileApp: "Aplicativo móvel Tokenizart",
    nfcVoucher: "Voucher NFC disponível",
    nfcReceipt: "Comprovante NFC simulado",
  },
} satisfies Record<Language, Record<string, string>>;

function PracticeContextCard({ icon: Icon, title, body, tone = "" }: { icon: typeof Blocks; title: string; body: string; tone?: string }) {
  return <div className={`practice-context-card ${tone}`.trim()}><Icon size={24} /><span><strong>{title}</strong><small>{body}</small></span></div>;
}

type PracticeOption = { id: string; label: string; description: string; count?: number };

function PracticeOptionSelector({ legend, options, initialId, onChange }: { legend: string; options: PracticeOption[]; initialId: string; onChange?: (optionId: string) => void }) {
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  return (
    <fieldset data-practice-action className="practice-option-selector">
      <legend>{legend}</legend>
      <div className="practice-option-grid">
        {options.map((option) => <button type="button" key={option.id} className={selected.id === option.id ? "selected" : ""} aria-pressed={selected.id === option.id} onClick={() => { setSelectedId(option.id); onChange?.(option.id); }}><ListFilter size={17} /><span>{option.label}</span>{typeof option.count === "number" && <b>{option.count}</b>}</button>)}
      </div>
      <div className="practice-selection-result"><Route size={22} /><span><strong>{selected.label}</strong><small>{selected.description}</small></span>{typeof selected.count === "number" && <b>{selected.count}</b>}</div>
    </fieldset>
  );
}

function AtelierNavigationPractice({ context, step, onPracticeSelection }: { context: DemoContext; step: ManualStep; onPracticeSelection: (selectionId: string) => void }) {
  const lang = context.language;
  const t = ui[lang];
  const copy = step.copy[lang];
  const steps = manualContract.flows.atelier_navigation.steps;
  const option = (order: number, count: number): PracticeOption => {
    const source = steps[order - 1];
    return { id: source.step_id, label: source.copy[lang].title, description: source.copy[lang].body, count };
  };
  const sectionCopy = {
    es: { mode: "Elegir una vista de práctica", menu: "Secciones principales", own: "Filtros de Obras Propias", managed: "Filtros de Obras Gestionadas", received: "Estados de Certificaciones Recibidas", requested: "Estados de Certificaciones Solicitadas", synthetic: "Datos sintéticos de navegación", ownerOnly: "Disponible para el usuario autenticado" },
    en: { mode: "Choose a practice view", menu: "Main sections", own: "Own Artwork filters", managed: "Managed Artwork filters", received: "Received Certification states", requested: "Requested Certification states", synthetic: "Synthetic navigation data", ownerOnly: "Available to the authenticated user" },
    pt: { mode: "Escolher uma vista de prática", menu: "Seções principais", own: "Filtros de Obras Próprias", managed: "Filtros de Obras Gerenciadas", received: "Estados de Certificações Recebidas", requested: "Estados de Certificações Solicitadas", synthetic: "Dados sintéticos de navegação", ownerOnly: "Disponível para o usuário autenticado" },
  }[lang];

  if (step.order === 1) return <div className="practice-fields navigation-practice"><PracticeContextCard icon={Route} title={copy.title} body={copy.body} /><div className="navigation-path"><span>Gallery</span><ArrowRight size={16} /><span>{sectionCopy.ownerOnly}</span><ArrowRight size={16} /><span>{t.simulated}</span></div></div>;
  if (step.order === 2 || step.order === 3) {
    const options = [option(2, 12), option(3, 8)];
    return <div className="practice-fields navigation-practice"><PracticeOptionSelector key={step.step_id} legend={sectionCopy.mode} options={options} initialId={step.step_id} onChange={onPracticeSelection} /><div className="safety-note"><ShieldCheck size={18} />{sectionCopy.synthetic}</div></div>;
  }
  if (step.order === 4) return <div className="practice-fields navigation-practice"><PracticeContextCard icon={UserRoundPlus} title={copy.title} body={copy.body} /><div className="navigation-path"><span>{steps[2].copy[lang].title}</span><ArrowRight size={16} /><strong>{copy.title}</strong></div></div>;
  if (step.order === 5) {
    const menuItems = [steps[5], steps[10], steps[14], steps[18], steps[20], steps[21]];
    return <div className="practice-fields navigation-practice"><h3 className="practice-section-title">{sectionCopy.menu}</h3><div className="navigation-menu-grid">{menuItems.map((item) => <div key={item.step_id}><Route size={19} /><span><strong>{item.copy[lang].title}</strong><small>{sectionCopy.ownerOnly}</small></span></div>)}</div></div>;
  }
  if (step.order >= 6 && step.order <= 10) {
    const options = [option(6, 8), option(7, 5), option(8, 3), option(9, 4), option(10, 2)];
    return <div className="practice-fields navigation-practice"><PracticeOptionSelector key={step.step_id} legend={sectionCopy.own} options={options} initialId={step.step_id} onChange={onPracticeSelection} /></div>;
  }
  if (step.order >= 11 && step.order <= 14) {
    const options = [option(11, 4), option(12, 2), option(13, 3), option(14, 1)];
    return <div className="practice-fields navigation-practice"><PracticeOptionSelector key={step.step_id} legend={sectionCopy.managed} options={options} initialId={step.step_id} onChange={onPracticeSelection} /></div>;
  }
  if (step.order >= 15 && step.order <= 18) {
    const options = [option(15, 3), option(16, 2), option(17, 7), option(18, 1)];
    return <div className="practice-fields navigation-practice"><PracticeOptionSelector key={step.step_id} legend={sectionCopy.received} options={options} initialId={step.step_id} onChange={onPracticeSelection} /></div>;
  }
  if (step.order >= 19 && step.order <= 20) {
    const options = [option(19, 2), option(20, 6)];
    return <div className="practice-fields navigation-practice"><PracticeOptionSelector key={step.step_id} legend={sectionCopy.requested} options={options} initialId={step.step_id} onChange={onPracticeSelection} /></div>;
  }
  return <div className="practice-fields navigation-practice"><PracticeContextCard icon={step.order === 21 ? Users : UserRoundPlus} title={copy.title} body={copy.body} /><div className="directory-preview"><Users size={22} /><span><strong>{copy.title}</strong><small>{sectionCopy.synthetic} · 3</small></span><Search size={20} /></div></div>;
}

function GalleryTraceabilityPractice({ context, step, onPracticeSelection }: { context: DemoContext; step: ManualStep; onPracticeSelection: (selectionId: string) => void }) {
  const lang = context.language;
  const copy = step.copy[lang];
  const artwork = context.world.artwork;
  const steps = manualContract.flows.public_gallery_traceability.steps;
  const c = {
    es: { publicCard: "Tarjeta pública de práctica", visibleByOwner: "Visible porque el owner decidió publicarlo", endpoints: "Elegir una referencia pública", publicBoundary: "Estos recursos son públicos solo mientras el owner exponga la obra y esos datos en Gallery.", technical: "Ficha pública", statuses: "Estados visibles", certify: "Certify públicos", simulated: "Referencia sintética" },
    en: { publicCard: "Public practice card", visibleByOwner: "Visible because the owner chose to publish it", endpoints: "Choose a public reference", publicBoundary: "These resources are public only while the owner exposes the artwork and those fields in Gallery.", technical: "Public details", statuses: "Visible states", certify: "Public Certify records", simulated: "Synthetic reference" },
    pt: { publicCard: "Cartão público de prática", visibleByOwner: "Visível porque o owner decidiu publicá-lo", endpoints: "Escolher uma referência pública", publicBoundary: "Estes recursos são públicos somente enquanto o owner expõe a obra e esses dados na Gallery.", technical: "Ficha pública", statuses: "Estados visíveis", certify: "Certify públicos", simulated: "Referência sintética" },
  }[lang];
  const endpointRefs: Record<number, { icon: typeof Blocks; label: string; value: string }> = {
    5: { icon: FileCheck2, label: steps[4].copy[lang].title, value: "bafy...metadata-demo-255" },
    6: { icon: ImageIcon, label: steps[5].copy[lang].title, value: "bafy...image-demo-255" },
    7: { icon: Fingerprint, label: steps[6].copy[lang].title, value: "TOKEN-DEMO-255" },
    8: { icon: BadgeCheck, label: steps[7].copy[lang].title, value: "TX-DEMO-ARTWORK-255" },
    9: { icon: Route, label: steps[8].copy[lang].title, value: "Transfer(DEMO_FROM, DEMO_TO, 255)" },
    11: { icon: FileCheck2, label: steps[10].copy[lang].title, value: "bafy...certify-evidence-demo" },
    12: { icon: FileCheck2, label: steps[11].copy[lang].title, value: "bafy...certify-document-demo" },
    13: { icon: BadgeCheck, label: steps[12].copy[lang].title, value: "TX-DEMO-CERTIFY-004" },
  };

  if (step.order === 1) return <div className="practice-fields gallery-practice"><div className="gallery-public-card"><ImageIcon size={30} /><span><strong>{artwork.title}</strong><small>{artwork.author} · {c.publicCard}</small></span><b>Gallery</b></div><div className="safety-note"><Eye size={18} />{c.visibleByOwner}</div></div>;
  if (step.order === 2) return <div className="practice-fields gallery-practice"><h3 className="practice-section-title">{c.statuses}</h3><div className="gallery-status-grid"><span><ImageIcon size={18} />Precargada</span><span><Fingerprint size={18} />Mint</span><span><BadgeCheck size={18} />Certify</span><span><Tag size={18} />NFC</span></div></div>;
  if (step.order === 3) return <div className="practice-fields gallery-practice"><PracticeContextCard icon={GalleryHorizontalEnd} title={c.technical} body={copy.body} /><dl className="gallery-facts"><div><dt>Autor</dt><dd>{artwork.author}</dd></div><div><dt>Técnica</dt><dd>{artwork.technique[lang]} · {artwork.support[lang]}</dd></div><div><dt>Medidas</dt><dd>{artwork.widthCm} × {artwork.heightCm} cm</dd></div><div><dt>Token ID</dt><dd>DEMO-255</dd></div></dl></div>;
  if (step.order === 4) {
    const options = [5, 6, 7, 8].map((order) => ({ id: steps[order - 1].step_id, label: steps[order - 1].copy[lang].title, description: steps[order - 1].copy[lang].body }));
    return <div className="practice-fields gallery-practice"><PracticeOptionSelector key={step.step_id} legend={c.endpoints} options={options} initialId={options[0].id} onChange={onPracticeSelection} /><div className="safety-note"><Globe2 size={18} />{c.publicBoundary}</div></div>;
  }
  if (step.order === 10) return <div className="practice-fields gallery-practice"><h3 className="practice-section-title">{c.certify}</h3><div className="gallery-certify-grid"><div><BadgeCheck size={19} /><span><strong>Autenticidad</strong><small>CERT-DEMO-001</small></span></div><div><BadgeCheck size={19} /><span><strong>Exhibición</strong><small>CERT-DEMO-002</small></span></div><div><BadgeCheck size={19} /><span><strong>Estado</strong><small>CERT-DEMO-003</small></span></div></div><div className="safety-note"><Eye size={18} />{c.publicBoundary}</div></div>;
  const endpoint = endpointRefs[step.order];
  if (endpoint) {
    const EndpointIcon = endpoint.icon;
    return <div className="practice-fields gallery-practice"><div className="gallery-endpoint-card"><EndpointIcon size={26} /><span><strong>{endpoint.label}</strong><small>{c.simulated}</small><code>{endpoint.value}</code></span><ExternalLink size={19} /></div><PracticeContextCard icon={ShieldCheck} title={copy.title} body={copy.body} /><div className="safety-note"><Globe2 size={18} />{c.publicBoundary}</div></div>;
  }
  return <div className="practice-fields gallery-practice"><PracticeContextCard icon={GalleryHorizontalEnd} title={copy.title} body={copy.body} /></div>;
}

function ActionOverviewPractice({ context, step }: { context: DemoContext; step: ManualStep }) {
  const lang = context.language;
  const copy = step.copy[lang];
  const flowByAction: Record<string, string> = {
    "atelier_action.load": "carga_obra",
    "atelier_action.mint": "mint",
    "atelier_action.chip": "chip",
    "atelier_action.certify": "certify",
    "atelier_action.transfer": "transferencia",
    "atelier_action.privacy": "privacy",
  };
  const relation = {
    es: {
      "atelier_action.load": "Punto de partida: prepara información e imágenes antes de Mint.",
      "atelier_action.mint": "Crea identidad digital después de revisar la obra cargada.",
      "atelier_action.chip": "Conecta el objeto físico con su identidad digital cuando aporta valor.",
      "atelier_action.certify": "Suma evidencia y hechos verificables a una obra con identidad digital.",
      "atelier_action.transfer": "Traslada titularidad registrada; no es una venta automática.",
      "atelier_action.privacy": "El owner decide qué información expone y qué conserva en Nivel 4.",
    },
    en: {
      "atelier_action.load": "Starting point: prepare information and images before Mint.",
      "atelier_action.mint": "Creates digital identity after reviewing the loaded artwork.",
      "atelier_action.chip": "Connects the physical object to its digital identity when useful.",
      "atelier_action.certify": "Adds evidence and verifiable events to an artwork with digital identity.",
      "atelier_action.transfer": "Moves registered ownership; it is not an automated sale.",
      "atelier_action.privacy": "The owner decides what to expose and what stays in Level 4.",
    },
    pt: {
      "atelier_action.load": "Ponto de partida: prepare informações e imagens antes do Mint.",
      "atelier_action.mint": "Cria identidade digital depois de revisar a obra carregada.",
      "atelier_action.chip": "Conecta o objeto físico à identidade digital quando agrega valor.",
      "atelier_action.certify": "Adiciona evidências e fatos verificáveis à obra com identidade digital.",
      "atelier_action.transfer": "Transfere titularidade registrada; não é uma venda automática.",
      "atelier_action.privacy": "O owner decide o que expõe e o que conserva no Nível 4.",
    },
  }[lang];
  return <div className="practice-fields action-overview-practice"><div className="action-sequence">{manualContract.flows.action_overview.steps.map((item) => <div key={item.step_id} className={item.step_id === step.step_id ? "active" : ""}><FlowIconMark flowId={flowByAction[item.step_id]} size={18} /><span>{item.copy[lang].title}</span></div>)}</div><PracticeContextCard icon={Blocks} title={copy.title} body={copy.body} /><div className="practice-selection-result"><Route size={22} /><span><strong>{copy.title}</strong><small>{relation[step.step_id as keyof typeof relation]}</small></span></div></div>;
}

function PracticeFields({ context, step, send, onPracticeSelection }: { context: DemoContext; step: ManualStep; send: (event: any) => void; onPracticeSelection: (selectionId: string) => void }) {
  const lang = context.language;
  const t = ui[lang];
  const stepCopy = step.copy[lang];
  const p = adaptivePracticeCopy[lang];

  if (context.flow === "atelier_navigation") return <AtelierNavigationPractice context={context} step={step} onPracticeSelection={onPracticeSelection} />;
  if (context.flow === "public_gallery_traceability") return <GalleryTraceabilityPractice context={context} step={step} onPracticeSelection={onPracticeSelection} />;
  if (context.flow === "action_overview") return <ActionOverviewPractice context={context} step={step} />;

  if (context.flow === "onboarding") {
    const isAccess = step.order <= 3;
    const isRegistration = step.order >= 4 && step.order <= 5;
    const isActivation = step.order >= 6 && step.order <= 8;
    const isProfile = step.order >= 9;
    return (
      <div className="practice-fields">
        {isAccess && <label>{t.emailLabel}<input value="visitante.demo@ejemplo.test" readOnly /></label>}
        {isRegistration && <div className="practice-context-card"><UserRoundPlus size={24} /><span><strong>{stepCopy.title}</strong><small>{stepCopy.body}</small></span></div>}
        {isActivation && <div className="fake-mail"><BadgeCheck size={22} /><span><strong>Tokenizart Atelier</strong><small>Activación simulada · código 482 731</small></span></div>}
        {isProfile && <div className="practice-context-card success"><BadgeCheck size={24} /><span><strong>{stepCopy.title}</strong><small>{stepCopy.body}</small></span></div>}
        {(step.order === 6 || step.order === 7) && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "email_not_received" })}><CircleAlert size={17} />{t.errorPractice}</button>}
      </div>
    );
  }

  if (context.flow === "account_wallet") {
    const order = step.order;
    return (
      <div className="practice-fields wallet-practice">
        {order === 1 && <PracticeContextCard icon={WalletCards} title={stepCopy.title} body={stepCopy.body} />}
        {order === 2 && <div className="credential-simulation"><KeyRound size={24} /><span><strong>••••••••••••</strong><small>{stepCopy.body}</small></span><ShieldCheck size={20} /></div>}
        {order === 2 && <button data-practice-action className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "wrong_wallet_password" })}><CircleAlert size={17} />{t.errorPractice}</button>}
        {order === 3 && <PracticeContextCard icon={ShieldCheck} title={p.browserStorageOff} body={stepCopy.body} tone="success" />}
        {order === 4 && <div className="practice-comparison">
          <article><UserRoundPlus size={21} /><strong>{p.accessCredential}</strong><small>{p.accessCredentialHelp}</small></article>
          <article><KeyRound size={21} /><strong>{p.walletCredential}</strong><small>{p.walletCredentialHelp}</small></article>
        </div>}
        {order === 5 && <div className="practice-comparison">
          <article><WalletCards size={21} /><strong>{p.publicAddress}</strong><small>0xD3m0...8A71 · {p.publicAddressHelp}</small></article>
          <article className="private"><ShieldCheck size={21} /><strong>{p.privateCredential}</strong><small>{p.privateCredentialHelp}</small></article>
        </div>}
        {order === 6 && <><div className="wallet-preview"><KeyRound size={26} /><span><strong>Smart Wallet · {t.simulated}</strong><small>0xD3m0...8A71 · {p.publicAddress}</small></span><ShieldCheck size={22} /></div><div className="safety-note"><ShieldCheck size={18} />{t.noSecrets}</div></>}
        {order === 7 && <div className="credential-simulation success"><Check size={24} /><span><strong>{p.copiedSafely}</strong><small>{stepCopy.body}</small></span></div>}
        {order === 8 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
        {order === 9 && <PracticeContextCard icon={UserRoundPlus} title={stepCopy.title} body={stepCopy.body} />}
      </div>
    );
  }

  if (context.flow === "carga_obra") {
    const isStart = step.order <= 3;
    const isIdentity = step.order >= 4 && step.order <= 7;
    const isImages = step.order >= 8 && step.order <= 9;
    const isTechnicalSheet = step.order >= 10 && step.order <= 14;
    const isReview = step.order >= 15 && step.order <= 19;
    const isManaged = step.order >= 20;
    return (
      <div className="practice-fields artwork-form">
        {isStart && <PracticeContextCard icon={ImageIcon} title={context.world.artwork.title} body={stepCopy.body} />}
        {isIdentity && <div className="practice-receipt"><FileCheck2 size={24} /><span><strong>{context.world.artwork.title}</strong><small>{context.world.artwork.author} · {context.world.artwork.countryName[lang]}</small></span></div>}
        {isImages && <div className="upload-simulation"><ImageIcon size={24} /><span><strong>3 imágenes de práctica</strong><small>Frente · reverso/firma · detalle</small></span><Check size={20} /></div>}
        {isTechnicalSheet && <div className="practice-context-card"><FileCheck2 size={24} /><span><strong>{stepCopy.title}</strong><small>{context.world.artwork.technique[lang]} · {context.world.artwork.widthCm} × {context.world.artwork.heightCm} cm</small></span></div>}
        {isReview && <div className="practice-context-card success"><PackageCheck size={24} /><span><strong>{context.world.artwork.title}</strong><small>{stepCopy.body}</small></span></div>}
        {isManaged && <div className="practice-context-card managed"><UserRoundPlus size={24} /><span><strong>{stepCopy.title}</strong><small>{stepCopy.body}</small></span></div>}
        <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "missing_required_field" })}><CircleAlert size={17} />{t.errorPractice}</button>
      </div>
    );
  }

  if (context.flow === "vouchers") {
    return <VoucherPractice context={context} step={step} send={send} onPracticeSelection={onPracticeSelection} />;
  }

  if (context.flow === "privacy") {
    const draft = context.world.privacyDraft;
    const completed = context.world.events.includes("privacy.completed");
    const audience = draft.previewAudience;
    const effectivePublicCertify = draft.galleryVisible
      ? privacyCertifyIds.filter((id) => draft.certifyVisibility[id])
      : [];
    const privacyPreview = (
      <div className={`privacy-preview ${audience}`} data-testid="privacy-preview">
        <div className="privacy-preview-heading"><ImageIcon size={25} /><span><strong>{context.world.artwork.title}</strong><small>{audience === "owner" ? t.privacyOwnerView : t.privacyVisitorView}</small></span><b>{audience === "owner" ? "Nivel 4" : "Nivel 5"}</b></div>
        {audience === "visitor" && !draft.galleryVisible ? (
          <div className="privacy-hidden"><Eye size={24} /><strong>{t.privacyArtworkHidden}</strong><small>{t.privacyHiddenHelp}</small></div>
        ) : (
          <>
            {(audience === "owner" || draft.technicalSheetVisible) && <div className="privacy-technical"><strong>{t.privacyTechnicalSheet}</strong><span>{context.world.artwork.author} · {context.world.artwork.widthCm} × {context.world.artwork.heightCm} cm · {t.simulated}</span></div>}
            <div className="privacy-certify-list">
              {privacyCertifyIds.filter((id) => audience === "owner" || effectivePublicCertify.includes(id)).map((id) => <div key={id}><BadgeCheck size={17} /><span>{certifyTypes[id][lang].name}</span><small>{draft.galleryVisible && draft.certifyVisibility[id] ? t.privacyPublicBadge : t.privacyOwnerBadge}</small></div>)}
              {audience === "visitor" && effectivePublicCertify.length === 0 && <p>{t.privacyNoPublicCertify}</p>}
            </div>
          </>
        )}
      </div>
    );
    return (
      <div className="practice-fields privacy-controls">
        {step.order === 1 && <><PracticeContextCard icon={ShieldCheck} title={stepCopy.title} body={stepCopy.body} /><div className="safety-note"><ShieldCheck size={18} />{t.privacySafety}</div></>}
        {step.order === 2 && <><PracticeContextCard icon={UserRoundPlus} title={stepCopy.title} body={stepCopy.body} />{privacyPreview}</>}
        {step.order === 3 && <><label data-practice-action className="privacy-toggle"><span><strong>{t.privacyGalleryToggle}</strong><small>{t.privacyGalleryHelp}</small></span><input type="checkbox" disabled={completed} checked={draft.galleryVisible} onChange={(event) => {
          send({ type: "SET_PRIVACY_DRAFT", galleryVisible: event.target.checked, ownerConfirmed: false });
          onPracticeSelection(`privacy_gallery:${event.target.checked ? "visible" : "hidden"}`);
        }} /></label>{privacyPreview}</>}
        {step.order === 4 && <><fieldset data-practice-action>
          <legend>{t.privacyCertifyControls}</legend>
          <div className="privacy-certify-controls">
            {privacyCertifyIds.map((id) => <label key={id}><span><strong>{certifyTypes[id][lang].name}</strong><small>{draft.certifyVisibility[id] ? t.privacyPublicBadge : t.privacyOwnerBadge}</small></span><input type="checkbox" disabled={completed || !draft.galleryVisible} checked={draft.certifyVisibility[id]} onChange={(event) => {
              send({ type: "SET_PRIVACY_DRAFT", certifyId: id, certifyVisible: event.target.checked, ownerConfirmed: false });
              onPracticeSelection(`privacy_certify:${id}.${event.target.checked ? "public" : "owner"}`);
            }} /></label>)}
          </div>
        </fieldset>{privacyPreview}</>}
        {step.order === 5 && <><fieldset data-practice-action>
          <legend>{t.privacyPreviewAs}</legend>
          <div className="visibility-selector">
            {(["owner", "visitor"] as PrivacyPreviewAudience[]).map((previewAudience) => <button type="button" key={previewAudience} className={audience === previewAudience ? "selected" : ""} onClick={() => {
              send({ type: "SET_PRIVACY_DRAFT", previewAudience });
              onPracticeSelection(`privacy_audience:${previewAudience}`);
            }}><Eye size={17} />{previewAudience === "owner" ? t.privacyOwnerView : t.privacyVisitorView}</button>)}
          </div>
        </fieldset>{privacyPreview}</>}
        {step.order === 6 && <>{privacyPreview}<label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.ownerConfirmed} onChange={(event) => send({ type: "SET_PRIVACY_DRAFT", ownerConfirmed: event.target.checked })} /><span>{t.confirmPrivacy}<small>{t.confirmPrivacyHelp}</small></span></label>{!completed && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "privacy_confirmation_required" })}><CircleAlert size={17} />{t.errorPractice}</button>}</>}
      </div>
    );
  }

  if (context.flow === "chip") {
    const draft = context.world.nfcDraft;
    const completed = context.world.events.includes("chip.completed");
    const selectedTag = nfcTagStates[draft.tagState][lang];
    const order = step.order;
    return (
      <div className="practice-fields nfc-config">
        {order === 1 && <PracticeContextCard icon={Nfc} title={stepCopy.title} body={stepCopy.body} />}
        {order === 2 && <PracticeContextCard icon={PackageCheck} title={p.toolboxReady} body={stepCopy.body} />}
        {order === 3 && <PracticeContextCard icon={Smartphone} title={p.mobileReady} body={stepCopy.body} tone="success" />}
        {order === 4 && <PracticeContextCard icon={ImageIcon} title={p.selectedArtwork} body={`${context.world.artwork.title} · ${stepCopy.body}`} />}
        {order === 5 && <PracticeContextCard icon={FileCheck2} title={stepCopy.title} body={stepCopy.body} />}
        {order === 6 && <fieldset data-practice-action>
          <legend>{t.nfcActor}</legend>
          <div className="actor-selector">
            {(Object.keys(nfcActors) as NfcActorId[]).map((actorId) => {
              const actor = nfcActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => {
                send({ type: "SET_NFC_DRAFT", actorId });
                onPracticeSelection(`nfc_actor:${actorId}`);
              }}><Nfc size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>}
        {order === 7 && <PracticeContextCard icon={Nfc} title={stepCopy.title} body={stepCopy.body} />}
        {order >= 8 && order <= 12 && <PracticeContextCard icon={order === 10 ? BadgeCheck : FileCheck2} title={order === 10 ? p.nfcRequest : order >= 11 ? p.pendingRequest : stepCopy.title} body={stepCopy.body} tone={order === 10 ? "success" : "request"} />}
        {order >= 13 && order <= 17 && <PracticeContextCard icon={Smartphone} title={order === 13 ? p.mobileApp : stepCopy.title} body={stepCopy.body} />}
        {order === 18 && <><div className="phone-simulation nfc-ready_to_link"><Nfc size={38} /><strong>Ready to link</strong><small>{stepCopy.body}</small></div><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.scanConfirmed} onChange={(event) => send({ type: "SET_NFC_DRAFT", tagState: "ready_to_link", scanConfirmed: event.target.checked })} /><span>{t.confirmNfcScan}<small>{t.nfcScanHelp}</small></span></label></>}
        {order >= 19 && order <= 20 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
        {order === 21 && <div className="transaction-preview"><TicketCheck size={25} /><span><strong>{p.nfcVoucher}: {context.world.vouchers.nfc}</strong><small>{context.world.artwork.title} · {stepCopy.body}</small></span></div>}
        {order === 22 && <label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_NFC_DRAFT", signatureConfirmed: event.target.checked })} /><span>{t.confirmNfcSignature}<small>{t.signatureHelp}</small></span></label>}
        {order === 23 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
        {order === 24 && <div className="practice-receipt"><FileCheck2 size={24} /><span><strong>{p.nfcReceipt}</strong><small>CERT-NFC-DEMO-001 · TX-DEMO-NFC-001</small></span></div>}
        {order === 25 && <div className="phone-simulation nfc-linked_artwork"><Nfc size={38} /><strong>{nfcTagStates.linked_artwork[lang].systemMessage}</strong><small>{stepCopy.body}</small></div>}
        {order === 26 && <fieldset data-practice-action>
          <legend>{t.nfcTagReading}</legend>
          <div className="nfc-state-selector">
            {(Object.keys(nfcTagStates) as NfcTagState[]).map((tagState) => {
              const tag = nfcTagStates[tagState][lang];
              return <button type="button" key={tagState} disabled={completed} className={draft.tagState === tagState ? "selected" : ""} onClick={() => {
                send({ type: "SET_NFC_DRAFT", tagState, scanConfirmed: false, signatureConfirmed: false });
                onPracticeSelection(`nfc_tag_state:${tagState}`);
              }}><Nfc size={17} /><span><strong>{tag.name}</strong><small>{tag.description}</small></span></button>;
            })}
          </div>
        </fieldset>}
        {order === 26 && <div className={`phone-simulation nfc-${draft.tagState}`}><Nfc size={38} /><strong>{selectedTag.systemMessage}</strong><small>{selectedTag.description}</small></div>}
      </div>
    );
  }

  if (context.flow === "certify") {
    const draft = context.world.certifyDraft;
    const completed = context.world.events.includes("certify.completed");
    const isArtworkSelection = step.order <= 2;
    const isActor = step.order === 3;
    const isType = step.order === 4;
    const isRequest = step.order >= 5 && step.order <= 9;
    const isEvidence = step.order >= 10 && step.order <= 11;
    const isRegistration = step.order >= 12;
    return (
      <div className="practice-fields certify-config">
        {isArtworkSelection && <div className="practice-context-card"><FileCheck2 size={24} /><span><strong>{context.world.artwork.title}</strong><small>{stepCopy.body}</small></span></div>}
        {isActor && <fieldset>
          <legend>{t.certifierRole}</legend>
          <div className="actor-selector">
            {(Object.keys(certifyActors) as CertifyActorId[]).map((actorId) => {
              const actor = certifyActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => {
                send({ type: "SET_CERTIFY_DRAFT", actorId });
                onPracticeSelection(`certify_actor:${actorId}`);
              }}><BadgeCheck size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>}
        {isType && <label>{t.certifyType}
          <select disabled={completed} value={draft.typeId} onChange={(event) => {
            const typeId = event.target.value as CertifyTypeId;
            send({ type: "SET_CERTIFY_DRAFT", typeId });
            onPracticeSelection(`certify_type:${typeId}`);
          }}>
            {(Object.keys(certifyTypes) as CertifyTypeId[]).map((typeId) => <option key={typeId} value={typeId}>{certifyTypes[typeId][lang].name}</option>)}
          </select>
        </label>}
        {(isType || step.order === 5) && <fieldset>
          <legend>{t.visibilityLabel}</legend>
          <div className="visibility-selector">
            <button type="button" disabled={completed} className={draft.visibility === "public" ? "selected" : ""} onClick={() => {
              send({ type: "SET_CERTIFY_DRAFT", visibility: "public" });
              onPracticeSelection("certify_visibility:public");
            }}><Eye size={17} />{t.publicVisibility}</button>
            <button type="button" disabled={completed} className={draft.visibility === "owner" ? "selected" : ""} onClick={() => {
              send({ type: "SET_CERTIFY_DRAFT", visibility: "owner" });
              onPracticeSelection("certify_visibility:owner");
            }}><ShieldCheck size={17} />{t.ownerVisibility}</button>
          </div>
        </fieldset>}
        {isRequest && <div className="practice-context-card request"><BadgeCheck size={24} /><span><strong>{stepCopy.title}</strong><small>{stepCopy.body}</small></span></div>}
        {isEvidence && <div className="evidence-preview"><FileCheck2 size={24} /><span><strong>{t.evidenceLabel}</strong><small>{certifyTypes[draft.typeId][lang].evidence}</small></span></div>}
        {isRegistration && <div className="transaction-preview"><Fingerprint size={25} /><span><strong>Certify {t.simulated}</strong><small>{context.world.artwork.title} · {t.voucherAvailable}: {context.world.vouchers.certify}</small></span></div>}
        {!completed && (step.order === 12 || step.order === 13) && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: context.world.vouchers.certify ? "wrong_wallet_password" : "missing_voucher" })}><CircleAlert size={17} />{t.errorPractice}</button>}
      </div>
    );
  }

  if (context.flow === "mint") {
    const draft = context.world.mintDraft;
    const completed = context.world.events.includes("mint.completed");
    const voucherRequirement = draft.mode === "batch" ? 2 : 1;
    const order = step.order;
    return (
      <div className="practice-fields mint-config">
        {order === 1 && <PracticeContextCard icon={ImageIcon} title={p.selectedArtwork} body={`${context.world.artwork.title} · ${stepCopy.body}`} />}
        {order === 2 && <><div className="mint-readiness"><strong>{t.reviewBeforeMint}</strong><span><Check size={16} />{t.artworkDataReady}</span><span><Check size={16} />{t.artworkImagesReady}</span><span><Check size={16} />{t.artworkVisibilityReady}</span></div><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.reviewConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", reviewConfirmed: event.target.checked })} /><span>{t.confirmReview}</span></label></>}
        {order === 3 && <fieldset data-practice-action>
          <legend>{t.mintActor}</legend>
          <div className="actor-selector">
            {(Object.keys(mintActors) as MintActorId[]).map((actorId) => {
              const actor = mintActors[actorId][lang];
              return <button type="button" key={actorId} disabled={completed} className={draft.actorId === actorId ? "selected" : ""} onClick={() => {
                send({ type: "SET_MINT_DRAFT", actorId });
                onPracticeSelection(`mint_actor:${actorId}`);
              }}><Fingerprint size={18} /><span><strong>{actor.name}</strong><small>{actor.description}</small></span></button>;
            })}
          </div>
        </fieldset>}
        {order === 4 && <div className="transaction-preview"><TicketCheck size={25} /><span><strong>{p.mintVoucher}: {context.world.vouchers.mint}</strong><small>{t.voucherCost}: {voucherRequirement} · {context.world.artwork.title}</small></span></div>}
        {order === 5 && <><PracticeContextCard icon={KeyRound} title={stepCopy.title} body={stepCopy.body} /><div className="safety-note"><ShieldCheck size={18} />{t.noSecrets}</div></>}
        {order === 6 && <label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", signatureConfirmed: event.target.checked })} /><span>{t.confirmSignature}<small>{t.signatureHelp}</small></span></label>}
        {order === 7 && <PracticeContextCard icon={RefreshCcw} title={p.waitingBlockchain} body={stepCopy.body} />}
        {order === 8 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
        {order === 9 && <div className="practice-receipt"><FileCheck2 size={24} /><span><strong>{p.mintReceipt}</strong><small>TX-DEMO-MINT-001 · IPFS-DEMO-001</small></span></div>}
        {order === 10 && <PracticeContextCard icon={Fingerprint} title={p.mintedStatus} body={stepCopy.body} tone="success" />}
        {order === 11 && <><PracticeContextCard icon={CircleAlert} title={stepCopy.title} body={stepCopy.body} tone="managed" /><button data-practice-action className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: context.world.vouchers.mint < voucherRequirement ? "missing_voucher" : "wrong_wallet_password" })}><CircleAlert size={17} />{t.errorPractice}</button></>}
        {order === 12 && <fieldset data-practice-action>
          <legend>{t.mintMode}</legend>
          <div className="mode-selector">
            {(Object.keys(mintModes) as MintMode[]).map((mode) => {
              const option = mintModes[mode][lang];
              return <button type="button" key={mode} disabled={completed} className={draft.mode === mode ? "selected" : ""} onClick={() => {
                send({ type: "SET_MINT_DRAFT", mode });
                onPracticeSelection(`mint_mode:${mode}`);
              }}><Blocks size={18} /><span><strong>{option.name}</strong><small>{option.description}</small></span></button>;
            })}
          </div>
        </fieldset>}
        {order === 13 && <><div className="mint-readiness"><strong>{stepCopy.title}</strong><span><Check size={16} />{t.artworkDataReady}</span><span><Check size={16} />{t.artworkImagesReady}</span><span><Check size={16} />{t.artworkVisibilityReady}</span></div><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.reviewConfirmed} onChange={(event) => send({ type: "SET_MINT_DRAFT", reviewConfirmed: event.target.checked })} /><span>{t.confirmReview}</span></label></>}
        {order === 14 && <div className="transaction-preview"><Fingerprint size={25} /><span><strong>Mint · {t.simulated}</strong><small>{draft.mode === "batch" ? t.mintBatch : t.mintSingle} · {t.voucherCost}: {voucherRequirement}</small></span></div>}
        {order === 15 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
      </div>
    );
  }

  if (context.flow === "transferencia") {
    const draft = context.world.transferDraft;
    const completed = context.world.events.includes("transferencia.completed");
    const external = draft.destinationType === "external_wallet";
    const order = step.order;
    return (
      <div className="practice-fields transfer-config">
        {order === 1 && <><PracticeContextCard icon={ImageIcon} title={p.selectedArtwork} body={`${context.world.artwork.title} · ${stepCopy.body}`} /><label>{t.transferCurrentOwner}<input value={`${context.world.artwork.ownerDisplayName} · ${context.world.currentOwnerRef}`} readOnly /></label></>}
        {order === 2 && <PracticeContextCard icon={ArrowRight} title={stepCopy.title} body={stepCopy.body} />}
        {order === 3 && <div className="practice-receipt"><FileCheck2 size={24} /><span><strong>{context.world.artwork.title}</strong><small>{context.world.artwork.author} · Token ID DEMO-255 · {context.world.artwork.widthCm} × {context.world.artwork.heightCm} cm</small></span></div>}
        {order === 4 && <fieldset data-practice-action>
          <legend>{t.transferDestination}</legend>
          <div className="mode-selector">
            {(Object.keys(transferDestinations) as TransferDestinationType[]).map((destinationType) => {
              const destination = transferDestinations[destinationType][lang];
              return <button type="button" key={destinationType} disabled={completed} className={draft.destinationType === destinationType ? "selected" : ""} onClick={() => {
                send({ type: "SET_TRANSFER_DRAFT", destinationType, recipientVerified: false, externalWarningAccepted: false, signatureConfirmed: false });
                onPracticeSelection(`transfer_destination:${destinationType}`);
              }}><ArrowRight size={18} /><span><strong>{destination.name}</strong><small>{destination.description}</small></span></button>;
            })}
          </div>
          <label>{external ? t.transferExternalWallet : t.transferRecipientEmail}<input value={external ? "0xEXTERNAL-DEMO-0001" : "coleccionista.demo@ejemplo.test"} readOnly /></label>
        </fieldset>}
        {order === 5 && <><div className="wallet-preview"><WalletCards size={24} /><span><strong>{external ? "0xEXTERNAL...0001" : "WALLET-DEMO-COLLECTOR"}</strong><small>{transferDestinations[draft.destinationType][lang].description}</small></span><Check size={18} /></div><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.recipientVerified} onChange={(event) => send({ type: "SET_TRANSFER_DRAFT", recipientVerified: event.target.checked })} /><span>{t.confirmTransferRecipient}<small>{t.transferVerifyHelp}</small></span></label></>}
        {order === 6 && <><PracticeContextCard icon={KeyRound} title={stepCopy.title} body={stepCopy.body} /><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.signatureConfirmed} onChange={(event) => send({ type: "SET_TRANSFER_DRAFT", signatureConfirmed: event.target.checked })} /><span>{t.confirmTransferSignature}<small>{t.signatureHelp}</small></span></label><div className="safety-note"><Tag size={18} />{t.transferNoVoucher}</div></>}
        {order === 7 && (external ? <label data-practice-action className="confirmation-check transfer-warning"><input type="checkbox" disabled={completed} checked={draft.externalWarningAccepted} onChange={(event) => send({ type: "SET_TRANSFER_DRAFT", externalWarningAccepted: event.target.checked })} /><span>{t.confirmExternalBoundary}<small>{t.externalBoundaryHelp}</small></span></label> : <PracticeContextCard icon={CircleAlert} title={stepCopy.title} body={stepCopy.body} tone="managed" />)}
        {order === 8 && <PracticeContextCard icon={BadgeCheck} title={stepCopy.title} body={stepCopy.body} tone="success" />}
        {order === 9 && <div className="practice-receipt"><Fingerprint size={24} /><span><strong>{stepCopy.title}</strong><small>TOKEN-DEMO-255 · NFT-DEMO-255</small></span></div>}
        {order === 10 && <div className="transaction-preview"><ArrowRight size={25} /><span><strong>{t.transferTitle} · {t.simulated}</strong><small>Token ID DEMO-255 · TX-DEMO-TRANSFER-001 · {t.vouchersConsumed}: 0</small></span></div>}
        {order === 11 && <><PracticeContextCard icon={CircleAlert} title={stepCopy.title} body={stepCopy.body} tone="managed" /><button data-practice-action className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "transfer_recipient_required" })}><CircleAlert size={17} />{t.errorPractice}</button></>}
        {order === 12 && <><PracticeContextCard icon={WalletCards} title={stepCopy.title} body={stepCopy.body} /><div className="safety-note"><ShieldCheck size={18} />{external ? t.externalBoundaryHelp : transferDestinations.tokenizart_user[lang].description}</div></>}
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

function TransferCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "transferencia" || !context.world.events.includes("transferencia.completed")) return null;
  const receipt = context.world.transferReceipts.at(-1);
  if (!receipt) return null;
  const lang = context.language;
  const t = ui[lang];
  const destination = transferDestinations[receipt.destinationType][lang];
  const management = receipt.atelierManagement === "inside_atelier" ? t.transferInsideAtelier : t.transferOutsideAtelier;
  const timeline = {
    es: ["Owner anterior", "Destino verificado", "Nuevo owner"],
    en: ["Previous owner", "Destination verified", "New owner"],
    pt: ["Owner anterior", "Destino verificado", "Novo owner"],
  }[lang];

  return (
    <section className="completion-result transfer-result" aria-live="polite">
      <div className="completion-heading"><ArrowRight size={28} /><div><strong>{t.transferCompleted}</strong><span>{receipt.receiptId}</span></div></div>
      <dl>
        <div><dt>{t.transferDestination}</dt><dd>{destination.name}</dd></div>
        <div><dt>{t.transferPreviousOwner}</dt><dd>{receipt.previousOwnerRef}</dd></div>
        <div><dt>{t.transferNewOwner}</dt><dd>{receipt.newOwnerRef}</dd></div>
        <div><dt>{t.transferDestinationWallet}</dt><dd>{receipt.destinationWalletRef}</dd></div>
        <div><dt>{t.transferManagement}</dt><dd>{management}</dd></div>
        <div><dt>{t.networkLabel}</dt><dd>Gnosis Chain · {t.simulated.toLowerCase()}</dd></div>
        <div><dt>{t.vouchersConsumed}</dt><dd>{receipt.vouchersConsumed}</dd></div>
        <div><dt>{t.tokenReference}</dt><dd>{receipt.tokenRef}</dd></div>
        <div><dt>{t.transactionReference}</dt><dd>{receipt.transactionRef}</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealTransfer}</p>
    </section>
  );
}

function PrivacyCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "privacy" || !context.world.events.includes("privacy.completed")) return null;
  const receipt = context.world.privacyReceipts.at(-1);
  if (!receipt) return null;
  const lang = context.language;
  const t = ui[lang];
  const timeline = {
    es: ["Owner conserva todo", "Política confirmada", "Vista pública calculada"],
    en: ["Owner keeps everything", "Policy confirmed", "Public view calculated"],
    pt: ["Owner mantém tudo", "Política confirmada", "Vista pública calculada"],
  }[lang];

  return (
    <section className="completion-result privacy-result" aria-live="polite">
      <div className="completion-heading"><Eye size={28} /><div><strong>{t.privacyCompleted}</strong><span>{receipt.receiptId}</span></div></div>
      <dl>
        <div><dt>{t.privacyGalleryToggle}</dt><dd>{receipt.galleryVisible ? t.privacyVisible : t.privacyHidden}</dd></div>
        <div><dt>{t.privacyTechnicalSheet}</dt><dd>{receipt.technicalSheetVisible ? t.privacyVisible : t.privacyHidden}</dd></div>
        <div><dt>{t.privacyPublicCertifyCount}</dt><dd>{receipt.publicCertifyIds.length}</dd></div>
        <div><dt>{t.privacyOwnerCertifyCount}</dt><dd>{receipt.ownerOnlyCertifyIds.length}</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealPrivacy}</p>
    </section>
  );
}

function VoucherPractice({ context, step, send, onPracticeSelection }: { context: DemoContext; step: ManualStep; send: (event: any) => void; onPracticeSelection: (selectionId: string) => void }) {
  const lang = context.language;
  const t = ui[lang];
  const draft = context.world.voucherDraft;
  const selected = voucherProducts[draft.productId];
  const completed = context.world.events.includes("vouchers.completed");
  const stepCopy = step.copy[lang];
  const consumers = [
    { label: "Mint", copy: t.voucherMintConsumer },
    { label: "Certify", copy: t.voucherCertifyConsumer },
    { label: "NFC", copy: t.voucherNfcConsumer },
    { label: t.transferTitle, copy: t.voucherTransferConsumer },
  ];

  return (
    <div className="practice-fields voucher-practice">
      {step.order === 1 && <><div className="voucher-explainer"><TicketCheck size={25} /><span><strong>{t.vouchersAreCredits}</strong><small>{t.vouchersNotGas}</small></span></div><section className="voucher-consumption compact">{consumers.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.copy}</span></div>)}</section></>}
      {step.order === 2 && <><PracticeContextCard icon={TicketCheck} title={stepCopy.title} body={stepCopy.body} /><VoucherBalances context={context} /></>}
      {step.order === 3 && <><div className="voucher-price-list">{voucherProductIds.map((productId) => { const product = voucherProducts[productId]; return <div key={productId}><span><strong>{product[lang].name}</strong><small>{product[lang].description}</small></span><b>USD {product.priceUsd.toFixed(2)}</b></div>; })}</div><div className="voucher-snapshot"><strong>{t.voucherSnapshotLabel}: 2026-07-14</strong><span>{t.voucherPriceCanChange}</span></div><a className="shop-link" href="https://tokenizart.com/es/shop/" target="_blank" rel="noreferrer"><ShoppingCart size={18} />{t.openOfficialShop}<ExternalLink size={16} /></a></>}
      {step.order === 4 && <><fieldset data-practice-action>
        <legend>{t.voucherChooseProduct}</legend>
        <div className="voucher-product-grid">
          {voucherProductIds.map((productId) => {
            const product = voucherProducts[productId];
            return (
              <button type="button" key={productId} disabled={completed} className={draft.productId === productId ? "selected" : ""} onClick={() => {
                send({ type: "SET_VOUCHER_DRAFT", productId, creditConfirmed: false });
                onPracticeSelection(`voucher_product:${productId}`);
              }}>
                {productId === "starter_kit" ? <PackageCheck size={21} /> : <TicketCheck size={21} />}
                <span><strong>{product[lang].name}</strong><small>{product[lang].description}</small></span>
                <b>USD {product.priceUsd.toFixed(2)}</b>
              </button>
            );
          })}
        </div>
      </fieldset><div className="voucher-snapshot"><strong>{selected[lang].name}</strong><span>+{selected.credited.mint} Mint · +{selected.credited.certify} Certify · +{selected.credited.nfc} NFC</span></div></>}
      {step.order === 5 && <><PracticeContextCard icon={TicketCheck} title={stepCopy.title} body={stepCopy.body} /><VoucherBalances context={context} /></>}
      {step.order === 6 && <><PracticeContextCard icon={UserRoundPlus} title={stepCopy.title} body={stepCopy.body} /><VoucherBalances context={context} /><div className="safety-note"><ShieldCheck size={18} />{t.voucherSafety}</div></>}
      {step.order === 7 && <><section className="voucher-consumption"><h3>{t.voucherConsumptionTitle}</h3>{consumers.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.copy}</span></div>)}</section><label data-practice-action className="confirmation-check"><input type="checkbox" disabled={completed} checked={draft.creditConfirmed} onChange={(event) => send({ type: "SET_VOUCHER_DRAFT", creditConfirmed: event.target.checked })} /><span>{t.voucherConfirm}<small>{t.voucherConfirmHelp}</small></span></label>{!completed && <button className="text-action" onClick={() => send({ type: "INJECT_ERROR", code: "voucher_confirmation_required" })}><CircleAlert size={17} />{t.errorPractice}</button>}</>}
    </div>
  );
}

function VoucherCompletion({ context }: { context: DemoContext }) {
  if (context.flow !== "vouchers" || !context.world.events.includes("vouchers.completed")) return null;
  const receipt = context.world.voucherReceipts.at(-1);
  if (!receipt) return null;
  const lang = context.language;
  const t = ui[lang];
  const product = voucherProducts[receipt.productId][lang];
  const timeline = {
    es: ["Producto revisado", "Acreditación simulada", "Saldo de práctica actualizado"],
    en: ["Product reviewed", "Simulated credit", "Practice balance updated"],
    pt: ["Produto revisado", "Crédito simulado", "Saldo de prática atualizado"],
  }[lang];

  return (
    <section className="completion-result voucher-result" aria-live="polite">
      <div className="completion-heading"><PackageCheck size={28} /><div><strong>{t.voucherCompleted}</strong><span>{receipt.receiptId}</span></div></div>
      <dl>
        <div><dt>{t.voucherProduct}</dt><dd>{product.name}</dd></div>
        <div><dt>{t.voucherSnapshotPrice}</dt><dd>USD {receipt.priceUsd.toFixed(2)}</dd></div>
        <div><dt>{t.voucherCreditsAdded}</dt><dd>+{receipt.credited.mint} M · +{receipt.credited.certify} C · +{receipt.credited.nfc} NFC</dd></div>
        <div><dt>{t.voucherResultingBalance}</dt><dd>{receipt.resultingBalances.mint} M · {receipt.resultingBalances.certify} C · {receipt.resultingBalances.nfc} NFC</dd></div>
      </dl>
      <div className="provenance-timeline">{timeline.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
      <p>{t.noRealVoucherPurchase}</p>
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [focusIndex, setFocusIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"full" | "detail">("full");
  const displayAssetId = step.display_asset_id || step.asset_id;
  const assetUrl = `/api/manual-asset/${encodeURIComponent(displayAssetId)}`;
  const layout = classifyVisualLayout(dimensions.width, dimensions.height);
  const hotspots = step.hotspots ?? [];
  const showDetail = hotspots.length > 0 || needsVisualDetail(dimensions.width, dimensions.height);
  const activeHotspot = hotspots[focusIndex] ?? null;
  const labels = {
    es: { detail: "Detalle guiado", full: "Pantalla completa", previous: "Detalle anterior", next: "Siguiente detalle" },
    en: { detail: "Guided detail", full: "Full screen", previous: "Previous detail", next: "Next detail" },
    pt: { detail: "Detalhe guiado", full: "Tela completa", previous: "Detalhe anterior", next: "Proximo detalhe" },
  }[language];

  useEffect(() => {
    setDimensions({ width: 0, height: 0 });
    setFocusIndex(0);
    setViewMode("full");
  }, [step.step_id]);

  return (
    <div className="manual-visual" data-visual-layout={layout}>
      {showDetail && (
        <div className="visual-view-controls" aria-label={labels.detail}>
          <button type="button" className={viewMode === "full" ? "active" : ""} onClick={() => setViewMode("full")}>{labels.full}</button>
          <button type="button" className={viewMode === "detail" ? "active" : ""} onClick={() => setViewMode("detail")}><ZoomIn size={15} />{activeHotspot?.label[language] || labels.detail}</button>
          {hotspots.length > 1 && <div><button type="button" disabled={focusIndex === 0} onClick={() => { setFocusIndex((current) => Math.max(0, current - 1)); setViewMode("detail"); }} title={labels.previous} aria-label={labels.previous}><ArrowLeft size={16} /></button><b>{focusIndex + 1}/{hotspots.length}</b><button type="button" disabled={focusIndex === hotspots.length - 1} onClick={() => { setFocusIndex((current) => Math.min(hotspots.length - 1, current + 1)); setViewMode("detail"); }} title={labels.next} aria-label={labels.next}><ArrowRight size={16} /></button></div>}
        </div>
      )}
      <div className={viewMode === "detail" ? "visual-stage detail-mode" : "visual-stage"}>
        {viewMode === "full" || !showDetail ? (
          <>
            <img src={assetUrl} alt={step.copy[language].title} onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
            {hotspots.map((hotspot, index) => (
              <button
                className={index === focusIndex ? "hotspot active" : "hotspot"}
                key={`${step.step_id}-${index}`}
                title={hotspot.label[language]}
                aria-label={`${labels.detail} ${index + 1}`}
                onClick={() => { setFocusIndex(index); setViewMode("detail"); }}
                style={{ left: `${hotspot.x_pct}%`, top: `${hotspot.y_pct}%`, width: `${hotspot.width_pct}%`, height: `${hotspot.height_pct}%` }}
              />
            ))}
          </>
        ) : activeHotspot ? (
          <div className="visual-focus-viewport" role="img" aria-label={`${labels.detail}: ${activeHotspot.label[language]}`}><img src={assetUrl} alt="" style={focusImageStyle(activeHotspot)} /></div>
        ) : (
          <div className="visual-pan-scroll" tabIndex={0} aria-label={labels.full}><img src={assetUrl} alt="" /></div>
        )}
        <button className="icon-button zoom" onClick={onZoom} title="Ampliar imagen" aria-label="Ampliar imagen"><ZoomIn size={20} /></button>
      </div>
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
  const [bridgeStatus, setBridgeStatus] = useState<"disconnected" | "connected" | "explanation_ready">("disconnected");
  const context = snapshot.context;
  const lang = context.language;
  const t = ui[lang];
  const flow = manualContract.flows[context.flow];
  const step = flow.steps[context.stepIndex] ?? flow.steps[0];
  const displayAssetId = step.display_asset_id || step.asset_id;
  const phase = flow.phase_map?.find((item) => step.order >= item.from_order && step.order <= item.to_order);
  const enrichment = flow.step_enrichment?.[step.step_id];
  const progress = Math.round(((context.stepIndex + 1) / flow.steps.length) * 100);
  const activeError = context.errorCode ? errors[context.errorCode]?.[lang] : null;
  const flowCompleted = context.world.events.includes(`${context.flow}.completed`);
  const interactiveSurface = usesInteractiveAtelierSurface(context.flow);
  const surfaceOwnsControls = context.flow === "mint" || context.flow === "certify";
  const bridgeOrigin = useMemo(() => resolveDemoBridgeOrigin(window.location.search, document.referrer), []);
  const bridgeTarget = bridgeOrigin && window.parent !== window ? window.parent : null;
  const defaultPracticeState = useMemo(() => practiceStateForContext(context, step.step_id), [
    context.flow,
    context.world.certifyDraft.actorId,
    context.world.certifyDraft.typeId,
    context.world.certifyDraft.visibility,
    context.world.mintDraft.actorId,
    context.world.mintDraft.mode,
    context.world.nfcDraft.actorId,
    context.world.nfcDraft.tagState,
    context.world.privacyDraft.certifyVisibility.authenticity,
    context.world.privacyDraft.galleryVisible,
    context.world.privacyDraft.previewAudience,
    context.world.transferDraft.destinationType,
    context.world.voucherDraft.productId,
    step.step_id,
  ]);
  const [practiceState, setPracticeState] = useState<DemoPracticeState | null>(defaultPracticeState);

  function emitDemoMessage(type: Parameters<typeof postDemoBridgeMessage>[2], overridePracticeState: DemoPracticeState | null = practiceState ?? defaultPracticeState): boolean {
    return postDemoBridgeMessage(bridgeTarget, bridgeOrigin, type, context, step.step_id, overridePracticeState);
  }

  function handlePracticeSelection(selectionId: string) {
    const nextPracticeState = practiceStateForSelection(context.flow, selectionId);
    if (!nextPracticeState) return;
    setPracticeState(nextPracticeState);
    postDemoBridgeMessage(bridgeTarget, bridgeOrigin, "demo.practice.changed", context, step.step_id, nextPracticeState);
  }

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(context));
    document.documentElement.lang = lang;
  }, [context, lang]);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 860px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(".flow-rail nav button.active")?.scrollIntoView({ block: "nearest", inline: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [context.flow, lang]);

  useEffect(() => {
    setPracticeState(defaultPracticeState);
    emitDemoMessage("demo.step.changed", defaultPracticeState);
  }, [bridgeOrigin, context.flow, context.fixtureId, context.scenarioId, lang, step.step_id]);

  useEffect(() => {
    if (context.errorCode) emitDemoMessage("demo.error.shown");
  }, [bridgeOrigin, context.errorCode]);

  useEffect(() => {
    if (flowCompleted) emitDemoMessage("demo.flow.completed");
  }, [bridgeOrigin, context.flow, flowCompleted]);

  useEffect(() => {
    if (!bridgeOrigin || !bridgeTarget) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== bridgeOrigin || event.source !== bridgeTarget || !isCompanionBridgeMessage(event.data)) return;
      if (event.data.scenario_id !== context.scenarioId || event.data.flow !== context.flow || event.data.step_id !== step.step_id || event.data.synthetic_fixture_id !== context.fixtureId) return;
      setBridgeStatus(event.data.type === "companion.explanation.available" ? "explanation_ready" : "connected");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [bridgeOrigin, bridgeTarget, context.fixtureId, context.flow, context.scenarioId, step.step_id]);

  useEffect(() => {
    if (!bridgeOrigin || !bridgeTarget || bridgeStatus !== "disconnected") return;

    const announce = () => {
      postDemoBridgeMessage(bridgeTarget, bridgeOrigin, "demo.ready", context, step.step_id, defaultPracticeState);
      postDemoBridgeMessage(bridgeTarget, bridgeOrigin, "demo.step.changed", context, step.step_id, defaultPracticeState);
    };
    announce();
    const retry = window.setInterval(announce, 500);
    const stop = window.setTimeout(() => window.clearInterval(retry), 5000);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(stop);
    };
  }, [
    bridgeOrigin,
    bridgeStatus,
    bridgeTarget,
    context.fixtureId,
    context.flow,
    context.scenarioId,
    defaultPracticeState,
    step.step_id,
  ]);

  function reset() {
    emitDemoMessage("demo.reset");
    sessionStorage.removeItem(SESSION_KEY);
    send({ type: "RESET" });
  }

  function requestExplanation() {
    if (emitDemoMessage("demo.explain.requested")) return;
    const url = `https://companion-staging.tokenizart.info/beta?demo_flow=${encodeURIComponent(context.flow)}&demo_step=${encodeURIComponent(step.step_id)}&lang=${lang}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block"><span className="brand-mark"><img src="/brand/tokenizart-symbol.png" alt="" /></span><div><h1>{t.brand}</h1><p>{t.tagline}</p></div></div>
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
              return <button key={flowId} className={flowId === context.flow ? "active" : ""} onClick={() => send({ type: "SELECT_FLOW", flow: flowId })}><FlowIconMark flowId={flowId} size={18} /><span>{flowLabels[flowId][lang]}</span><small>{manualContract.flows[flowId].steps.length}</small></button>;
            })}
          </nav>
        </aside>

        <main className="simulation-workspace">
          <section className="simulation-header">
            <div><span className="eyebrow">{flowLabels[context.flow][lang]}</span><h2>{step.copy[lang].title}</h2></div>
            <div className="header-actions">
              <div className="progress-block"><span>{context.stepIndex + 1} / {flow.steps.length}</span><div><i style={{ width: `${progress}%` }} /></div></div>
              <div className="step-navigation compact">
                <button className="secondary" disabled={context.stepIndex === 0} onClick={() => send({ type: "PREVIOUS" })}><ArrowLeft size={18} />{t.previous}</button>
                <button className="primary" disabled={flowCompleted && context.stepIndex === flow.steps.length - 1} onClick={() => {
                  if (context.stepIndex === flow.steps.length - 1) send({ type: "COMPLETE_STEP" });
                  else send({ type: "NEXT" });
                }}>{flowCompleted && context.stepIndex === flow.steps.length - 1 ? t.completed : context.stepIndex === flow.steps.length - 1 ? t.complete : t.next}<ArrowRight size={18} /></button>
              </div>
            </div>
          </section>

          <section className={interactiveSurface ? "simulation-grid interactive-surface" : "simulation-grid"}>
            <div className="screen-zone">
              {interactiveSurface ? (
                <>
                  <AtelierSurface context={context} step={step} send={send} onPracticeSelection={handlePracticeSelection} />
                  <details className="manual-reference">
                    <summary>{lang === "en" ? "Compare with the verified manual" : lang === "pt" ? "Comparar com o manual verificado" : "Comparar con el manual verificado"}</summary>
                    <ManualVisual step={step} language={lang} onZoom={() => setZoomed(true)} />
                    <div className="visual-meta"><span>{t.source}: Manual Atelier 2026</span><span>{t.slide} {step.source_slide}</span><span>{step.step_id}</span></div>
                  </details>
                </>
              ) : (
                <>
                  <ManualVisual step={step} language={lang} onZoom={() => setZoomed(true)} />
                  <div className="visual-meta"><span>{t.source}: Manual Atelier 2026</span><span>{t.slide} {step.source_slide}</span><span>{step.step_id}</span></div>
                </>
              )}
            </div>
            <div className="practice-zone" data-flow={context.flow}>
              <div className="practice-title"><FlowIconMark flowId={context.flow} size={22} /><span className="practice-heading"><strong>{t.demoData}</strong><small>{flowLabels[context.flow][lang]}</small></span><span className="simulated-badge">{t.simulated}</span></div>
              <div className="practice-step-focus"><span>{step.order}</span><div><small>{t.currentStep}</small><strong>{step.copy[lang].title}</strong></div></div>
              {surfaceOwnsControls ? (
                <div className="surface-control-note">
                  <ShieldCheck size={20} />
                  <span>
                    <strong>{lang === "en" ? "Practice controls are inside Atelier" : lang === "pt" ? "Os controles de prática estão dentro do Atelier" : "Los controles de práctica están dentro de Atelier"}</strong>
                    <small>{lang === "en" ? "Use the central simulated screen; this panel only reports blocks or errors." : lang === "pt" ? "Use a tela simulada central; este painel apenas informa bloqueios ou erros." : "Usa la pantalla simulada central; este panel solo informa bloqueos o errores."}</small>
                  </span>
                </div>
              ) : (
                <PracticeFields context={context} step={step} send={send} onPracticeSelection={handlePracticeSelection} />
              )}
              {!surfaceOwnsControls && <MintCompletion context={context} />}
              {!surfaceOwnsControls && <CertifyCompletion context={context} />}
              <NfcCompletion context={context} />
              <TransferCompletion context={context} />
              <PrivacyCompletion context={context} />
              <VoucherCompletion context={context} />
              {activeError && <div className="error-panel"><CircleAlert size={22} /><div><strong>{activeError.title}</strong><p>{activeError.body}</p><button onClick={() => send({ type: "RESOLVE_ERROR" })}><Check size={17} />{t.resolve}</button></div></div>}
            </div>
          </section>

          <section className="step-coach" aria-live="polite">
            <div className="coach-summary">
              <div className="coach-heading">
                <span><MessageCircleQuestion size={20} /><strong>{t.currentStep}</strong></span>
                {phase && <span className="phase-badge">{phase.label[lang]}</span>}
              </div>
              <p>{step.copy[lang].body}</p>
              {step.copy[lang].next_question && <blockquote>{step.copy[lang].next_question}</blockquote>}
              <div className="coach-actions">
                {bridgeStatus !== "disconnected" && <span className="bridge-status">{bridgeStatus === "explanation_ready" ? (lang === "en" ? "Companion explanation ready" : lang === "pt" ? "Explicacao do Companion pronta" : "Explicacion del Companion lista") : (lang === "en" ? "Companion connected" : lang === "pt" ? "Companion conectado" : "Companion conectado")}</span>}
                <button className="companion-link" type="button" onClick={requestExplanation}><MessageCircleQuestion size={18} />{t.explain}</button>
              </div>
            </div>
            <details className="practice-details">
              <summary>{t.practiceDetails}</summary>
              <div className="coach-details-grid">
                {enrichment && (
                  <section className="state-legend" aria-label={enrichment.state_legend_title[lang]}>
                    <h3>{enrichment.state_legend_title[lang]}</h3>
                    <div>
                      {enrichment.state_legend.map((item) => (
                        <article key={item.state} data-tone={item.tone}>
                          <strong>{item.label[lang]}</strong>
                          <span>{item.message[lang]}</span>
                          <small>{item.meaning[lang]}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                <div className="world-status">
                  <h3>{t.session}</h3>
                  <dl>
                    <div><dt>{t.account}</dt><dd>{context.world.accountStatus}</dd></div>
                    <div><dt>{t.wallet}</dt><dd>{context.world.walletStatus}</dd></div>
                    <div><dt>{t.artwork}</dt><dd>{statusText(context, lang)}</dd></div>
                  </dl>
                  <VoucherBalances context={context} compact />
                </div>
              </div>
            </details>
          </section>
        </main>
      </div>

      {zoomed && <div className="lightbox" role="dialog" aria-modal="true" aria-label={step.copy[lang].title}><button className="icon-button" onClick={() => setZoomed(false)} title="Cerrar" aria-label="Cerrar"><X size={22} /></button><img src={`/api/manual-asset/${encodeURIComponent(displayAssetId)}`} alt={step.copy[lang].title} /><div><strong>{step.copy[lang].title}</strong><span>{t.imageHint}</span></div></div>}
    </div>
  );
}

export default App;
