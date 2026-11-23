import {
  CheckCircle2,
  Circle,
  Gift,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  CareerStage,
  LiveStudioCounters,
  StageMission,
} from "@/data/careerTestDefaults";
import { ELO_PALETTE, EloCrestSvg } from "./EloCrestSvg";

export function resolveMissionProgress(
  mission: StageMission,
  counters: LiveStudioCounters
) {
  let current = mission.currentValue;
  if (mission.metricSource === "clients_total") current = counters.clientsTotal;
  else if (mission.metricSource === "students_total")
    current = counters.studentsTotal;
  else if (mission.metricSource === "month_revenue")
    current = counters.monthRevenue;
  else if (mission.metricSource === "completed_sessions")
    current = counters.completedSessions;

  const target = Math.max(1, mission.targetValue);
  const completed = mission.completed || current >= target;
  const pct = completed
    ? 100
    : Math.min(100, Math.round((current / target) * 100));

  return { current, target, completed, pct };
}

export function formatMissionValue(value: number, unit: string) {
  if (unit === "R$") {
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  return `${value.toLocaleString("pt-BR")} ${unit}`;
}

export function evaluateStageStatus(
  stage: CareerStage,
  counters: LiveStudioCounters,
  previousUnlocked: boolean
) {
  const missionResults = stage.missions.map((m) =>
    resolveMissionProgress(m, counters)
  );
  const completedMissions = missionResults.filter((r) => r.completed).length;
  const totalMissions = stage.missions.length;
  const progressPct =
    totalMissions === 0
      ? 0
      : Math.round(
          missionResults.reduce((acc, r) => acc + r.pct, 0) / totalMissions
        );
  const isCompleted =
    totalMissions > 0 && completedMissions === totalMissions;
  const status: "completed" | "active" | "locked" = isCompleted
    ? "completed"
    : previousUnlocked
    ? "active"
    : "locked";

  return { progressPct, completedMissions, totalMissions, isCompleted, status };
}

interface CareerStageCardProps {
  stage: CareerStage;
  counters: LiveStudioCounters;
  previousUnlocked: boolean;
  readOnly?: boolean;
  onToggleMission: (stageId: string, missionId: string) => void;
  onAdjustMission: (stageId: string, missionId: string, delta: number) => void;
  onDeleteMission?: (stageId: string, missionId: string) => void;
  onAddMission?: (stageId: string) => void;
  onEditStagePrize: (stage: CareerStage) => void;
  onClaimPrize: (stageId: string) => void;
}

export function CareerStageCard({
  stage,
  counters,
  previousUnlocked,
  readOnly = false,
  onToggleMission,
  onAdjustMission,
  onDeleteMission,
  onAddMission,
  onEditStagePrize,
  onClaimPrize,
}: CareerStageCardProps) {
  const { progressPct, completedMissions, totalMissions, isCompleted, status } =
    evaluateStageStatus(stage, counters, previousUnlocked);
  const eloPalette = ELO_PALETTE[stage.eloKey];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card overflow-hidden transition-all flex flex-col justify-between",
        status === "completed" && "border-primary/50 shadow-md",
        status === "active" &&
          "border-primary/40 shadow-md ring-1 ring-primary/15",
        status === "locked" && "border-border opacity-90"
      )}
    >
      {/* Topo Ranked Elo */}
      <div
        className={cn(
          "p-4 sm:p-5 border-b flex items-center justify-between gap-4",
          status === "locked"
            ? "bg-muted/40 border-border"
            : "bg-sidebar text-sidebar-foreground border-sidebar-border"
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <EloCrestSvg elo={stage.eloKey} status={status} size="md" />

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] font-extrabold uppercase px-2 py-0"
                style={
                  status !== "locked"
                    ? {
                        borderColor: eloPalette.rim,
                        color: eloPalette.rim,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }
                    : undefined
                }
              >
                {stage.eloName}
              </Badge>
              <span
                className={cn(
                  "text-[11px] font-medium truncate",
                  status === "locked"
                    ? "text-muted-foreground"
                    : "text-sidebar-foreground/75"
                )}
              >
                {stage.trophyTitle}
              </span>
            </div>
            <h3
              className={cn(
                "text-base sm:text-lg font-bold truncate",
                status === "locked"
                  ? "text-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              {stage.title}
            </h3>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-base sm:text-lg font-extrabold tabular-nums",
              status === "locked" ? "text-muted-foreground" : "text-primary"
            )}
          >
            {progressPct} PDL
          </span>
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              status === "locked"
                ? "text-muted-foreground"
                : "text-sidebar-foreground/60"
            )}
          >
            {completedMissions}/{totalMissions} missões
          </p>
        </div>
      </div>

      <Progress value={progressPct} className="h-1.5 rounded-none bg-muted" />

      <div className="p-4 sm:p-5 space-y-2.5 flex-1">
        {stage.missions.map((mission) => {
          const res = resolveMissionProgress(mission, counters);
          const isSystemMetric = mission.metricSource !== "manual";
          const stepSize = mission.unit === "R$" ? 1000 : 1;

          return (
            <div
              key={mission.id}
              className={cn(
                "rounded-xl border p-3 space-y-2 transition-colors",
                res.completed
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/25"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onToggleMission(stage.id, mission.id)}
                  className={cn(
                    "flex items-start gap-2.5 text-left min-w-0 flex-1",
                    !readOnly && "cursor-pointer hover:opacity-85"
                  )}
                >
                  {res.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-semibold leading-snug",
                      res.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {mission.title}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      isSystemMetric
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-card text-muted-foreground border-border"
                    )}
                  >
                    {isSystemMetric ? "Auto" : "Manual"}
                  </span>
                  {!readOnly && onDeleteMission && (
                    <button
                      type="button"
                      onClick={() => onDeleteMission(stage.id, mission.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover missão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-foreground tabular-nums">
                  {formatMissionValue(res.current, mission.unit)}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / {formatMissionValue(res.target, mission.unit)}
                  </span>
                </span>

                {!readOnly && !isSystemMetric && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onAdjustMission(stage.id, mission.id, -stepSize)
                      }
                      className="h-6 w-6 rounded-md border bg-card flex items-center justify-center hover:bg-muted text-foreground"
                      aria-label="Diminuir"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdjustMission(stage.id, mission.id, stepSize)
                      }
                      className="h-6 w-6 rounded-md border bg-card flex items-center justify-center hover:bg-muted text-foreground"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <Progress value={res.pct} className="h-1.5" />
            </div>
          );
        })}

        {!readOnly && onAddMission && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAddMission(stage.id)}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova Missão
          </Button>
        )}
      </div>

      <div
        className={cn(
          "px-4 sm:px-5 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2",
          isCompleted
            ? "bg-primary/5 border-primary/25"
            : "bg-muted/30 border-border"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
              isCompleted
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Gift className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground truncate">
            {stage.prizeTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditStagePrize(stage)}
              className="h-8 text-xs px-2.5"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Prêmio
            </Button>
          )}
          {isCompleted && (
            <Button
              type="button"
              size="sm"
              variant={stage.prizeClaimed ? "secondary" : "default"}
              onClick={() => onClaimPrize(stage.id)}
              className="h-8 text-xs px-3 font-bold"
            >
              {stage.prizeClaimed ? "Resgatado" : "Resgatar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
