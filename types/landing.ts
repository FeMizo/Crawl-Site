export type LandingSectionKey = "hero" | "steps";

export type LandingSectionDto = {
  id: string;
  key: LandingSectionKey;
  label: string;
  order: number;
  content: Record<string, unknown>;
};
