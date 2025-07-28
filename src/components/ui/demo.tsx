import { Hero } from "@/components/ui/animated-hero"

interface HeroDemoProps {
  onLoginClick: () => void;
}

function HeroDemo({ onLoginClick }: HeroDemoProps) {
  return (
    <div className="block">
      <Hero onLoginClick={onLoginClick} />
    </div>
  );
}

export { HeroDemo };