import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type EloTierKey =
  | "ferro"
  | "bronze"
  | "prata"
  | "ouro"
  | "platina"
  | "diamante"
  | "mestre"
  | "desafiante";

export const ELO_PALETTE: Record<
  EloTierKey,
  {
    label: string;
    primary: string;
    secondary: string;
    rim: string;
    glow: string;
  }
> = {
  ferro: {
    label: "Ferro",
    primary: "#64748b",
    secondary: "#334155",
    rim: "#94a3b8",
    glow: "rgba(100, 116, 139, 0.35)",
  },
  bronze: {
    label: "Bronze",
    primary: "#b45309",
    secondary: "#78350f",
    rim: "#d97706",
    glow: "rgba(217, 119, 6, 0.35)",
  },
  prata: {
    label: "Prata",
    primary: "#94a3b8",
    secondary: "#475569",
    rim: "#e2e8f0",
    glow: "rgba(226, 232, 240, 0.35)",
  },
  ouro: {
    label: "Ouro",
    primary: "#eab308",
    secondary: "#a16207",
    rim: "#fde047",
    glow: "rgba(234, 179, 8, 0.4)",
  },
  platina: {
    label: "Platina",
    primary: "#0d9488",
    secondary: "#115e59",
    rim: "#5eead4",
    glow: "rgba(45, 212, 191, 0.4)",
  },
  diamante: {
    label: "Diamante",
    primary: "#2563eb",
    secondary: "#1e40af",
    rim: "#60a5fa",
    glow: "rgba(59, 130, 246, 0.5)",
  },
  mestre: {
    label: "Mestre",
    primary: "#7c3aed",
    secondary: "#4c1d95",
    rim: "#c4b5fd",
    glow: "rgba(139, 92, 246, 0.45)",
  },
  desafiante: {
    label: "Desafiante",
    primary: "#f59e0b",
    secondary: "#1d4ed8",
    rim: "#fef08a",
    glow: "rgba(245, 158, 11, 0.55)",
  },
};

interface EloCrestSvgProps {
  elo: EloTierKey;
  status: "completed" | "active" | "locked";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EloCrestSvg({
  elo,
  status,
  size = "md",
  className,
}: EloCrestSvgProps) {
  const palette = ELO_PALETTE[elo] || ELO_PALETTE.ferro;
  const isLocked = status === "locked";
  const isHighTier =
    elo === "diamante" || elo === "mestre" || elo === "desafiante";

  const pxSize = size === "lg" ? 84 : size === "sm" ? 42 : 58;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        className
      )}
      style={{ width: pxSize, height: pxSize }}
    >
      {!isLocked && (
        <div
          className="absolute inset-1 rounded-full blur-md pointer-events-none"
          style={{ backgroundColor: palette.glow }}
        />
      )}

      <svg
        viewBox="0 0 80 80"
        className={cn(
          "relative w-full h-full drop-shadow-md transition-transform duration-300",
          isLocked && "opacity-45 grayscale"
        )}
      >
        {/* Asas laterais para Elos médios/altos */}
        {elo !== "ferro" && (
          <path
            d={
              isHighTier
                ? "M14 26 L4 18 L10 36 L18 40 Z M66 26 L76 18 L70 36 L62 40 Z"
                : "M16 30 L8 25 L12 38 L18 42 Z M64 30 L72 25 L68 38 L62 42 Z"
            }
            fill={isLocked ? "#475569" : palette.rim}
            opacity={0.85}
          />
        )}

        {/* Coroa superior para Desafiante / Mestre */}
        {(elo === "desafiante" || elo === "mestre") && (
          <path
            d="M28 14 L34 6 L40 12 L46 6 L52 14 L48 18 L32 18 Z"
            fill={isLocked ? "#475569" : palette.rim}
          />
        )}

        {/* Escudo Principal */}
        <path
          d="M40 12 L62 22 L58 50 L40 68 L22 50 L18 22 Z"
          fill={isLocked ? "#1e293b" : palette.secondary}
          stroke={isLocked ? "#64748b" : palette.rim}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Faceta interna */}
        <path
          d="M40 18 L56 26 L53 47 L40 61 L27 47 L24 26 Z"
          fill={isLocked ? "#334155" : palette.primary}
          opacity={0.9}
        />

        {/* Gema central */}
        <polygon
          points="40,26 48,37 40,51 32,37"
          fill={isLocked ? "#475569" : palette.rim}
          opacity={isLocked ? 0.5 : 0.95}
        />
      </svg>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}
