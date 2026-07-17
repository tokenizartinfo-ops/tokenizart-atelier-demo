export type Language = "es" | "en" | "pt";
export type CertifyActorId = "owner_artist" | "expert" | "gallery_museum";
export type CertifyTypeId = "authenticity" | "condition" | "exhibition" | "additional_report";
export type CertifyVisibility = "public" | "owner";
export type MintActorId = "owner_artist" | "authorized_manager";
export type MintMode = "single" | "batch";
export type NfcActorId = "owner_artist" | "authorized_certifier";
export type NfcTagState = "ready_to_link" | "linked_artwork" | "not_tokenizart";
export type TransferDestinationType = "tokenizart_user" | "external_wallet";
export type PrivacyPreviewAudience = "owner" | "visitor";
export type PrivacyCertifyId = "authenticity" | "exhibition" | "condition";
export type VoucherProductId = "starter_kit" | "mint" | "certify" | "nfc";

export interface VoucherBalances {
  mint: number;
  certify: number;
  nfc: number;
}

export interface LocalizedCopy {
  title: string;
  body: string;
  next_question?: string;
}

export interface Hotspot {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  label: Record<Language, string>;
}

export interface ManualStep {
  step_id: string;
  order: number;
  source_slide: number;
  asset_id: string;
  copy: Record<Language, LocalizedCopy>;
  hotspots?: Hotspot[];
}

export interface ManualFlow {
  source_slides: number[];
  description: string;
  steps: ManualStep[];
}

export interface ManualContract {
  schema: string;
  version: string;
  flows: Record<string, ManualFlow>;
}

export interface DemoCertification {
  certificationId: string;
  actorId: CertifyActorId;
  typeId: CertifyTypeId;
  visibility: CertifyVisibility;
  evidenceAssetId: string;
  completedAt: string;
}

export interface DemoMintReceipt {
  receiptId: string;
  actorId: MintActorId;
  mode: MintMode;
  artworkCount: number;
  vouchersConsumed: number;
  networkRef: "gnosis-simulated";
  tokenRef: string;
  transactionRef: string;
  metadataRef: string;
  completedAt: string;
}

export interface DemoNfcReceipt {
  receiptId: string;
  actorId: NfcActorId;
  tagState: "linked_artwork";
  vouchersConsumed: 1;
  networkRef: "gnosis-simulated";
  tagRef: string;
  certificationRef: string;
  tokenRef: string;
  transactionRef: string;
  completedAt: string;
}

export interface DemoTransferReceipt {
  receiptId: string;
  destinationType: TransferDestinationType;
  previousOwnerRef: string;
  newOwnerRef: string;
  destinationWalletRef: string;
  atelierManagement: "inside_atelier" | "outside_atelier";
  vouchersConsumed: 0;
  networkRef: "gnosis-simulated";
  tokenRef: string;
  transactionRef: string;
  completedAt: string;
}

export interface DemoPrivacyReceipt {
  receiptId: string;
  galleryVisible: boolean;
  technicalSheetVisible: boolean;
  publicCertifyIds: PrivacyCertifyId[];
  ownerOnlyCertifyIds: PrivacyCertifyId[];
  completedAt: string;
}

export interface DemoVoucherReceipt {
  receiptId: string;
  productId: VoucherProductId;
  priceUsd: number;
  priceVerifiedAt: "2026-07-14";
  credited: VoucherBalances;
  resultingBalances: VoucherBalances;
  sourceUrl: "https://tokenizart.com/es/shop/";
  completedAt: string;
}

export interface DemoWorld {
  accountStatus: "not_created" | "email_pending" | "active";
  walletStatus: "not_created" | "created" | "backed_up";
  artworkStatus: "none" | "draft" | "loaded" | "minted" | "certified" | "tagged" | "transferred";
  artworkTitle: string;
  artworkAuthor: string;
  artworkType: "painting" | "sculpture" | "sports";
  currentOwnerRef: string;
  galleryVisible: boolean;
  certifyVisible: boolean;
  mintDraft: {
    actorId: MintActorId;
    mode: MintMode;
    reviewConfirmed: boolean;
    signatureConfirmed: boolean;
  };
  mintReceipts: DemoMintReceipt[];
  nfcDraft: {
    actorId: NfcActorId;
    tagState: NfcTagState;
    scanConfirmed: boolean;
    signatureConfirmed: boolean;
  };
  nfcReceipts: DemoNfcReceipt[];
  transferDraft: {
    destinationType: TransferDestinationType;
    recipientVerified: boolean;
    externalWarningAccepted: boolean;
    signatureConfirmed: boolean;
  };
  transferReceipts: DemoTransferReceipt[];
  privacyDraft: {
    galleryVisible: boolean;
    technicalSheetVisible: boolean;
    certifyVisibility: Record<PrivacyCertifyId, boolean>;
    previewAudience: PrivacyPreviewAudience;
    ownerConfirmed: boolean;
  };
  privacyReceipts: DemoPrivacyReceipt[];
  voucherDraft: {
    productId: VoucherProductId;
    creditConfirmed: boolean;
  };
  voucherReceipts: DemoVoucherReceipt[];
  certifyDraft: {
    actorId: CertifyActorId;
    typeId: CertifyTypeId;
    visibility: CertifyVisibility;
  };
  certifications: DemoCertification[];
  vouchers: VoucherBalances;
  events: string[];
}

export interface DemoContext {
  language: Language;
  flow: string;
  stepIndex: number;
  scenarioId: string;
  fixtureId: string;
  errorCode: string | null;
  world: DemoWorld;
}
