import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Search, MessageCircle, CheckCircle2, RefreshCw, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { openWhatsApp } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WaitlistReallocateModal, FreedSlotInfo } from "@/components/crm/WaitlistReallocateModal";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function AgendaReschedule({ appointments, clients, onEdit, onRefresh, onCheckout }: any) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<"all" | "reschedule" | "pending">("all");
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [freedSlot, setFreedSlot] = useState<FreedSlotInfo | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const pendingAppointments = appointments.filter((a: any) => a.status === "Para Remarcar");
  const pendingSessions = appointments.filter((a: any) => a.status === "Agendado" && a.date < todayStr);

  const getClientObj = (a: any) => {
    const clientObj = clients?.find((c: any) => c.id === a.client_id);
    const relClient = Array.isArray(a.client) ? a.client[0] : a.client;
    return clientObj || relClient || null;
  };

  const getClientName = (a: any) => {
    const clientObj = getClientObj(a);
    const rawName =
      (a.client_name && a.client_name !== "Cliente" ? a.client_name : "") ||
      clientObj?.name ||
      "Cliente";
    return rawName.trim();
  };

  const filterBySearch = (list: any[]) =>
    list.filter((a: any) => {
      if (!search) return true;
      const clientName = getClientName(a).toLowerCase();
      return clientName.includes(search.toLowerCase());
    });

  const filteredToReschedule = filterBySearch(pendingAppointments);
  const filteredPending = filterBySearch(pendingSessions);

  const handleWhatsApp = (phone: string, message: string) => {
    if (!phone || phone === "Não informado") {
      toast.error("Cliente sem telefone cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Número de WhatsApp inválido.");
      return;
    }
    const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    openWhatsApp(url);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Sem data";
      const parsed = parseISO(dateString);
      return format(parsed, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (val: any) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val || 0));

  const handleMarkAsRescheduled = async (appt: any) => {
    try {
      const { error } = await supabase.from("appointments").update({ status: "Reagendado" }).eq("id", appt.id);
      if (error) throw error;
      toast.success("Sessão marcada como Reagendada!");
      if (onRefresh) onRefresh();

      setFreedSlot({
        appointmentId: appt.id,
        previousClientName: getClientName(appt),
        date: appt.date || new Date().toISOString().split("T")[0],
        startTime: appt.startTime || appt.start_time || "09:00",
        endTime: appt.endTime || appt.end_time || "11:00",
        reason: "Reagendado",
        value: Number(appt.value || 0),
      });
      setReallocateModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar sessão.");
    }
  };

  const handleMarkAsCompleted = async (appt: any, e: any) => {
    if (onCheckout) {
      onCheckout(appt, e);
      return;
    }
    try {
      const { error } = await supabase.from("appointments").update({ status: "Concluído" }).eq("id", appt.id);
      if (error) throw error;
      toast.success("Sessão marcada como Concluída!");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa na sessão.");
    }
  };

  const triggerEdit = (appt: any, isRescheduleList: boolean) => {
    onEdit(appt, {
      client_id: appt.client_id || "",
      journey_id: appt.journey_id || "",
      date: appt.date || new Date().toISOString().split("T")[0],
      startTime: appt.startTime || appt.start_time || "09:00",
      endTime: appt.endTime || appt.end_time || "10:00",
      status: isRescheduleList ? "Agendado" : appt.status,
      value: appt.value || 0,
      deposit: appt.deposit || 0,
      deposit_date: appt.deposit_date || new Date().toISOString().split("T")[0],
      deposit_link: appt.deposit_link || "",
    });
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    list: any[],
    emptyMessage: string,
    isRescheduleList: boolean
  ) => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
        {/* Cabeçalho da Seção */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-xs sm:text-sm font-bold text-foreground">{title}</h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isRescheduleList
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-foreground border border-border"
            }`}
          >
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {search ? "Nenhum cliente encontrado na busca." : emptyMessage}
          </div>
        ) : (
          <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {list.map((appt: any) => {
              const clientObj = getClientObj(appt);
              const resolvedName = getClientName(appt);
              const resolvedPhone = clientObj?.phone || "";
              const cleanDigits = resolvedPhone.replace(/\D/g, "");
              const hasPhone = cleanDigits.length >= 10;
              const timeRange =
                appt.startTime || appt.start_time
                  ? `${appt.startTime || appt.start_time}${
                      appt.endTime || appt.end_time ? ` - ${appt.endTime || appt.end_time}` : ""
                    }`
                  : "";

              const wppMessageReschedule = `Olá ${resolvedName}! Vi que ficamos de remarcar a sua sessão de tatuagem. Já tem uma nova data em mente? Posso mandar os horários disponíveis?`;
              const wppMessagePending = `Olá ${resolvedName}! Vi que a sua sessão do dia ${formatDate(
                appt.date
              )} ficou pendente no sistema. Deu tudo certo?`;

              return (
                <div
                  key={appt.id}
                  className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col justify-between shadow-2xs hover:border-border transition-colors"
                >
                  {/* Bloco Superior: Dados do Cliente + Valor e Status */}
                  <div className="p-3.5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 border border-primary/15">
                        {clientObj?.avatar_url ? (
                          <img
                            src={clientObj.avatar_url}
                            alt={resolvedName}
                            className="h-full w-full rounded-xl object-cover"
                          />
                        ) : (
                          resolvedName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="font-bold text-sm text-foreground block truncate">
                          {resolvedName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/60 font-medium text-foreground/80">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(appt.date)}
                          </span>
                          {timeRange && (
                            <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/60 font-medium text-foreground/80">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {timeRange}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(appt.value)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 font-semibold ${
                          isRescheduleList
                            ? "bg-primary/10 text-primary border-primary/25"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {isRescheduleList ? "Remarcar" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {/* Recorte Inferior: Barra de Ações Estruturada */}
                  <div className="px-2.5 py-2 bg-muted/30 border-t border-border/70 grid grid-cols-3 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPhone}
                      className="h-8 px-2 text-[11px] font-semibold gap-1.5 rounded-lg bg-card border-border/80 hover:bg-accent w-full"
                      onClick={() =>
                        handleWhatsApp(
                          resolvedPhone,
                          isRescheduleList ? wppMessageReschedule : wppMessagePending
                        )
                      }
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-[11px] font-semibold gap-1.5 rounded-lg bg-card border-border/80 hover:bg-accent w-full"
                      onClick={() => triggerEdit(appt, isRescheduleList)}
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{isRescheduleList ? "Novo Horário" : "Horário"}</span>
                    </Button>

                    {isRescheduleList ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 px-2 text-[11px] font-semibold gap-1.5 rounded-lg w-full shadow-2xs"
                        onClick={() => handleMarkAsRescheduled(appt)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Reagendado</span>
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 px-2 text-[11px] font-semibold gap-1.5 rounded-lg w-full shadow-2xs"
                        onClick={(e) => handleMarkAsCompleted(appt, e)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Concluir</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior: Busca + Filtro Rápido */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border/80 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex items-center bg-muted p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setSectionFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors ${
              sectionFilter === "all"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({filteredToReschedule.length + filteredPending.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter("reschedule")}
            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors ${
              sectionFilter === "reschedule"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Remarcar ({filteredToReschedule.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors ${
              sectionFilter === "pending"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pendentes ({filteredPending.length})
          </button>
        </div>
      </div>

      {/* Listagens */}
      <div className="space-y-4">
        {(sectionFilter === "all" || sectionFilter === "reschedule") &&
          renderSection(
            "Para Remarcar",
            <RefreshCw className="w-3.5 h-3.5 text-primary" />,
            filteredToReschedule,
            "Nenhum cliente aguardando remarcação.",
            true
          )}

        {(sectionFilter === "all" || sectionFilter === "pending") &&
          renderSection(
            "Sessões Pendentes",
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
            filteredPending,
            "Nenhuma sessão pendente.",
            false
          )}
      </div>

      <WaitlistReallocateModal
        open={reallocateModalOpen}
        onOpenChange={setReallocateModalOpen}
        freedSlot={freedSlot}
        clients={clients}
        onReallocated={onRefresh}
      />
    </div>
  );
}
