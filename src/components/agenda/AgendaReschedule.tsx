import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Search, MessageCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { openWhatsApp } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    if (!phone || phone === "Não informado") return;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) return;
    const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    openWhatsApp(url);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "—";
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
          <>
            {/* VISÃO MOBILE: Lista Compacta de 2 Andares (Zero Rolagem Lateral) */}
            <div className="sm:hidden divide-y divide-border/60">
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
                    className="px-3.5 py-3 flex flex-col gap-2 hover:bg-muted/20 transition-colors"
                  >
                    {/* Andar 1: Avatar + Nome + Data à esquerda | Badge de Status à direita */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {clientObj?.avatar_url ? (
                            <img
                              src={clientObj.avatar_url}
                              alt={resolvedName}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            resolvedName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-foreground block truncate">
                            {resolvedName}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {formatDate(appt.date)}
                            {timeRange ? ` • ${timeRange}` : ""}
                            {Number(appt.value || 0) > 0 ? ` • ${formatCurrency(appt.value)}` : ""}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 font-semibold shrink-0 ${
                          isRescheduleList
                            ? "bg-primary/10 text-primary border-primary/25"
                            : "bg-muted/60 text-muted-foreground border-border"
                        }`}
                      >
                        {isRescheduleList ? "Remarcar" : "Pendente"}
                      </Badge>
                    </div>

                    {/* Andar 2: Botões de Ação Compactos para Toque */}
                    <div className="pl-10 flex items-center justify-end gap-1.5">
                      {hasPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-[11px] font-semibold gap-1.5 rounded-lg"
                          onClick={() =>
                            handleWhatsApp(
                              resolvedPhone,
                              isRescheduleList ? wppMessageReschedule : wppMessagePending
                            )
                          }
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-primary" />
                          WhatsApp
                        </Button>
                      )}

                      {isRescheduleList ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-[11px] font-semibold gap-1.5 rounded-lg"
                          onClick={() => handleMarkAsRescheduled(appt)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          Reagendado
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-[11px] font-semibold gap-1.5 rounded-lg"
                          onClick={(e) => handleMarkAsCompleted(appt, e)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          Concluir
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title={isRescheduleList ? "Agendar Novo Horário" : "Editar Sessão"}
                        onClick={() => triggerEdit(appt, isRescheduleList)}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VISÃO DESKTOP: Tabela Completa */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Última Data</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableRow key={appt.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {clientObj?.avatar_url ? (
                                <img
                                  src={clientObj.avatar_url}
                                  alt={resolvedName}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                resolvedName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold text-sm text-foreground">{resolvedName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(appt.date)}
                          {timeRange ? ` • ${timeRange}` : ""}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(appt.value)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-semibold ${
                              isRescheduleList
                                ? "bg-primary/10 text-primary border-primary/25"
                                : "bg-muted/60 text-muted-foreground border-border"
                            }`}
                          >
                            {isRescheduleList ? "Para Remarcar" : "Sessão Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            {hasPhone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg"
                                onClick={() =>
                                  handleWhatsApp(
                                    resolvedPhone,
                                    isRescheduleList ? wppMessageReschedule : wppMessagePending
                                  )
                                }
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                                WhatsApp
                              </Button>
                            )}

                            {isRescheduleList ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg"
                                onClick={() => handleMarkAsRescheduled(appt)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                Reagendado
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg"
                                onClick={(e) => handleMarkAsCompleted(appt, e)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                Concluir
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                              title={isRescheduleList ? "Agendar Novo Horário" : "Editar Sessão"}
                              onClick={() => triggerEdit(appt, isRescheduleList)}
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
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
