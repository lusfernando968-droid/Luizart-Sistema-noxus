import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerStage, LiveStudioCounters } from "@/data/careerTestDefaults";
import { evaluateStageStatus } from "./CareerStageCard";
import { ELO_PALETTE, EloCrestSvg } from "./EloCrestSvg";

export interface MapStageItem {
  chapterTitle: string;
  chapterLabel: string;
  stage: CareerStage;
  previousUnlocked: boolean;
}

interface ZigZagGameMapProps {
  items: MapStageItem[];
  counters: LiveStudioCounters;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
}

const X_PATTERN_PCT = [24, 74, 26, 74, 26, 74, 26, 74];

export function ZigZagGameMap({
  items,
  counters,
  selectedStageId,
  onSelectStage,
}: ZigZagGameMapProps) {
  const total = items.length;
  const svgWidth = 400;
  const stepHeight = 118;
  const topPad = 78;
  const bottomPad = 72;
  const svgHeight = Math.max(
    360,
    topPad + bottomPad + Math.max(0, total - 1) * stepHeight
  );

  const stageStatuses = useMemo(
    () =>
      items.map((item) =>
        evaluateStageStatus(item.stage, counters, item.previousUnlocked)
      ),
    [items, counters]
  );

  const targetPlayerIndex = useMemo(() => {
    const activeIdx = stageStatuses.findIndex((s) => s.status === "active");
    if (activeIdx !== -1) return activeIdx;
    const allDone = stageStatuses.every((s) => s.isCompleted);
    return allDone ? Math.max(0, total - 1) : 0;
  }, [stageStatuses, total]);

  const [animatedIndex, setAnimatedIndex] = useState<number>(targetPlayerIndex);

  useEffect(() => {
    if (targetPlayerIndex === animatedIndex) return;
    const direction = targetPlayerIndex > animatedIndex ? 1 : -1;
    const timer = window.setTimeout(() => {
      setAnimatedIndex((curr) => curr + direction);
    }, 480);
    return () => window.clearTimeout(timer);
  }, [targetPlayerIndex, animatedIndex]);

  const points = useMemo(() => {
    return items.map((_, idx) => {
      const xPct = X_PATTERN_PCT[idx % X_PATTERN_PCT.length];
      const yPx = svgHeight - bottomPad - idx * stepHeight;
      const yPct = (yPx / svgHeight) * 100;
      const xPx = (xPct / 100) * svgWidth;
      return { xPct, yPct, xPx, yPx };
    });
  }, [items, svgHeight]);

  const segments = useMemo(() => {
    const list: {
      d: string;
      unlocked: boolean;
      color: string;
      index: number;
    }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midY = (p1.yPx + p2.yPx) / 2;
      const d = `M ${p1.xPx} ${p1.yPx} C ${p1.xPx} ${midY}, ${p2.xPx} ${midY}, ${p2.xPx} ${p2.yPx}`;
      const unlocked = stageStatuses[i]?.isCompleted ?? false;
      const eloPalette =
        ELO_PALETTE[items[i + 1]?.stage.eloKey || "diamante"];
      list.push({
        d,
        unlocked,
        color: eloPalette.rim,
        index: i,
      });
    }
    return list;
  }, [points, stageStatuses, items]);

  const playerPoint = points[animatedIndex] || points[0];
  const currentAnimatedStage = items[animatedIndex]?.stage;

  return (
    <div className="relative rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground overflow-hidden shadow-lg">
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.45) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-44 bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-sidebar-border/80 bg-black/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            Escalada de Elos (Ziguezague)
          </span>
        </div>
        <span className="text-[11px] font-bold text-primary">
          {currentAnimatedStage?.eloName || "Ferro"} • Nível{" "}
          {currentAnimatedStage?.levelNumber || 1}/{total}
        </span>
      </div>

      <div
        className="relative w-full mx-auto max-w-[540px]"
        style={{ height: `${svgHeight}px` }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <filter
              id="noxus-elo-glow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {segments.map((seg) => (
            <g key={seg.index}>
              <path
                d={seg.d}
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="8 8"
              />
              {seg.unlocked && (
                <motion.path
                  d={seg.d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#noxus-elo-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              )}
            </g>
          ))}
        </svg>

        {items.map((item, idx) => {
          const pt = points[idx];
          const evalRes = stageStatuses[idx];
          const isSelected = item.stage.id === selectedStageId;
          const isActive = evalRes.status === "active";
          const isLocked = evalRes.status === "locked";
          const labelOnRight = pt.xPct < 50;
          const eloPalette = ELO_PALETTE[item.stage.eloKey];

          return (
            <div
              key={item.stage.id}
              style={{ left: `${pt.xPct}%`, top: `${pt.yPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 -m-2 rounded-full pointer-events-none"
                  style={{ backgroundColor: eloPalette.glow }}
                  animate={{
                    scale: [1, 1.32, 1],
                    opacity: [0.65, 0.15, 0.65],
                  }}
                  transition={{
                    duration: 2.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onSelectStage(item.stage.id)}
                className={cn(
                  "relative rounded-full p-1 transition-all",
                  isSelected && "ring-2 ring-white/80 bg-white/10"
                )}
              >
                <EloCrestSvg
                  elo={item.stage.eloKey}
                  status={evalRes.status}
                  size="md"
                />
              </motion.button>

              <button
                type="button"
                onClick={() => onSelectStage(item.stage.id)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl border text-left transition-all w-[144px] sm:w-[178px] shadow-md",
                  labelOnRight ? "left-[68px]" : "right-[68px] text-right",
                  isSelected
                    ? "bg-primary text-primary-foreground border-white/60"
                    : isLocked
                    ? "bg-slate-900/85 border-slate-700/80 text-slate-300 hover:border-slate-500"
                    : "bg-slate-900/95 border-primary/40 text-white hover:border-primary"
                )}
              >
                <p
                  className="text-[10px] font-extrabold uppercase tracking-wider truncate"
                  style={{
                    color: isSelected
                      ? "#ffffff"
                      : isLocked
                      ? "#94a3b8"
                      : eloPalette.rim,
                  }}
                >
                  {item.stage.eloName} • {evalRes.progressPct} PDL
                </p>
                <p className="text-xs font-extrabold truncate leading-tight">
                  {item.stage.title}
                </p>
                <p className="text-[10px] opacity-80 truncate">
                  {item.stage.trophyTitle}
                </p>
              </button>
            </div>
          );
        })}

        {playerPoint && (
          <motion.div
            animate={{
              left: `${playerPoint.xPct}%`,
              top: `${playerPoint.yPct}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 95,
              damping: 15,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative -top-10 flex flex-col items-center"
            >
              <div className="px-2.5 py-0.5 rounded-full bg-white text-slate-950 text-[10px] font-extrabold shadow-lg border border-primary flex items-center gap-1 whitespace-nowrap">
                <User className="h-3 w-3 text-primary" />
                Você
              </div>
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white -mt-0.5" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
