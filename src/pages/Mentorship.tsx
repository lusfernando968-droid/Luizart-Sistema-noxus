import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  FileText,
  ClipboardList,
  Phone,
  Instagram,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronRight,
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Check,
  Filter,
  Link as LinkIcon,
  Play,
  Sparkles,
  UserPlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatInstagramUrl, getInstagramHandle } from "./Clients";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

interface ClientRow {
  id: string;
  name: string;
  phone?: string;
  instagram?: string;
  avatar_url?: string;
  notes?: string;
  is_student?: boolean;
}

interface MentorshipProfile {
  id: string;
  client_id: string;
  status: string;
  level: string;
  specialty: string;
  city_studio: string;
  main_goal: string;
  initial_revenue: number;
  current_revenue: number;
  target_revenue: number;
  meeting_frequency_days: number;
  start_date: string;
  next_meeting_date: string;
  strengths: string;
  weaknesses: string;
  general_notes: string;
}

interface MentorshipMeeting {
  id: string;
  client_id: string;
  meeting_number: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  title: string;
  status: string;
  summary_notes: string;
  next_steps: string;
  recording_link: string;
  appointment_id?: string | null;
  created_at?: string;
}

interface MentorshipTask {
  id: string;
  client_id: string;
  meeting_id?: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  due_date: string;
  completed_at: string;
  delivery_link: string;
  mentor_feedback: string;
  created_at?: string;
}

interface MentorshipMetric {
  id: string;
  client_id: string;
  record_date: string;
  period_label: string;
  monthly_revenue: number;
  tattoos_completed: number;
  leads_received: number;
  technical_score: number;
  commercial_score: number;
  notes: string;
}

const TASK_CATEGORIES = [
  "Técnica",
  "Instagram & Conteúdo",
  "Comercial & Vendas",
  "Gestão & Estúdio",
  "Mentalidade"
];

const TASK_STATUSES = ["Pendente", "Em Execução", "Entregue", "Revisado"];

const LEVELS = ["Iniciante", "Intermediário", "Avançado", "Dono de Estúdio"];

const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(val || 0);
};

const getDaysDiffFromToday = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(`${dateStr}T12:00:00`);
  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const Mentorship = () => {
  const [activeTab, setActiveTab] = useState("mentorados");
  const [loading, setLoading] = useState(true);

  // Dados principais do Supabase
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [profiles, setProfiles] = useState<MentorshipProfile[]>([]);
  const [meetings, setMeetings] = useState<MentorshipMeeting[]>([]);
  const [tasks, setTasks] = useState<MentorshipTask[]>([]);
  const [metrics, setMetrics] = useState<MentorshipMetric[]>([]);

  // Filtros
  const [searchMentee, setSearchMentee] = useState("");
  const [filterCycle, setFilterCycle] = useState("all");
  const [filterMeetingStudent, setFilterMeetingStudent] = useState("all");
  const [filterTaskStudent, setFilterTaskStudent] = useState("all");
  const [filterTaskStatus, setFilterTaskStatus] = useState("all");
  const [filterTaskCategory, setFilterTaskCategory] = useState("all");
  const [filterPerformanceStudent, setFilterPerformanceStudent] = useState("all");

  // Dossiê Individual do Aluno Selecionado
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState("ficha");

  // Modal: Adicionar / Vincular Novo Mentorado
  const [newMenteeModalOpen, setNewMenteeModalOpen] = useState(false);
  const [newMenteeMode, setNewMenteeMode] = useState<"existing" | "create">("existing");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedExistingClientId, setSelectedExistingClientId] = useState("");
  const [newClientForm, setNewClientForm] = useState({
    name: "",
    phone: "",
    instagram: ""
  });
  const [initialProfileForm, setInitialProfileForm] = useState({
    level: "Intermediário",
    specialty: "",
    city_studio: "",
    main_goal: "",
    initial_revenue: 0,
    target_revenue: 0,
    meeting_frequency_days: 15,
    start_date: new Date().toISOString().split("T")[0],
    next_meeting_date: addDays(new Date().toISOString().split("T")[0], 15)
  });

  // Form de edição da Ficha Técnica no Dossiê
  const [editingProfile, setEditingProfile] = useState<MentorshipProfile | null>(null);

  // Modal: Registrar / Editar Encontro Quinzenal
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MentorshipMeeting | null>(null);
  const [syncToAgenda, setSyncToAgenda] = useState(true);
  const [autoScheduleNext15d, setAutoScheduleNext15d] = useState(true);
  const [meetingForm, setMeetingForm] = useState({
    client_id: "",
    meeting_number: 1,
    date: new Date().toISOString().split("T")[0],
    start_time: "14:00",
    duration_minutes: 60,
    title: "",
    status: "Realizado",
    summary_notes: "",
    next_steps: "",
    recording_link: ""
  });

  // Modal: Nova / Editar Atividade
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MentorshipTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    client_id: "",
    meeting_id: "none",
    title: "",
    description: "",
    category: "Técnica",
    priority: "Normal",
    status: "Pendente",
    due_date: addDays(new Date().toISOString().split("T")[0], 15),
    delivery_link: "",
    mentor_feedback: ""
  });

  // Modal: Registrar Checkpoint de Performance
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [metricForm, setMetricForm] = useState({
    client_id: "",
    record_date: new Date().toISOString().split("T")[0],
    period_label: "",
    monthly_revenue: 0,
    tattoos_completed: 0,
    leads_received: 0,
    technical_score: 7,
    commercial_score: 7,
    notes: ""
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [clientsRes, profilesRes, meetingsRes, tasksRes, metricsRes] = await Promise.all([
        supabase.from("clientes").select("id, name, phone, instagram, avatar_url, notes, is_student").order("name"),
        supabase.from("mentorship_profiles").select("*"),
        supabase.from("mentorship_meetings").select("*").order("date", { ascending: false }),
        supabase.from("mentorship_tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("mentorship_metrics").select("*").order("record_date", { ascending: true })
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (meetingsRes.data) setMeetings(meetingsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados de mentoria:", err);
      toast.error("Erro ao carregar dados de mentoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Lista consolidada de Mentorados (clientes com is_student = true ou com perfil em mentorship_profiles)
  const mentees = useMemo(() => {
    const profileMap = new Map<string, MentorshipProfile>();
    profiles.forEach(p => profileMap.set(p.client_id, p));

    return clients
      .filter(c => c.is_student || profileMap.has(c.id))
      .map(client => {
        const profile = profileMap.get(client.id) || {
          id: "",
          client_id: client.id,
          status: "Ativo",
          level: "Intermediário",
          specialty: "",
          city_studio: "",
          main_goal: "",
          initial_revenue: 0,
          current_revenue: 0,
          target_revenue: 0,
          meeting_frequency_days: 15,
          start_date: "",
          next_meeting_date: "",
          strengths: "",
          weaknesses: "",
          general_notes: client.notes || ""
        };

        const studentMeetings = meetings.filter(m => m.client_id === client.id);
        const completedMeetings = studentMeetings.filter(m => m.status === "Realizado");
        const lastMeeting = completedMeetings[0] || studentMeetings[0] || null;

        const studentTasks = tasks.filter(t => t.client_id === client.id);
        const deliveredTasks = studentTasks.filter(t => t.status === "Entregue" || t.status === "Revisado");
        const pendingTasks = studentTasks.filter(t => t.status === "Pendente" || t.status === "Em Execução");

        const studentMetrics = metrics.filter(m => m.client_id === client.id);
        const latestMetric = studentMetrics[studentMetrics.length - 1] || null;

        const effectiveCurrentRevenue =
          latestMetric && latestMetric.monthly_revenue > 0
            ? Number(latestMetric.monthly_revenue)
            : Number(profile.current_revenue || 0);

        // Cálculo do ciclo quinzenal (15 dias)
        const nextDate =
          profile.next_meeting_date ||
          (lastMeeting ? addDays(lastMeeting.date, profile.meeting_frequency_days || 15) : "");
        const daysUntilNext = getDaysDiffFromToday(nextDate);

        let cycleStatus: "ok" | "soon" | "overdue" | "none" = "none";
        if (daysUntilNext !== null) {
          if (daysUntilNext < 0) cycleStatus = "overdue";
          else if (daysUntilNext <= 3) cycleStatus = "soon";
          else cycleStatus = "ok";
        }

        return {
          client,
          profile,
          meetings: studentMeetings,
          completedMeetingsCount: completedMeetings.length,
          lastMeeting,
          nextDate,
          daysUntilNext,
          cycleStatus,
          tasks: studentTasks,
          deliveredTasksCount: deliveredTasks.length,
          pendingTasksCount: pendingTasks.length,
          taskProgress:
            studentTasks.length > 0
              ? Math.round((deliveredTasks.length / studentTasks.length) * 100)
              : 0,
          metrics: studentMetrics,
          latestMetric,
          effectiveCurrentRevenue
        };
      });
  }, [clients, profiles, meetings, tasks, metrics]);

  const filteredMentees = useMemo(() => {
    return mentees.filter(item => {
      const matchSearch =
        item.client.name.toLowerCase().includes(searchMentee.toLowerCase()) ||
        (item.profile.specialty || "").toLowerCase().includes(searchMentee.toLowerCase()) ||
        (item.profile.city_studio || "").toLowerCase().includes(searchMentee.toLowerCase());

      if (!matchSearch) return false;

      if (filterCycle === "overdue") return item.cycleStatus === "overdue" || item.cycleStatus === "none";
      if (filterCycle === "soon") return item.cycleStatus === "soon";
      if (filterCycle === "active") return item.profile.status === "Ativo";
      return true;
    });
  }, [mentees, searchMentee, filterCycle]);

  const selectedMenteeData = useMemo(() => {
    if (!selectedMenteeId) return null;
    return mentees.find(m => m.client.id === selectedMenteeId) || null;
  }, [mentees, selectedMenteeId]);

  useEffect(() => {
    if (selectedMenteeData) {
      setEditingProfile({ ...selectedMenteeData.profile });
    }
  }, [selectedMenteeId, profiles]);

  // KPIs Globais
  const kpis = useMemo(() => {
    const activeCount = mentees.filter(m => m.profile.status !== "Pausado").length;
    const overdueCount = mentees.filter(m => m.cycleStatus === "overdue" || m.cycleStatus === "none").length;
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === "Entregue" || t.status === "Revisado").length;
    const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const totalInitialRev = mentees.reduce((acc, m) => acc + Number(m.profile.initial_revenue || 0), 0);
    const totalCurrentRev = mentees.reduce((acc, m) => acc + Number(m.effectiveCurrentRevenue || 0), 0);
    const growthDiff = totalCurrentRev - totalInitialRev;

    return {
      activeCount,
      overdueCount,
      totalTasks,
      doneTasks,
      taskRate,
      totalCurrentRev,
      growthDiff
    };
  }, [mentees, tasks]);

  // ==========================================
  // HANDLERS: MENTORADOS & FICHA
  // ==========================================
  const handleCreateOrLinkMentee = async () => {
    try {
      let targetClientId = selectedExistingClientId;

      if (newMenteeMode === "create") {
        if (!newClientForm.name.trim()) {
          toast.error("Informe o nome do aluno.");
          return;
        }
        const { data: createdClient, error: clientErr } = await supabase
          .from("clientes")
          .insert({
            name: newClientForm.name.trim(),
            phone: newClientForm.phone.trim() || "Não informado",
            instagram: newClientForm.instagram.trim(),
            status: "Concluído",
            is_student: true
          })
          .select()
          .single();

        if (clientErr) throw clientErr;
        targetClientId = createdClient.id;
      } else {
        if (!targetClientId) {
          toast.error("Selecione um cliente da lista.");
          return;
        }
        const { error: updErr } = await supabase
          .from("clientes")
          .update({ is_student: true })
          .eq("id", targetClientId);
        if (updErr) throw updErr;
      }

      const profilePayload = {
        client_id: targetClientId,
        status: "Ativo",
        level: initialProfileForm.level,
        specialty: initialProfileForm.specialty,
        city_studio: initialProfileForm.city_studio,
        main_goal: initialProfileForm.main_goal,
        initial_revenue: Number(initialProfileForm.initial_revenue || 0),
        current_revenue: Number(initialProfileForm.initial_revenue || 0),
        target_revenue: Number(initialProfileForm.target_revenue || 0),
        meeting_frequency_days: Number(initialProfileForm.meeting_frequency_days || 15),
        start_date: initialProfileForm.start_date,
        next_meeting_date: initialProfileForm.next_meeting_date
      };

      const { error: profErr } = await supabase
        .from("mentorship_profiles")
        .upsert(profilePayload, { onConflict: "client_id" });

      if (profErr) throw profErr;

      // Se informou faturamento inicial, já cria o marco zero na performance
      if (Number(initialProfileForm.initial_revenue) > 0) {
        await supabase.from("mentorship_metrics").insert({
          client_id: targetClientId,
          record_date: initialProfileForm.start_date || new Date().toISOString().split("T")[0],
          period_label: "Início",
          monthly_revenue: Number(initialProfileForm.initial_revenue),
          tattoos_completed: 0,
          leads_received: 0,
          technical_score: 5,
          commercial_score: 5,
          notes: "Marco inicial da mentoria"
        });
      }

      toast.success("Mentorado cadastrado com sucesso!");
      setNewMenteeModalOpen(false);
      setSelectedExistingClientId("");
      setNewClientForm({ name: "", phone: "", instagram: "" });
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao cadastrar mentorado:", err);
      toast.error("Erro ao salvar mentorado.");
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile || !selectedMenteeId) return;
    try {
      const payload = {
        client_id: selectedMenteeId,
        status: editingProfile.status || "Ativo",
        level: editingProfile.level || "Intermediário",
        specialty: editingProfile.specialty || "",
        city_studio: editingProfile.city_studio || "",
        main_goal: editingProfile.main_goal || "",
        initial_revenue: Number(editingProfile.initial_revenue || 0),
        current_revenue: Number(editingProfile.current_revenue || 0),
        target_revenue: Number(editingProfile.target_revenue || 0),
        meeting_frequency_days: Number(editingProfile.meeting_frequency_days || 15),
        start_date: editingProfile.start_date || new Date().toISOString().split("T")[0],
        next_meeting_date: editingProfile.next_meeting_date || "",
        strengths: editingProfile.strengths || "",
        weaknesses: editingProfile.weaknesses || "",
        general_notes: editingProfile.general_notes || "",
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("mentorship_profiles")
        .upsert(payload, { onConflict: "client_id" });

      if (error) throw error;
      toast.success("Ficha do mentorado atualizada!");
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao salvar ficha:", err);
      toast.error("Erro ao salvar ficha.");
    }
  };

  const handleRemoveFromMentorship = async (clientId: string) => {
    try {
      await supabase.from("clientes").update({ is_student: false }).eq("id", clientId);
      await supabase.from("mentorship_profiles").delete().eq("client_id", clientId);
      toast.success("Mentorado removido da listagem ativa.");
      if (selectedMenteeId === clientId) setSelectedMenteeId(null);
      await fetchAllData();
    } catch (err) {
      toast.error("Erro ao remover mentorado.");
    }
  };

  // ==========================================
  // HANDLERS: ENCONTROS QUINZENAIS
  // ==========================================
  const openNewMeetingModal = (preselectedClientId?: string) => {
    const cid = preselectedClientId || (mentees[0]?.client.id ?? "");
    const existingCount = meetings.filter(m => m.client_id === cid).length;
    setEditingMeeting(null);
    setMeetingForm({
      client_id: cid,
      meeting_number: existingCount + 1,
      date: new Date().toISOString().split("T")[0],
      start_time: "14:00",
      duration_minutes: 60,
      title: `Encontro #${existingCount + 1} - Acompanhamento Quinzenal`,
      status: "Realizado",
      summary_notes: "",
      next_steps: "",
      recording_link: ""
    });
    setMeetingModalOpen(true);
  };

  const openEditMeetingModal = (m: MentorshipMeeting) => {
    setEditingMeeting(m);
    setMeetingForm({
      client_id: m.client_id,
      meeting_number: m.meeting_number,
      date: m.date,
      start_time: m.start_time || "14:00",
      duration_minutes: m.duration_minutes || 60,
      title: m.title,
      status: m.status,
      summary_notes: m.summary_notes || "",
      next_steps: m.next_steps || "",
      recording_link: m.recording_link || ""
    });
    setMeetingModalOpen(true);
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.client_id || !meetingForm.date || !meetingForm.title.trim()) {
      toast.error("Preencha o aluno, data e título do encontro.");
      return;
    }

    try {
      let appointmentId = editingMeeting?.appointment_id || null;

      // Sincronizar com a tabela de agendamentos se marcado
      if (!editingMeeting && syncToAgenda) {
        const [h, m] = (meetingForm.start_time || "14:00").split(":").map(Number);
        const endMinutesTotal = h * 60 + m + Number(meetingForm.duration_minutes || 60);
        const endH = Math.min(23, Math.floor(endMinutesTotal / 60));
        const endM = endMinutesTotal % 60;
        const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

        const { data: apptData } = await supabase
          .from("appointments")
          .insert({
            client_id: meetingForm.client_id,
            date: meetingForm.date,
            start_time: meetingForm.start_time || "14:00",
            end_time: endTimeStr,
            type: "Mentoria 1 a 1",
            status: meetingForm.status === "Realizado" ? "Concluído" : "Confirmado",
            value: 0,
            notes: meetingForm.title
          })
          .select()
          .maybeSingle();

        if (apptData?.id) appointmentId = apptData.id;
      }

      const payload = {
        client_id: meetingForm.client_id,
        meeting_number: Number(meetingForm.meeting_number || 1),
        date: meetingForm.date,
        start_time: meetingForm.start_time,
        duration_minutes: Number(meetingForm.duration_minutes || 60),
        title: meetingForm.title.trim(),
        status: meetingForm.status,
        summary_notes: meetingForm.summary_notes,
        next_steps: meetingForm.next_steps,
        recording_link: meetingForm.recording_link,
        appointment_id: appointmentId
      };

      if (editingMeeting) {
        const { error } = await supabase
          .from("mentorship_meetings")
          .update(payload)
          .eq("id", editingMeeting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mentorship_meetings").insert(payload);
        if (error) throw error;
      }

      // Atualizar a data do próximo encontro (+15 dias ou frequência configurada)
      if (autoScheduleNext15d) {
        const menteeObj = mentees.find(x => x.client.id === meetingForm.client_id);
        const freq = menteeObj?.profile.meeting_frequency_days || 15;
        const nextDate = addDays(meetingForm.date, freq);

        await supabase.from("mentorship_profiles").upsert(
          {
            client_id: meetingForm.client_id,
            next_meeting_date: nextDate,
            updated_at: new Date().toISOString()
          },
          { onConflict: "client_id" }
        );
      }

      toast.success(editingMeeting ? "Encontro atualizado!" : "Encontro registrado com sucesso!");
      setMeetingModalOpen(false);
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao salvar encontro:", err);
      toast.error("Erro ao salvar encontro.");
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase.from("mentorship_meetings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Encontro excluído.");
      await fetchAllData();
    } catch (err) {
      toast.error("Erro ao excluir encontro.");
    }
  };

  // ==========================================
  // HANDLERS: ATIVIDADES & TAREFAS
  // ==========================================
  const openNewTaskModal = (preselectedClientId?: string, preselectedMeetingId?: string) => {
    const cid = preselectedClientId || (mentees[0]?.client.id ?? "");
    setEditingTask(null);
    setTaskForm({
      client_id: cid,
      meeting_id: preselectedMeetingId || "none",
      title: "",
      description: "",
      category: "Técnica",
      priority: "Normal",
      status: "Pendente",
      due_date: addDays(new Date().toISOString().split("T")[0], 15),
      delivery_link: "",
      mentor_feedback: ""
    });
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (t: MentorshipTask) => {
    setEditingTask(t);
    setTaskForm({
      client_id: t.client_id,
      meeting_id: t.meeting_id || "none",
      title: t.title,
      description: t.description || "",
      category: t.category || "Técnica",
      priority: t.priority || "Normal",
      status: t.status || "Pendente",
      due_date: t.due_date || "",
      delivery_link: t.delivery_link || "",
      mentor_feedback: t.mentor_feedback || ""
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.client_id || !taskForm.title.trim()) {
      toast.error("Informe o aluno e o título da atividade.");
      return;
    }

    try {
      const isDelivered = taskForm.status === "Entregue" || taskForm.status === "Revisado";
      const payload = {
        client_id: taskForm.client_id,
        meeting_id: taskForm.meeting_id && taskForm.meeting_id !== "none" ? taskForm.meeting_id : null,
        title: taskForm.title.trim(),
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date,
        completed_at: isDelivered ? new Date().toISOString().split("T")[0] : "",
        delivery_link: taskForm.delivery_link,
        mentor_feedback: taskForm.mentor_feedback
      };

      if (editingTask) {
        const { error } = await supabase
          .from("mentorship_tasks")
          .update(payload)
          .eq("id", editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mentorship_tasks").insert(payload);
        if (error) throw error;
      }

      toast.success(editingTask ? "Atividade atualizada!" : "Atividade atribuída ao aluno!");
      setTaskModalOpen(false);
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao salvar atividade:", err);
      toast.error("Erro ao salvar atividade.");
    }
  };

  const handleQuickTaskStatus = async (task: MentorshipTask, newStatus: string) => {
    try {
      const isDelivered = newStatus === "Entregue" || newStatus === "Revisado";
      const { error } = await supabase
        .from("mentorship_tasks")
        .update({
          status: newStatus,
          completed_at: isDelivered ? new Date().toISOString().split("T")[0] : task.completed_at
        })
        .eq("id", task.id);
      if (error) throw error;
      toast.success(`Status alterado para ${newStatus}`);
      await fetchAllData();
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("mentorship_tasks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Atividade removida.");
      await fetchAllData();
    } catch (err) {
      toast.error("Erro ao remover atividade.");
    }
  };

  // ==========================================
  // HANDLERS: PERFORMANCE & MÉTRICAS
  // ==========================================
  const openNewMetricModal = (preselectedClientId?: string) => {
    const cid = preselectedClientId || (mentees[0]?.client.id ?? "");
    const existingCount = metrics.filter(m => m.client_id === cid).length;
    setMetricForm({
      client_id: cid,
      record_date: new Date().toISOString().split("T")[0],
      period_label: `Quinzena ${existingCount + 1}`,
      monthly_revenue: 0,
      tattoos_completed: 0,
      leads_received: 0,
      technical_score: 7,
      commercial_score: 7,
      notes: ""
    });
    setMetricModalOpen(true);
  };

  const handleSaveMetric = async () => {
    if (!metricForm.client_id || !metricForm.record_date) {
      toast.error("Selecione o aluno e a data.");
      return;
    }

    try {
      const { error } = await supabase.from("mentorship_metrics").insert({
        client_id: metricForm.client_id,
        record_date: metricForm.record_date,
        period_label: metricForm.period_label || formatDateBR(metricForm.record_date),
        monthly_revenue: Number(metricForm.monthly_revenue || 0),
        tattoos_completed: Number(metricForm.tattoos_completed || 0),
        leads_received: Number(metricForm.leads_received || 0),
        technical_score: Number(metricForm.technical_score || 5),
        commercial_score: Number(metricForm.commercial_score || 5),
        notes: metricForm.notes
      });

      if (error) throw error;

      // Atualiza também o faturamento atual na ficha do aluno
      if (Number(metricForm.monthly_revenue) > 0) {
        await supabase.from("mentorship_profiles").upsert(
          {
            client_id: metricForm.client_id,
            current_revenue: Number(metricForm.monthly_revenue),
            updated_at: new Date().toISOString()
          },
          { onConflict: "client_id" }
        );
      }

      toast.success("Indicadores de performance salvos!");
      setMetricModalOpen(false);
      await fetchAllData();
    } catch (err) {
      console.error("Erro ao salvar métrica:", err);
      toast.error("Erro ao registrar indicadores.");
    }
  };

  const handleDeleteMetric = async (id: string) => {
    try {
      await supabase.from("mentorship_metrics").delete().eq("id", id);
      toast.success("Registro removido.");
      await fetchAllData();
    } catch (err) {
      toast.error("Erro ao remover registro.");
    }
  };

  // Dados filtrados para as abas Encontros, Atividades e Performance
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      if (filterMeetingStudent !== "all" && m.client_id !== filterMeetingStudent) return false;
      return true;
    });
  }, [meetings, filterMeetingStudent]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterTaskStudent !== "all" && t.client_id !== filterTaskStudent) return false;
      if (filterTaskStatus !== "all" && t.status !== filterTaskStatus) return false;
      if (filterTaskCategory !== "all" && t.category !== filterTaskCategory) return false;
      return true;
    });
  }, [tasks, filterTaskStudent, filterTaskStatus, filterTaskCategory]);

  const performanceChartData = useMemo(() => {
    const list =
      filterPerformanceStudent === "all"
        ? metrics
        : metrics.filter(m => m.client_id === filterPerformanceStudent);

    return list.map(m => {
      const clientName = clients.find(c => c.id === m.client_id)?.name || "Aluno";
      return {
        id: m.id,
        label:
          filterPerformanceStudent === "all"
            ? `${clientName.split(" ")[0]} (${m.period_label || formatDateBR(m.record_date)})`
            : m.period_label || formatDateBR(m.record_date),
        faturamento: Number(m.monthly_revenue || 0),
        tattoos: Number(m.tattoos_completed || 0),
        leads: Number(m.leads_received || 0),
        tecnica: Number(m.technical_score || 0),
        comercial: Number(m.commercial_score || 0)
      };
    });
  }, [metrics, filterPerformanceStudent, clients]);

  const studentRevenueComparisonData = useMemo(() => {
    const source =
      filterPerformanceStudent === "all"
        ? mentees
        : mentees.filter(m => m.client.id === filterPerformanceStudent);

    return source.map(m => ({
      nome: m.client.name.split(" ")[0],
      inicial: Number(m.profile.initial_revenue || 0),
      atual: Number(m.effectiveCurrentRevenue || 0),
      meta: Number(m.profile.target_revenue || 0)
    }));
  }, [mentees, filterPerformanceStudent]);

  const taskCategoryChartData = useMemo(() => {
    const sourceTasks =
      filterPerformanceStudent === "all"
        ? tasks
        : tasks.filter(t => t.client_id === filterPerformanceStudent);

    return TASK_CATEGORIES.map(cat => {
      const catTasks = sourceTasks.filter(t => t.category === cat);
      const entregues = catTasks.filter(
        t => t.status === "Entregue" || t.status === "Revisado"
      ).length;
      const pendentes = catTasks.length - entregues;
      return {
        categoria: cat.split(" ")[0],
        entregues,
        pendentes,
        total: catTasks.length
      };
    });
  }, [tasks, filterPerformanceStudent]);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Aluno";
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Revisado":
      case "Entregue":
      case "Realizado":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Em Execução":
      case "Agendado":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO PADRÃO DO PROJETO */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Mentorias Luizart</h1>
          <p className="page-subtitle">
            Gestão de alunos, encontros quinzenais, atividades e análise de dados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 gap-2"
            onClick={() => openNewMeetingModal()}
          >
            <Calendar className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Registrar Encontro</span>
            <span className="sm:hidden">Encontro</span>
          </Button>
          <Button
            className="h-10 gap-2"
            onClick={() => setNewMenteeModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Mentorado
          </Button>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO ABAIXO DO CABEÇALHO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex w-full overflow-x-auto no-scrollbar items-center">
          <TabsList className="bg-muted p-1 inline-flex w-max mb-2">
            <TabsTrigger
              value="mentorados"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" /> Mentorados ({mentees.length})
            </TabsTrigger>
            <TabsTrigger
              value="encontros"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" /> Encontros 15d ({meetings.length})
            </TabsTrigger>
            <TabsTrigger
              value="atividades"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Atividades ({tasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4 whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Análise de Dados
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =========================================================
            ABA 1: PAINEL DE MENTORADOS
           ========================================================= */}
        <TabsContent value="mentorados" className="m-0 space-y-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mentorado por nome, estilo ou cidade..."
                value={searchMentee}
                onChange={e => setSearchMentee(e.target.value)}
                className="pl-9 h-10 bg-accent/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={filterCycle} onValueChange={setFilterCycle}>
                <SelectTrigger className="h-10 w-full sm:w-[210px]">
                  <SelectValue placeholder="Filtrar Ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Mentorados</SelectItem>
                  <SelectItem value="overdue">Ciclo 15d Pendente / Atrasado</SelectItem>
                  <SelectItem value="soon">Próximo Encontro em Breve</SelectItem>
                  <SelectItem value="active">Apenas Ativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMentees.map(item => {
              const { client, profile, lastMeeting, nextDate, daysUntilNext, cycleStatus } = item;
              return (
                <div
                  key={client.id}
                  className="bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-primary/50 transition-all"
                >
                  {/* Topo do Card: Avatar + Nome + Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                        onClick={() => {
                          setSelectedMenteeId(client.id);
                          setDossierTab("ficha");
                        }}
                      >
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {client.avatar_url ? (
                            <img
                              src={client.avatar_url}
                              alt={client.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-foreground truncate hover:text-primary transition-colors">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">
                              {profile.level || "Intermediário"}
                            </Badge>
                            {profile.specialty && (
                              <span className="text-xs text-muted-foreground truncate">
                                • {profile.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          cycleStatus === "overdue" || cycleStatus === "none"
                            ? "border-destructive/40 text-destructive bg-destructive/5 text-[10px] shrink-0"
                            : cycleStatus === "soon"
                            ? "border-primary/40 text-primary bg-primary/5 text-[10px] shrink-0"
                            : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[10px] shrink-0"
                        }
                      >
                        {cycleStatus === "overdue"
                          ? `Atrasado (${Math.abs(daysUntilNext || 0)}d)`
                          : cycleStatus === "soon"
                          ? daysUntilNext === 0
                            ? "Hoje"
                            : `Em ${daysUntilNext}d`
                          : cycleStatus === "ok"
                          ? `Em dia (${daysUntilNext}d)`
                          : "Sem encontro"}
                      </Badge>
                    </div>

                    {/* Objetivo Principal */}
                    {profile.main_goal && (
                      <div className="bg-muted/40 rounded-lg p-2.5 border border-border/60">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Target className="w-3 h-3" /> Meta Principal
                        </div>
                        <p className="text-xs text-foreground font-medium line-clamp-2 mt-0.5">
                          {profile.main_goal}
                        </p>
                      </div>
                    )}

                    {/* Resumo do Ciclo Quinzenal e Métricas */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-muted/20 border rounded-lg p-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Último Encontro
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {lastMeeting ? formatDateBR(lastMeeting.date) : "Nenhum"}
                        </span>
                      </div>
                      <div className="bg-muted/20 border rounded-lg p-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Próximo (15d)
                        </span>
                        <span className="font-semibold text-primary mt-0.5 block">
                          {nextDate ? formatDateBR(nextDate) : "Agendar"}
                        </span>
                      </div>
                    </div>

                    {/* Progresso de Atividades + Faturamento */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Atividades Entregues
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.deliveredTasksCount}/{item.tasks.length} ({item.taskProgress}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${item.taskProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Faturamento Atual:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground">
                            {formatCurrency(item.effectiveCurrentRevenue)}
                          </span>
                          {profile.target_revenue > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              / Meta {formatCurrency(profile.target_revenue)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas do Card */}
                  <div className="pt-3 border-t flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-9 text-xs gap-1.5"
                      onClick={() => {
                        setSelectedMenteeId(client.id);
                        setDossierTab("ficha");
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Dossiê
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs px-2.5 gap-1"
                      onClick={() => openNewMeetingModal(client.id)}
                      title="Registrar Encontro Quinzenal"
                    >
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      +15d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs px-2.5 gap-1"
                      onClick={() => openNewTaskModal(client.id)}
                      title="Passar Nova Atividade"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      Tarefa
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Card tracejado para adicionar novo mentorado */}
            <div
              onClick={() => setNewMenteeModalOpen(true)}
              className="bg-card rounded-xl border-2 border-dashed p-6 text-center space-y-3 flex flex-col items-center justify-center min-h-[260px] bg-muted/5 cursor-pointer hover:bg-muted/15 hover:border-primary/40 transition-all"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Adicionar Mentorado</h3>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================
            ABA 2: ENCONTROS QUINZENAIS & ANOTAÇÕES
           ========================================================= */}
        <TabsContent value="encontros" className="m-0 space-y-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={filterMeetingStudent} onValueChange={setFilterMeetingStudent}>
                <SelectTrigger className="h-10 w-full sm:w-[240px]">
                  <SelectValue placeholder="Filtrar por Aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Alunos</SelectItem>
                  {mentees.map(m => (
                    <SelectItem key={m.client.id} value={m.client.id}>
                      {m.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="h-10 w-full sm:w-auto gap-2" onClick={() => openNewMeetingModal()}>
              <Plus className="h-4 w-4" />
              Novo Encontro Quinzenal
            </Button>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="bg-card rounded-xl border p-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum encontro registrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="bg-card rounded-xl border p-5 shadow-sm space-y-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        #{meeting.meeting_number}
                      </Badge>
                      <span
                        className="font-bold text-base text-foreground cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedMenteeId(meeting.client_id);
                          setDossierTab("encontros");
                        }}
                      >
                        {getClientName(meeting.client_id)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-semibold text-sm text-foreground">{meeting.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusBadgeStyle(meeting.status)}>
                        {meeting.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatDateBR(meeting.date)} às {meeting.start_time}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditMeetingModal(meeting)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-muted/30 rounded-lg p-3 border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Anotações do Encontro
                      </span>
                      <p className="text-xs text-foreground whitespace-pre-line">
                        {meeting.summary_notes || "Sem anotações registradas."}
                      </p>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 border flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                          Direcionamento para os Próximos 15 Dias
                        </span>
                        <p className="text-xs text-foreground whitespace-pre-line">
                          {meeting.next_steps || "Sem acordos específicos registrados."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
                        {meeting.recording_link ? (
                          <a
                            href={meeting.recording_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" /> Acessar Gravação / Material
                          </a>
                        ) : (
                          <span />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => openNewTaskModal(meeting.client_id, meeting.id)}
                        >
                          <Plus className="w-3 h-3" /> Passar Atividade deste Encontro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =========================================================
            ABA 3: CENTRAL DE ATIVIDADES & ENTREGAS
           ========================================================= */}
        <TabsContent value="atividades" className="m-0 space-y-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={filterTaskStudent} onValueChange={setFilterTaskStudent}>
                <SelectTrigger className="h-10 w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos os Alunos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Alunos</SelectItem>
                  {mentees.map(m => (
                    <SelectItem key={m.client.id} value={m.client.id}>
                      {m.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTaskStatus} onValueChange={setFilterTaskStatus}>
                <SelectTrigger className="h-10 w-full sm:w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {TASK_STATUSES.map(st => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTaskCategory} onValueChange={setFilterTaskCategory}>
                <SelectTrigger className="h-10 w-full sm:w-[190px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {TASK_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="h-10 w-full md:w-auto gap-2" onClick={() => openNewTaskModal()}>
              <Plus className="h-4 w-4" />
              Nova Atividade
            </Button>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Aluno</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status de Execução</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma atividade encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map(task => {
                      const diff = getDaysDiffFromToday(task.due_date);
                      const isOverdue =
                        diff !== null &&
                        diff < 0 &&
                        task.status !== "Entregue" &&
                        task.status !== "Revisado";

                      return (
                        <TableRow key={task.id}>
                          <TableCell className="font-semibold text-sm whitespace-nowrap">
                            <span
                              className="cursor-pointer hover:text-primary"
                              onClick={() => {
                                setSelectedMenteeId(task.client_id);
                                setDossierTab("atividades");
                              }}
                            >
                              {getClientName(task.client_id)}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="font-medium text-sm text-foreground">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </div>
                            )}
                            {task.delivery_link && (
                              <a
                                href={task.delivery_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary font-medium inline-flex items-center gap-1 mt-0.5 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" /> Ver Entrega
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {task.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            <span className={isOverdue ? "text-destructive font-bold" : ""}>
                              {formatDateBR(task.due_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={task.status}
                              onValueChange={val => handleQuickTaskStatus(task, val)}
                            >
                              <SelectTrigger
                                className={`h-8 w-[140px] text-xs font-semibold ${getStatusBadgeStyle(
                                  task.status
                                )}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_STATUSES.map(st => (
                                  <SelectItem key={st} value={st}>
                                    {st}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditTaskModal(task)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================
            ABA 4: ANÁLISE DE DADOS & PERFORMANCE
           ========================================================= */}
        <TabsContent value="performance" className="m-0 space-y-6">
          {/* Barra de Filtro e Ação da Análise */}
          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select
                value={filterPerformanceStudent}
                onValueChange={setFilterPerformanceStudent}
              >
                <SelectTrigger className="h-10 w-full sm:w-[260px]">
                  <SelectValue placeholder="Selecionar Aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visão Geral (Todos os Mentorados)</SelectItem>
                  {mentees.map(m => (
                    <SelectItem key={m.client.id} value={m.client.id}>
                      {m.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="h-10 w-full sm:w-auto gap-2" onClick={() => openNewMetricModal()}>
              <Plus className="h-4 w-4" />
              Registrar Checkpoint de Performance
            </Button>
          </div>

          {/* Cards de Indicadores (Exclusivos da Aba de Análise de Dados) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mentorados Ativos
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ciclo 15 Dias Pendente
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.overdueCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Entregas de Atividades
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-foreground">{kpis.taskRate}%</p>
                  <span className="text-xs text-muted-foreground">
                    ({kpis.doneTasks}/{kpis.totalTasks})
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Faturamento dos Alunos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 truncate">
                  {formatCurrency(kpis.totalCurrentRev)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Gráficos de Comparação de Alunos e Execução por Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Salto de Faturamento por Mentorado (Inicial vs. Atual vs. Meta)
              </h3>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentRevenueComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="inicial"
                      name="Fat. Inicial"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="atual"
                      name="Fat. Atual"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="meta"
                      name="Meta"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Execução de Atividades por Pilar
              </h3>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskCategoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="entregues"
                      name="Entregues / Revisadas"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pendentes"
                      name="Pendentes"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráficos de Evolução Histórica dos Checkpoints */}
          {performanceChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Curva de Evolução de Faturamento nos Checkpoints (R$)
                </h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="faturamento"
                        name="Faturamento (R$)"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.15)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Score Técnico vs. Comercial (0 a 10) & Sessões
                </h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="tecnica"
                        name="Nota Técnica"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="comercial"
                        name="Nota Comercial"
                        fill="#64748b"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="tattoos"
                        name="Tattoos no Período"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Tabela Comparativa de Performance dos Alunos */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm text-foreground">
                Quadro Geral de Performance por Mentorado
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mentorado</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Fat. Inicial</TableHead>
                    <TableHead>Fat. Atual</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Encontros</TableHead>
                    <TableHead>Execução Tarefas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentees.map(m => {
                    const initial = Number(m.profile.initial_revenue || 0);
                    const current = Number(m.effectiveCurrentRevenue || 0);
                    const growthPct =
                      initial > 0 ? Math.round(((current - initial) / initial) * 100) : 0;

                    return (
                      <TableRow key={m.client.id}>
                        <TableCell className="font-bold text-sm">
                          <span
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setSelectedMenteeId(m.client.id);
                              setDossierTab("performance");
                            }}
                          >
                            {m.client.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {m.profile.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatCurrency(initial)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {formatCurrency(current)}
                          {growthPct !== 0 && (
                            <span
                              className={`ml-1.5 text-[10px] font-semibold ${
                                growthPct > 0 ? "text-emerald-600" : "text-destructive"
                              }`}
                            >
                              ({growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatCurrency(m.profile.target_revenue)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {m.completedMeetingsCount} realizados
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${m.taskProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{m.taskProgress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => openNewMetricModal(m.client.id)}
                          >
                            + Lançar Dados
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* =========================================================
          MODAL 360º: DOSSIÊ COMPLETO DO MENTORADO SELECIONADO
         ========================================================= */}
      <Dialog
        open={!!selectedMenteeData}
        onOpenChange={open => !open && setSelectedMenteeId(null)}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {selectedMenteeData && (
            <>
              {/* Cabeçalho do Dossiê */}
              <div className="p-6 pb-4 border-b bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-14 w-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedMenteeData.client.avatar_url ? (
                      <img
                        src={selectedMenteeData.client.avatar_url}
                        alt={selectedMenteeData.client.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      selectedMenteeData.client.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-foreground truncate">
                        {selectedMenteeData.client.name}
                      </h2>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {selectedMenteeData.profile.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {selectedMenteeData.client.phone && (
                        <a
                          href={`https://wa.me/55${selectedMenteeData.client.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="w-3 h-3" /> {selectedMenteeData.client.phone}
                        </a>
                      )}
                      {formatInstagramUrl(selectedMenteeData.client.instagram) && (
                        <a
                          href={formatInstagramUrl(selectedMenteeData.client.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary font-medium"
                        >
                          <Instagram className="w-3 h-3" />
                          {getInstagramHandle(selectedMenteeData.client.instagram)}
                        </a>
                      )}
                      <span>
                        • Próximo Encontro:{" "}
                        <strong className="text-foreground">
                          {formatDateBR(selectedMenteeData.nextDate)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs gap-1.5"
                    onClick={() => openNewMeetingModal(selectedMenteeData.client.id)}
                  >
                    <Calendar className="w-3.5 h-3.5 text-primary" /> + Encontro
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 text-xs gap-1.5"
                    onClick={() => openNewTaskModal(selectedMenteeData.client.id)}
                  >
                    <Plus className="w-3.5 h-3.5" /> + Atividade
                  </Button>
                </div>
              </div>

              {/* Sub-Abas do Dossiê */}
              <div className="px-6 pt-3 border-b bg-muted/20">
                <Tabs value={dossierTab} onValueChange={setDossierTab}>
                  <TabsList className="bg-muted p-1 inline-flex w-max mb-2">
                    <TabsTrigger value="ficha" className="text-xs font-semibold px-3">
                      Ficha & Dados Específicos
                    </TabsTrigger>
                    <TabsTrigger value="encontros" className="text-xs font-semibold px-3">
                      Encontros ({selectedMenteeData.meetings.length})
                    </TabsTrigger>
                    <TabsTrigger value="atividades" className="text-xs font-semibold px-3">
                      Atividades ({selectedMenteeData.tasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="text-xs font-semibold px-3">
                      Performance ({selectedMenteeData.metrics.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Conteúdo rolável do Dossiê */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {dossierTab === "ficha" && editingProfile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status da Mentoria</Label>
                        <Select
                          value={editingProfile.status}
                          onValueChange={val =>
                            setEditingProfile({ ...editingProfile, status: val })
                          }
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Pausado">Pausado</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Nível do Artista</Label>
                        <Select
                          value={editingProfile.level}
                          onValueChange={val =>
                            setEditingProfile({ ...editingProfile, level: val })
                          }
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map(lv => (
                              <SelectItem key={lv} value={lv}>
                                {lv}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Estilo / Especialidade</Label>
                        <Input
                          className="h-10"
                          placeholder="Ex: Realismo, Fine Line..."
                          value={editingProfile.specialty}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, specialty: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cidade / Estúdio</Label>
                        <Input
                          className="h-10"
                          placeholder="Ex: São Paulo - Estúdio Próprio"
                          value={editingProfile.city_studio}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, city_studio: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Início da Mentoria</Label>
                        <Input
                          type="date"
                          className="h-10"
                          value={editingProfile.start_date}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, start_date: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Próximo Encontro (Ciclo 15d)</Label>
                        <Input
                          type="date"
                          className="h-10"
                          value={editingProfile.next_meeting_date}
                          onChange={e =>
                            setEditingProfile({
                              ...editingProfile,
                              next_meeting_date: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Faturamento Inicial (R$)</Label>
                        <CurrencyInput
                          className="h-10"
                          value={editingProfile.initial_revenue}
                          onValueChange={val =>
                            setEditingProfile({ ...editingProfile, initial_revenue: val })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Faturamento Atual (R$)</Label>
                        <CurrencyInput
                          className="h-10"
                          value={editingProfile.current_revenue}
                          onValueChange={val =>
                            setEditingProfile({ ...editingProfile, current_revenue: val })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta de Faturamento (R$)</Label>
                        <CurrencyInput
                          className="h-10"
                          value={editingProfile.target_revenue}
                          onValueChange={val =>
                            setEditingProfile({ ...editingProfile, target_revenue: val })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Objetivo Principal na Mentoria</Label>
                      <Input
                        className="h-10"
                        placeholder="Ex: Estruturar captação pelo Instagram e atingir R$ 15k/mês"
                        value={editingProfile.main_goal}
                        onChange={e =>
                          setEditingProfile({ ...editingProfile, main_goal: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Pontos Fortes do Aluno</Label>
                        <Textarea
                          rows={3}
                          placeholder="Habilidades técnicas, dedicação, portfólio..."
                          value={editingProfile.strengths}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, strengths: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Gargalos / Dificuldades a Trabalhar</Label>
                        <Textarea
                          rows={3}
                          placeholder="Fechamento de vendas, precificação, sombra..."
                          value={editingProfile.weaknesses}
                          onChange={e =>
                            setEditingProfile({ ...editingProfile, weaknesses: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Observações Estratégicas Gerais</Label>
                      <Textarea
                        rows={3}
                        placeholder="Histórico do aluno, equipamentos, contexto..."
                        value={editingProfile.general_notes}
                        onChange={e =>
                          setEditingProfile({ ...editingProfile, general_notes: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => handleRemoveFromMentorship(selectedMenteeData.client.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Remover da Mentoria
                      </Button>

                      <Button onClick={handleSaveProfile} className="h-10 px-6">
                        Salvar Ficha do Mentorado
                      </Button>
                    </div>
                  </div>
                )}

                {dossierTab === "encontros" && (
                  <div className="space-y-3">
                    {selectedMenteeData.meetings.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">
                          Nenhum encontro registrado para este aluno.
                        </p>
                      </div>
                    ) : (
                      selectedMenteeData.meetings.map(m => (
                        <div key={m.id} className="p-4 rounded-xl border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-primary-foreground text-[10px]">
                                #{m.meeting_number}
                              </Badge>
                              <span className="font-bold text-sm">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDateBR(m.date)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditMeetingModal(m)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          {m.summary_notes && (
                            <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded border whitespace-pre-line">
                              {m.summary_notes}
                            </p>
                          )}
                          {m.next_steps && (
                            <p className="text-xs text-primary font-medium">
                              <strong>Próximos 15d:</strong> {m.next_steps}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {dossierTab === "atividades" && (
                  <div className="space-y-2.5">
                    {selectedMenteeData.tasks.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">
                          Nenhuma atividade atribuída a este aluno.
                        </p>
                      </div>
                    ) : (
                      selectedMenteeData.tasks.map(t => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{t.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {t.category}
                              </Badge>
                            </div>
                            {t.description && (
                              <p className="text-xs text-muted-foreground">{t.description}</p>
                            )}
                            <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                              <span>Prazo: {formatDateBR(t.due_date)}</span>
                              {t.mentor_feedback && (
                                <span className="text-primary font-medium">
                                  Feedback: {t.mentor_feedback}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Select
                              value={t.status}
                              onValueChange={val => handleQuickTaskStatus(t, val)}
                            >
                              <SelectTrigger
                                className={`h-8 w-[135px] text-xs font-semibold ${getStatusBadgeStyle(
                                  t.status
                                )}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_STATUSES.map(st => (
                                  <SelectItem key={st} value={st}>
                                    {st}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditTaskModal(t)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {dossierTab === "performance" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Histórico de Checkpoints do Aluno
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openNewMetricModal(selectedMenteeData.client.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Novo Checkpoint
                      </Button>
                    </div>

                    {selectedMenteeData.metrics.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">
                          Nenhum checkpoint de performance registrado ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedMenteeData.metrics.map(met => (
                          <div
                            key={met.id}
                            className="p-3 rounded-lg border bg-card flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground">
                                {met.period_label || formatDateBR(met.record_date)}
                              </span>
                              <span className="text-muted-foreground block">
                                Data: {formatDateBR(met.record_date)}
                                {met.notes ? ` • ${met.notes}` : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Faturamento
                                </span>
                                <span className="font-bold text-foreground">
                                  {formatCurrency(met.monthly_revenue)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Tattoos / Leads
                                </span>
                                <span className="font-semibold">
                                  {met.tattoos_completed} / {met.leads_received}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Técnica / Comercial
                                </span>
                                <span className="font-semibold text-primary">
                                  {met.technical_score} / {met.commercial_score}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteMetric(met.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: ADICIONAR / VINCULAR NOVO MENTORADO
         ========================================================= */}
      <Dialog open={newMenteeModalOpen} onOpenChange={setNewMenteeModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Mentorado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={newMenteeMode === "existing" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setNewMenteeMode("existing")}
              >
                Selecionar de Clientes
              </Button>
              <Button
                type="button"
                variant={newMenteeMode === "create" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setNewMenteeMode("create")}
              >
                Cadastrar Novo Cliente
              </Button>
            </div>

            {newMenteeMode === "existing" ? (
              <div className="space-y-2">
                <Label className="text-xs">Buscar em Clientes</Label>
                <Input
                  placeholder="Digite o nome do cliente..."
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                  className="h-10"
                />
                <div className="max-h-36 overflow-y-auto border rounded-lg p-1.5 space-y-1">
                  {clients
                    .filter(c =>
                      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
                    )
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedExistingClientId(c.id)}
                        className={`p-2 rounded-md text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedExistingClientId === c.id
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="opacity-75">{c.phone}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label className="text-xs">Nome Completo</Label>
                  <Input
                    className="h-10"
                    placeholder="Nome do aluno"
                    value={newClientForm.name}
                    onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">WhatsApp</Label>
                  <Input
                    className="h-10"
                    placeholder="(00) 00000-0000"
                    value={newClientForm.phone}
                    onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Instagram</Label>
                  <Input
                    className="h-10"
                    placeholder="@usuario"
                    value={newClientForm.instagram}
                    onChange={e =>
                      setNewClientForm({ ...newClientForm, instagram: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">Nível Atual</Label>
                <Select
                  value={initialProfileForm.level}
                  onValueChange={val =>
                    setInitialProfileForm({ ...initialProfileForm, level: val })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(lv => (
                      <SelectItem key={lv} value={lv}>
                        {lv}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Especialidade / Estilo</Label>
                <Input
                  className="h-10"
                  placeholder="Ex: Realismo, Blackwork..."
                  value={initialProfileForm.specialty}
                  onChange={e =>
                    setInitialProfileForm({ ...initialProfileForm, specialty: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Faturamento Inicial (R$)</Label>
                <CurrencyInput
                  className="h-10"
                  value={initialProfileForm.initial_revenue}
                  onValueChange={val =>
                    setInitialProfileForm({ ...initialProfileForm, initial_revenue: val })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Meta de Faturamento (R$)</Label>
                <CurrencyInput
                  className="h-10"
                  value={initialProfileForm.target_revenue}
                  onValueChange={val =>
                    setInitialProfileForm({ ...initialProfileForm, target_revenue: val })
                  }
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Objetivo Principal na Mentoria</Label>
                <Input
                  className="h-10"
                  placeholder="Meta central do aluno no acompanhamento"
                  value={initialProfileForm.main_goal}
                  onChange={e =>
                    setInitialProfileForm({ ...initialProfileForm, main_goal: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Início</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={initialProfileForm.start_date}
                  onChange={e =>
                    setInitialProfileForm({
                      ...initialProfileForm,
                      start_date: e.target.value,
                      next_meeting_date: addDays(e.target.value, 15)
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Próximo Encontro (+15 dias)</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={initialProfileForm.next_meeting_date}
                  onChange={e =>
                    setInitialProfileForm({
                      ...initialProfileForm,
                      next_meeting_date: e.target.value
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMenteeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrLinkMentee}>Salvar Mentorado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: REGISTRAR / EDITAR ENCONTRO QUINZENAL
         ========================================================= */}
      <Dialog open={meetingModalOpen} onOpenChange={setMeetingModalOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMeeting ? "Editar Encontro" : "Registrar Encontro de Mentoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Mentorado</Label>
                <Select
                  value={meetingForm.client_id}
                  onValueChange={val => {
                    const count = meetings.filter(m => m.client_id === val).length;
                    setMeetingForm({
                      ...meetingForm,
                      client_id: val,
                      meeting_number: count + 1,
                      title: `Encontro #${count + 1} - Acompanhamento Quinzenal`
                    });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentees.map(m => (
                      <SelectItem key={m.client.id} value={m.client.id}>
                        {m.client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nº do Encontro</Label>
                <Input
                  type="number"
                  className="h-10"
                  value={meetingForm.meeting_number}
                  onChange={e =>
                    setMeetingForm({ ...meetingForm, meeting_number: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={meetingForm.date}
                  onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Horário</Label>
                <Input
                  type="time"
                  className="h-10"
                  value={meetingForm.start_time}
                  onChange={e => setMeetingForm({ ...meetingForm, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={meetingForm.status}
                  onValueChange={val => setMeetingForm({ ...meetingForm, status: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Realizado">Realizado</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Remarcado">Remarcado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tema / Foco do Encontro</Label>
              <Input
                className="h-10"
                placeholder="Ex: Análise de Portfólio e Posicionamento no Instagram"
                value={meetingForm.title}
                onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Anotações do Encontro</Label>
              <Textarea
                rows={4}
                placeholder="Pontos discutidos, evolução percebida, dúvidas tiradas..."
                value={meetingForm.summary_notes}
                onChange={e => setMeetingForm({ ...meetingForm, summary_notes: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Acordos para os Próximos 15 Dias</Label>
              <Textarea
                rows={2}
                placeholder="Metas e compromissos até a próxima sessão..."
                value={meetingForm.next_steps}
                onChange={e => setMeetingForm({ ...meetingForm, next_steps: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link da Gravação / Material (Opcional)</Label>
              <Input
                className="h-10"
                placeholder="https://..."
                value={meetingForm.recording_link}
                onChange={e => setMeetingForm({ ...meetingForm, recording_link: e.target.value })}
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  Programar próximo encontro para +15 dias automaticamente
                </span>
                <Switch
                  checked={autoScheduleNext15d}
                  onCheckedChange={setAutoScheduleNext15d}
                />
              </div>
              {!editingMeeting && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs font-medium">
                    Lançar sessão na Agenda Principal
                  </span>
                  <Switch checked={syncToAgenda} onCheckedChange={setSyncToAgenda} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMeeting}>Salvar Encontro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: ATRIBUIR / EDITAR ATIVIDADE DO ALUNO
         ========================================================= */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Atividade" : "Passar Nova Atividade"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mentorado</Label>
                <Select
                  value={taskForm.client_id}
                  onValueChange={val => setTaskForm({ ...taskForm, client_id: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentees.map(m => (
                      <SelectItem key={m.client.id} value={m.client.id}>
                        {m.client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={taskForm.category}
                  onValueChange={val => setTaskForm({ ...taskForm, category: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Título da Atividade</Label>
              <Input
                className="h-10"
                placeholder="Ex: Treinar 3 peles artificiais de sombreamento whip shading"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Instruções / Detalhes</Label>
              <Textarea
                rows={3}
                placeholder="Critérios de entrega, referências..."
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prazo de Entrega</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={val => setTaskForm({ ...taskForm, status: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(st => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link da Entrega / Evidência (Opcional)</Label>
              <Input
                className="h-10"
                placeholder="Link do post, Drive ou foto..."
                value={taskForm.delivery_link}
                onChange={e => setTaskForm({ ...taskForm, delivery_link: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Feedback / Avaliação do Mentor</Label>
              <Textarea
                rows={2}
                placeholder="Observações sobre a execução do aluno..."
                value={taskForm.mentor_feedback}
                onChange={e => setTaskForm({ ...taskForm, mentor_feedback: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTask}>Salvar Atividade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: REGISTRAR CHECKPOINT DE PERFORMANCE
         ========================================================= */}
      <Dialog open={metricModalOpen} onOpenChange={setMetricModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Checkpoint de Performance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mentorado</Label>
                <Select
                  value={metricForm.client_id}
                  onValueChange={val => setMetricForm({ ...metricForm, client_id: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentees.map(m => (
                      <SelectItem key={m.client.id} value={m.client.id}>
                        {m.client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Período / Identificação</Label>
                <Input
                  className="h-10"
                  placeholder="Ex: Quinzena 2, Outubro..."
                  value={metricForm.period_label}
                  onChange={e => setMetricForm({ ...metricForm, period_label: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data do Registro</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={metricForm.record_date}
                  onChange={e => setMetricForm({ ...metricForm, record_date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Faturamento no Período (R$)</Label>
                <CurrencyInput
                  className="h-10"
                  value={metricForm.monthly_revenue}
                  onValueChange={val => setMetricForm({ ...metricForm, monthly_revenue: val })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tattoos Realizadas</Label>
                <Input
                  type="number"
                  className="h-10"
                  value={metricForm.tattoos_completed}
                  onChange={e =>
                    setMetricForm({
                      ...metricForm,
                      tattoos_completed: Number(e.target.value)
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Orçamentos / Leads</Label>
                <Input
                  type="number"
                  className="h-10"
                  value={metricForm.leads_received}
                  onChange={e =>
                    setMetricForm({
                      ...metricForm,
                      leads_received: Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nota Técnica (1 a 10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  className="h-10"
                  value={metricForm.technical_score}
                  onChange={e =>
                    setMetricForm({
                      ...metricForm,
                      technical_score: Number(e.target.value)
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nota Comercial (1 a 10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  className="h-10"
                  value={metricForm.commercial_score}
                  onChange={e =>
                    setMetricForm({
                      ...metricForm,
                      commercial_score: Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações do Período</Label>
              <Textarea
                rows={2}
                placeholder="Destaques ou motivos de variação..."
                value={metricForm.notes}
                onChange={e => setMetricForm({ ...metricForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMetric}>Salvar Indicadores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mentorship;
