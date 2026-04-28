export type LandingSectionKey = "hero" | "steps" | "features" | "faq" | "pricing-teaser" | "contact";

export type LandingSectionDto = {
  id: string;
  key: LandingSectionKey;
  label: string;
  order: number;
  content: Record<string, unknown>;
  showFor?: "all" | "guest" | "auth";
};
