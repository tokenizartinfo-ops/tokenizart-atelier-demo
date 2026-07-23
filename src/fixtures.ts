import type { DemoArtwork, Language } from "./types";

const localized = (es: string, en: string, pt: string): Record<Language, string> => ({ es, en, pt });

export const curvasArtworkFixture: DemoArtwork = {
  artworkId: "ARTWORK-DEMO-CURVAS-001",
  title: "Curvas",
  author: "Jorge Norberto Leporace",
  ownerDisplayName: "Gabriel Mucchiut",
  type: "painting",
  countryCode: "AR",
  countryName: localized("Argentina", "Argentina", "Argentina"),
  galleryVisible: true,
  exhibited: true,
  exhibitionPlace: "Galería personal",
  description: localized(
    "Toda la paleta de colores desplegada sobre el lienzo. Una de las primeras obras del artista con óleo, perteneciente a su colección personal.",
    "A full color palette unfolds across the canvas. One of the artist's early oil works, from his personal collection.",
    "Toda a paleta de cores se desdobra sobre a tela. Uma das primeiras obras a óleo do artista, pertencente à sua coleção pessoal.",
  ),
  popularName: "Curvas",
  style: localized("Abstracto", "Abstract", "Abstrato"),
  theme: localized("Geométrico", "Geometric", "Geométrico"),
  technique: localized("Óleo", "Oil", "Óleo"),
  support: localized("Lienzo", "Canvas", "Tela"),
  widthCm: "100",
  heightCm: "120",
  depthCm: "",
  period: localized("Contemporánea", "Contemporary", "Contemporânea"),
  creationYear: "2020",
  creationPlace: "Buenos Aires",
  province: "Buenos Aires",
    series: {
      es: "Colección personal",
      en: "Personal collection",
      pt: "Coleção pessoal",
    },
  declaredValueUsd: "3500",
  notes: localized(
    "Fixture didáctico basado en el ejemplo público del Manual Atelier 2026.",
    "Learning fixture based on the public example in the Atelier 2026 Manual.",
    "Fixture didático baseado no exemplo público do Manual Atelier 2026.",
  ),
  existingSheetFileName: "ficha-curvas-demo.pdf",
  images: [
    { imageId: "CURVAS-MAIN", role: "main", assetPath: "/fixtures/curvas.png", objectPosition: "50% 50%" },
    { imageId: "CURVAS-REVERSE", role: "reverse", assetPath: "/fixtures/curvas.png", objectPosition: "30% 46%" },
    { imageId: "CURVAS-DETAIL", role: "detail", assetPath: "/fixtures/curvas.png", objectPosition: "72% 58%" },
  ],
};

export function createCurvasArtworkFixture(): DemoArtwork {
  return structuredClone(curvasArtworkFixture);
}

export function artworkTypeLabel(type: DemoArtwork["type"], language: Language): string {
  const labels: Record<DemoArtwork["type"], Record<Language, string>> = {
    painting: localized("Pintura", "Painting", "Pintura"),
    sculpture: localized("Escultura", "Sculpture", "Escultura"),
    sports: localized("Objeto deportivo", "Sports object", "Objeto esportivo"),
  };
  return labels[type][language];
}
