export type Language = "es" | "en" | "pt";
export type CertifyActorId = "owner_artist" | "expert" | "gallery_museum";
export type CertifyTypeId = "authenticity" | "condition" | "exhibition" | "additional_report";
export type CertifyVisibility = "public" | "owner";

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

export interface DemoWorld {
  accountStatus: "not_created" | "email_pending" | "active";
  walletStatus: "not_created" | "created" | "backed_up";
  artworkStatus: "none" | "draft" | "loaded" | "minted" | "certified" | "tagged" | "transferred";
  artworkTitle: string;
  artworkAuthor: string;
  artworkType: "painting" | "sculpture" | "sports";
  galleryVisible: boolean;
  certifyVisible: boolean;
  certifyDraft: {
    actorId: CertifyActorId;
    typeId: CertifyTypeId;
    visibility: CertifyVisibility;
  };
  certifications: DemoCertification[];
  vouchers: { mint: number; certify: number; nfc: number };
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
