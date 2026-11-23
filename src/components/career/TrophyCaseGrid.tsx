import { Gift, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CareerStage, LiveStudioCounters } from "@/data/careerTestDefaults";
import { evaluateStageStatus } from "./CareerStageCard";
import { ELO_PALETTE, EloCrestSvg } from "./EloCrestSvg";

export interface TrophyEntry {
  blockTitle: string;
  stage: CareerStage;
  previousUnlocked: boolean;
}

interface TrophyCaseGridProps {
  entries: TrophyEntry[];
  counters: LiveStudioCounters;
  readOnly?: boolean;
  onEditTrophy: (stage: CareerStage) => void;
  onClaimPrize: (stageId: string) => void;
}

export function TrophyCaseGrid({
  entries,
  counters,
  readOnly = false,
  onEditTrophy,
  onClaimPrize,
}: TrophyCaseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {entries.map(({ blockTitle, stage, previousUnlocked }) => {
        const { isCompleted, progressPct, status } = evaluateStageStatus(
          stage,
          counters,
          previousUnlocked
        );
        const eloPalette = ELO_PALETTE[stage.eloKey];

        return (
          <div
            key={stage.id}
            className={cn(
              "rounded-2xl border overflow-hidden flex flex-col justify-between transition-all",
              isCompleted
                ? "bg-sidebar text-sidebar-foreground border-primary/50 shadow-lg"
                : "bg-card border-border"
            )}
          >
            <div className="p-5 flex flex-col items-center text-center space-y-3.5">
              <div className="w-full flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider truncate",
                    !isCompleted && "text-muted-foreground"
                  )}
                  style={isCompleted ? { color: eloPalette.rim } : undefined}
                >
                  {stage.eloName} · {blockTitle}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold shrink-0",
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isCompleted
                    ? stage.prizeClaimed
                      ? "Resgatado"
                      : "100 PDL"
                    : `${progressPct} PDL`}
                </Badge>
              </div>

              <div className="py-1">
                <EloCrestSvg elo={stage.eloKey} status={status} size="lg" />
              </div>

              <div className="space-y-1 w-full">
                <h3
                  className={cn(
                    "text-base font-extrabold truncate",
                    isCompleted ? "text-sidebar-foreground" : "text-foreground"
                  )}
                >
                  {stage.trophyTitle}
                </h3>
                <p
                  className={cn(
                    "text-xs truncate",
                    isCompleted
                      ? "text-sidebar-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {stage.title}
                </p>
              </div>

              {!isCompleted && (
                <Progress value={progressPct} className="h-1.5 w-full" />
              )}
            </div>

            <div
              className={cn(
                "px-4 py-3 border-t space-y-2.5",
                isCompleted
                  ? "border-sidebar-border bg-black/15"
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Gift
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isCompleted ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold truncate",
                    isCompleted ? "text-sidebar-foreground" : "text-foreground"
                  )}
                >
                  {stage.prizeTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTrophy(stage)}
                    className={cn(
                      "h-8 text-xs flex-1",
                      isCompleted &&
                        "bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
                {isCompleted && (
                  <Button
                    type="button"
                    size="sm"
                    variant={stage.prizeClaimed ? "secondary" : "default"}
                    onClick={() => onClaimPrize(stage.id)}
                    className="h-8 text-xs flex-1 font-bold"
                  >
                    {stage.prizeClaimed ? "Resgatado" : "Resgatar"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
