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
import { ChevronLeft, ChevronRight, Plus, Check, User, Calendar, Clock, RefreshCw, FileSpreadsheet, CheckCircle2, Trash2, ChevronsUpDown, Link as LinkIcon, ExternalLink, DollarSign, List } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix',
    driveLink: ''
  });

  const [formData, setFormData] = useState({
    client_id: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    status: "Agendado",
    value: 0,
    deposit: 0,
    deposit_date: new Date().toISOString().split("T")[0],
    deposit_link: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  
  const [clientJourneys, setClientJourneys] = useState<any[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);

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
        .select('*, client:clientes(name)');

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
        status: a.status || "Agendado"
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
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const getEventColors = (status: string) => {
    switch (status) {
      case "Pendente":
      case "Agendado": return { backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" };
      case "Confirmado": return { backgroundColor: "#9333ea", borderColor: "#9333ea" };
      case "Concluído": return { backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" };
      case "Cancelado": return { backgroundColor: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))" };
      case "Para Remarcar": return { backgroundColor: "#f97316", borderColor: "#f97316" };
      default: return { backgroundColor: "hsl(var(--muted))", borderColor: "hsl(var(--muted))" };
    }
  };

  const calendarEvents = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments
      .filter(appt => appt && appt.date && appt.startTime)
      .map(appt => {
        const colors = getEventColors(appt.status);
        return {
          id: appt.id,
          title: appt.client_name || "Cliente",
          start: `${appt.date}T${appt.startTime}`,
          end: `${appt.date}T${appt.endTime || appt.startTime}`,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: "#ffffff",
          extendedProps: {
            status: appt.status,
            value: appt.value,
            deposit: appt.deposit,
            deposit_date: appt.deposit_date,
            deposit_link: appt.deposit_link
          }
        };
      });
  }, [appointments]);

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
    setFormData({
      client_id: "",
      date: arg.dateStr.includes("T") ? arg.dateStr.split("T")[0] : arg.dateStr,
      startTime: arg.dateStr.includes("T") ? arg.dateStr.split("T")[1].substring(0, 5) : "09:00",
      endTime: arg.dateStr.includes("T") ?
        new Date(new Date(arg.dateStr).getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5) :
        "10:00",
      status: "Agendado",
      value: 0,
      deposit: 0,
      deposit_date: new Date().toISOString().split("T")[0],
      deposit_link: ""
    });
    setModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const appt = appointments.find(a => a.id === arg.event.id);
    if (appt) {
      setEditingAppointment(appt);
      setFormData({
        client_id: appt.client_id || "",
          journey_id: appt.journey_id || "",
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        value: appt.value,
        deposit: appt.deposit,
        deposit_date: appt.deposit_date || new Date().toISOString().split("T")[0],
        deposit_link: appt.deposit_link || ""
      });
      setModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;

    try {
      setLoading(true);
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

      const clientObj = clients.find(c => c.id === formData.client_id);
      const clientName = clientObj?.name || "Cliente";
      const finalStatus = typeof overrideStatus === 'string' ? overrideStatus : formData.status;

      const payload: any = {
        client_id: formData.client_id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        status: finalStatus,
        value: formData.value,
        deposit: formData.deposit,
        deposit_date: formData.deposit_date || null,
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

      // Se houver sinal > 0 e for um novo agendamento (ou se o sinal acabou de ser preenchido)
      if (formData.deposit > 0 && formData.deposit_link && !editingAppointment) {
        try {
          await supabasePublic.from('nx_financial_transactions').insert([{
            description: `Sinal de Agendamento - ${clientName}`,
            value: formData.deposit,
            date: formData.deposit_date || formData.date,
            type: "entrada",
            status: "Pago",
            driveLink: formData.deposit_link,
            isDeductible: false,
            appointment_id: savedApptId
          }]);
        } catch (e) {
          console.log("Aviso: Falha ao lançar sinal no financeiro", e);
        }
      }

      await fetchAppointments();
      setModalOpen(false);
      toast.success("Agendamento salvo com sucesso!");

      // Se o status mudou para 'Concluído', abra o modal de checkout para dar baixa financeira
      if (finalStatus === 'Concluído' && editingAppointment?.status !== 'Concluído' && apptData) {
        setTimeout(() => {
          setSelectedCheckout({
            ...apptData,
            client_name: clientName,
            startTime: formData.startTime,
            endTime: formData.endTime
          } as any);
          setCheckoutData({
            status: 'Recebido',
            value: Math.max(0, (formData.value || 0) - (formData.deposit || 0)),
            paymentMethod: 'Pix',
            driveLink: ''
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
    setFormData({
      client_id: "",
      date: arg.startStr.split("T")[0],
      startTime: arg.startStr.includes("T") ? arg.startStr.split("T")[1].substring(0, 5) : "09:00",
      endTime: arg.endStr.includes("T") ? arg.endStr.split("T")[1].substring(0, 5) : "10:00",
      status: "Agendado",
      value: 0,
      deposit: 0,
      deposit_date: new Date().toISOString().split("T")[0],
      deposit_link: ""
    });
    setModalOpen(true);
  };

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    try {
      const appt = appointments.find(a => a.id === event.id);
      if (!appt) return;

      const { error } = await supabase.from('appointments').update({
          date: event.startStr.split("T")[0],
          start_time: event.startStr.split("T")[1].substring(0, 5),
          end_time: event.endStr ? event.endStr.split("T")[1].substring(0, 5) : appt.endTime,
        }).eq('id', event.id);

      if (error) throw error;
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
    setSelectedCheckout(appt);
    setCheckoutData({
      status: 'Recebido',
      value: Math.max(0, (appt.value || 0) - (appt.deposit || 0)),
      paymentMethod: 'Pix',
      driveLink: ''
    });
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedCheckout) return;
    try {
      // 1. Atualizar o agendamento
      const apptStatus = checkoutData.status === 'Recebido' || checkoutData.status === 'Apenas Consulta' ? 'Concluído' : 'Cancelado';
      const { error: apptError } = await supabase.from('appointments').update({ status: apptStatus }).eq('id', selectedCheckout.id);
      if (apptError) throw apptError;

      // 2. Se for "Recebido", lançar no financeiro
      if (checkoutData.status === 'Recebido') {
        const { error: finError } = await supabasePublic.from('nx_financial_transactions').insert([{
          description: `Sessão de Tattoo - ${selectedCheckout.client_name}`,
          type: "entrada",
          value: checkoutData.value,
          date: new Date().toISOString().split("T")[0],
          status: "Pago",
          drive_link: checkoutData.driveLink,
          appointment_id: selectedCheckout.id
        }]);
        if (finError) console.error("Error inserting financial transaction:", finError);
      }

      toast.success("Sessão baixada com sucesso!");
      setCheckoutModalOpen(false);
      fetchAppointments();
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

  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Agenda & Recebimentos</h1>
          <p className="page-subtitle">Gerencie suas sessões, sinais e baixas financeiras</p>
        </div>
        <Button className="hidden sm:flex" onClick={() => {
          setEditingAppointment(null);
          setFormData({
            client_id: "",
            date: new Date().toISOString().split("T")[0],
            startTime: "09:00",
            endTime: "10:00",
            status: "Agendado",
            value: 0,
            deposit: 0,
            deposit_date: new Date().toISOString().split("T")[0],
            deposit_link: ""
          });
          setModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <Tabs defaultValue="calendario" className="space-y-6">
        <TabsList className="bg-muted p-1 inline-flex w-max mb-2">
          <TabsTrigger value="calendario" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <Calendar className="w-3.5 h-3.5" /> Meu Calendário
          </TabsTrigger>
          <TabsTrigger value="inteligencia" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <BrainCircuit className="w-3.5 h-3.5" /> Assistente CRM
          </TabsTrigger>
          <TabsTrigger value="remarcar" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <RefreshCw className="w-3.5 h-3.5" /> Para Remarcar
          </TabsTrigger>
          <TabsTrigger value="registro" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Registros & Métricas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendario" className="m-0 space-y-4">
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
              .map(a => (
                <div 
                  key={a.id} 
                  className="min-w-[200px] flex-shrink-0 bg-accent/10 border border-border p-3 rounded-lg flex flex-col gap-1 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => handleEventClick({ event: { id: a.id } } as any)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm truncate pr-2">{a.client_name}</span>
                    <Badge variant={a.status === 'Confirmado' ? 'default' : a.status === 'Concluído' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {a.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.startTime} - {a.endTime}</span>
                </div>
              ))
          )}
        </div>
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
              setFormData({
                client_id: "",
                date: new Date().toISOString().split("T")[0],
                startTime: "09:00",
                endTime: "10:00",
                status: "Agendado",
                value: 0,
                deposit: 0,
                deposit_date: new Date().toISOString().split("T")[0],
                deposit_link: ""
              });
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
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              allDaySlot={false}
              headerToolbar={false}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
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
            select={handleSelect}
            eventChange={handleEventChange}
            height="calc(100vh - 220px)"
          />
        </div>
      )}
      </TabsContent>

      <TabsContent value="inteligencia" className="m-0">
        <AgendaIntelligence appointments={appointments} clients={clients} />
      </TabsContent>

      <TabsContent value="remarcar" className="m-0">
        <AgendaReschedule 
          appointments={appointments} 
          clients={clients} 
          onEdit={(appt, formDataObj) => {
            setEditingAppointment(appt);
            setFormData(formDataObj);
            setModalOpen(true);
          }} 
          onRefresh={fetchAppointments}
          onCheckout={openCheckout}
        />
      </TabsContent>

      <TabsContent value="registro" className="m-0">
        <AgendaRegistry appointments={appointments} clients={clients} />
      </TabsContent>
      </Tabs>

      {/* Modal de Cadastro/Edição de Agendamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar Agendamento" : "Novo Agendamento & Sinal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5"><User className="w-4 h-4 text-muted-foreground" /> Cliente</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between mt-1.5"
                  onClick={() => setClientDropdownOpen(prev => !prev)}
                >
                  {formData.client_id
                    ? clients.find((c) => c.id === formData.client_id)?.name
                    : "Selecione um cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {clientDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">Nenhum cliente encontrado.</p>
                      ) : (
                        clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, client_id: client.id, journey_id: "" }));
                              setClientDropdownOpen(false);
                              setClientSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                formData.client_id === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {client.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formData.client_id && (
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <List className="w-4 h-4 text-primary" /> Jornada (Projeto)
                </Label>
                <Select 
                  value={formData.journey_id || ""} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, journey_id: val }))}
                  disabled={loadingJourneys || clientJourneys.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingJourneys ? "Carregando..." : clientJourneys.length === 0 ? "Nenhuma jornada encontrada" : "Selecione a jornada..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientJourneys.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.status} {j.status === 'Concluído' ? '(Antiga)' : '(Atual)'} - Criada em {new Date(j.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientJourneys.length === 0 && !loadingJourneys && (
                  <p className="text-xs text-muted-foreground mt-1">Este cliente não possui jornadas no CRM.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Sessão</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Para Remarcar">Para Remarcar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário de Início</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário de Término</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total da Sessão</Label>
                <CurrencyInput
                  value={formData.value}
                  onChange={(val) => setFormData(prev => ({ ...prev, value: val }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor do Sinal</Label>
                <CurrencyInput
                  value={formData.deposit}
                  onChange={(val) => setFormData(prev => ({ ...prev, deposit: val }))}
                />
              </div>
            </div>

            {/* Se houver sinal, exibe campos do Sinal e Link do Drive */}
            {formData.deposit > 0 && (
              <div className="bg-accent/20 border border-primary/20 p-3 rounded-xl space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data do Pagamento do Sinal</Label>
                  <Input
                    type="date"
                    value={formData.deposit_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, deposit_date: e.target.value }))}
                    className="h-8 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-primary" /> Link do Comprovante do Sinal (Drive)
                  </Label>
                  <Input
                    placeholder="https://drive.google.com/file/d/..."
                    value={formData.deposit_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, deposit_link: e.target.value }))}
                    className="h-8 text-xs bg-card"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Cole o link do Google Drive para vincular no perfil do cliente e lançar automaticamente no financeiro.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              {editingAppointment ? (
                <Button variant="destructive" size="icon" onClick={() => setDeleteAlertOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : <div />}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                {editingAppointment && formData.status !== 'Concluído' && (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => handleSave('Concluído')}
                  >
                    Dar Baixa
                  </Button>
                )}
                <Button onClick={() => handleSave()}>
                  {editingAppointment ? "Atualizar Agendamento" : "Salvar Agendamento"}
                </Button>
              </div>
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
            <div className="bg-muted p-3 rounded-md flex flex-col gap-1 text-sm">
              <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.client_name}</span>
              <span className="text-muted-foreground">Horário: {selectedCheckout?.startTime} - {selectedCheckout?.endTime}</span>
              {selectedCheckout?.deposit ? (
                <span className="text-xs text-primary font-semibold">Sinal Já Abatido: R$ {selectedCheckout.deposit.toLocaleString("pt-BR")}</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Resultado da Sessão</Label>
              <Select
                value={checkoutData.status}
                onValueChange={(val) => setCheckoutData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Realizada / Pago</SelectItem>
                  <SelectItem value="Apenas Consulta">Apenas Consulta (Sem Custo)</SelectItem>
                  <SelectItem value="Cancelado">Faltou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
    </>
  );
};

export default Agenda;
