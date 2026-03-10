import LandingHeroSection from "./LandingHeroSection";
import LandingStepsSection from "./LandingStepsSection";
import type { LandingSectionDto } from "../../types/landing";

type HeroRuntimeProps = {
  url: string;
  submitting: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
};

type LandingSectionRendererProps = {
  section: LandingSectionDto;
  heroRuntime: HeroRuntimeProps;
};

export default function LandingSectionRenderer({
  section,
  heroRuntime,
}: LandingSectionRendererProps) {
  if (section.key === "hero") {
    return (
      <LandingHeroSection
        content={section.content}
        url={heroRuntime.url}
        submitting={heroRuntime.submitting}
        onUrlChange={heroRuntime.onUrlChange}
        onSubmit={heroRuntime.onSubmit}
      />
    );
  }

  if (section.key === "steps") {
    return <LandingStepsSection content={section.content} />;
  }

  return null;
}
