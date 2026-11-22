import { useMemo, useState } from "react";
import { format, subDays, subYears, addDays, subMonths } from "date-fns";
import { Clock, CalendarHeart, History, CalendarClock, MessageCircle, RefreshCw, Search, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type CategoryKey = "all" | "today" | "tomorrow" | "7days" | "2months" | "1year";

export function AgendaIntelligence({ appointments, clients }: any) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const today = new Date();

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

  const formatPhoneDisplay = (phone?: string) => {
    if (!phone || phone === "Não informado") return "Sem telefone";
    const digits = phone.replace(/\D/g, "");
    const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
    if (local.length === 11) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
    }
    return phone;
  };

  const filterBySearch = (list: any[]) =>
    list.filter((a: any) => {
      if (!search.trim()) return true;
      return getClientName(a).toLowerCase().includes(search.toLowerCase());
    });

  const categories = useMemo(() => {
    const todayStr = format(today, "yyyy-MM-dd");
    const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");
    const sevenDaysAgoStr = format(subDays(today, 7), "yyyy-MM-dd");
    const twoMonthsAgoStr = format(subMonths(today, 2), "yyyy-MM-dd");
    const oneYearAgoStr = format(subYears(today, 1), "yyyy-MM-dd");

    return {
      todayList: filterBySearch(appointments.filter((a: any) => a.date === todayStr)),
      tomorrowList: filterBySearch(appointments.filter((a: any) => a.date === tomorrowStr)),
      sevenDaysList: filterBySearch(
        appointments.filter((a: any) => a.date === sevenDaysAgoStr && a.status === "Concluído")
      ),
      twoMonthsList: filterBySearch(
        appointments.filter((a: any) => a.date === twoMonthsAgoStr && a.status === "Concluído")
      ),
      oneYearList: filterBySearch(
        appointments.filter((a: any) => a.date === oneYearAgoStr && a.status === "Concluído")
      ),
    };
  }, [appointments, search]);

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

  const getStatusBadge = (status: string) => {
    if (status === "Concluído") {
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-primary/10 text-primary border-primary/25">
          Concluído
        </Badge>
      );
    }
    if (status === "Cancelado") {
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-muted/40 text-muted-foreground border-border">
          Cancelado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-muted text-foreground border-border">
        {status || "Agendado"}
      </Badge>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    list: any[],
    emptyMessage: string,
    context: "today" | "tomorrow" | "7days" | "2months" | "1year",
    fullWidth = false
  ) => {
    return (
      <div
        className={`bg-card rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col ${
          fullWidth ? "lg:col-span-2" : ""
        }`}
      >
        {/* Cabeçalho Limpo da Seção (Sem textos explicativos) */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-xs sm:text-sm font-bold text-foreground">{title}</h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              list.length > 0
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-7 text-center text-xs text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div
            className={`p-3 sm:p-4 grid grid-cols-1 ${
              fullWidth ? "md:grid-cols-2" : ""
            } gap-3`}
          >
            {list.map((appt) => {
              const clientObj = getClientObj(appt);
              const resolvedName = getClientName(appt);
              const resolvedStartTime = appt.startTime || appt.start_time || "";
              const resolvedEndTime = appt.endTime || appt.end_time || "";
              const timeRange = resolvedStartTime
                ? `${resolvedStartTime}${resolvedEndTime ? ` - ${resolvedEndTime}` : ""}`
                : "";
              const resolvedPhone = clientObj?.phone || "";
              const cleanDigits = resolvedPhone.replace(/\D/g, "");
              const hasPhone = cleanDigits.length >= 10;

              let wppMessage = "";
              let buttonLabel = "Chamar no WhatsApp";
              if (context === "today") {
                wppMessage = `Olá ${resolvedName}! Tudo certo para a nossa sessão de hoje${
                  resolvedStartTime ? ` às ${resolvedStartTime}` : ""
                }?`;
                buttonLabel = "Confirmar Sessão de Hoje";
              } else if (context === "tomorrow") {
                wppMessage = `Olá ${resolvedName}! Passando para lembrar da nossa sessão de tatuagem amanhã${
                  resolvedStartTime ? ` às ${resolvedStartTime}` : ""
                }. Até lá!`;
                buttonLabel = "Enviar Lembrete de Amanhã";
              } else if (context === "7days") {
                wppMessage = `Fala ${resolvedName}! Como está a cicatrização da tattoo que fizemos há uma semana? Tudo certinho?`;
                buttonLabel = "Perguntar da Cicatrização";
              } else if (context === "2months") {
                wppMessage = `Fala ${resolvedName}! Tudo bem? Já faz 2 meses da nossa última tattoo, ela já deve estar 100% cicatrizada! Bora pensar no próximo projeto?`;
                buttonLabel = "Chamar p/ Novo Projeto";
              } else if (context === "1year") {
                wppMessage = `Oie ${resolvedName}! Sabia que sua tattoo está fazendo 1 ano hoje? Parabéns! Já vamos planejar a próxima?`;
                buttonLabel = "Mandar Parabéns (1 Ano)";
              }

              return (
                <div
                  key={appt.id}
                  className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col justify-between shadow-2xs hover:border-border transition-colors"
                >
                  {/* Topo do Card: Avatar + Nome Padronizado (text-sm) + Etiquetas */}
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
                          {timeRange && (
                            <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/60 font-medium text-foreground/80">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {timeRange}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/60 font-medium text-foreground/80">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {formatPhoneDisplay(resolvedPhone)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{getStatusBadge(appt.status)}</div>
                  </div>

                  {/* Recorte Inferior: Botão Grande Mobile-First */}
                  <div className="px-2.5 py-2 bg-muted/30 border-t border-border/70">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!hasPhone}
                      onClick={() => handleWhatsApp(resolvedPhone, wppMessage)}
                      className="h-9 w-full text-xs font-semibold gap-2 rounded-lg shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{buttonLabel}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const totalCount =
    categories.todayList.length +
    categories.tomorrowList.length +
    categories.sevenDaysList.length +
    categories.twoMonthsList.length +
    categories.oneYearList.length;

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

        <div className="flex items-center bg-muted p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: `Todos (${totalCount})` },
              { id: "tomorrow", label: `Amanhã (${categories.tomorrowList.length})` },
              { id: "7days", label: `7 Dias (${categories.sevenDaysList.length})` },
              { id: "2months", label: `2 Meses (${categories.twoMonthsList.length})` },
              { id: "1year", label: `1 Ano (${categories.oneYearList.length})` },
              { id: "today", label: `Hoje (${categories.todayList.length})` },
            ] as { id: CategoryKey; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === tab.id
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Seções do Assistente CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(activeCategory === "all" || activeCategory === "tomorrow") &&
          renderSection(
            "Agendamentos de Amanhã",
            <CalendarClock className="w-3.5 h-3.5 text-primary" />,
            categories.tomorrowList,
            "Nenhum agendamento para amanhã.",
            "tomorrow",
            activeCategory !== "all"
          )}

        {(activeCategory === "all" || activeCategory === "7days") &&
          renderSection(
            "Pós-Tatuagem (7 Dias)",
            <CalendarHeart className="w-3.5 h-3.5 text-primary" />,
            categories.sevenDaysList,
            "Nenhuma tatuagem concluída há 7 dias.",
            "7days",
            activeCategory !== "all"
          )}

        {(activeCategory === "all" || activeCategory === "2months") &&
          renderSection(
            "Retorno Pós-Tattoo (2 Meses)",
            <RefreshCw className="w-3.5 h-3.5 text-primary" />,
            categories.twoMonthsList,
            "Nenhuma tatuagem completou 2 meses hoje.",
            "2months",
            activeCategory !== "all"
          )}

        {(activeCategory === "all" || activeCategory === "1year") &&
          renderSection(
            "Aniversário da Tattoo (1 Ano)",
            <History className="w-3.5 h-3.5 text-primary" />,
            categories.oneYearList,
            "Nenhuma tatuagem completou 1 ano hoje.",
            "1year",
            activeCategory !== "all"
          )}

        {(activeCategory === "all" || activeCategory === "today") &&
          renderSection(
            "Agendamentos de Hoje",
            <Clock className="w-3.5 h-3.5 text-primary" />,
            categories.todayList,
            "Agenda livre hoje.",
            "today",
            true
          )}
      </div>
    </div>
  );
}
