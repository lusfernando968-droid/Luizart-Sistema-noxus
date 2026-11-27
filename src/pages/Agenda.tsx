import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit } from "lucide-react";
import { AgendaIntelligence } from "@/components/agenda/AgendaIntelligence";
import { AgendaReschedule } from "@/components/agenda/AgendaReschedule";
import { AgendaRegistry } from "@/components/agenda/AgendaRegistry";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from "@/components/ui/context-menu";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, User, Calendar, Clock, RefreshCw, FileSpreadsheet, CheckCircle2, Trash2, ChevronsUpDown, Link as LinkIcon, ExternalLink, DollarSign, List, Settings, AlertTriangle, CalendarOff, Info, Lock, Ban, UserCheck, CalendarRange, BookOpen, Droplet } from "lucide-react";
import { AgendaConfigModal, AgendaConfig, AgendaBlock } from "@/components/agenda/AgendaConfigModal";
import { CancellationReasonFields } from "@/components/agenda/CancellationReasonFields";
import {
  buildCancellationPayload,
  CancelledBy,
  validateCancellationInput,
} from "@/lib/cancellations";
import FullCalendar from "@fullcalendar/react";
import { EventContentArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
import { WaitlistReallocateModal, FreedSlotInfo } from "@/components/crm/WaitlistReallocateModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase, supabasePublic } from "@/lib/supabase";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Appointment {
  id: string;
  client_id: string;
  journey_id?: string;
  client_name?: string;
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  deposit: number;
  deposit_date?: string;
  deposit_link?: string;
  status: string;
  type?: string;
  notes?: string;
  cancelled_by?: CancelledBy | null;
  cancellation_reason?: string | null;
  cancellation_notes?: string | null;
  cancelled_at?: string | null;
}

const Agenda = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileViewType, setMobileViewType] = useState<string>("timeGridDay");
  const calendarRef = useRef<any>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig | null>(null);
  const [agendaBlocks, setAgendaBlocks] = useState<AgendaBlock[]>([]);
  const [assistantMissions, setAssistantMissions] = useState<any[]>([]);
  const [selectedBlockToDelete, setSelectedBlockToDelete] = useState<AgendaBlock | null>(null);
  const [blockAlertOpen, setBlockAlertOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<Appointment | null>(null);
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [freedSlot, setFreedSlot] = useState<FreedSlotInfo | null>(null);
  const [contextMenuData, setContextMenuData] = useState<{ x: number, y: number, appt: Appointment } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenuData(null);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix',
    driveLink: '',
    barterDescription: '',
    cancelledBy: "" as CancelledBy | "",
    cancellationReason: "",
    cancellationNotes: ""
  });

  const createDefaultFormData = (overrides: Record<string, any> = {}) => ({
    client_id: "",
    journey_id: "",
    type: "Tatuagem",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    status: "Agendado",
    value: 0,
    deposit: 0,
    deposit_date: new Date().toISOString().split("T")[0],
    deposit_link: "",
    cancelledBy: "" as CancelledBy | "",
    cancellationReason: "",
    cancellationNotes: "",
    ...overrides,
  });

  const [formData, setFormData] = useState(() => createDefaultFormData({ date: "" }));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  
  const [clientJourneys, setClientJourneys] = useState<any[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const anestheticExtraAppliedRef = useRef(false);

  const shiftTimeByMinutes = (time: string, deltaMinutes: number) => {
    const [h, m] = (time || "09:00").split(":").map(Number);
    const total = Math.max(0, Math.min(23 * 60 + 59, (h || 0) * 60 + (m || 0) + deltaMinutes));
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!modalOpen) {
      anestheticExtraAppliedRef.current = false;
    }
  }, [modalOpen]);

  useEffect(() => {
    if (formData.client_id) {
      const fetchClientJourneys = async () => {
        setLoadingJourneys(true);
        const { data } = await supabase.from('journeys').select('*').eq('client_id', formData.client_id).order('created_at', { ascending: false });
        setClientJourneys(data || []);
        
        // Auto-select the first active journey if not editing or if journey_id is empty
        if (data && data.length > 0 && !formData.journey_id) {
          // Try to find one not "Concluído"
          const active = data.find(j => j.status !== 'Concluído') || data[0];
          setFormData(prev => ({ ...prev, journey_id: active.id }));
        }
        setLoadingJourneys(false);
      };
      fetchClientJourneys();
    } else {
      setClientJourneys([]);
      setFormData(prev => ({ ...prev, journey_id: "" }));
    }
  }, [formData.client_id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*, client:clientes(name, is_student)');

      if (error) throw error;

      const formatted = (data || []).map((a: any) => ({
        id: a.id,
        client_id: a.client_id,
        journey_id: a.journey_id,
        client_name: a.client?.name || "Cliente",
        date: a.date || "",
        startTime: a.start_time || a.startTime || "09:00",
        endTime: a.end_time || a.endTime || "10:00",
        value: a.value || 0,
        deposit: a.deposit || 0,
        deposit_date: a.deposit_date || "",
        deposit_link: a.deposit_link || a.deposit_drive_link || "",
        status: a.status || "Agendado",
        type: a.type || "Tatuagem",
        notes: a.notes || "",
        cancelled_by: a.cancelled_by || null,
        cancellation_reason: a.cancellation_reason || null,
        cancellation_notes: a.cancellation_notes || null,
        cancelled_at: a.cancelled_at || null
      }));

      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const [{ data: clientsData, error }, { data: profilesData }] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('mentorship_profiles').select('client_id')
      ]);
      if (error) throw error;

      const menteeSet = new Set((profilesData || []).map((p: any) => p.client_id));
      const enriched = (clientsData || []).map((c: any) => ({
        ...c,
        is_student: Boolean(c.is_student || menteeSet.has(c.id))
      }));
      setClients(enriched);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAgendaConfigAndBlocks = async () => {
    try {
      const [{ data: configData }, { data: blocksData }, { data: missionsData }] = await Promise.all([
        supabase.from('agenda_config').select('*').limit(1).maybeSingle(),
        supabase.from('agenda_blocks').select('*').order('date', { ascending: true }),
        supabase
          .from('strategic_workspace')
          .select('*')
          .eq('item_type', 'assistant_mission')
          .eq('status', 'Pendente')
          .order('created_at', { ascending: false })
      ]);
      if (configData) setAgendaConfig(configData);
      if (blocksData) setAgendaBlocks(blocksData);
      if (missionsData) setAssistantMissions(missionsData);
    } catch (error) {
      console.error('Error fetching agenda config and blocks:', error);
    }
  };

  const handleCompleteAssistantMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('strategic_workspace')
        .update({ status: 'Concluído', updated_at: new Date().toISOString() })
        .eq('id', missionId);
      if (error) throw error;
      toast.success("Missão concluída!");
      fetchAgendaConfigAndBlocks();
    } catch (error) {
      toast.error("Erro ao concluir missão.");
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchClients();
    fetchAgendaConfigAndBlocks();
  }, []);

  const getEventColors = (status: string) => {
    switch (status) {
      case "Pendente":
      case "Agendado": return { backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" };
      case "Confirmado": return { backgroundColor: "#9333ea", borderColor: "#9333ea" };
      case "Concluído": return { backgroundColor: "#10b981", borderColor: "#10b981" };
      case "Reagendado": return { backgroundColor: "#3b82f6", borderColor: "#3b82f6" };
      case "Cancelado": return { backgroundColor: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))" };
      case "Para Remarcar": return { backgroundColor: "#f97316", borderColor: "#f97316" };
      default: return { backgroundColor: "hsl(var(--muted))", borderColor: "hsl(var(--muted))" };
    }
  };

  const { calendarSlotMinTime, calendarSlotMaxTime } = useMemo(() => {
    if (!agendaConfig?.weekly_schedule) {
      return { calendarSlotMinTime: "08:00", calendarSlotMaxTime: "23:00" };
    }

    let minHour = 8;
    let maxHour = 22;
    let hasEnabled = false;

    Object.values(agendaConfig.weekly_schedule).forEach(day => {
      if (day.enabled) {
        hasEnabled = true;
        const startH = parseInt(day.start?.split(":")[0] || "8", 10);
        const endH = parseInt(day.end?.split(":")[0] || "22", 10);
        if (startH < minHour) minHour = startH;
        if (endH > maxHour) maxHour = endH;
      }
    });

    if (!hasEnabled) {
      return { calendarSlotMinTime: "08:00", calendarSlotMaxTime: "23:00" };
    }

    const finalMin = Math.max(6, minHour - 1);
    const finalMax = Math.min(24, Math.max(23, maxHour + 1));

    return {
      calendarSlotMinTime: `${finalMin.toString().padStart(2, "0")}:00`,
      calendarSlotMaxTime: `${finalMax.toString().padStart(2, "0")}:00`
    };
  }, [agendaConfig]);

  const calendarBusinessHours = useMemo(() => {
    if (!agendaConfig?.weekly_schedule) {
      return [
        { daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
        { daysOfWeek: [6], startTime: '09:00', endTime: '14:00' }
      ];
    }

    const bh: any[] = [];
    Object.entries(agendaConfig.weekly_schedule).forEach(([dayKey, day]) => {
      if (day.enabled) {
        bh.push({
          daysOfWeek: [parseInt(dayKey, 10)],
          startTime: day.start || '09:00',
          endTime: day.end || '18:00'
        });
      }
    });

    return bh;
  }, [agendaConfig]);

  const calendarEvents = useMemo(() => {
    const list: any[] = [];
    if (!Array.isArray(appointments)) return [];

    appointments
      .filter(appt => appt && appt.date && appt.startTime)
      .forEach(appt => {
        const colors = getEventColors(appt.status);
        const isMentoria = appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1";
        list.push({
          id: appt.id,
          title: appt.client_name || "Cliente",
          start: `${appt.date}T${appt.startTime}`,
          end: `${appt.date}T${appt.endTime || appt.startTime}`,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: "#ffffff",
          extendedProps: {
            isBlock: false,
            isMentoria,
            type: appt.type || "Tatuagem",
            notes: appt.notes || "",
            status: appt.status,
            value: appt.value,
            deposit: appt.deposit,
            deposit_date: appt.deposit_date,
            deposit_link: appt.deposit_link
          }
        });
      });

    if (Array.isArray(agendaBlocks)) {
      agendaBlocks.forEach(block => {
        const startHour = block.all_day
          ? calendarSlotMinTime
          : (block.start_time || "08:00");
        const endHour = block.all_day
          ? calendarSlotMaxTime
          : (block.end_time || "18:00");

        // Evento visível em primeiro plano (sempre com allDay: false para renderizar no corpo dos horários)
        list.push({
          id: `block-${block.id}`,
          title: `Bloqueado: ${block.title}`,
          start: `${block.date}T${startHour}`,
          end: `${block.date}T${endHour}`,
          allDay: false,
          backgroundColor: "#1e293b",
          borderColor: "#334155",
          textColor: "#ffffff",
          display: "block",
          className: "fc-block-event cursor-pointer",
          extendedProps: {
            isBlock: true,
            blockData: block,
            isAllDay: block.all_day
          }
        });

        // Sombreamento de fundo suave no horário bloqueado
        list.push({
          id: `block-bg-${block.id}`,
          start: `${block.date}T${startHour}`,
          end: `${block.date}T${endHour}`,
          allDay: false,
          display: "background",
          className: "fc-block-bg-event",
          backgroundColor: "rgba(30, 41, 59, 0.08)"
        });
      });
    }

    return list;
  }, [appointments, agendaBlocks, calendarSlotMinTime, calendarSlotMaxTime]);

  const currentConflict = useMemo(() => {
    if (!formData.date) return { hasConflict: false, type: null, message: "" };

    // 1. Checar bloqueio por compromisso pontual
    const matchedBlock = agendaBlocks.find(b => b.date === formData.date);
    if (matchedBlock) {
      if (matchedBlock.all_day) {
        return {
          hasConflict: true,
          type: "block",
          message: `O dia todo está bloqueado por compromisso: "${matchedBlock.title}". Evite agendamentos nesta data.`
        };
      }
      if (matchedBlock.start_time && matchedBlock.end_time && formData.startTime && formData.endTime) {
        if (formData.startTime < matchedBlock.end_time && formData.endTime > matchedBlock.start_time) {
          return {
            hasConflict: true,
            type: "block",
            message: `Conflito com o compromisso "${matchedBlock.title}" (${matchedBlock.start_time} às ${matchedBlock.end_time}).`
          };
        }
      }
    }

    // 2. Checar disponibilidade da grade semanal
    if (agendaConfig?.weekly_schedule) {
      const [year, month, day] = formData.date.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay().toString();
      const dayRule = agendaConfig.weekly_schedule[dayOfWeek];

      if (dayRule) {
        if (!dayRule.enabled) {
          return {
            hasConflict: true,
            type: "day_disabled",
            message: `A agenda está configurada como FECHADA aos ${dayRule.name}s. Não há vagas abertas para o assistente marcar.`
          };
        }
        if (formData.startTime && dayRule.start && formData.startTime < dayRule.start) {
          return {
            hasConflict: true,
            type: "out_of_hours",
            message: `Horário de início (${formData.startTime}) é anterior ao expediente de ${dayRule.name} (${dayRule.start} às ${dayRule.end}).`
          };
        }
        if (formData.endTime && dayRule.end && formData.endTime > dayRule.end) {
          return {
            hasConflict: true,
            type: "out_of_hours",
            message: `Horário de término (${formData.endTime}) ultrapassa o expediente de ${dayRule.name} (${dayRule.start} às ${dayRule.end}).`
          };
        }
      }
    }

    return { hasConflict: false, type: null, message: "" };
  }, [formData.date, formData.startTime, formData.endTime, agendaBlocks, agendaConfig]);

  const statusColor = (status: string) => {
    switch (status) {
      case "Confirmado": return "bg-purple-500/10 text-purple-500";
      case "Pendente":
      case "Agendado": return "bg-primary/10 text-primary";
      case "Concluído": return "bg-primary/10 text-primary";
      case "Cancelado": return "bg-destructive/10 text-destructive";
      case "Para Remarcar": return "bg-orange-500/10 text-orange-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    setEditingAppointment(null);
    setFormData(
      createDefaultFormData({
        date: arg.dateStr.includes("T") ? arg.dateStr.split("T")[0] : arg.dateStr,
        startTime: arg.dateStr.includes("T") ? arg.dateStr.split("T")[1].substring(0, 5) : "09:00",
        endTime: arg.dateStr.includes("T")
          ? new Date(new Date(arg.dateStr).getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5)
          : "10:00",
      })
    );
    setModalOpen(true);
  };

  const openEditWithAppointment = (appt: Appointment, statusOverride?: string) => {
    setEditingAppointment(appt);
    const normalizedType =
      appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1" ? "Mentoria" : "Tatuagem";
    setFormData(
      createDefaultFormData({
        client_id: appt.client_id || "",
        journey_id: appt.journey_id || "",
        type: normalizedType,
        notes: appt.notes || "",
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: statusOverride || appt.status,
        value: appt.value,
        deposit: appt.deposit,
        deposit_date: appt.deposit_date || new Date().toISOString().split("T")[0],
        deposit_link: appt.deposit_link || "",
        cancelledBy: appt.cancelled_by || "",
        cancellationReason: appt.cancellation_reason || "",
        cancellationNotes: appt.cancellation_notes || "",
      })
    );
    setModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    if (typeof arg?.event?.id === "string" && arg.event.id.startsWith("block-")) {
      const blockId = arg.event.id.replace("block-", "");
      const block = agendaBlocks.find(b => b.id === blockId);
      if (block) {
        setSelectedBlockToDelete(block);
        setBlockAlertOpen(true);
      }
      return;
    }

    const appt = appointments.find(a => a.id === arg.event.id);
    if (appt) {
      openEditWithAppointment(appt);
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;

    try {
      setLoading(true);
      await supabase.from('mentorship_meetings').delete().eq('appointment_id', editingAppointment.id);
      const { error } = await supabase.from('appointments').delete().eq('id', editingAppointment.id);
      if (error) throw error;

      toast.success("Agendamento excluído com sucesso.");
      setModalOpen(false);
      setDeleteAlertOpen(false);
      await fetchAppointments();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (overrideStatus?: string) => {
    try {
      if (!formData.client_id) {
        toast.error("Por favor, selecione um cliente.");
        return;
      }

      // Validação de restrição da agenda ou compromisso bloqueado
      if (currentConflict.hasConflict) {
        if (agendaConfig?.block_outside_schedule) {
          const confirmForce = window.confirm(
            `ATENÇÃO: RESTRIÇÃO DE AGENDA!\n\n${currentConflict.message}\n\nDeseja confirmar o agendamento mesmo com essa restrição?`
          );
          if (!confirmForce) return;
        } else {
          toast.warning(`Aviso: ${currentConflict.message}`);
        }
      }

      const clientObj = clients.find(c => c.id === formData.client_id);
      const clientName = clientObj?.name || "Cliente";
      const finalStatus = typeof overrideStatus === 'string' ? overrideStatus : formData.status;
      const isMentoria = formData.type === "Mentoria";

      if (finalStatus === "Cancelado") {
        const cancellationError = validateCancellationInput({
          cancelledBy: formData.cancelledBy,
          reason: formData.cancellationReason,
          notes: formData.cancellationNotes,
        });
        if (cancellationError) {
          toast.error(cancellationError);
          return;
        }
      }

      const cancellationFields = buildCancellationPayload(
        finalStatus,
        {
          cancelledBy: formData.cancelledBy,
          reason: formData.cancellationReason,
          notes: formData.cancellationNotes,
        },
        {
          status: editingAppointment?.status,
          cancelled_at: editingAppointment?.cancelled_at,
        }
      );

      const userStr = localStorage.getItem("noxus_user");
      const loggedUser = userStr ? JSON.parse(userStr) : null;

      const payload: any = {
        client_id: formData.client_id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        status: finalStatus,
        type: isMentoria ? "Mentoria" : "Tatuagem",
        notes: formData.notes?.trim() || null,
        value: formData.value,
        deposit: formData.deposit,
        deposit_date: formData.deposit_date || null,
        user_id: loggedUser?.id || null,
        ...cancellationFields,
      };

      let savedApptId = editingAppointment?.id;
      let apptData = null;

      if (editingAppointment) {
        const { data, error } = await supabase.from('appointments').update(payload).eq('id', editingAppointment.id).select().single();
        if (error) { console.error("Supabase update error:", JSON.stringify(error)); throw error; }
        apptData = data;
      } else {
        const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
        if (error) { console.error("Supabase insert error:", JSON.stringify(error)); throw error; }
        apptData = data;
        savedApptId = data.id;
      }

      // Sincronização automática com o módulo de Mentorias (mentorship_meetings e mentorship_profiles)
      if (savedApptId) {
        if (isMentoria) {
          const [sh, sm] = (formData.startTime || "09:00").split(":").map(Number);
          const [eh, em] = (formData.endTime || "10:00").split(":").map(Number);
          const durationMins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));
          const meetingStatus =
            finalStatus === "Concluído"
              ? "Realizado"
              : finalStatus === "Cancelado"
              ? "Cancelado"
              : "Agendado";

          const { data: existingMeeting } = await supabase
            .from("mentorship_meetings")
            .select("id, meeting_number")
            .eq("appointment_id", savedApptId)
            .maybeSingle();

          if (existingMeeting) {
            await supabase
              .from("mentorship_meetings")
              .update({
                client_id: formData.client_id,
                date: formData.date,
                start_time: formData.startTime,
                duration_minutes: durationMins,
                title:
                  formData.notes?.trim() ||
                  `Encontro #${existingMeeting.meeting_number} - Mentoria Quinzenal`,
                status: meetingStatus
              })
              .eq("id", existingMeeting.id);
          } else {
            const { count } = await supabase
              .from("mentorship_meetings")
              .select("id", { count: "exact", head: true })
              .eq("client_id", formData.client_id);

            const nextNum = (count || 0) + 1;
            await supabase.from("mentorship_meetings").insert({
              client_id: formData.client_id,
              appointment_id: savedApptId,
              meeting_number: nextNum,
              date: formData.date,
              start_time: formData.startTime,
              duration_minutes: durationMins,
              title: formData.notes?.trim() || `Encontro #${nextNum} - Mentoria Quinzenal`,
              status: meetingStatus
            });
          }

          // Atualiza o próximo encontro na ficha do mentorado
          let nextCycleDate = formData.date;
          if (meetingStatus === "Realizado" && formData.date) {
            const d = new Date(`${formData.date}T12:00:00`);
            d.setDate(d.getDate() + 15);
            nextCycleDate = d.toISOString().split("T")[0];
          }

          await supabase.from("mentorship_profiles").upsert(
            {
              client_id: formData.client_id,
              next_meeting_date: nextCycleDate,
              updated_at: new Date().toISOString()
            },
            { onConflict: "client_id" }
          );
        } else if (editingAppointment) {
          // Caso tenha sido alterado de Mentoria para Tatuagem, remove o encontro vinculado
          await supabase.from("mentorship_meetings").delete().eq("appointment_id", savedApptId);
        }
      }

      if (formData.deposit > 0) {
        try {
          const { data: existingSinal } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('appointment_id', savedApptId)
            .ilike('description', 'Sinal%')
            .maybeSingle();

          if (!existingSinal) {
            await supabase.from('financial_transactions').insert([{
              description: `Sinal de Agendamento - ${clientName}`,
              value: formData.deposit,
              date: formData.deposit_date || formData.date,
              type: "entrada",
              status: "Pago",
              category: "sinal",
              drive_link: formData.deposit_link,
              is_deductible: false,
              appointment_id: savedApptId
            }]);
          } else {
            await supabase.from('financial_transactions').update({
              value: formData.deposit,
              date: formData.deposit_date || formData.date,
              drive_link: formData.deposit_link
            }).eq('id', existingSinal.id);
          }
        } catch (e) {
          console.log("Aviso: Falha ao lançar/atualizar sinal no financeiro", e);
        }
      }

      await fetchAppointments();
      setModalOpen(false);
      toast.success(
        isMentoria
          ? "Sessão de mentoria agendada e vinculada ao perfil do aluno!"
          : "Agendamento salvo com sucesso!"
      );

      // Se o status mudou para 'Cancelado', 'Para Remarcar' ou 'Reagendado' (ou mudou a data de um agendamento existente), abre pop-up para realocar a vaga
      const vacatedByStatus =
        (finalStatus === "Cancelado" ||
          finalStatus === "Para Remarcar" ||
          finalStatus === "Reagendado") &&
        editingAppointment?.status !== finalStatus;
      const vacatedByDateMove =
        Boolean(editingAppointment) &&
        editingAppointment?.date &&
        editingAppointment.date !== formData.date &&
        editingAppointment.status !== "Cancelado";

      if (vacatedByStatus || vacatedByDateMove) {
        setTimeout(() => {
          setFreedSlot({
            appointmentId: savedApptId,
            previousClientName: clientName,
            date: editingAppointment?.date || formData.date,
            startTime: editingAppointment?.startTime || formData.startTime,
            endTime: editingAppointment?.endTime || formData.endTime,
            reason: vacatedByStatus ? finalStatus : "Reagendado",
            value: Number(editingAppointment?.value ?? formData.value ?? 0)
          });
          setReallocateModalOpen(true);
        }, 250);
      }

      // Se o status mudou para 'Concluído', abra o modal de checkout para dar baixa financeira (se for tatuagem ou tiver valor)
      if (
        finalStatus === 'Concluído' &&
        editingAppointment?.status !== 'Concluído' &&
        apptData &&
        (!isMentoria || Number(formData.value) > 0)
      ) {
        setTimeout(() => {
          setSelectedCheckout({
            ...apptData,
            client_name: clientName,
            startTime: formData.startTime,
            endTime: formData.endTime
          } as any);
          setCheckoutData({
            status: clientObj?.is_barter ? 'Permuta' : 'Recebido',
            value: Math.max(0, (formData.value || 0) - (formData.deposit || 0)),
            paymentMethod: 'Pix',
            driveLink: '',
            barterDescription: clientObj?.barter_description || ''
          });
          setCheckoutModalOpen(true);
        }, 300);
      }
    } catch (error: any) {
        console.error('Error saving appointment:', error);
        toast.error(`Erro ao salvar: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const handleSelect = (arg: any) => {
    setEditingAppointment(null);
    setFormData(
      createDefaultFormData({
        date: arg.startStr.split("T")[0],
        startTime: arg.startStr.includes("T") ? arg.startStr.split("T")[1].substring(0, 5) : "09:00",
        endTime: arg.endStr.includes("T") ? arg.endStr.split("T")[1].substring(0, 5) : "10:00",
      })
    );
    setModalOpen(true);
  };

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    try {
      const appt = appointments.find(a => a.id === event.id);
      if (!appt) return;

      const newDate = event.startStr.split("T")[0];
      const newStart = event.startStr.split("T")[1].substring(0, 5);
      const newEnd = event.endStr ? event.endStr.split("T")[1].substring(0, 5) : appt.endTime;

      const { error } = await supabase.from('appointments').update({
          date: newDate,
          start_time: newStart,
          end_time: newEnd,
        }).eq('id', event.id);

      if (error) throw error;

      if (appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1") {
        await supabase
          .from("mentorship_meetings")
          .update({ date: newDate, start_time: newStart })
          .eq("appointment_id", event.id);
      }

      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      changeInfo.revert();
    }
  };

  const handleConfirmAppointment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('appointments').update({ status: 'Confirmado' }).eq('id', id);
      if (error) throw error;

      await fetchAppointments();
      toast.success("Agendamento confirmado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao confirmar agendamento.");
    }
  };

  const openCheckout = (appt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    const matchedClient = clients.find(c => c.id === appt.client_id);
    setSelectedCheckout(appt);
    setCheckoutData({
      status: matchedClient?.is_barter ? 'Permuta' : 'Recebido',
      value: Math.max(0, (appt.value || 0) - (appt.deposit || 0)),
      paymentMethod: 'Pix',
      driveLink: '',
      barterDescription: matchedClient?.barter_description || '',
      cancelledBy: appt.cancelled_by || "",
      cancellationReason: appt.cancellation_reason || "",
      cancellationNotes: appt.cancellation_notes || "",
    });
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedCheckout) return;
    try {
      // 1. Atualizar o agendamento
      const apptStatus =
        checkoutData.status === 'Recebido' ||
        checkoutData.status === 'Permuta' ||
        checkoutData.status === 'Apenas Consulta'
          ? 'Concluído'
          : checkoutData.status === 'Para Remarcar'
          ? 'Para Remarcar'
          : 'Cancelado';

      if (apptStatus === 'Cancelado') {
        const cancellationError = validateCancellationInput({
          cancelledBy: checkoutData.cancelledBy,
          reason: checkoutData.cancellationReason,
          notes: checkoutData.cancellationNotes,
        });
        if (cancellationError) {
          toast.error(cancellationError);
          return;
        }
      }

      const cancellationFields = buildCancellationPayload(
        apptStatus,
        {
          cancelledBy: checkoutData.cancelledBy,
          reason: checkoutData.cancellationReason,
          notes: checkoutData.cancellationNotes,
        },
        {
          status: selectedCheckout.status,
          cancelled_at: selectedCheckout.cancelled_at,
        }
      );

      const { error: apptError } = await supabase
        .from('appointments')
        .update({ status: apptStatus, ...cancellationFields })
        .eq('id', selectedCheckout.id);
      if (apptError) throw apptError;

      // 2. Se for "Recebido", lançar no financeiro
      if (checkoutData.status === 'Recebido') {
        const isMentoriaCheckout =
          String(selectedCheckout.client_name || "").toLowerCase().includes("mentoria") ||
          String(selectedCheckout.style || "").toLowerCase().includes("mentoria");
        const { error: finError } = await supabase.from('financial_transactions').insert([{
          description: `Sessão de Tattoo - ${selectedCheckout.client_name}`,
          type: "entrada",
          value: checkoutData.value,
          date: new Date().toISOString().split("T")[0],
          status: "Pago",
          category: isMentoriaCheckout ? "mentoria" : "tatuagem",
          drive_link: checkoutData.driveLink,
          appointment_id: selectedCheckout.id
        }]);
        if (finError) console.error("Error inserting financial transaction:", finError);
      }

      // 3. Se for "Permuta", abater no saldo de permuta do cliente
      if (checkoutData.status === 'Permuta' && selectedCheckout.client_id) {
        const matchedClient = clients.find(c => c.id === selectedCheckout.client_id);
        const currentBalance = Number(matchedClient?.barter_balance || 0);
        const deductAmount = Number(checkoutData.value || 0);
        const newBalance = currentBalance - deductAmount;
        const historyEntry = {
          id: String(Date.now()),
          date: new Date().toISOString().split("T")[0],
          type: "abatimento",
          amount: -deductAmount,
          balance_after: newBalance,
          note: `Baixa de sessão (${selectedCheckout.date ? selectedCheckout.date.split('-').reverse().join('/') : "Tatuagem"})`
        };
        const currentHistory = Array.isArray(matchedClient?.barter_history) ? matchedClient.barter_history : [];

        const { error: barterError } = await supabase
          .from('clientes')
          .update({
            is_barter: true,
            barter_description: checkoutData.barterDescription?.trim() || matchedClient?.barter_description || "Permuta",
            barter_balance: newBalance,
            barter_history: [historyEntry, ...currentHistory]
          })
          .eq('id', selectedCheckout.client_id);

        if (barterError) throw barterError;
      }

      toast.success(
        checkoutData.status === 'Permuta'
          ? "Sessão abatida no saldo de permuta!"
          : "Sessão baixada com sucesso!"
      );
      setCheckoutModalOpen(false);
      fetchAppointments();
      fetchClients();

      if (apptStatus === 'Cancelado' || apptStatus === 'Para Remarcar') {
        setFreedSlot({
          appointmentId: selectedCheckout.id,
          previousClientName: selectedCheckout.client_name,
          date: selectedCheckout.date || new Date().toISOString().split("T")[0],
          startTime: selectedCheckout.startTime || "09:00",
          endTime: selectedCheckout.endTime || "11:00",
          reason: apptStatus,
          value: Number(selectedCheckout.value || 0)
        });
        setReallocateModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa na sessão.");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const WEEK_DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      setSelectedDay(calendarRef.current.getApi().getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      setSelectedDay(calendarRef.current.getApi().getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setSelectedDay(new Date());
    }
  };

  const handleDuplicateContextMenu = (appt: Appointment) => {
    setEditingAppointment(null);
    const normalizedType =
      appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1" ? "Mentoria" : "Tatuagem";
    setFormData(
      createDefaultFormData({
        client_id: appt.client_id || "",
        journey_id: appt.journey_id || "",
        type: normalizedType,
        notes: appt.notes || "",
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status === "Cancelado" ? "Agendado" : appt.status,
        value: appt.value,
        deposit: appt.deposit,
        deposit_date: appt.deposit_date || new Date().toISOString().split("T")[0],
        deposit_link: appt.deposit_link || "",
      })
    );
    setModalOpen(true);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    if (eventInfo.event.extendedProps?.isBlock) {
      const blockData = eventInfo.event.extendedProps?.blockData;
      const isAllDay = eventInfo.event.extendedProps?.isAllDay;
      return (
        <div className="w-full h-full flex flex-col justify-start overflow-hidden p-2 text-white select-none">
          <div className="flex items-center gap-1.5 leading-tight">
            <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="block-badge text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Horário Bloqueado
            </span>
          </div>
          <div className="block-title font-bold text-xs text-white truncate mt-1 leading-snug">
            {blockData?.title || eventInfo.event.title.replace("Bloqueado: ", "")}
          </div>
          <div className="block-time text-[11px] text-slate-300 font-medium leading-tight mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{isAllDay ? "Dia inteiro" : `${blockData?.start_time || ""} às ${blockData?.end_time || ""}`}</span>
          </div>
          {blockData?.reason && (
            <div className="block-desc text-[10px] text-slate-300 truncate mt-1 bg-slate-900/60 border border-slate-700/60 px-1.5 py-0.5 rounded">
              {blockData.reason}
            </div>
          )}
        </div>
      );
    }

    const isMentoria = Boolean(eventInfo.event.extendedProps?.isMentoria);

    return (
      <div className="w-full h-full flex flex-col overflow-hidden text-xs text-white p-1 min-h-[20px]">
        <div className="font-semibold truncate leading-tight flex items-center gap-1">
          {isMentoria && <BookOpen className="w-3.5 h-3.5 text-white shrink-0" title="Sessão de Mentoria" />}
          <span>{eventInfo.timeText}</span>
        </div>
        <div className="truncate whitespace-normal leading-tight flex items-center gap-1">
          {!eventInfo.timeText && isMentoria && (
            <BookOpen className="w-3.5 h-3.5 text-white shrink-0" title="Sessão de Mentoria" />
          )}
          <span className="font-medium">{eventInfo.event.title}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Agenda & Recebimentos</h1>
          <p className="page-subtitle">Gerencie suas sessões, sinais e baixas financeiras</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="hidden sm:flex h-10" onClick={() => {
            setEditingAppointment(null);
            setFormData(createDefaultFormData());
            setModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendario" className="space-y-6">
        <TabsList className="bg-muted p-1 inline-flex w-max mb-2">
          <TabsTrigger value="calendario" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <Calendar className="w-3.5 h-3.5" /> Meu Calendário
          </TabsTrigger>
          <TabsTrigger value="registro" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Registros & Métricas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendario" className="m-0 space-y-4">
          {assistantMissions.length > 0 && (
            <div className="bg-card rounded-xl border border-primary/30 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Missões Prioritárias do Dia ({assistantMissions.length})
                </h3>
              </div>
              <div className="divide-y border rounded-lg overflow-hidden bg-muted/20">
                {assistantMissions.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{m.title}</span>
                        {m.category === "Alta" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Urgente
                          </span>
                        )}
                      </div>
                      {m.content && (
                        <span className="text-muted-foreground block mt-0.5">{m.content}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs gap-1.5 font-semibold shrink-0 self-end sm:self-center"
                      onClick={() => handleCompleteAssistantMission(m.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      Concluir Missão
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Compromissos de Hoje
            </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length === 0 ? (
            <span className="text-xs text-muted-foreground">Nenhum compromisso para hoje.</span>
          ) : (
            appointments
              .filter(a => a.date === new Date().toISOString().split("T")[0])
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(a => {
                const isMentoria = a.type === "Mentoria" || a.type === "Mentoria 1 a 1";
                return (
                  <div 
                    key={a.id} 
                    className="min-w-[200px] flex-shrink-0 bg-accent/10 border border-border p-3 rounded-lg flex flex-col gap-1 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => handleEventClick({ event: { id: a.id } } as any)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-sm truncate flex items-center gap-1.5">
                        {isMentoria && <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" title="Sessão de Mentoria" />}
                        <span className="truncate">{a.client_name}</span>
                      </span>
                      <Badge variant={a.status === 'Confirmado' ? 'default' : a.status === 'Concluído' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                        {a.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.startTime} - {a.endTime}</span>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Barra de Grade de Vagas (Menu Suspenso Retrátil) */}
      <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border p-2.5 sm:p-3 shadow-xs mb-4">
        <div className="flex items-center justify-between gap-2">
          {/* Botão Retrátil (Menu Suspenso) */}
          <button
            type="button"
            onClick={() => setGradeDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 text-left py-1 px-1.5 rounded-lg hover:bg-muted/60 transition-colors focus:outline-hidden"
            title="Clique para expandir ou recolher a grade de horários"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">Grade de Vagas</span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {gradeDropdownOpen ? "(ocultar horários)" : "(ver horários)"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                gradeDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Botão de Ajustar Grade */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2.5 gap-1.5 rounded-lg border border-border/60"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustar Grade</span>
          </Button>
        </div>

        {/* Conteúdo Suspenso da Grade (Aberto sob demanda) */}
        {gradeDropdownOpen && (
          <div className="pt-3 mt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "1", label: "Seg" },
                { key: "2", label: "Ter" },
                { key: "3", label: "Qua" },
                { key: "4", label: "Qui" },
                { key: "5", label: "Sex" },
                { key: "6", label: "Sáb" },
                { key: "0", label: "Dom" },
              ].map(d => {
                const dayConfig = agendaConfig?.weekly_schedule?.[d.key];
                const isEnabled = dayConfig ? dayConfig.enabled : d.key !== "0";
                const timeText = dayConfig?.enabled
                  ? `${dayConfig.start}–${dayConfig.end}`
                  : d.key === "6"
                  ? "09:00–14:00"
                  : d.key === "0"
                  ? "Fechado"
                  : "09:00–18:00";

                return (
                  <div
                    key={d.key}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] border font-medium ${
                      isEnabled
                        ? "bg-muted/50 border-border text-foreground"
                        : "bg-muted/20 border-border/40 text-muted-foreground/60 line-through"
                    }`}
                    title={`${d.label}: ${isEnabled ? timeText : "Fechado"}`}
                  >
                    <span className="font-semibold text-muted-foreground">{d.label}</span>
                    <span className="text-[10px]">{isEnabled ? timeText : "Off"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {/* Cabeçalho Unificado do Calendário Mobile (Estilo Google Agenda) */}
          <div className="bg-card rounded-xl border p-2 shadow-sm space-y-2">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[15px] font-bold capitalize tracking-tight">
                {calendarRef.current ? calendarRef.current.getApi().view.title : currentWeekStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => setConfigModalOpen(true)}
                  title="Configurar Horários e Vagas"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div className="flex items-center bg-accent/50 rounded-lg p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => calendarRef.current?.getApi().prev()}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => calendarRef.current?.getApi().next()}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center bg-accent/50 p-0.5 rounded-lg border">
                  <Button
                    variant={mobileViewType === 'timeGridDay' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Dia
                  </Button>
                  <Button
                    variant={mobileViewType === 'timeGridWeek' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={mobileViewType === 'dayGridMonth' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Mês
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Flutuante (FAB) para Mobile */}
          <Button
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl shadow-primary/40 z-50 p-0 flex items-center justify-center"
            onClick={() => {
              setEditingAppointment(null);
              setFormData(createDefaultFormData());
              setModalOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>

          <div className="bg-card rounded-xl border p-2 shadow-sm overflow-hidden">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={mobileViewType}
              locale={ptBrLocale}
              events={calendarEvents}
              businessHours={calendarBusinessHours}
              slotMinTime={calendarSlotMinTime}
              slotMaxTime={calendarSlotMaxTime}
              scrollTime="08:30:00"
              nowIndicator={true}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              allDaySlot={false}
              headerToolbar={false}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              eventDidMount={(info) => {
                info.el.addEventListener('contextmenu', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof info.event.id === "string" && info.event.id.startsWith("block-")) {
                    const blockId = info.event.id.replace("block-", "");
                    const block = agendaBlocks.find(b => b.id === blockId);
                    if (block) {
                      setSelectedBlockToDelete(block);
                      setBlockAlertOpen(true);
                    }
                    return;
                  }
                  const appt = appointments.find(a => a.id === info.event.id);
                  if (appt) {
                    setContextMenuData({ x: e.clientX, y: e.clientY, appt });
                  }
                });
              }}
              select={handleSelect}
              eventChange={handleEventChange}
              height="calc(100vh - 200px)"
              datesSet={() => {
                setMobileViewType(calendarRef.current?.getApi().view.type || 'timeGridDay');
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            events={calendarEvents}
            businessHours={calendarBusinessHours}
            slotMinTime={calendarSlotMinTime}
            slotMaxTime={calendarSlotMaxTime}
            scrollTime="08:30:00"
            nowIndicator={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            allDaySlot={false}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventDidMount={(info) => {
              info.el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof info.event.id === "string" && info.event.id.startsWith("block-")) {
                  const blockId = info.event.id.replace("block-", "");
                  const block = agendaBlocks.find(b => b.id === blockId);
                  if (block) {
                    setSelectedBlockToDelete(block);
                    setBlockAlertOpen(true);
                  }
                  return;
                }
                const appt = appointments.find(a => a.id === info.event.id);
                if (appt) {
                  setContextMenuData({ x: e.clientX, y: e.clientY, appt });
                }
              });
            }}
            select={handleSelect}
            eventChange={handleEventChange}
            height="calc(100vh - 220px)"
          />
        </div>
      )}
      </TabsContent>

      <TabsContent value="registro" className="m-0">
        <AgendaRegistry appointments={appointments} clients={clients} />
      </TabsContent>
      </Tabs>

      {/* Modal de Cadastro/Edição de Agendamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden gap-0 rounded-2xl border-border/80">
          <DialogHeader className="px-5 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center gap-3 space-y-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-base font-bold text-foreground leading-tight">
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-5 py-4 space-y-3.5 max-h-[78vh] overflow-y-auto">
            {/* Seleção de Cliente */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Cliente</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11 justify-between rounded-xl bg-muted/20 hover:bg-muted/40 border-border/80 px-3.5 font-medium"
                  onClick={() => setClientDropdownOpen(prev => !prev)}
                >
                  {(() => {
                    const selectedClientObj = clients.find((c) => c.id === formData.client_id);
                    return (
                      <span className="flex items-center gap-2.5 truncate">
                        {selectedClientObj ? (
                          <>
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {selectedClientObj.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate text-foreground font-semibold">
                              {selectedClientObj.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Selecione um cliente...</span>
                        )}
                        {selectedClientObj?.is_student && (
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <BookOpen className="w-3 h-3" /> Aluno
                          </span>
                        )}
                      </span>
                    );
                  })()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {clientDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="h-9 rounded-lg"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Nenhum cliente encontrado.</p>
                      ) : (
                        clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            onClick={() => {
                              const nextType = client.is_student ? "Mentoria" : "Tatuagem";
                              const shouldApplyAnesthetic =
                                !editingAppointment &&
                                Boolean(client.uses_anesthetic_cream) &&
                                nextType !== "Mentoria";

                              setFormData(prev => {
                                let nextEndTime = prev.endTime;
                                if (shouldApplyAnesthetic && !anestheticExtraAppliedRef.current) {
                                  nextEndTime = shiftTimeByMinutes(prev.endTime || "10:00", 60);
                                  anestheticExtraAppliedRef.current = true;
                                } else if (!shouldApplyAnesthetic && anestheticExtraAppliedRef.current) {
                                  nextEndTime = shiftTimeByMinutes(prev.endTime || "11:00", -60);
                                  anestheticExtraAppliedRef.current = false;
                                }
                                return {
                                  ...prev,
                                  client_id: client.id,
                                  journey_id: "",
                                  type: nextType,
                                  endTime: nextEndTime
                                };
                              });
                              setClientDropdownOpen(false);
                              setClientSearch("");
                            }}
                          >
                            <span className="flex items-center truncate">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0 text-primary",
                                  formData.client_id === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate font-medium">{client.name}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 ml-2">
                              {client.uses_anesthetic_cream && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  <Droplet className="w-3 h-3" /> +1h
                                </span>
                              )}
                              {client.is_student && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  <BookOpen className="w-3 h-3" /> Aluno
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Caixa de Escolha: Mentoria vs Tatuagem (exibida automaticamente para alunos) */}
            {formData.client_id &&
              (clients.find(c => c.id === formData.client_id)?.is_student ||
                formData.type === "Mentoria") && (
                <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Modalidade
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formData.type === "Mentoria" ? "default" : "outline"}
                      className="h-9 rounded-lg text-xs gap-1.5 font-semibold"
                      onClick={() => {
                        setFormData(prev => {
                          let nextEndTime = prev.endTime;
                          if (!editingAppointment && anestheticExtraAppliedRef.current) {
                            nextEndTime = shiftTimeByMinutes(prev.endTime || "11:00", -60);
                            anestheticExtraAppliedRef.current = false;
                          }
                          return { ...prev, type: "Mentoria", endTime: nextEndTime };
                        });
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Mentoria
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={formData.type !== "Mentoria" ? "default" : "outline"}
                      className="h-9 rounded-lg text-xs gap-1.5 font-semibold"
                      onClick={() => {
                        const selectedClientObj = clients.find(c => c.id === formData.client_id);
                        setFormData(prev => {
                          let nextEndTime = prev.endTime;
                          if (
                            !editingAppointment &&
                            selectedClientObj?.uses_anesthetic_cream &&
                            !anestheticExtraAppliedRef.current
                          ) {
                            nextEndTime = shiftTimeByMinutes(prev.endTime || "10:00", 60);
                            anestheticExtraAppliedRef.current = true;
                          }
                          return { ...prev, type: "Tatuagem", endTime: nextEndTime };
                        });
                      }}
                    >
                      Tatuagem
                    </Button>
                  </div>
                </div>
              )}

            {formData.client_id && formData.type === "Mentoria" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Pauta da Mentoria
                </Label>
                <Input
                  placeholder="Ex: Encontro Quinzenal"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-11 rounded-xl bg-muted/20 border-border/80"
                />
              </div>
            )}

            {formData.client_id && formData.type !== "Mentoria" && clientJourneys.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Jornada (Projeto)
                </Label>
                <Select
                  value={formData.journey_id || ""}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, journey_id: val }))}
                  disabled={loadingJourneys}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl bg-muted/20 border-border/80">
                    <SelectValue placeholder={loadingJourneys ? "Carregando..." : "Selecione a jornada..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientJourneys.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.status} {j.status === 'Concluído' ? '(Antiga)' : '(Atual)'} - {new Date(j.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Alerta sutil de Horário Restrito */}
            {currentConflict.hasConflict && (
              <div className="px-2.5 py-1.5 rounded-lg border border-destructive/15 bg-destructive/5 text-destructive text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-destructive/80" />
                <span>Horário indisponível / restrito</span>
              </div>
            )}

            {/* Data & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Data da Sessão</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="h-11 rounded-xl bg-muted/20 border-border/80"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/80 font-medium">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Para Remarcar">Para Remarcar</SelectItem>
                    <SelectItem value="Reagendado">Reagendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status === "Cancelado" && (
              <CancellationReasonFields
                cancelledBy={formData.cancelledBy}
                reason={formData.cancellationReason}
                notes={formData.cancellationNotes}
                onChange={(next) =>
                  setFormData((prev) => ({
                    ...prev,
                    cancelledBy: next.cancelledBy,
                    cancellationReason: next.reason,
                    cancellationNotes: next.notes,
                  }))
                }
              />
            )}

            {/* Horário de Início & Término */}
            <div className="space-y-1.5">
              {formData.client_id &&
                formData.type !== "Mentoria" &&
                clients.find(c => c.id === formData.client_id)?.uses_anesthetic_cream && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Pomada Anestésica (+1h)</span>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Início</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setFormData(prev => {
                        if (!editingAppointment && prev.startTime && prev.endTime && newStart) {
                          const [sh, sm] = prev.startTime.split(":").map(Number);
                          const [eh, em] = prev.endTime.split(":").map(Number);
                          const currentDuration = Math.max(30, (eh * 60 + em) - (sh * 60 + sm));
                          return {
                            ...prev,
                            startTime: newStart,
                            endTime: shiftTimeByMinutes(newStart, currentDuration)
                          };
                        }
                        return { ...prev, startTime: newStart };
                      });
                    }}
                    className="h-11 rounded-xl bg-muted/20 border-border/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Término</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="h-11 rounded-xl bg-muted/20 border-border/80"
                  />
                </div>
              </div>
            </div>

            {/* Bloco Financeiro (Valor Total & Sinal) */}
            {formData.type !== "Mentoria" && (
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Valor da Sessão</Label>
                    <CurrencyInput
                      value={formData.value}
                      onChange={(val) => setFormData(prev => ({ ...prev, value: val }))}
                      className="h-11 rounded-xl bg-background border-border/80 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Valor do Sinal</Label>
                    <CurrencyInput
                      value={formData.deposit}
                      onChange={(val) => setFormData(prev => ({ ...prev, deposit: val }))}
                      className="h-11 rounded-xl bg-background border-border/80 font-semibold"
                    />
                  </div>
                </div>

                {formData.deposit > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-border/60">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Data do Sinal</Label>
                      <Input
                        type="date"
                        value={formData.deposit_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, deposit_date: e.target.value }))}
                        className="h-10 text-xs bg-background rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-primary" /> Comprovante (Drive)
                      </Label>
                      <Input
                        placeholder="https://drive.google.com/..."
                        value={formData.deposit_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, deposit_link: e.target.value }))}
                        className="h-10 text-xs bg-background rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé Clean */}
          <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
            {editingAppointment ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 px-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold gap-1.5"
                onClick={() => setDeleteAlertOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {editingAppointment && formData.status !== "Concluído" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/80"
                  onClick={() => {
                    setModalOpen(false);
                    openCheckout(editingAppointment, { stopPropagation: () => {} } as any);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Dar Baixa</span>
                </Button>
              )}
              <Button
                type="button"
                className="h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold"
                onClick={() => handleSave()}
              >
                {editingAppointment ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá o agendamento do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Baixa de Sessão */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Sessão (Dar Baixa)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {(() => {
              const checkoutClient = clients.find(c => c.id === selectedCheckout?.client_id);
              return (
                <div className="bg-muted p-3 rounded-md flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.client_name}</span>
                    {checkoutClient?.is_barter && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <RefreshCw className="w-2.5 h-2.5" />
                        Permuta{checkoutClient?.barter_description ? `: ${checkoutClient.barter_description}` : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground">Horário: {selectedCheckout?.startTime} - {selectedCheckout?.endTime}</span>
                  {selectedCheckout?.deposit ? (
                    <span className="text-xs text-primary font-semibold">Sinal Já Abatido: R$ {selectedCheckout.deposit.toLocaleString("pt-BR")}</span>
                  ) : null}
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Resultado da Sessão</Label>
              <Select
                value={checkoutData.status}
                onValueChange={(val) => setCheckoutData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Realizada / Pago</SelectItem>
                  <SelectItem value="Permuta">Realizada / Abater em Permuta</SelectItem>
                  <SelectItem value="Apenas Consulta">Apenas Consulta (Sem Custo)</SelectItem>
                  <SelectItem value="Para Remarcar">Remarcou / Reagendar</SelectItem>
                  <SelectItem value="Cancelado">Faltou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {checkoutData.status === 'Cancelado' && (
              <CancellationReasonFields
                cancelledBy={checkoutData.cancelledBy}
                reason={checkoutData.cancellationReason}
                notes={checkoutData.cancellationNotes}
                onChange={(next) =>
                  setCheckoutData((prev) => ({
                    ...prev,
                    cancelledBy: next.cancelledBy,
                    cancellationReason: next.reason,
                    cancellationNotes: next.notes,
                  }))
                }
              />
            )}

            {checkoutData.status === 'Permuta' && (() => {
              const checkoutClient = clients.find(c => c.id === selectedCheckout?.client_id);
              const currentBalance = Number(checkoutClient?.barter_balance || 0);
              const deductVal = Number(checkoutData.value || 0);
              const afterBalance = currentBalance - deductVal;

              return (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Saldo Atual do Cliente:</span>
                      <span className={`font-bold ${
                        currentBalance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : currentBalance < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }`}>
                        R$ {Math.abs(currentBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                        {currentBalance > 0 ? "(Disponível)" : currentBalance < 0 ? "(Pendente)" : "(Zerado)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-muted-foreground font-medium">Saldo Após Esta Sessão:</span>
                      <span className={`font-bold ${
                        afterBalance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : afterBalance < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }`}>
                        R$ {Math.abs(afterBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                        {afterBalance > 0 ? "(Disponível)" : afterBalance < 0 ? "(Pendente)" : "(Quitado)"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Serviço da Permuta</Label>
                    <Input
                      placeholder="Ex: Barbeiro, Personal, Academia..."
                      value={checkoutData.barterDescription}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, barterDescription: e.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Abatido na Permuta</Label>
                    <CurrencyInput
                      value={checkoutData.value}
                      onChange={(val) => setCheckoutData(prev => ({ ...prev, value: val }))}
                    />
                  </div>
                </div>
              );
            })()}

            {checkoutData.status === 'Recebido' && (
              <>
                <div className="space-y-2">
                  <Label>Valor Restante Recebido</Label>
                  <CurrencyInput
                    value={checkoutData.value}
                    onChange={(val) => setCheckoutData(prev => ({ ...prev, value: val }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={checkoutData.paymentMethod}
                    onValueChange={(val) => setCheckoutData(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Link do Comprovante Final (Google Drive)
                  </Label>
                  <Input
                    placeholder="https://drive.google.com/file/d/..."
                    value={checkoutData.driveLink}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, driveLink: e.target.value }))}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckout}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {contextMenuData && (
        <div 
          style={{ position: 'fixed', top: contextMenuData.y, left: contextMenuData.x, zIndex: 9999 }}
          className="bg-popover text-popover-foreground border border-border shadow-md rounded-md py-1 min-w-[8rem] z-[9999]"
        >
          <div className="px-2 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={() => { handleEventClick({event: {id: contextMenuData.appt.id}}); setContextMenuData(null); }}>Editar</div>
          <div className="px-2 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={() => { handleDuplicateContextMenu(contextMenuData.appt); setContextMenuData(null); }}>Duplicar</div>
          <div className="px-2 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={(e) => { openCheckout(contextMenuData.appt, e as any); setContextMenuData(null); }}>Dar baixa</div>
          <div className="px-2 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={() => { openEditWithAppointment(contextMenuData.appt, "Cancelado"); setContextMenuData(null); }}>Cancelar sessão</div>
          <div className="h-px bg-border my-1" />
          <div className="px-2 py-1.5 hover:bg-accent cursor-pointer text-sm text-red-500" onClick={() => { setEditingAppointment(contextMenuData.appt); setDeleteAlertOpen(true); setContextMenuData(null); }}>Excluir</div>
        </div>
      )}

      {/* Modal de Configuração de Agenda (Horários permitidos e Bloqueios) */}
      <AgendaConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onConfigSaved={() => {
          fetchAgendaConfigAndBlocks();
        }}
      />

      {/* Pop-up para Realocar Horário Liberado (Lista de Espera) */}
      <WaitlistReallocateModal
        open={reallocateModalOpen}
        onOpenChange={setReallocateModalOpen}
        freedSlot={freedSlot}
        clients={clients}
        onReallocated={() => {
          fetchAppointments();
          fetchClients();
        }}
      />

      {/* Modal de Detalhes/Remoção de Bloqueio clicado no calendário */}
      <AlertDialog open={blockAlertOpen} onOpenChange={setBlockAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <CalendarOff className="w-5 h-5" />
              Compromisso Bloqueado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2 text-foreground">
              <span className="font-semibold text-base block">{selectedBlockToDelete?.title}</span>
              <span className="text-xs text-muted-foreground block space-y-1">
                <span className="block"><strong>Data:</strong> {selectedBlockToDelete?.date}</span>
                <span className="block">
                  <strong>Horário:</strong> {selectedBlockToDelete?.all_day ? "Dia inteiro" : `${selectedBlockToDelete?.start_time} às ${selectedBlockToDelete?.end_time}`}
                </span>
                {selectedBlockToDelete?.reason && <span className="block"><strong>Motivo:</strong> {selectedBlockToDelete.reason}</span>}
              </span>
              <span className="text-xs text-muted-foreground pt-2 block">
                Este horário está protegido contra agendamentos de clientes pelo assistente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBlockToDelete(null)}>Fechar</AlertDialogCancel>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBlockAlertOpen(false);
                setConfigModalOpen(true);
              }}
            >
              <Settings className="w-3.5 h-3.5 mr-1" />
              Configurar Agenda
            </Button>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={async () => {
                if (!selectedBlockToDelete) return;
                try {
                  const { error } = await supabase.from('agenda_blocks').delete().eq('id', selectedBlockToDelete.id);
                  if (error) throw error;
                  toast.success("Bloqueio removido com sucesso!");
                  await fetchAgendaConfigAndBlocks();
                } catch (e) {
                  toast.error("Erro ao remover bloqueio.");
                }
              }}
            >
              Desbloquear Horário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Agenda;
