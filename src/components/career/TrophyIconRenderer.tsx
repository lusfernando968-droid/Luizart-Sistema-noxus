import {
  Trophy,
  Award,
  Crown,
  Star,
  Flame,
  Medal,
  Shield,
  Gem,
} from "lucide-react";
import type { TrophyIconKey } from "@/data/careerTestDefaults";

interface TrophyIconRendererProps {
  icon: TrophyIconKey;
  className?: string;
}

const ICON_MAP = {
  trophy: Trophy,
  award: Award,
  crown: Crown,
  star: Star,
  flame: Flame,
  medal: Medal,
  shield: Shield,
  gem: Gem,
} as const;

export const TROPHY_ICON_OPTIONS: { value: TrophyIconKey; label: string }[] = [
  { value: "trophy", label: "Troféu" },
  { value: "crown", label: "Coroa" },
  { value: "award", label: "Medalhão" },
  { value: "medal", label: "Medalha" },
  { value: "shield", label: "Escudo" },
  { value: "gem", label: "Diamante" },
  { value: "flame", label: "Chama" },
  { value: "star", label: "Estrela" },
];

export function TrophyIconRenderer({ icon, className }: TrophyIconRendererProps) {
  const IconComponent = ICON_MAP[icon] || Trophy;
  return <IconComponent className={className} />;
}
