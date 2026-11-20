import { useState, useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Compass,
  Target,
  Calendar,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  TrendingUp,
  DollarSign,
  FolderKanban,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  UserCheck,
  Calculator,
  Video,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StrategicItem {
  id: string;
  item_type: "kpi_config" | "project" | "daily_task" | "journal" | "idea" | "assistant_mission";
  title: string;
  category: string;
  status: string;
  horizon: "3_meses" | "anual" | "diario";
  project_id?: string | null;
  progress: number;
  target_value: number;
  current_value: number;
  content: string;
  metadata: any;
  entry_date: string;
  created_at: string;
}

const Strategy = () => {
  const navigate = useNavigate();
  // Trava de Segurança: Exclusivo para o Dono
  const userStr = localStorage.getItem("noxus_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAssistant = user?.role === "ASSISTANT" || user?.name?.includes("Gabriel");

  const [activeTab, setActiveTab] = useState("projetos");
  const [items, setItems] = useState<StrategicItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Métricas reais do estúdio para cruzar com as KPIs estratégicas
  const [studioMetrics, setStudioMetrics] = useState({
    monthRevenue: 0,
    scheduledMonthRevenue: 0,
    yearRevenue: 0,
    monthSessions: 0,
    avgTicket: 0,
  });
  const [funnelRadar, setFunnelRadar] = useState({
    orcamentoCount: 0,
    onboardingCount: 0,
    remarcarCount: 0,
    remarcarValue: 0,
    waitlistCount: 0,
  });
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [strategicBlocks, setStrategicBlocks] = useState<any[]>([]);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "11:00",
    reason: "Bloco Estratégico (QG)",
  });

  // Delegação de Missões para o Assistente
  const [missionTitle, setMissionTitle] = useState("");
  const [missionNotes, setMissionNotes] = useState("");
  const [missionPriority, setMissionPriority] = useState("Alta");

  // Simulador de Preço & Hora Tatuada
  const [simTicketAdd, setSimTicketAdd] = useState(150);
  const [simMonthlySessions, setSimMonthlySessions] = useState(18);
  const [simHoursPerSession, setSimHoursPerSession] = useState(3.5);

  // Modal de Roteiro Rápido (Ponte com Estúdio Motion / Conteúdo)
  const [scriptIdea, setScriptIdea] = useState<StrategicItem | null>(null);
  const [scriptForm, setScriptForm] = useState({
    hook: "",
    body: "",
    cta: "",
  });

  // Config de Metas KPI
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(25000);
  const [annualGoalInput, setAnnualGoalInput] = useState(300000);

  // Modal Novo / Editar Projeto (3 Meses ou Anual)
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<StrategicItem | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    category: "Financeiro",
    horizon: "3_meses" as "3_meses" | "anual",
    target_value: 0,
    progress: 0,
    content: "",
    milestonesText: "",
  });

  // Expansão de documentação de projetos
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectHorizonFilter, setProjectHorizonFilter] = useState<"all" | "3_meses" | "anual">("all");
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, string>>({});
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTempContent, setDocTempContent] = useState("");

  // Tarefas do Dia
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("none");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("Alta");

  // Diário de Atividade
  const [journalProjectFilter, setJournalProjectFilter] = useState<string>("all");
  const [journalSearch, setJournalSearch] = useState("");
  const [journalForm, setJournalForm] = useState({
    project_id: "none",
    what_i_did: "",
    to_improve: "",
    new_idea: "",
    addIdeaToChecklist: true,
  });

  // Checklist de Ideias
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaCategory, setNewIdeaCategory] = useState("Marketing");
  const [newIdeaProjectId, setNewIdeaProjectId] = useState("none");
  const [ideaFilter, setIdeaFilter] = useState("all");

  const todayStr = new Date().toISOString().split("T")[0];
  const thisMonthStr = todayStr.slice(0, 7);
  const currentYear = new Date().getFullYear();

  const fetchStrategicData = async () => {
    try {
      setLoading(true);
      const [
        { data: stratData, error: stratError },
        { data: finsData },
        { data: apptsData },
        { data: blocksData },
        { data: clientsData },
      ] = await Promise.all([
        supabase
          .from("strategic_workspace")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("financial_transactions").select("value, type, date"),
        supabase.from("appointments").select("id, value, status, date, start_time, end_time, type, client:clientes(name)"),
        supabase.from("agenda_blocks").select("*").gte("date", todayStr).order("date", { ascending: true }),
        supabase.from("clientes").select("id, status, is_waitlist"),
      ]);

      if (stratError) throw stratError;

      const list = (stratData || []) as StrategicItem[];
      setItems(list);
      setStrategicBlocks(blocksData || []);

      const kpiConfig = list.find((i) => i.item_type === "kpi_config");
      if (kpiConfig) {
        setMonthlyGoalInput(Number(kpiConfig.target_value || 25000));
        setAnnualGoalInput(Number(kpiConfig.current_value || 300000));
      }

      // Calcular métricas reais
      const entries = (finsData || []).filter((f: any) => f.type === "entrada");
      const monthRev = entries
        .filter((f: any) => f.date?.startsWith(thisMonthStr))
        .reduce((acc: number, curr: any) => acc + Number(curr.value || 0), 0);

      const yearRev = entries
        .filter((f: any) => f.date?.startsWith(String(currentYear)))
        .reduce((acc: number, curr: any) => acc + Number(curr.value || 0), 0);

      const completedMonthAppts = (apptsData || []).filter(
        (a: any) => a.date?.startsWith(thisMonthStr) && a.status === "Concluído"
      );
      const scheduledMonthAppts = (apptsData || []).filter(
        (a: any) =>
          a.date?.startsWith(thisMonthStr) &&
          (a.status === "Agendado" || a.status === "Confirmado")
      );
      const scheduledRev = scheduledMonthAppts.reduce(
        (acc: number, a: any) => acc + Number(a.value || 0),
        0
      );

      const todayList = (apptsData || [])
        .filter((a: any) => a.date === todayStr && a.status !== "Cancelado")
        .sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));
      setTodayAppts(todayList);

      const avgTkt =
        completedMonthAppts.length > 0
          ? completedMonthAppts.reduce((acc: number, a: any) => acc + Number(a.value || 0), 0) /
            completedMonthAppts.length
          : scheduledMonthAppts.length > 0
          ? scheduledRev / scheduledMonthAppts.length
          : 500;

      setStudioMetrics({
        monthRevenue: monthRev,
        scheduledMonthRevenue: scheduledRev,
        yearRevenue: yearRev,
        monthSessions: completedMonthAppts.length,
        avgTicket: avgTkt,
      });

      const allClients = clientsData || [];
      const orcamentoCount = allClients.filter((c: any) => c.status === "Orçamento").length;
      const onboardingCount = allClients.filter((c: any) => c.status === "Onboarding").length;
      const waitlistCount = allClients.filter((c: any) => Boolean(c.is_waitlist)).length;
      const remarcarAppts = (apptsData || []).filter((a: any) => a.status === "Para Remarcar");
      const remarcarValue = remarcarAppts.reduce(
        (acc: number, a: any) => acc + Number(a.value || avgTkt || 500),
        0
      );

      setFunnelRadar({
        orcamentoCount,
        onboardingCount,
        remarcarCount: remarcarAppts.length,
        remarcarValue,
        waitlistCount,
      });
    } catch (error) {
      console.error("Erro ao carregar dados estratégicos:", error);
      toast.error("Erro ao carregar painel estratégico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAssistant) {
      fetchStrategicData();
    }
  }, [isAssistant]);

  if (isAssistant) {
    return <Navigate to="/agenda" replace />;
  }

  const projects = useMemo(
    () => items.filter((i) => i.item_type === "project"),
    [items]
  );

  const dailyTasks = useMemo(
    () => items.filter((i) => i.item_type === "daily_task"),
    [items]
  );

  const journalEntries = useMemo(
    () => items.filter((i) => i.item_type === "journal"),
    [items]
  );

  const ideas = useMemo(
    () => items.filter((i) => i.item_type === "idea"),
    [items]
  );

  const assistantMissions = useMemo(
    () => items.filter((i) => i.item_type === "assistant_mission"),
    [items]
  );

  // Salvar Metas KPI
  const handleSaveKpiGoals = async () => {
    try {
      const existing = items.find((i) => i.item_type === "kpi_config");
      if (existing) {
        const { error } = await supabase
          .from("strategic_workspace")
          .update({
            target_value: monthlyGoalInput,
            current_value: annualGoalInput,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("strategic_workspace").insert([
          {
            item_type: "kpi_config",
            title: "Metas Financeiras",
            target_value: monthlyGoalInput,
            current_value: annualGoalInput,
          },
        ]);
        if (error) throw error;
      }
      toast.success("Metas atualizadas!");
      setKpiModalOpen(false);
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao salvar metas.");
    }
  };

  // Criar ou Editar Projeto (3 Meses / Anual)
  const openNewProjectModal = (defaultHorizon: "3_meses" | "anual" = "3_meses") => {
    setEditingProject(null);
    setProjectForm({
      title: "",
      category: "Financeiro",
      horizon: defaultHorizon,
      target_value: 0,
      progress: 0,
      content: "",
      milestonesText: "",
    });
    setProjectModalOpen(true);
  };

  const openEditProjectModal = (proj: StrategicItem) => {
    setEditingProject(proj);
    const milestones = Array.isArray(proj.metadata?.milestones)
      ? proj.metadata.milestones.map((m: any) => m.title).join("\n")
      : "";
    setProjectForm({
      title: proj.title || "",
      category: proj.category || "Financeiro",
      horizon: (proj.horizon as "3_meses" | "anual") || "3_meses",
      target_value: Number(proj.target_value || 0),
      progress: Number(proj.progress || 0),
      content: proj.content || "",
      milestonesText: milestones,
    });
    setProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }
    try {
      const existingMilestones = Array.isArray(editingProject?.metadata?.milestones)
        ? editingProject!.metadata.milestones
        : [];

      const parsedMilestones = projectForm.milestonesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const found = existingMilestones.find((m: any) => m.title === line);
          return found || { id: String(Date.now() + Math.random()), title: line, done: false };
        });

      const autoProgress =
        parsedMilestones.length > 0
          ? Math.round(
              (parsedMilestones.filter((m: any) => m.done).length / parsedMilestones.length) * 100
            )
          : projectForm.progress;

      const payload = {
        item_type: "project",
        title: projectForm.title.trim(),
        category: projectForm.category,
        horizon: projectForm.horizon,
        target_value: projectForm.target_value,
        progress: autoProgress,
        content: projectForm.content,
        metadata: {
          ...(editingProject?.metadata || {}),
          milestones: parsedMilestones,
        },
        updated_at: new Date().toISOString(),
      };

      if (editingProject) {
        const { error } = await supabase
          .from("strategic_workspace")
          .update(payload)
          .eq("id", editingProject.id);
        if (error) throw error;
        toast.success("Projeto atualizado!");
      } else {
        const { data, error } = await supabase
          .from("strategic_workspace")
          .insert([{ ...payload, entry_date: todayStr }])
          .select()
          .single();
        if (error) throw error;
        if (data?.id) setExpandedProjectId(data.id);
        toast.success("Projeto estratégico criado!");
      }

      setProjectModalOpen(false);
      fetchStrategicData();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar projeto.");
    }
  };

  const handleToggleProjectMilestone = async (proj: StrategicItem, milestoneId: string) => {
    const milestones = Array.isArray(proj.metadata?.milestones) ? proj.metadata.milestones : [];
    const updated = milestones.map((m: any) =>
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );
    const doneCount = updated.filter((m: any) => m.done).length;
    const newProgress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : proj.progress;

    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({
          progress: newProgress,
          metadata: { ...(proj.metadata || {}), milestones: updated },
        })
        .eq("id", proj.id);
      if (error) throw error;
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao atualizar entrega.");
    }
  };

  const handleAddProjectMilestone = async (proj: StrategicItem) => {
    const text = (newMilestoneInputs[proj.id] || "").trim();
    if (!text) return;
    const milestones = Array.isArray(proj.metadata?.milestones) ? proj.metadata.milestones : [];
    const updated = [...milestones, { id: String(Date.now()), title: text, done: false }];
    const doneCount = updated.filter((m: any) => m.done).length;
    const newProgress = Math.round((doneCount / updated.length) * 100);

    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({
          progress: newProgress,
          metadata: { ...(proj.metadata || {}), milestones: updated },
        })
        .eq("id", proj.id);
      if (error) throw error;
      setNewMilestoneInputs((prev) => ({ ...prev, [proj.id]: "" }));
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao adicionar entrega.");
    }
  };

  const handleSaveProjectDoc = async (projId: string) => {
    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({ content: docTempContent, updated_at: new Date().toISOString() })
        .eq("id", projId);
      if (error) throw error;
      setEditingDocId(null);
      toast.success("Documentação salva!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao salvar documentação.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("strategic_workspace").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item removido.");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao remover item.");
    }
  };

  // Tarefas do Dia
  const handleAddDailyTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const { error } = await supabase.from("strategic_workspace").insert([
        {
          item_type: "daily_task",
          title: newTaskTitle.trim(),
          category: newTaskPriority,
          status: "Pendente",
          horizon: "diario",
          project_id: newTaskProjectId === "none" ? null : newTaskProjectId,
          entry_date: todayStr,
        },
      ]);
      if (error) throw error;
      setNewTaskTitle("");
      toast.success("Tarefa adicionada ao foco do dia!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao adicionar tarefa.");
    }
  };

  const handleToggleDailyTask = async (task: StrategicItem) => {
    const newStatus = task.status === "Concluído" ? "Pendente" : "Concluído";
    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({ status: newStatus })
        .eq("id", task.id);
      if (error) throw error;
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao atualizar tarefa.");
    }
  };

  // Diário de Atividade
  const handleSaveJournal = async () => {
    if (
      !journalForm.what_i_did.trim() &&
      !journalForm.to_improve.trim() &&
      !journalForm.new_idea.trim()
    ) {
      toast.error("Preencha pelo menos um campo do diário.");
      return;
    }
    try {
      const { error } = await supabase.from("strategic_workspace").insert([
        {
          item_type: "journal",
          title: `Diário - ${todayStr.split("-").reverse().join("/")}`,
          project_id: journalForm.project_id === "none" ? null : journalForm.project_id,
          entry_date: todayStr,
          content: journalForm.what_i_did.trim(),
          metadata: {
            what_i_did: journalForm.what_i_did.trim(),
            to_improve: journalForm.to_improve.trim(),
            new_idea: journalForm.new_idea.trim(),
          },
        },
      ]);
      if (error) throw error;

      // Se digitou uma ideia no diário e marcou para adicionar ao checklist de ideias
      if (journalForm.new_idea.trim() && journalForm.addIdeaToChecklist) {
        await supabase.from("strategic_workspace").insert([
          {
            item_type: "idea",
            title: journalForm.new_idea.trim(),
            category: "Geral",
            status: "Pendente",
            project_id: journalForm.project_id === "none" ? null : journalForm.project_id,
            entry_date: todayStr,
          },
        ]);
      }

      setJournalForm({
        project_id: journalForm.project_id,
        what_i_did: "",
        to_improve: "",
        new_idea: "",
        addIdeaToChecklist: true,
      });
      toast.success("Registro salvo no Diário de Atividade!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao salvar no diário.");
    }
  };

  // Checklist de Ideias
  const handleAddIdea = async () => {
    if (!newIdeaTitle.trim()) return;
    try {
      const { error } = await supabase.from("strategic_workspace").insert([
        {
          item_type: "idea",
          title: newIdeaTitle.trim(),
          category: newIdeaCategory,
          status: "Pendente",
          project_id: newIdeaProjectId === "none" ? null : newIdeaProjectId,
          entry_date: todayStr,
        },
      ]);
      if (error) throw error;
      setNewIdeaTitle("");
      toast.success("Ideia adicionada ao checklist!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao salvar ideia.");
    }
  };

  const handleToggleIdea = async (idea: StrategicItem) => {
    const newStatus = idea.status === "Concluído" ? "Pendente" : "Concluído";
    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({ status: newStatus })
        .eq("id", idea.id);
      if (error) throw error;
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao atualizar ideia.");
    }
  };

  const handleConvertIdeaToTask = async (idea: StrategicItem) => {
    try {
      const { error } = await supabase.from("strategic_workspace").insert([
        {
          item_type: "daily_task",
          title: idea.title,
          category: "Alta",
          status: "Pendente",
          horizon: "diario",
          project_id: idea.project_id || null,
          entry_date: todayStr,
        },
      ]);
      if (error) throw error;
      toast.success("Ideia enviada para as Tarefas do Dia!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao converter ideia em tarefa.");
    }
  };

  const openScheduleBlockModal = (defaultTitle = "") => {
    setBlockForm({
      title: defaultTitle || "Foco Estratégico (QG)",
      date: todayStr,
      start_time: "09:00",
      end_time: "11:00",
      reason: "Reservado pelo QG Estratégico",
    });
    setBlockModalOpen(true);
  };

  const handleConfirmScheduleBlock = async () => {
    if (!blockForm.title.trim()) {
      toast.error("Informe o título do bloco.");
      return;
    }
    try {
      const { error } = await supabase.from("agenda_blocks").insert([
        {
          title: blockForm.title.trim(),
          date: blockForm.date,
          start_time: blockForm.start_time,
          end_time: blockForm.end_time,
          all_day: false,
          reason: blockForm.reason,
        },
      ]);
      if (error) throw error;
      toast.success("Horário reservado e protegido na Agenda!");
      setBlockModalOpen(false);
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao reservar horário na agenda.");
    }
  };

  const handleRemoveStrategicBlock = async (blockId: string) => {
    try {
      const { error } = await supabase.from("agenda_blocks").delete().eq("id", blockId);
      if (error) throw error;
      toast.success("Bloqueio liberado na Agenda.");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao remover bloqueio.");
    }
  };

  // Delegar Missão para o Assistente
  const handleCreateAssistantMission = async (customTitle?: string, customNotes?: string) => {
    const finalTitle = (customTitle ?? missionTitle).trim();
    if (!finalTitle) {
      toast.error("Informe a missão para o assistente.");
      return;
    }
    try {
      const { error } = await supabase.from("strategic_workspace").insert([
        {
          item_type: "assistant_mission",
          title: finalTitle,
          category: missionPriority,
          status: "Pendente",
          horizon: "diario",
          content: (customNotes ?? missionNotes).trim() || null,
          entry_date: todayStr,
        },
      ]);
      if (error) throw error;
      if (!customTitle) {
        setMissionTitle("");
        setMissionNotes("");
      }
      toast.success("Missão enviada para a tela do Assistente!");
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao delegar missão.");
    }
  };

  const handleToggleAssistantMission = async (mission: StrategicItem) => {
    const newStatus = mission.status === "Concluído" ? "Pendente" : "Concluído";
    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({ status: newStatus })
        .eq("id", mission.id);
      if (error) throw error;
      fetchStrategicData();
    } catch (e) {
      toast.error("Erro ao atualizar missão.");
    }
  };

  // Ponte com Estúdio de Conteúdo / Roteirizador Rápido
  const openScriptModal = (idea: StrategicItem) => {
    setScriptIdea(idea);
    setScriptForm({
      hook: idea.metadata?.script_hook || "",
      body: idea.metadata?.script_body || "",
      cta: idea.metadata?.script_cta || "",
    });
  };

  const handleSaveScript = async (openStudioAfter = false) => {
    if (!scriptIdea) return;
    try {
      const { error } = await supabase
        .from("strategic_workspace")
        .update({
          metadata: {
            ...(scriptIdea.metadata || {}),
            script_hook: scriptForm.hook.trim(),
            script_body: scriptForm.body.trim(),
            script_cta: scriptForm.cta.trim(),
            has_script: Boolean(
              scriptForm.hook.trim() || scriptForm.body.trim() || scriptForm.cta.trim()
            ),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", scriptIdea.id);
      if (error) throw error;
      toast.success("Roteiro salvo na ideia!");
      setScriptIdea(null);
      await fetchStrategicData();
      if (openStudioAfter) {
        navigate("/cursos");
      }
    } catch (e) {
      toast.error("Erro ao salvar roteiro.");
    }
  };

  const monthGoalPct =
    monthlyGoalInput > 0 ? Math.min(100, Math.round((studioMetrics.monthRevenue / monthlyGoalInput) * 100)) : 0;
  const annualGoalPct =
    annualGoalInput > 0 ? Math.min(100, Math.round((studioMetrics.yearRevenue / annualGoalInput) * 100)) : 0;
  const threeMonthProjects = projects.filter((p) => p.horizon === "3_meses");
  const avgThreeMonthProgress =
    threeMonthProjects.length > 0
      ? Math.round(
          threeMonthProjects.reduce((acc, p) => acc + Number(p.progress || 0), 0) /
            threeMonthProjects.length
        )
      : 0;
  const completedTasksCount = dailyTasks.filter((t) => t.status === "Concluído").length;

  const getProjectName = (projId?: string | null) => {
    if (!projId) return null;
    return projects.find((p) => p.id === projId)?.title || null;
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Cabeçalho Padrão do Sistema */}
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">QG Estratégico</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                <Lock className="w-2.5 h-2.5" /> Exclusivo Dono
              </span>
            </div>
            <p className="page-subtitle">
              KPIs, planejamento anual, projetos de 3 meses, diário de atividades e banco de ideias
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" onClick={() => setKpiModalOpen(true)} className="h-10 text-xs font-semibold">
              Ajustar Metas KPI
            </Button>
            <Button onClick={() => openNewProjectModal("3_meses")} className="h-10 gap-2 font-bold shadow-md">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Painel de KPIs Estratégicas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div
            onClick={() => setKpiModalOpen(true)}
            className="stat-card cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-accent p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary">{monthGoalPct}% da Meta</span>
            </div>
            <div className="mt-3">
              <p className="text-lg md:text-xl font-bold text-foreground">
                R$ {studioMetrics.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Meta Mês: R$ {monthlyGoalInput.toLocaleString("pt-BR")}
              </p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${monthGoalPct}%` }} />
              </div>
            </div>
          </div>

          <div
            onClick={() => setKpiModalOpen(true)}
            className="stat-card cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-accent p-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary">{annualGoalPct}% Anual</span>
            </div>
            <div className="mt-3">
              <p className="text-lg md:text-xl font-bold text-foreground">
                R$ {studioMetrics.yearRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alvo {currentYear}: R$ {annualGoalInput.toLocaleString("pt-BR")} • Ticket Médio R${" "}
                {Math.round(studioMetrics.avgTicket).toLocaleString("pt-BR")}
              </p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${annualGoalPct}%` }} />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("projetos")}
            className="stat-card cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-accent p-2">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary">{avgThreeMonthProgress}% Concluído</span>
            </div>
            <div className="mt-3">
              <p className="text-lg md:text-xl font-bold text-foreground">
                {threeMonthProjects.length} Projetos (3 Meses)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projects.filter((p) => p.horizon === "anual").length} metas anuais ativas
              </p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${avgThreeMonthProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("tarefas")}
            className="stat-card cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-accent p-2">
                <CheckSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary">
                {ideas.filter((i) => i.status !== "Concluído").length} Ideias Ativas
              </span>
            </div>
            <div className="mt-3">
              <p className="text-lg md:text-xl font-bold text-foreground">
                {completedTasksCount}/{dailyTasks.length} Tarefas
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {journalEntries.length} registros no diário
              </p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação (Linha abaixo do cabeçalho) */}
        <div className="flex w-full overflow-x-auto no-scrollbar items-center gap-3">
          <TabsList className="bg-muted p-1 inline-flex w-max">
            <TabsTrigger value="projetos" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap">
              <FolderKanban className="w-3.5 h-3.5" /> Planejamento (3 Meses & Anual)
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap">
              <CheckSquare className="w-3.5 h-3.5" /> Tarefas do Dia
              {dailyTasks.filter((t) => t.status !== "Concluído").length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                  {dailyTasks.filter((t) => t.status !== "Concluído").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="diario" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5" /> Diário de Atividade
            </TabsTrigger>
            <TabsTrigger value="ideias" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap">
              <Lightbulb className="w-3.5 h-3.5" /> Checklist de Ideias
              {ideas.filter((i) => i.status !== "Concluído").length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                  {ideas.filter((i) => i.status !== "Concluído").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" /> Agenda & Ferramentas
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: PLANEJAMENTO (3 MESES & ANUAL) + DOCUMENTAÇÃO */}
        <TabsContent value="projetos" className="m-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setProjectHorizonFilter("all")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
                  projectHorizonFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectHorizonFilter("3_meses")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
                  projectHorizonFilter === "3_meses"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Ciclos de 3 Meses ({projects.filter((p) => p.horizon === "3_meses").length})
              </button>
              <button
                type="button"
                onClick={() => setProjectHorizonFilter("anual")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
                  projectHorizonFilter === "anual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Visão Anual ({projects.filter((p) => p.horizon === "anual").length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs gap-1.5 flex-1 sm:flex-initial"
                onClick={() => openNewProjectModal("anual")}
              >
                <Plus className="w-3.5 h-3.5" /> Meta Anual
              </Button>
              <Button
                size="sm"
                className="h-9 text-xs gap-1.5 flex-1 sm:flex-initial"
                onClick={() => openNewProjectModal("3_meses")}
              >
                <Plus className="w-3.5 h-3.5" /> Projeto 3 Meses
              </Button>
            </div>
          </div>

          {(() => {
            const filteredProjects = projects.filter((p) =>
              projectHorizonFilter === "all" ? true : p.horizon === projectHorizonFilter
            );

            if (filteredProjects.length === 0) {
              return (
                <div className="bg-card rounded-xl border-2 border-dashed p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Nenhum projeto estratégico cadastrado neste filtro.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" onClick={() => openNewProjectModal("3_meses")} className="gap-1.5">
                      <Plus className="w-4 h-4" /> Criar Projeto de 3 Meses
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openNewProjectModal("anual")}
                      className="gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Criar Meta Anual
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredProjects.map((proj) => {
                  const milestones = Array.isArray(proj.metadata?.milestones)
                    ? proj.metadata.milestones
                    : [];
                  const isExpanded = expandedProjectId === proj.id;
                  const projectTasks = dailyTasks.filter((t) => t.project_id === proj.id);
                  const projectLogs = journalEntries.filter((j) => j.project_id === proj.id);

                  return (
                    <div
                      key={proj.id}
                      className="bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {proj.horizon === "anual" ? "Planejamento Anual" : "Projeto 3 Meses"}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border">
                                {proj.category || "Geral"}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-foreground">{proj.title}</h3>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditProjectModal(proj)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteItem(proj.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Barra de Progresso e Alvo */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">
                              {proj.target_value > 0
                                ? `Alvo: R$ ${Number(proj.target_value).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}`
                                : "Progresso de Execução"}
                            </span>
                            <span className="font-bold text-foreground">{proj.progress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min(100, Number(proj.progress || 0))}%` }}
                            />
                          </div>
                        </div>

                        {/* Checklist de Principais Entregas / Marcos do Projeto */}
                        <div className="space-y-2 pt-1">
                          <Label className="text-xs font-semibold text-foreground">
                            Principais Frentes & Entregas ({milestones.filter((m: any) => m.done).length}/
                            {milestones.length})
                          </Label>
                          {milestones.length > 0 && (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {milestones.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleToggleProjectMilestone(proj, m.id)}
                                  className="w-full flex items-center gap-2.5 text-left text-xs p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                  {m.done ? (
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                                  )}
                                  <span
                                    className={`flex-1 ${
                                      m.done ? "line-through text-muted-foreground" : "text-foreground font-medium"
                                    }`}
                                  >
                                    {m.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Input
                              placeholder="Adicionar entrega/marco neste projeto..."
                              value={newMilestoneInputs[proj.id] || ""}
                              onChange={(e) =>
                                setNewMilestoneInputs((prev) => ({
                                  ...prev,
                                  [proj.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddProjectMilestone(proj);
                                }
                              }}
                              className="h-9 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-3 text-xs shrink-0"
                              onClick={() => handleAddProjectMilestone(proj)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card: Documentação e Atalhos */}
                      <div className="pt-3 border-t space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{projectTasks.length} tarefas</span>
                            <span>•</span>
                            <span>{projectLogs.length} registros no diário</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1.5 font-semibold"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedProjectId(null);
                              } else {
                                setExpandedProjectId(proj.id);
                                setDocTempContent(proj.content || "");
                              }
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Documentação
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="p-3 rounded-xl border bg-muted/20 space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold">Documentação & Notas do Projeto</Label>
                              {editingDocId !== proj.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    setEditingDocId(proj.id);
                                    setDocTempContent(proj.content || "");
                                  }}
                                >
                                  <Pencil className="w-3 h-3 mr-1" /> Editar
                                </Button>
                              )}
                            </div>

                            {editingDocId === proj.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  rows={5}
                                  value={docTempContent}
                                  onChange={(e) => setDocTempContent(e.target.value)}
                                  placeholder="Documente estratégia, regras, links, roteiros ou aprendizados deste projeto..."
                                  className="text-xs bg-background"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => setEditingDocId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleSaveProjectDoc(proj.id)}
                                  >
                                    Salvar Documentação
                                  </Button>
                                </div>
                              </div>
                            ) : proj.content ? (
                              <div
                                onClick={() => {
                                  setEditingDocId(proj.id);
                                  setDocTempContent(proj.content || "");
                                }}
                                className="text-xs text-foreground whitespace-pre-wrap bg-background p-3 rounded-lg border cursor-pointer hover:border-primary/40"
                              >
                                {proj.content}
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingDocId(proj.id);
                                  setDocTempContent("");
                                }}
                                className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg cursor-pointer hover:bg-background/50"
                              >
                                Clique para escrever a documentação deste projeto
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* ABA 2: PRINCIPAIS TAREFAS DO DIA */}
        <TabsContent value="tarefas" className="m-0 space-y-4">
          <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <Input
                  placeholder="Nova tarefa principal do dia..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDailyTask();
                    }
                  }}
                  className="h-11"
                />
              </div>
              <div className="sm:col-span-3">
                <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                  <SelectTrigger className="h-11 text-xs">
                    <SelectValue placeholder="Vincular Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem projeto específico</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger className="h-11 text-xs">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Prioridade Alta</SelectItem>
                    <SelectItem value="Normal">Prioridade Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleAddDailyTask} className="w-full h-11 font-semibold gap-1.5">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>
            </div>

            <div className="divide-y border rounded-xl overflow-hidden">
              {dailyTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa prioritária registrada.
                </div>
              ) : (
                dailyTasks.map((task) => {
                  const isDone = task.status === "Concluído";
                  const linkedProj = getProjectName(task.project_id);
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-accent/30 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleDailyTask(task)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-sm font-semibold block ${
                              isDone ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                task.category === "Alta"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {task.category || "Normal"}
                            </span>
                            {linkedProj && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-foreground border">
                                Projeto: {linkedProj}
                              </span>
                            )}
                            {task.entry_date && (
                              <span className="text-[10px] text-muted-foreground">
                                {task.entry_date.split("-").reverse().join("/")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isDone && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5"
                              onClick={() =>
                                handleCreateAssistantMission(
                                  task.title,
                                  linkedProj ? `Projeto: ${linkedProj}` : ""
                                )
                              }
                            >
                              <UserCheck className="w-3.5 h-3.5 text-primary" />
                              <span className="hidden sm:inline">Delegar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5"
                              onClick={() => openScheduleBlockModal(task.title)}
                            >
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span className="hidden sm:inline">Travar na Agenda</span>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteItem(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* ABA 3: DIÁRIO DE ATIVIDADE */}
        <TabsContent value="diario" className="m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário Novo Registro do Dia */}
            <div className="lg:col-span-5 bg-card rounded-xl border shadow-sm p-5 space-y-4 h-fit">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Registrar no Diário ({todayStr.split("-").reverse().join("/")})
                </h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Projeto Relacionado</Label>
                <Select
                  value={journalForm.project_id}
                  onValueChange={(val) => setJournalForm((prev) => ({ ...prev, project_id: val }))}
                >
                  <SelectTrigger className="h-11 text-xs">
                    <SelectValue placeholder="Selecione um projeto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral / Operação do Estúdio</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">O que eu fiz hoje</Label>
                <Textarea
                  rows={3}
                  placeholder="Ex: Gravei 3 vídeos novos, fechei orçamento do projeto..."
                  value={journalForm.what_i_did}
                  onChange={(e) => setJournalForm((prev) => ({ ...prev, what_i_did: e.target.value }))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">O que precisa melhorar / Gargalos</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Tempo de resposta nos orçamentos da tarde..."
                  value={journalForm.to_improve}
                  onChange={(e) => setJournalForm((prev) => ({ ...prev, to_improve: e.target.value }))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Ideia para implementar</Label>
                <Input
                  placeholder="Ex: Criar campanha de retorno para clientes de 6 meses..."
                  value={journalForm.new_idea}
                  onChange={(e) => setJournalForm((prev) => ({ ...prev, new_idea: e.target.value }))}
                  className="h-11 text-xs"
                />
                {journalForm.new_idea.trim() && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={journalForm.addIdeaToChecklist}
                      onChange={(e) =>
                        setJournalForm((prev) => ({ ...prev, addIdeaToChecklist: e.target.checked }))
                      }
                      className="rounded border-border accent-primary"
                    />
                    <span>Enviar automaticamente para o Checklist de Ideias</span>
                  </label>
                )}
              </div>

              <Button onClick={handleSaveJournal} className="w-full h-11 font-bold">
                Salvar no Diário
              </Button>
            </div>

            {/* Histórico do Diário */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-card rounded-xl border shadow-sm p-3.5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Buscar no diário..."
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Select value={journalProjectFilter} onValueChange={setJournalProjectFilter}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Filtrar por Projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Projetos</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  const filteredLogs = journalEntries.filter((j) => {
                    if (journalProjectFilter !== "all" && j.project_id !== journalProjectFilter) {
                      return false;
                    }
                    if (!journalSearch.trim()) return true;
                    const q = journalSearch.toLowerCase();
                    const textBlob = `${j.content || ""} ${j.metadata?.what_i_did || ""} ${
                      j.metadata?.to_improve || ""
                    } ${j.metadata?.new_idea || ""}`.toLowerCase();
                    return textBlob.includes(q);
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="bg-card rounded-xl border-2 border-dashed p-10 text-center text-xs text-muted-foreground">
                        Nenhum registro encontrado no Diário de Atividade.
                      </div>
                    );
                  }

                  return filteredLogs.map((log) => {
                    const linkedProj = getProjectName(log.project_id);
                    return (
                      <div key={log.id} className="bg-card rounded-xl border shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {log.entry_date
                                ? log.entry_date.split("-").reverse().join("/")
                                : new Date(log.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            {linkedProj && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {linkedProj}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(log.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-2 text-xs">
                          {(log.metadata?.what_i_did || log.content) && (
                            <div className="p-2.5 rounded-lg bg-muted/30 border">
                              <span className="font-bold text-foreground block mb-0.5">
                                O que foi feito:
                              </span>
                              <p className="text-foreground/90 whitespace-pre-wrap">
                                {log.metadata?.what_i_did || log.content}
                              </p>
                            </div>
                          )}

                          {log.metadata?.to_improve && (
                            <div className="p-2.5 rounded-lg bg-muted/30 border">
                              <span className="font-bold text-foreground block mb-0.5">
                                Precisa melhorar:
                              </span>
                              <p className="text-foreground/90 whitespace-pre-wrap">
                                {log.metadata.to_improve}
                              </p>
                            </div>
                          )}

                          {log.metadata?.new_idea && (
                            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                              <span className="font-bold text-primary block mb-0.5">
                                Ideia registrada:
                              </span>
                              <p className="text-foreground whitespace-pre-wrap">
                                {log.metadata.new_idea}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA 4: CHECKLIST DE IDEIAS */}
        <TabsContent value="ideias" className="m-0 space-y-4">
          <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <Input
                  placeholder="Capturar nova ideia no checklist..."
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIdea();
                    }
                  }}
                  className="h-11"
                />
              </div>
              <div className="sm:col-span-2">
                <Select value={newIdeaCategory} onValueChange={setNewIdeaCategory}>
                  <SelectTrigger className="h-11 text-xs">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Estúdio">Estúdio</SelectItem>
                    <SelectItem value="Conteúdo">Conteúdo</SelectItem>
                    <SelectItem value="Mentoria">Mentoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Select value={newIdeaProjectId} onValueChange={setNewIdeaProjectId}>
                  <SelectTrigger className="h-11 text-xs">
                    <SelectValue placeholder="Projeto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleAddIdea} className="w-full h-11 font-semibold gap-1.5">
                  <Plus className="w-4 h-4" /> Salvar Ideia
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["all", "Marketing", "Financeiro", "Estúdio", "Conteúdo", "Mentoria"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIdeaFilter(cat)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    ideaFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "Todas" : cat}
                </button>
              ))}
            </div>

            <div className="divide-y border rounded-xl overflow-hidden">
              {(() => {
                const filteredIdeas = ideas.filter((i) =>
                  ideaFilter === "all" ? true : i.category === ideaFilter
                );

                if (filteredIdeas.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Nenhuma ideia cadastrada neste filtro.
                    </div>
                  );
                }

                return filteredIdeas.map((idea) => {
                  const isDone = idea.status === "Concluído";
                  const linkedProj = getProjectName(idea.project_id);

                  return (
                    <div
                      key={idea.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-accent/30 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleIdea(idea)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-sm font-semibold block ${
                              isDone ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {idea.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground border">
                              {idea.category || "Geral"}
                            </span>
                            {linkedProj && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {linkedProj}
                              </span>
                            )}
                            {idea.metadata?.has_script && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Roteiro Pronto
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => openScriptModal(idea)}
                        >
                          <Video className="w-3.5 h-3.5 text-primary" />
                          Roteiro / Estúdio
                        </Button>
                        {!isDone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleConvertIdeaToTask(idea)}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Virar Tarefa do Dia
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteItem(idea.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </TabsContent>

        {/* ABA 5: AGENDA & FERRAMENTAS ESTRATÉGICAS */}
        <TabsContent value="ferramentas" className="m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ferramenta 1: Conexão com a Agenda (Travar Horário de CEO / Produção) */}
            <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Agenda de Hoje & Blocos Estratégicos</h3>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-semibold"
                  onClick={() => openScheduleBlockModal("")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Travar Horário na Agenda
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Sessões de Clientes Hoje ({todayAppts.length})
                </Label>
                {todayAppts.length === 0 ? (
                  <div className="p-3 rounded-lg border bg-muted/20 text-xs text-muted-foreground">
                    Nenhuma sessão de cliente agendada para hoje — dia livre para execução estratégica.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {todayAppts.map((a: any) => {
                      const relClient = Array.isArray(a.client) ? a.client[0] : a.client;
                      return (
                        <div key={a.id} className="p-2.5 px-3 flex items-center justify-between text-xs bg-background">
                          <span className="font-semibold text-foreground">
                            {relClient?.name || "Cliente"} ({a.type || "Tatuagem"})
                          </span>
                          <span className="font-bold text-primary">
                            {a.start_time} - {a.end_time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Horários Protegidos na Agenda ({strategicBlocks.length})
                </Label>
                {strategicBlocks.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                    Nenhum horário reservado. Reserve blocos para gravar aulas, criar conteúdo ou planejar sem o assistente marcar clientes em cima.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {strategicBlocks.map((b: any) => (
                      <div key={b.id} className="p-2.5 px-3 flex items-center justify-between gap-2 text-xs bg-muted/20">
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate">{b.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {b.date?.split("-").reverse().join("/")} •{" "}
                            {b.all_day ? "Dia inteiro" : `${b.start_time} às ${b.end_time}`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemoveStrategicBlock(b.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ferramenta 2: Simulador & Calculadora de Ritmo da Meta */}
            <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Calculadora & Projeção da Meta do Mês</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setKpiModalOpen(true)}
                >
                  Editar Meta
                </Button>
              </div>

              {(() => {
                const projectedTotal = studioMetrics.monthRevenue + studioMetrics.scheduledMonthRevenue;
                const remainingToGoal = Math.max(0, monthlyGoalInput - studioMetrics.monthRevenue);
                const remainingAfterAgenda = Math.max(0, monthlyGoalInput - projectedTotal);
                const ticket = Math.max(100, Math.round(studioMetrics.avgTicket || 500));
                const sessionsNeededNow = Math.ceil(remainingToGoal / ticket);
                const extraSessionsToBook = Math.ceil(remainingAfterAgenda / ticket);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Já Recebido no Caixa
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          R$ {studioMetrics.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Já Agendado no Mês
                        </span>
                        <span className="text-base font-bold text-primary mt-1 block">
                          R$ {studioMetrics.scheduledMonthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border bg-primary/5 border-primary/20">
                        <span className="text-[11px] text-primary font-semibold block">
                          Projeção Total do Mês
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          R$ {projectedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/30 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Falta entrar no caixa p/ bater a meta:</span>
                        <span className="font-bold text-foreground">
                          R$ {remainingToGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({sessionsNeededNow} sessões de R$ {ticket})
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-muted-foreground font-medium">
                          Falta agendar (além do que já está marcado):
                        </span>
                        <span className="font-bold text-primary">
                          {remainingAfterAgenda > 0
                            ? `R$ ${remainingAfterAgenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (+${extraSessionsToBook} novos agendamentos)`
                            : "Meta já coberta pela agenda atual!"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Ferramenta 3: Delegar Missão para o Assistente ("Ordens do Dia") */}
            <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Delegar Missão p/ Assistente</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {assistantMissions.filter((m) => m.status !== "Concluído").length} Pendentes
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Ex: Chamar os 5 clientes da Lista de Espera hoje..."
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateAssistantMission();
                      }
                    }}
                    className="h-10 text-xs flex-1"
                  />
                  <Select value={missionPriority} onValueChange={setMissionPriority}>
                    <SelectTrigger className="h-10 w-full sm:w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Urgente</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Instrução extra (opcional)..."
                    value={missionNotes}
                    onChange={(e) => setMissionNotes(e.target.value)}
                    className="h-10 text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    className="h-10 px-4 text-xs font-semibold shrink-0"
                    onClick={() => handleCreateAssistantMission()}
                  >
                    Enviar Missão
                  </Button>
                </div>
              </div>

              <div className="divide-y border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {assistantMissions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nenhuma missão enviada para o assistente ainda.
                  </div>
                ) : (
                  assistantMissions.map((m) => {
                    const isDone = m.status === "Concluído";
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 px-3 flex items-center justify-between gap-2 text-xs bg-background"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleAssistantMission(m)}
                          className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <span
                              className={`font-semibold block truncate ${
                                isDone ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {m.title}
                            </span>
                            {m.content && (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {m.content}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isDone
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {isDone ? "Feito" : "Na Fila"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(m.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ferramenta 4: Radar de Dinheiro Parado no Funil (Garimpo) */}
            <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Radar de Dinheiro Parado no Funil</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate("/clientes")}
                >
                  Abrir CRM
                </Button>
              </div>

              {(() => {
                const ticket = Math.max(100, Math.round(studioMetrics.avgTicket || 500));
                const orcamentoPotencial = funnelRadar.orcamentoCount * ticket;
                const waitlistPotencial = funnelRadar.waitlistCount * ticket;
                const totalParado = orcamentoPotencial + funnelRadar.remarcarValue;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Em Orçamento ({funnelRadar.orcamentoCount})
                        </span>
                        <span className="text-sm font-bold text-foreground mt-1 block">
                          ~R$ {orcamentoPotencial.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          P/ Remarcar ({funnelRadar.remarcarCount})
                        </span>
                        <span className="text-sm font-bold text-foreground mt-1 block">
                          R$ {funnelRadar.remarcarValue.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border bg-primary/5 border-primary/20">
                        <span className="text-[11px] text-primary font-semibold block">
                          Lista de Espera ({funnelRadar.waitlistCount})
                        </span>
                        <span className="text-sm font-bold text-foreground mt-1 block">
                          ~R$ {waitlistPotencial.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Potencial acumulado para repescagem:</span>
                        <span className="text-base font-bold text-foreground">
                          R$ {totalParado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-9 text-xs font-semibold gap-1.5 shrink-0"
                        onClick={() =>
                          handleCreateAssistantMission(
                            `Fazer repescagem dos ${funnelRadar.orcamentoCount} clientes em Orçamento e ${funnelRadar.remarcarCount} Para Remarcar`,
                            "Priorizar clientes com maior potencial de fechamento nesta semana"
                          )
                        }
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Acionar Assistente p/ Garimpo
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Ferramenta 5: Simulador de Preço & Hora Tatuada */}
            <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Simulador de Reajuste de Preço & Valor da Hora Tatuada</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  Ticket Médio Atual:{" "}
                  <strong className="text-foreground">
                    R$ {Math.round(studioMetrics.avgTicket || 500).toLocaleString("pt-BR")}
                  </strong>
                </span>
              </div>

              {(() => {
                const currentTicket = Math.max(100, Math.round(studioMetrics.avgTicket || 500));
                const newTicket = currentTicket + Number(simTicketAdd || 0);
                const currentMonthly = currentTicket * simMonthlySessions;
                const newMonthly = newTicket * simMonthlySessions;
                const extraMonthly = newMonthly - currentMonthly;
                const extraAnnual = extraMonthly * 12;
                const currentHourly = simHoursPerSession > 0 ? currentTicket / simHoursPerSession : 0;
                const newHourly = simHoursPerSession > 0 ? newTicket / simHoursPerSession : 0;
                const sessionsSaved =
                  newTicket > 0 ? Math.max(0, simMonthlySessions - Math.ceil(currentMonthly / newTicket)) : 0;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Aumento por Sessão (R$)</Label>
                        <CurrencyInput value={simTicketAdd} onChange={setSimTicketAdd} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Sessões / Mês</Label>
                          <Input
                            type="number"
                            min={1}
                            value={simMonthlySessions}
                            onChange={(e) => setSimMonthlySessions(Math.max(1, Number(e.target.value || 1)))}
                            className="h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Horas / Sessão</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min={0.5}
                            value={simHoursPerSession}
                            onChange={(e) =>
                              setSimHoursPerSession(Math.max(0.5, Number(e.target.value || 1)))
                            }
                            className="h-10 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Novo Valor Sessão
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          R$ {newTicket.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          (+R$ {simTicketAdd.toLocaleString("pt-BR")}/sessão)
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-primary/5 border-primary/20">
                        <span className="text-[11px] text-primary font-semibold block">
                          Ganho Extra no Ano
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          +R$ {extraAnnual.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          (+R$ {extraMonthly.toLocaleString("pt-BR")}/mês)
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Sua Hora Tatuada
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          R$ {Math.round(newHourly).toLocaleString("pt-BR")}/h
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Antes: R$ {Math.round(currentHourly).toLocaleString("pt-BR")}/h
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-muted/20">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Tempo Livre Ganho
                        </span>
                        <span className="text-base font-bold text-foreground mt-1 block">
                          -{sessionsSaved} sessões
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          p/ ganhar o mesmo que hoje
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Roteiro Rápido & Ponte com Estúdio Motion */}
      <Dialog open={!!scriptIdea} onOpenChange={(open) => !open && setScriptIdea(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Roteiro de Conteúdo: {scriptIdea?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">1. Gancho (Primeiros 3 segundos)</Label>
              <Input
                placeholder="Ex: O erro que faz 80% dos tatuadores perderem dinheiro no caixa..."
                value={scriptForm.hook}
                onChange={(e) => setScriptForm((prev) => ({ ...prev, hook: e.target.value }))}
                className="h-11 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">2. Desenvolvimento & Analogia Visual</Label>
              <Textarea
                rows={4}
                placeholder="Ex: Mostrar o modelo Carro & Gasolina no Estúdio Motion explicando a diferença entre faturamento e caixa..."
                value={scriptForm.body}
                onChange={(e) => setScriptForm((prev) => ({ ...prev, body: e.target.value }))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">3. Chamada para Ação (Fechamento)</Label>
              <Input
                placeholder="Ex: Comenta 'CAIXA' ou entra no link da Mentoria..."
                value={scriptForm.cta}
                onChange={(e) => setScriptForm((prev) => ({ ...prev, cta: e.target.value }))}
                className="h-11 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setScriptIdea(null)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => handleSaveScript(false)}>
              Apenas Salvar Roteiro
            </Button>
            <Button onClick={() => handleSaveScript(true)} className="gap-1.5">
              <Video className="w-3.5 h-3.5" />
              Salvar & Abrir Estúdio Motion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Travar Horário Estratégico na Agenda */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Travar Horário Estratégico na Agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Atividade / Missão *</Label>
              <Input
                placeholder="Ex: Gravar vídeos YouTube, Planejamento Marketing..."
                value={blockForm.title}
                onChange={(e) => setBlockForm((prev) => ({ ...prev, title: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Data</Label>
              <Input
                type="date"
                value={blockForm.date}
                onChange={(e) => setBlockForm((prev) => ({ ...prev, date: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Início</Label>
                <Input
                  type="time"
                  value={blockForm.start_time}
                  onChange={(e) => setBlockForm((prev) => ({ ...prev, start_time: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Término</Label>
                <Input
                  type="time"
                  value={blockForm.end_time}
                  onChange={(e) => setBlockForm((prev) => ({ ...prev, end_time: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmScheduleBlock}>Bloquear na Agenda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajustar Metas KPI */}
      <Dialog open={kpiModalOpen} onOpenChange={setKpiModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Metas Financeiras (KPIs)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Meta de Faturamento Mensal</Label>
              <CurrencyInput value={monthlyGoalInput} onChange={setMonthlyGoalInput} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Meta de Faturamento Anual ({currentYear})</Label>
              <CurrencyInput value={annualGoalInput} onChange={setAnnualGoalInput} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveKpiGoals}>Salvar Metas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo / Editar Projeto Estratégico */}
      <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Editar Projeto Estratégico" : "Novo Projeto / Meta Estratégica"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Projeto / Meta *</Label>
              <Input
                placeholder="Ex: Projeto 3 Meses - Bater Meta Financeira / Marketing Específico"
                value={projectForm.title}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Horizonte</Label>
                <Select
                  value={projectForm.horizon}
                  onValueChange={(val: "3_meses" | "anual") =>
                    setProjectForm((prev) => ({ ...prev, horizon: val }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3_meses">Projeto de 3 Meses (90 Dias)</SelectItem>
                    <SelectItem value="anual">Planejamento Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Frente / Categoria</Label>
                <Select
                  value={projectForm.category}
                  onValueChange={(val) => setProjectForm((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operação">Operação & Estúdio</SelectItem>
                    <SelectItem value="Mentoria">Cursos & Mentoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Meta Financeira do Projeto (Opcional)</Label>
                <CurrencyInput
                  value={projectForm.target_value}
                  onChange={(val) => setProjectForm((prev) => ({ ...prev, target_value: val }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Progresso Inicial (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={projectForm.progress}
                  onChange={(e) =>
                    setProjectForm((prev) => ({
                      ...prev,
                      progress: Math.min(100, Math.max(0, Number(e.target.value || 0))),
                    }))
                  }
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Principais Entregas / Marcos (1 por linha)
              </Label>
              <Textarea
                rows={4}
                placeholder={"Ex:\nDefinir oferta e criativos\nGravar 10 vídeos para o público-alvo\nFechar 15 sessões de fechamento"}
                value={projectForm.milestonesText}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, milestonesText: e.target.value }))
                }
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Documentação do Projeto</Label>
              <Textarea
                rows={4}
                placeholder="Anotações estratégicas, regras do projeto, links e referências..."
                value={projectForm.content}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, content: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject}>Salvar Projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Strategy;
