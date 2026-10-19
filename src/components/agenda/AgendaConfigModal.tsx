import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CalendarOff,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  Settings2,
  AlertCircle,
  Search,
  Filter,
  History,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface DaySchedule {
  enabled: boolean;
  name: string;
  start: string;
  end: string;
}

export interface WeeklySchedule {
  [dayIndex: string]: DaySchedule;
}

export interface AgendaConfig {
  id?: string;
  weekly_schedule: WeeklySchedule;
  slot_interval_minutes: number;
  assistant_notes: string;
  block_outside_schedule: boolean;
}

export interface AgendaBlock {
  id: string;
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  all_day: boolean;
  reason?: string | null;
  created_at?: string;
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
  "0": { enabled: false, name: "Domingo", start: "09:00", end: "18:00" },
  "1": { enabled: true, name: "Segunda-feira", start: "09:00", end: "18:00" },
  "2": { enabled: true, name: "Terça-feira", start: "09:00", end: "18:00" },
  "3": { enabled: true, name: "Quarta-feira", start: "09:00", end: "18:00" },
  "4": { enabled: true, name: "Quinta-feira", start: "09:00", end: "18:00" },
  "5": { enabled: true, name: "Sexta-feira", start: "09:00", end: "18:00" },
  "6": { enabled: true, name: "Sábado", start: "09:00", end: "14:00" },
};

interface AgendaConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

export function AgendaConfigModal({ open, onOpenChange, onConfigSaved }: AgendaConfigModalProps) {
  const [activeTab, setActiveTab] = useState("horarios");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Configuração semanal
  const [configId, setConfigId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [slotInterval, setSlotInterval] = useState<number>(60);
  const [assistantNotes, setAssistantNotes] = useState<string>("");
  const [blockOutsideSchedule, setBlockOutsideSchedule] = useState<boolean>(true);

  // Bloqueios de compromissos pontuais
  const [blocks, setBlocks] = useState<AgendaBlock[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"todos" | "futuros" | "passados">("todos");
  const [historyCollapsibleOpen, setHistoryCollapsibleOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    all_day: true,
    start_time: "14:00",
    end_time: "17:00",
    reason: ""
  });
  const [addingBlock, setAddingBlock] = useState(false);

  // Carregar dados do banco de dados
  const loadConfigAndBlocks = async () => {
    try {
      setLoading(true);

      // Carregar configuração geral
      const { data: configData, error: configError } = await supabase
        .from("agenda_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (configError) throw configError;

      if (configData) {
        setConfigId(configData.id);
        if (configData.weekly_schedule) {
          setSchedule(configData.weekly_schedule);
        }
        setSlotInterval(configData.slot_interval_minutes || 60);
        setAssistantNotes(configData.assistant_notes || "");
        setBlockOutsideSchedule(configData.block_outside_schedule ?? true);
      }

      // Carregar bloqueios
      const { data: blocksData, error: blocksError } = await supabase
        .from("agenda_blocks")
        .select("*")
        .order("date", { ascending: true });

      if (blocksError) throw blocksError;

      setBlocks(blocksData || []);
    } catch (error: any) {
      console.error("Erro ao carregar configurações de agenda:", error);
      toast.error("Não foi possível carregar as configurações da agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadConfigAndBlocks();
    }
  }, [open]);

  // Atualizar um dia da semana
  const handleDayToggle = (dayKey: string, enabled: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled
      }
    }));
  };

  const handleDayTimeChange = (dayKey: string, field: "start" | "end", value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  // Replicar horário comercial padrão
  const handleApplyCommercialHours = () => {
    setSchedule(DEFAULT_SCHEDULE);
    toast.info("Horários padrão aplicados (Segunda a Sexta 09h às 18h, Sábado 09h às 14h)");
  };

  // Salvar configurações gerais
  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const payload = {
        weekly_schedule: schedule,
        slot_interval_minutes: slotInterval,
        assistant_notes: assistantNotes,
        block_outside_schedule: blockOutsideSchedule,
        updated_at: new Date().toISOString()
      };

      if (configId) {
        const { error } = await supabase
          .from("agenda_config")
          .update(payload)
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("agenda_config")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setConfigId(data.id);
      }

      toast.success("Configurações de horários salvas com sucesso!");
      if (onConfigSaved) onConfigSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração: " + (error?.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  // Adicionar bloqueio de compromisso
  const handleAddBlock = async () => {
    if (!newBlock.title.trim()) {
      toast.error("Informe o título ou motivo do compromisso.");
      return;
    }
    if (!newBlock.date) {
      toast.error("Selecione a data do compromisso.");
      return;
    }
    if (!newBlock.all_day && (!newBlock.start_time || !newBlock.end_time)) {
      toast.error("Informe os horários de início e término.");
      return;
    }

    try {
      setAddingBlock(true);
      const payload = {
        title: newBlock.title.trim(),
        date: newBlock.date,
        all_day: newBlock.all_day,
        start_time: newBlock.all_day ? null : newBlock.start_time,
        end_time: newBlock.all_day ? null : newBlock.end_time,
        reason: newBlock.reason?.trim() || null
      };

      const { data, error } = await supabase
        .from("agenda_blocks")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success("Compromisso/Bloqueio adicionado com sucesso!");
      setBlocks(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBlock({
        title: "",
        date: new Date().toISOString().split("T")[0],
        all_day: true,
        start_time: "14:00",
        end_time: "17:00",
        reason: ""
      });

      if (onConfigSaved) onConfigSaved();
    } catch (error: any) {
      console.error("Erro ao adicionar bloqueio:", error);
      toast.error("Erro ao adicionar bloqueio: " + (error?.message || "Tente novamente"));
    } finally {
      setAddingBlock(false);
    }
  };

  // Remover bloqueio
  const handleDeleteBlock = async (id: string) => {
    try {
      const { error } = await supabase.from("agenda_blocks").delete().eq("id", id);
      if (error) throw error;

      setBlocks(prev => prev.filter(b => b.id !== id));
      toast.success("Bloqueio removido.");
      if (onConfigSaved) onConfigSaved();
    } catch (error: any) {
      console.error("Erro ao remover bloqueio:", error);
      toast.error("Erro ao remover bloqueio.");
    }
  };

  const dayKeys = ["1", "2", "3", "4", "5", "6", "0"]; // Seg até Dom

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Configuração da Agenda & Vagas</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-muted p-1 rounded-lg">
              <TabsTrigger value="horarios" className="text-xs font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Grade Semanal de Vagas
              </TabsTrigger>
              <TabsTrigger value="bloqueios" className="text-xs font-semibold flex items-center gap-2">
                <CalendarOff className="w-3.5 h-3.5" /> Compromissos & Bloqueios
                {blocks.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                    {blocks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: GRADE SEMANAL */}
            <TabsContent value="horarios" className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border">
                <div className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Padrão de Expediente
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCommercialHours}
                  className="text-xs h-8 whitespace-nowrap"
                >
                  Restaurar Padrão Comercial
                </Button>
              </div>

              {/* Lista dos 7 dias da semana */}
              <div className="space-y-2.5">
                {dayKeys.map(dayKey => {
                  const day = schedule[dayKey] || { enabled: false, name: `Dia ${dayKey}`, start: "09:00", end: "18:00" };
                  return (
                    <div
                      key={dayKey}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        day.enabled ? "bg-card border-border/80 shadow-sm" : "bg-muted/20 border-dashed opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={day.enabled}
                          onCheckedChange={(val) => handleDayToggle(dayKey, val)}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{day.name}</span>
                          <Badge
                            variant={day.enabled ? "default" : "outline"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {day.enabled ? "Disponível" : "Fechado"}
                          </Badge>
                        </div>
                      </div>

                      {day.enabled && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">Das</Label>
                            <Input
                              type="time"
                              value={day.start}
                              onChange={(e) => handleDayTimeChange(dayKey, "start", e.target.value)}
                              className="w-24 h-8 text-xs font-medium"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">Até</Label>
                            <Input
                              type="time"
                              value={day.end}
                              onChange={(e) => handleDayTimeChange(dayKey, "end", e.target.value)}
                              className="w-24 h-8 text-xs font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Regras adicionais */}
              <div className="p-4 bg-card rounded-xl border space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Regras de Proteção
                </h4>

                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-semibold">Alertar e Bloquear Horários Fora da Grade</Label>
                  <Switch
                    checked={blockOutsideSchedule}
                    onCheckedChange={setBlockOutsideSchedule}
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-xs font-semibold">Orientações e Recados para o Assistente</Label>
                  <Textarea
                    placeholder="Ex: Não agendar sessões de mais de 4 horas aos sábados; priorizar manhãs para clientes de primeira viagem..."
                    value={assistantNotes}
                    onChange={(e) => setAssistantNotes(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: BLOQUEIOS E COMPROMISSOS */}
            <TabsContent value="bloqueios" className="space-y-4 pt-4">
              {/* Card para Adicionar Bloqueio */}
              <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                    <CalendarOff className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold">Bloquear Data ou Horário por Compromisso</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Compromisso / Motivo</Label>
                    <Input
                      placeholder="Ex: Consulta médica, Viagem, Assunto pessoal..."
                      value={newBlock.title}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, title: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Data do Compromisso</Label>
                    <Input
                      type="date"
                      value={newBlock.date}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, date: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="block-all-day"
                      checked={newBlock.all_day}
                      onCheckedChange={(val) => setNewBlock(prev => ({ ...prev, all_day: val }))}
                    />
                    <Label htmlFor="block-all-day" className="text-xs cursor-pointer font-medium">
                      Bloquear o Dia Inteiro
                    </Label>
                  </div>

                  {!newBlock.all_day && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Das</span>
                        <Input
                          type="time"
                          value={newBlock.start_time}
                          onChange={(e) => setNewBlock(prev => ({ ...prev, start_time: e.target.value }))}
                          className="w-24 h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Até</span>
                        <Input
                          type="time"
                          value={newBlock.end_time}
                          onChange={(e) => setNewBlock(prev => ({ ...prev, end_time: e.target.value }))}
                          className="w-24 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={handleAddBlock}
                    disabled={addingBlock}
                    className="h-8 text-xs gap-1.5 self-end sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingBlock ? "Adicionando..." : "Adicionar Bloqueio"}
                  </Button>
                </div>
              </div>

              {/* Seção de Compromissos Cadastrados (Menu Retrátil + Pop-up com Filtros) */}
              <div className="rounded-xl border bg-card p-3 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Botão do Menu Retrátil */}
                  <button
                    type="button"
                    onClick={() => setHistoryCollapsibleOpen(prev => !prev)}
                    className="flex items-center gap-2 text-left py-1 px-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Compromissos Cadastrados ({blocks.length})
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                        historyCollapsibleOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Botão para abrir Pop-up Completo com Filtros */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryModalOpen(true)}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Ver em Janela</span>
                  </Button>
                </div>

                {/* Conteúdo Retrátil no próprio modal */}
                {historyCollapsibleOpen && (
                  <div className="pt-2 border-t space-y-2">
                    {blocks.length === 0 ? (
                      <div className="p-4 text-center border border-dashed rounded-lg">
                        <p className="text-xs text-muted-foreground">Nenhum compromisso cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {blocks.map(block => {
                          const isPast = block.date < new Date().toISOString().split("T")[0];
                          const formattedDate = new Date(`${block.date}T12:00:00`).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          });

                          return (
                            <div
                              key={block.id}
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                                isPast ? "bg-muted/20 opacity-60" : "bg-card shadow-xs"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold">{block.title}</span>
                                  <Badge variant={block.all_day ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0">
                                    {block.all_day ? "Dia Inteiro" : `${block.start_time} - ${block.end_time}`}
                                  </Badge>
                                  {isPast && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                      Passado
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-primary" /> {formattedDate}
                                  {block.reason && <span className="italic">({block.reason})</span>}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                title="Remover"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveConfig}
            disabled={saving}
            className="text-xs gap-1.5 font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Pop-up Detalhado de Histórico de Compromissos com Filtros */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <History className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold">Histórico de Compromissos</DialogTitle>
            </div>
          </DialogHeader>

          {/* Filtros de Busca e Status de Data */}
          <div className="p-4 pb-2 border-b space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar compromisso..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border">
                {(["todos", "futuros", "passados"] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHistoryFilter(tab)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors ${
                      historyFilter === tab
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista Filtrada */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {(() => {
              const todayStr = new Date().toISOString().split("T")[0];
              const filtered = blocks.filter(b => {
                const matchesSearch =
                  !historySearch ||
                  b.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                  (b.reason && b.reason.toLowerCase().includes(historySearch.toLowerCase()));
                if (!matchesSearch) return false;
                if (historyFilter === "futuros") return b.date >= todayStr;
                if (historyFilter === "passados") return b.date < todayStr;
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center border-2 border-dashed rounded-xl">
                    <p className="text-xs text-muted-foreground">Nenhum compromisso encontrado para este filtro.</p>
                  </div>
                );
              }

              return filtered.map(block => {
                const isPast = block.date < todayStr;
                const formattedDate = new Date(`${block.date}T12:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                });

                return (
                  <div
                    key={block.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isPast ? "bg-muted/20 opacity-60" : "bg-card shadow-xs"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{block.title}</span>
                        <Badge variant={block.all_day ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0">
                          {block.all_day ? "Dia Inteiro" : `${block.start_time} - ${block.end_time}`}
                        </Badge>
                        {isPast && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            Passado
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-primary" /> {formattedDate}
                        {block.reason && <span className="italic">({block.reason})</span>}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              });
            })()}
          </div>

          <DialogFooter className="p-3 border-t bg-muted/20 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setHistoryModalOpen(false)} className="text-xs">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
