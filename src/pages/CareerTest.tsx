import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Database,
  FastForward,
  Layers,
  Map as MapIcon,
  Plus,
  RotateCcw,
  Trophy,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  INITIAL_CAREER_TEST_STATE,
  type CareerBlock,
  type CareerStage,
  type CareerTestState,
  type LiveStudioCounters,
  type MetricSource,
  type TrophyIconKey,
} from "@/data/careerTestDefaults";
import {
  CareerStageCard,
  evaluateStageStatus,
} from "@/components/career/CareerStageCard";
import {
  TrophyCaseGrid,
  type TrophyEntry,
} from "@/components/career/TrophyCaseGrid";
import {
  ELO_PALETTE,
  EloCrestSvg,
  type EloTierKey,
} from "@/components/career/EloCrestSvg";
import {
  ZigZagGameMap,
  type MapStageItem,
} from "@/components/career/ZigZagGameMap";
import { Revenue40kSimulator } from "@/components/career/Revenue40kSimulator";
import { TROPHY_ICON_OPTIONS } from "@/components/career/TrophyIconRenderer";

const STORAGE_KEY = "noxus_jornada_teste_v3";

const ELO_SELECT_OPTIONS: { value: EloTierKey; label: string }[] = [
  { value: "ferro", label: "Ferro" },
  { value: "bronze", label: "Bronze" },
  { value: "prata", label: "Prata" },
  { value: "ouro", label: "Ouro" },
  { value: "platina", label: "Platina" },
  { value: "diamante", label: "Diamante" },
  { value: "mestre", label: "Mestre" },
  { value: "desafiante", label: "Desafiante" },
];

function loadSavedState(): CareerTestState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CAREER_TEST_STATE;
    const parsed = JSON.parse(raw) as CareerTestState;
    if (Array.isArray(parsed.blocks) && Array.isArray(parsed.assistantStages)) {
      return parsed;
    }
  } catch {
    // fallback to defaults
  }
  return INITIAL_CAREER_TEST_STATE;
}

const CareerTest = () => {
  const [state, setState] = useState<CareerTestState>(loadSavedState);
  const [counters, setCounters] = useState<LiveStudioCounters>({
    clientsTotal: 0,
    studentsTotal: 0,
    monthRevenue: 0,
    completedSessions: 0,
  });
  const [activeTab, setActiveTab] = useState("mapa");
  const [previewRole, setPreviewRole] = useState<"owner" | "assistant">("owner");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("all");
  const [selectedOwnerStageId, setSelectedOwnerStageId] = useState<string>("stage-1");
  const [selectedAssistantStageId, setSelectedAssistantStageId] =
    useState<string>("ast-1");

  // Modais
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ title: "", periodLabel: "" });

  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageTargetBlockId, setStageTargetBlockId] = useState<string>("block-1");
  const [stageForm, setStageForm] = useState({
    title: "",
    eloKey: "ouro" as EloTierKey,
    trophyTitle: "",
    trophyIcon: "trophy" as TrophyIconKey,
    prizeTitle: "",
  });

  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [missionTargetStageId, setMissionTargetStageId] = useState<string>("");
  const [missionTargetScope, setMissionTargetScope] = useState<"owner" | "assistant">("owner");
  const [missionForm, setMissionForm] = useState({
    title: "",
    metricSource: "manual" as MetricSource,
    targetValue: "10",
    unit: "clientes",
  });

  const [prizeModalStage, setPrizeModalStage] = useState<CareerStage | null>(null);
  const [prizeModalScope, setPrizeModalScope] = useState<"owner" | "assistant">("owner");
  const [prizeForm, setPrizeForm] = useState({
    title: "",
    eloKey: "ferro" as EloTierKey,
    trophyTitle: "",
    trophyIcon: "trophy" as TrophyIconKey,
    prizeTitle: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const fetchLiveCounters = async () => {
      try {
        const thisMonth = new Date().toISOString().slice(0, 7);
        const [{ data: clients }, { data: fins }, { data: appts }] =
          await Promise.all([
            supabase.from("clientes").select("id, is_student"),
            supabase.from("financial_transactions").select("value, type, date"),
            supabase.from("appointments").select("id, status"),
          ]);

        const clientList = clients || [];
        const studentsCount = clientList.filter((c: any) => Boolean(c.is_student)).length;
        const monthRev = (fins || [])
          .filter((f: any) => f.type === "entrada" && f.date?.startsWith(thisMonth))
          .reduce((acc: number, f: any) => acc + Number(f.value || 0), 0);
        const completedSess = (appts || []).filter(
          (a: any) => a.status === "Concluído"
        ).length;

        setCounters({
          clientsTotal: clientList.length,
          studentsTotal: studentsCount,
          monthRevenue: Math.round(monthRev),
          completedSessions: completedSess,
        });
      } catch {
        // Mantém 0 caso offline
      }
    };

    fetchLiveCounters();
  }, []);

  const ownerSequentialMeta = useMemo(() => {
    const map = new Map<string, boolean>();
    let prevUnlocked = true;

    state.blocks.forEach((block) => {
      block.stages.forEach((stage) => {
        map.set(stage.id, prevUnlocked);
        const evalRes = evaluateStageStatus(stage, counters, prevUnlocked);
        prevUnlocked = prevUnlocked && evalRes.isCompleted;
      });
    });

    return map;
  }, [state.blocks, counters]);

  const assistantSequentialMeta = useMemo(() => {
    const map = new Map<string, boolean>();
    let prevUnlocked = true;

    state.assistantStages.forEach((stage) => {
      map.set(stage.id, prevUnlocked);
      const evalRes = evaluateStageStatus(stage, counters, prevUnlocked);
      prevUnlocked = prevUnlocked && evalRes.isCompleted;
    });

    return map;
  }, [state.assistantStages, counters]);

  const ownerMapItems: MapStageItem[] = useMemo(
    () =>
      state.blocks.flatMap((block) =>
        block.stages.map((stage) => ({
          chapterTitle: block.title,
          chapterLabel: block.periodLabel,
          stage,
          previousUnlocked: ownerSequentialMeta.get(stage.id) ?? false,
        }))
      ),
    [state.blocks, ownerSequentialMeta]
  );

  const assistantMapItems: MapStageItem[] = useMemo(
    () =>
      state.assistantStages.map((stage) => ({
        chapterTitle: "Trilha do Assistente",
        chapterLabel: "Operação",
        stage,
        previousUnlocked: assistantSequentialMeta.get(stage.id) ?? false,
      })),
    [state.assistantStages, assistantSequentialMeta]
  );

  const buildHudMetrics = (items: MapStageItem[]) => {
    const totalStages = items.length;
    let unlockedCount = 0;
    let totalPdl = 0;
    let currentItem: MapStageItem | null = null;
    let currentPdl = 0;

    items.forEach((item) => {
      const res = evaluateStageStatus(item.stage, counters, item.previousUnlocked);
      totalPdl += res.progressPct;
      if (res.isCompleted) {
        unlockedCount += 1;
      } else if (!currentItem) {
        currentItem = item;
        currentPdl = res.progressPct;
      }
    });

    const activeItem = currentItem || items[items.length - 1] || null;
    const maxPdl = totalStages * 100;
    const activeStatus = activeItem
      ? evaluateStageStatus(
          activeItem.stage,
          counters,
          activeItem.previousUnlocked
        )
      : null;

    return {
      totalStages,
      unlockedCount,
      totalPdl,
      maxPdl,
      currentPdl: activeStatus?.isCompleted ? 100 : currentPdl,
      activeStage: activeItem?.stage || null,
      overallPct: maxPdl > 0 ? Math.round((totalPdl / maxPdl) * 100) : 0,
    };
  };

  const ownerHud = useMemo(
    () => buildHudMetrics(ownerMapItems),
    [ownerMapItems, counters]
  );
  const assistantHud = useMemo(
    () => buildHudMetrics(assistantMapItems),
    [assistantMapItems, counters]
  );

  const activeMapItems =
    previewRole === "owner" ? ownerMapItems : assistantMapItems;
  const activeHud = previewRole === "owner" ? ownerHud : assistantHud;
  const selectedStageId =
    previewRole === "owner" ? selectedOwnerStageId : selectedAssistantStageId;
  const setSelectedStageId =
    previewRole === "owner"
      ? setSelectedOwnerStageId
      : setSelectedAssistantStageId;

  const selectedMapItem = useMemo(
    () =>
      activeMapItems.find((i) => i.stage.id === selectedStageId) ||
      activeMapItems.find((i) => i.stage.id === activeHud.activeStage?.id) ||
      activeMapItems[0] ||
      null,
    [activeMapItems, selectedStageId, activeHud.activeStage]
  );

  const ownerTrophyEntries: TrophyEntry[] = useMemo(
    () =>
      ownerMapItems.map((item) => ({
        blockTitle: item.chapterTitle,
        stage: item.stage,
        previousUnlocked: item.previousUnlocked,
      })),
    [ownerMapItems]
  );

  const assistantTrophyEntries: TrophyEntry[] = useMemo(
    () =>
      assistantMapItems.map((item) => ({
        blockTitle: item.chapterTitle,
        stage: item.stage,
        previousUnlocked: item.previousUnlocked,
      })),
    [assistantMapItems]
  );

  const updateStagesList = (
    scope: "owner" | "assistant",
    updater: (stage: CareerStage) => CareerStage
  ) => {
    setState((prev) => {
      if (scope === "assistant") {
        return {
          ...prev,
          assistantStages: prev.assistantStages.map(updater),
        };
      }
      return {
        ...prev,
        blocks: prev.blocks.map((block) => ({
          ...block,
          stages: block.stages.map(updater),
        })),
      };
    });
  };

  const handleToggleMission = (
    scope: "owner" | "assistant",
    stageId: string,
    missionId: string
  ) => {
    updateStagesList(scope, (stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        missions: stage.missions.map((m) =>
          m.id === missionId ? { ...m, completed: !m.completed } : m
        ),
      };
    });
  };

  const handleAdjustMission = (
    scope: "owner" | "assistant",
    stageId: string,
    missionId: string,
    delta: number
  ) => {
    updateStagesList(scope, (stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        missions: stage.missions.map((m) => {
          if (m.id !== missionId) return m;
          const nextVal = Math.max(0, m.currentValue + delta);
          return {
            ...m,
            currentValue: nextVal,
            completed: nextVal >= m.targetValue,
          };
        }),
      };
    });
  };

  const handleDeleteMission = (
    scope: "owner" | "assistant",
    stageId: string,
    missionId: string
  ) => {
    updateStagesList(scope, (stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        missions: stage.missions.filter((m) => m.id !== missionId),
      };
    });
    toast.success("Missão removida");
  };

  const handleClaimPrize = (scope: "owner" | "assistant", stageId: string) => {
    updateStagesList(scope, (stage) =>
      stage.id === stageId
        ? { ...stage, prizeClaimed: !stage.prizeClaimed }
        : stage
    );
    toast.success("Prêmio atualizado");
  };

  // Botão rápido de demonstração para subir de Elo e ver a animação no ziguezague
  const handleSimulateAdvanceElo = () => {
    const items = activeMapItems;
    const nextIncomplete = items.find((item) => {
      const res = evaluateStageStatus(
        item.stage,
        counters,
        item.previousUnlocked
      );
      return !res.isCompleted;
    });

    if (!nextIncomplete) {
      toast.success("Todos os Elos já estão desbloqueados!");
      return;
    }

    updateStagesList(previewRole, (stage) => {
      if (stage.id !== nextIncomplete.stage.id) return stage;
      return {
        ...stage,
        missions: stage.missions.map((m) => ({
          ...m,
          currentValue: Math.max(m.currentValue, m.targetValue),
          completed: true,
        })),
      };
    });

    const nextIdx = items.findIndex((i) => i.stage.id === nextIncomplete.stage.id) + 1;
    const promotedStage = items[nextIdx]?.stage || nextIncomplete.stage;
    setSelectedStageId(promotedStage.id);
    toast.success(
      `Promoção! Você avançou para ${promotedStage.eloName} (${promotedStage.title})`
    );
  };

  const openEditPrizeModal = (
    scope: "owner" | "assistant",
    stage: CareerStage
  ) => {
    setPrizeModalScope(scope);
    setPrizeModalStage(stage);
    setPrizeForm({
      title: stage.title,
      eloKey: stage.eloKey,
      trophyTitle: stage.trophyTitle,
      trophyIcon: stage.trophyIcon,
      prizeTitle: stage.prizeTitle,
    });
  };

  const handleSavePrizeModal = () => {
    if (!prizeModalStage) return;
    updateStagesList(prizeModalScope, (stage) =>
      stage.id === prizeModalStage.id
        ? {
            ...stage,
            title: prizeForm.title.trim() || stage.title,
            eloKey: prizeForm.eloKey,
            eloName: ELO_PALETTE[prizeForm.eloKey].label,
            trophyTitle: prizeForm.trophyTitle.trim() || stage.trophyTitle,
            trophyIcon: prizeForm.trophyIcon,
            prizeTitle: prizeForm.prizeTitle.trim() || stage.prizeTitle,
          }
        : stage
    );
    setPrizeModalStage(null);
    toast.success("Elo, troféu e prêmio salvos");
  };

  const handleCreateBlock = () => {
    if (!blockForm.title.trim()) return;
    const newBlock: CareerBlock = {
      id: `block-${Date.now()}`,
      title: blockForm.title.trim(),
      periodLabel: blockForm.periodLabel.trim() || "Capítulo Extra",
      stages: [],
    };
    setState((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setBlockForm({ title: "", periodLabel: "" });
    setBlockModalOpen(false);
    toast.success("Capítulo criado");
  };

  const handleCreateStage = () => {
    if (!stageForm.title.trim()) return;
    const totalCurrent = state.blocks.reduce(
      (acc, b) => acc + b.stages.length,
      0
    );
    const newStage: CareerStage = {
      id: `stage-${Date.now()}`,
      levelNumber: totalCurrent + 1,
      eloKey: stageForm.eloKey,
      eloName: ELO_PALETTE[stageForm.eloKey].label,
      title: stageForm.title.trim(),
      trophyTitle:
        stageForm.trophyTitle.trim() || `Troféu Nível ${totalCurrent + 1}`,
      trophyIcon: stageForm.trophyIcon,
      prizeTitle: stageForm.prizeTitle.trim() || "Definir prêmio",
      prizeClaimed: false,
      missions: [],
    };
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === stageTargetBlockId
          ? { ...b, stages: [...b.stages, newStage] }
          : b
      ),
    }));
    setStageForm({
      title: "",
      eloKey: "ouro",
      trophyTitle: "",
      trophyIcon: "trophy",
      prizeTitle: "",
    });
    setStageModalOpen(false);
    toast.success("Elo adicionado");
  };

  const openAddMissionModal = (
    scope: "owner" | "assistant",
    stageId: string
  ) => {
    setMissionTargetScope(scope);
    setMissionTargetStageId(stageId);
    setMissionForm({
      title: "",
      metricSource: "manual",
      targetValue: "10",
      unit: "clientes",
    });
    setMissionModalOpen(true);
  };

  const handleCreateMission = () => {
    if (!missionForm.title.trim() || !missionTargetStageId) return;
    const target = Math.max(1, Number(missionForm.targetValue) || 1);
    const unitBySource: Record<MetricSource, string> = {
      manual: missionForm.unit.trim() || "itens",
      clients_total: "clientes",
      students_total: "alunos",
      month_revenue: "R$",
      completed_sessions: "sessões",
    };

    const newMission = {
      id: `m-${Date.now()}`,
      title: missionForm.title.trim(),
      metricSource: missionForm.metricSource,
      currentValue: 0,
      targetValue: target,
      unit: unitBySource[missionForm.metricSource],
      completed: false,
    };

    updateStagesList(missionTargetScope, (stage) =>
      stage.id === missionTargetStageId
        ? { ...stage, missions: [...stage.missions, newMission] }
        : stage
    );
    setMissionModalOpen(false);
    toast.success("Missão adicionada");
  };

  const handleResetTemplate = () => {
    setState(INITIAL_CAREER_TEST_STATE);
    setSelectedOwnerStageId("stage-1");
    setSelectedAssistantStageId("ast-1");
    toast.success("Progresso resetado para o início");
  };

  const visibleBlocks =
    selectedBlockId === "all"
      ? state.blocks
      : state.blocks.filter((b) => b.id === selectedBlockId);

  const activeEloPalette =
    ELO_PALETTE[activeHud.activeStage?.eloKey || "ferro"];

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-5"
      >
        {/* Cabeçalho Padrão do Sistema */}
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">Jornada & Elos</h1>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase"
              >
                Ranking 2 Anos
              </Badge>
            </div>
            <p className="page-subtitle">
              Sistema de Elos, PDL, troféus e metas do estúdio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
              <button
                type="button"
                onClick={() => {
                  setPreviewRole("owner");
                  setActiveTab("mapa");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  previewRole === "owner"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Visão Dono
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewRole("assistant");
                  setActiveTab("mapa");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  previewRole === "assistant"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Visão Assistente
              </button>
            </div>

            {previewRole === "owner" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetTemplate}
                  className="h-9 px-3 text-xs font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Resetar
                </Button>
                <Button
                  type="button"
                  onClick={() => setStageModalOpen(true)}
                  className="h-9 px-3 text-xs font-bold shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Novo Elo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* HUD Ranked (Estilo LoL / Noxus Dark) */}
        <div className="rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <EloCrestSvg
                elo={activeHud.activeStage?.eloKey || "ferro"}
                status="active"
                size="lg"
              />

              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border"
                    style={{
                      color: activeEloPalette.rim,
                      borderColor: activeEloPalette.rim,
                      backgroundColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    Elo {activeHud.activeStage?.eloName || "Ferro"}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {activeHud.currentPdl} / 100 PDL
                  </span>
                  <span className="text-xs text-sidebar-foreground/60">
                    • {activeHud.totalPdl} pts acumulados
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold truncate">
                  {activeHud.activeStage?.title || "—"}
                </h2>

                <div className="flex items-center gap-3 max-w-md">
                  <Progress
                    value={activeHud.overallPct}
                    className="h-2 flex-1 bg-slate-800"
                  />
                  <span className="text-xs font-bold text-sidebar-foreground/80 tabular-nums">
                    {activeHud.overallPct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/25 border border-sidebar-border text-xs">
                <Database className="h-4 w-4 text-primary shrink-0" />
                <span className="font-bold">{counters.clientsTotal}</span>
                <span className="text-sidebar-foreground/65">clientes</span>
                <span className="text-sidebar-foreground/40">•</span>
                <span className="font-bold">{counters.studentsTotal}</span>
                <span className="text-sidebar-foreground/65">alunos</span>
                <span className="text-sidebar-foreground/40">•</span>
                <span className="font-bold">
                  R$ {counters.monthRevenue.toLocaleString("pt-BR")}
                </span>
              </div>

              {previewRole === "owner" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSimulateAdvanceElo}
                  className="h-9 px-3 text-xs font-bold shadow-md"
                >
                  <FastForward className="h-3.5 w-3.5 mr-1.5" />
                  Simular +1 Elo
                </Button>
              )}
            </div>
          </div>

          {/* Barra horizontal de todos os Elos da Escada */}
          <div className="pt-3 border-t border-sidebar-border/80 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {activeMapItems.map((item) => {
              const evalRes = evaluateStageStatus(
                item.stage,
                counters,
                item.previousUnlocked
              );
              const isSelected = selectedMapItem?.stage.id === item.stage.id;

              return (
                <button
                  key={item.stage.id}
                  type="button"
                  onClick={() => {
                    setSelectedStageId(item.stage.id);
                    if (activeTab !== "mapa") setActiveTab("mapa");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all shrink-0",
                    isSelected
                      ? "bg-primary/20 border-primary text-white"
                      : evalRes.status === "locked"
                      ? "bg-black/20 border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                      : "bg-black/30 border-sidebar-border text-sidebar-foreground hover:border-primary/50"
                  )}
                >
                  <EloCrestSvg
                    elo={item.stage.eloKey}
                    status={evalRes.status}
                    size="sm"
                  />
                  <div className="text-left">
                    <p className="text-[11px] font-bold leading-none">
                      {item.stage.eloName}
                    </p>
                    <p className="text-[10px] opacity-70 mt-0.5 tabular-nums">
                      {evalRes.progressPct} PDL
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Abas de Navegação abaixo do cabeçalho */}
        <div className="flex w-full overflow-x-auto hide-scrollbar items-center gap-3">
          <TabsList className="bg-muted p-1 inline-flex w-max">
            <TabsTrigger
              value="mapa"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <MapIcon className="w-3.5 h-3.5" />
              Mapa de Elos
            </TabsTrigger>
            {previewRole === "owner" && (
              <TabsTrigger
                value="blocos"
                className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                Capítulos
              </TabsTrigger>
            )}
            <TabsTrigger
              value="trofeus"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5" />
              Sala de Troféus
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                {activeHud.unlockedCount}/{activeHud.totalStages}
              </span>
            </TabsTrigger>
            {previewRole === "owner" && (
              <>
                <TabsTrigger
                  value="simulador"
                  className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Simulador 40k
                </TabsTrigger>
                <TabsTrigger
                  value="assistente"
                  className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Elos do Assistente
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* ABA 1: MAPA ZIGUEZAGUE + MISSÕES DO ELO SELECIONADO */}
        <TabsContent value="mapa" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7">
              <ZigZagGameMap
                items={activeMapItems}
                counters={counters}
                selectedStageId={selectedMapItem?.stage.id || ""}
                onSelectStage={setSelectedStageId}
              />
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
              {selectedMapItem && (
                <CareerStageCard
                  stage={selectedMapItem.stage}
                  counters={counters}
                  previousUnlocked={selectedMapItem.previousUnlocked}
                  readOnly={previewRole === "assistant"}
                  onToggleMission={(stageId, missionId) =>
                    handleToggleMission(previewRole, stageId, missionId)
                  }
                  onAdjustMission={(stageId, missionId, delta) =>
                    handleAdjustMission(previewRole, stageId, missionId, delta)
                  }
                  onDeleteMission={
                    previewRole === "owner"
                      ? (stageId, missionId) =>
                          handleDeleteMission("owner", stageId, missionId)
                      : undefined
                  }
                  onAddMission={
                    previewRole === "owner"
                      ? (stageId) => openAddMissionModal("owner", stageId)
                      : undefined
                  }
                  onEditStagePrize={(st) => openEditPrizeModal(previewRole, st)}
                  onClaimPrize={(stageId) =>
                    handleClaimPrize(previewRole, stageId)
                  }
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: CAPÍTULOS / BLOCOS COMPLETOS */}
        {previewRole === "owner" && (
          <TabsContent value="blocos" className="m-0 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedBlockId("all")}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedBlockId === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({state.blocks.length})
                </button>
                {state.blocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedBlockId === block.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {block.title}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBlockModalOpen(true)}
                className="h-8 text-xs font-semibold w-full sm:w-auto shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo Capítulo
              </Button>
            </div>

            <div className="space-y-6">
              {visibleBlocks.map((block) => {
                const stageProgresses = block.stages.map((st) =>
                  evaluateStageStatus(
                    st,
                    counters,
                    ownerSequentialMeta.get(st.id) ?? false
                  )
                );
                const blockPct =
                  stageProgresses.length === 0
                    ? 0
                    : Math.round(
                        stageProgresses.reduce((a, b) => a + b.progressPct, 0) /
                          stageProgresses.length
                      );

                return (
                  <section key={block.id} className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-foreground">
                          {block.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground border-border text-[11px]"
                        >
                          {block.periodLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-48">
                        <Progress value={blockPct} className="h-1.5 flex-1" />
                        <span className="text-xs font-bold text-primary shrink-0">
                          {blockPct}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {block.stages.map((stage) => (
                        <CareerStageCard
                          key={stage.id}
                          stage={stage}
                          counters={counters}
                          previousUnlocked={
                            ownerSequentialMeta.get(stage.id) ?? false
                          }
                          onToggleMission={(stageId, missionId) =>
                            handleToggleMission("owner", stageId, missionId)
                          }
                          onAdjustMission={(stageId, missionId, delta) =>
                            handleAdjustMission(
                              "owner",
                              stageId,
                              missionId,
                              delta
                            )
                          }
                          onDeleteMission={(stageId, missionId) =>
                            handleDeleteMission("owner", stageId, missionId)
                          }
                          onAddMission={(stageId) =>
                            openAddMissionModal("owner", stageId)
                          }
                          onEditStagePrize={(st) =>
                            openEditPrizeModal("owner", st)
                          }
                          onClaimPrize={(stageId) =>
                            handleClaimPrize("owner", stageId)
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* ABA 3: SALA DE TROFÉUS */}
        <TabsContent value="trofeus" className="m-0">
          <TrophyCaseGrid
            entries={
              previewRole === "assistant"
                ? assistantTrophyEntries
                : ownerTrophyEntries
            }
            counters={counters}
            readOnly={previewRole === "assistant"}
            onEditTrophy={(stage) => openEditPrizeModal(previewRole, stage)}
            onClaimPrize={(stageId) => handleClaimPrize(previewRole, stageId)}
          />
        </TabsContent>

        {/* ABA 4: SIMULADOR 40K */}
        {previewRole === "owner" && (
          <TabsContent value="simulador" className="m-0">
            <Revenue40kSimulator />
          </TabsContent>
        )}

        {/* ABA 5: ELOS DO ASSISTENTE */}
        {previewRole === "owner" && (
          <TabsContent value="assistente" className="m-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {state.assistantStages.map((stage) => (
                <CareerStageCard
                  key={stage.id}
                  stage={stage}
                  counters={counters}
                  previousUnlocked={
                    assistantSequentialMeta.get(stage.id) ?? false
                  }
                  onToggleMission={(stageId, missionId) =>
                    handleToggleMission("assistant", stageId, missionId)
                  }
                  onAdjustMission={(stageId, missionId, delta) =>
                    handleAdjustMission("assistant", stageId, missionId, delta)
                  }
                  onDeleteMission={(stageId, missionId) =>
                    handleDeleteMission("assistant", stageId, missionId)
                  }
                  onAddMission={(stageId) =>
                    openAddMissionModal("assistant", stageId)
                  }
                  onEditStagePrize={(st) =>
                    openEditPrizeModal("assistant", st)
                  }
                  onClaimPrize={(stageId) =>
                    handleClaimPrize("assistant", stageId)
                  }
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal: Novo Capítulo */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Capítulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={blockForm.title}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Ex: Expansão Internacional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Liga / Subtítulo</Label>
              <Input
                value={blockForm.periodLabel}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, periodLabel: e.target.value }))
                }
                placeholder="Ex: Liga Suprema"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateBlock}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Elo */}
      <Dialog open={stageModalOpen} onOpenChange={setStageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Elo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Capítulo</Label>
                <Select
                  value={stageTargetBlockId}
                  onValueChange={setStageTargetBlockId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.blocks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Patente (Elo)</Label>
                <Select
                  value={stageForm.eloKey}
                  onValueChange={(v) =>
                    setStageForm((p) => ({ ...p, eloKey: v as EloTierKey }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELO_SELECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Título Temático</Label>
              <Input
                value={stageForm.title}
                onChange={(e) =>
                  setStageForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Ex: Tatuador Artilheiro"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do Troféu</Label>
                <Input
                  value={stageForm.trophyTitle}
                  onChange={(e) =>
                    setStageForm((p) => ({ ...p, trophyTitle: e.target.value }))
                  }
                  placeholder="Ex: Troféu Steve Jobs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ícone</Label>
                <Select
                  value={stageForm.trophyIcon}
                  onValueChange={(v) =>
                    setStageForm((p) => ({
                      ...p,
                      trophyIcon: v as TrophyIconKey,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TROPHY_ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Prêmio Definido</Label>
              <Input
                value={stageForm.prizeTitle}
                onChange={(e) =>
                  setStageForm((p) => ({ ...p, prizeTitle: e.target.value }))
                }
                placeholder="Ex: Viagem ou Equipamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStageModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateStage}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Missão */}
      <Dialog open={missionModalOpen} onOpenChange={setMissionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Missão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Objetivo</Label>
              <Input
                value={missionForm.title}
                onChange={(e) =>
                  setMissionForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Ex: Alcançar 50 assinantes no software"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Origem do Progresso</Label>
              <Select
                value={missionForm.metricSource}
                onValueChange={(v) =>
                  setMissionForm((p) => ({
                    ...p,
                    metricSource: v as MetricSource,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="clients_total">
                    Sistema · Total de Clientes
                  </SelectItem>
                  <SelectItem value="students_total">
                    Sistema · Alunos de Tatuagem
                  </SelectItem>
                  <SelectItem value="month_revenue">
                    Sistema · Faturamento do Mês
                  </SelectItem>
                  <SelectItem value="completed_sessions">
                    Sistema · Sessões Concluídas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Alvo</Label>
                <Input
                  type="number"
                  min={1}
                  value={missionForm.targetValue}
                  onChange={(e) =>
                    setMissionForm((p) => ({
                      ...p,
                      targetValue: e.target.value,
                    }))
                  }
                />
              </div>
              {missionForm.metricSource === "manual" && (
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Input
                    value={missionForm.unit}
                    onChange={(e) =>
                      setMissionForm((p) => ({ ...p, unit: e.target.value }))
                    }
                    placeholder="clientes / alunos / R$"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMissionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateMission}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Elo, Troféu & Prêmio */}
      <Dialog
        open={Boolean(prizeModalStage)}
        onOpenChange={(open) => !open && setPrizeModalStage(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar Elo & Prêmio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Patente (Elo)</Label>
                <Select
                  value={prizeForm.eloKey}
                  onValueChange={(v) =>
                    setPrizeForm((p) => ({ ...p, eloKey: v as EloTierKey }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELO_SELECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Título Temático</Label>
                <Input
                  value={prizeForm.title}
                  onChange={(e) =>
                    setPrizeForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do Troféu</Label>
                <Input
                  value={prizeForm.trophyTitle}
                  onChange={(e) =>
                    setPrizeForm((p) => ({ ...p, trophyTitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ícone</Label>
                <Select
                  value={prizeForm.trophyIcon}
                  onValueChange={(v) =>
                    setPrizeForm((p) => ({
                      ...p,
                      trophyIcon: v as TrophyIconKey,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TROPHY_ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Prêmio Definido por Você</Label>
              <Input
                value={prizeForm.prizeTitle}
                onChange={(e) =>
                  setPrizeForm((p) => ({ ...p, prizeTitle: e.target.value }))
                }
                placeholder="Ex: Jantar, folga, equipamento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPrizeModalStage(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSavePrizeModal}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CareerTest;
