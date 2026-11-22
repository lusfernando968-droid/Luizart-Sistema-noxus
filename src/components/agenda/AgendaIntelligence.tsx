import { useMemo, useState } from "react";
import { format, subDays, subYears, addDays, subMonths } from "date-fns";
import {
  Clock,
  CalendarHeart,
  History,
  CalendarClock,
  MessageCircle,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type SectionKey = "tomorrow" | "7days" | "2months" | "1year" | "today";

export function AgendaIntelligence({ appointments, clients }: any) {
  const [search, setSearch] = useState("");
  const [openMenus, setOpenMenus] = useState<Record<SectionKey, boolean>>({
    tomorrow: false,
    "7days": false,
    "2months": false,
    "1year": false,
    today: false,
  });

  const today = new Date();

  const toggleMenu = (key: SectionKey) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const renderDropdownSection = (
    key: SectionKey,
    title: string,
    icon: React.ReactNode,
    list: any[],
    emptyMessage: string
  ) => {
    const isSearchingWithResults = search.trim().length > 0 && list.length > 0;
    const isOpen = openMenus[key] || isSearchingWithResults;

    return (
      <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
        {/* Botão do Menu Suspenso Clean */}
        <button
          type="button"
          onClick={() => toggleMenu(key)}
          className="w-full px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-2 text-left hover:bg-muted/40 active:bg-muted/60 transition-colors focus:outline-hidden"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                list.length > 0
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {list.length}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180 text-foreground" : ""
              }`}
            />
          </div>
        </button>

        {/* Conteúdo Expansível do Menu: Cards Compactos com Botão Discreto */}
        {isOpen && (
          <div className="border-t border-border/60 bg-muted/15">
            {list.length === 0 ? (
              <div className="p-5 text-center text-xs text-muted-foreground">{emptyMessage}</div>
            ) : (
              <div className="p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {list.map((appt) => {
                  const clientObj = getClientObj(appt);
                  const resolvedName = getClientName(appt);
                  const resolvedStartTime = appt.startTime || appt.start_time || "";
                  const resolvedPhone = clientObj?.phone || "";
                  const cleanDigits = resolvedPhone.replace(/\D/g, "");
                  const hasPhone = cleanDigits.length >= 10;

                  let wppMessage = "";
                  if (key === "today") {
                    wppMessage = `Olá ${resolvedName}! Tudo certo para a nossa sessão de hoje${
                      resolvedStartTime ? ` às ${resolvedStartTime}` : ""
                    }?`;
                  } else if (key === "tomorrow") {
                    wppMessage = `Olá ${resolvedName}! Passando para lembrar da nossa sessão de tatuagem amanhã${
                      resolvedStartTime ? ` às ${resolvedStartTime}` : ""
                    }. Até lá!`;
                  } else if (key === "7days") {
                    wppMessage = `Fala ${resolvedName}! Como está a cicatrização da tattoo que fizemos há uma semana? Tudo certinho?`;
                  } else if (key === "2months") {
                    wppMessage = `Fala ${resolvedName}! Tudo bem? Já faz 2 meses da nossa última tattoo, ela já deve estar 100% cicatrizada! Bora pensar no próximo projeto?`;
                  } else if (key === "1year") {
                    wppMessage = `Oie ${resolvedName}! Sabia que sua tattoo está fazendo 1 ano hoje? Parabéns! Já vamos planejar a próxima?`;
                  }

                  return (
                    <div
                      key={appt.id}
                      className="rounded-lg border border-border/70 bg-background px-3 py-2 flex items-center justify-between gap-2.5 hover:border-border transition-colors"
                    >
                      {/* Esquerda: Avatar Compacto + Nome e Sublinha Única */}
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {resolvedName}
                            </span>
                            {resolvedStartTime && (
                              <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-semibold text-muted-foreground shrink-0">
                                {resolvedStartTime}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {formatPhoneDisplay(resolvedPhone)}
                          </span>
                        </div>
                      </div>

                      {/* Direita: Botão Discreto e Compacto */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasPhone}
                        onClick={() => handleWhatsApp(resolvedPhone, wppMessage)}
                        className="h-7 sm:h-8 px-2.5 text-[11px] font-semibold gap-1.5 rounded-lg bg-muted/30 border-border/80 hover:bg-accent text-foreground shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Chamar</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const anyOpen = Object.values(openMenus).some(Boolean);
  const toggleAllMenus = () => {
    const nextState = !anyOpen;
    setOpenMenus({
      tomorrow: nextState,
      "7days": nextState,
      "2months": nextState,
      "1year": nextState,
      today: nextState,
    });
  };

  return (
    <div className="space-y-3">
      {/* Barra Superior: Busca + Botão Expandir/Recolher Todos */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border/80 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllMenus}
          className="h-10 sm:h-11 px-3 rounded-xl text-xs font-semibold shrink-0"
        >
          {anyOpen ? "Recolher Tudo" : "Abrir Tudo"}
        </Button>
      </div>

      {/* Lista de Menus Suspensos Clean */}
      <div className="space-y-2">
        {renderDropdownSection(
          "tomorrow",
          "Agendamentos de Amanhã",
          <CalendarClock className="w-3.5 h-3.5" />,
          categories.tomorrowList,
          "Nenhum agendamento para amanhã."
        )}

        {renderDropdownSection(
          "7days",
          "Pós-Tatuagem (7 Dias)",
          <CalendarHeart className="w-3.5 h-3.5" />,
          categories.sevenDaysList,
          "Nenhuma tatuagem concluída há 7 dias."
        )}

        {renderDropdownSection(
          "2months",
          "Retorno Pós-Tattoo (2 Meses)",
          <RefreshCw className="w-3.5 h-3.5" />,
          categories.twoMonthsList,
          "Nenhuma tatuagem completou 2 meses hoje."
        )}

        {renderDropdownSection(
          "1year",
          "Aniversário da Tattoo (1 Ano)",
          <History className="w-3.5 h-3.5" />,
          categories.oneYearList,
          "Nenhuma tatuagem completou 1 ano hoje."
        )}

        {renderDropdownSection(
          "today",
          "Agendamentos de Hoje",
          <Clock className="w-3.5 h-3.5" />,
          categories.todayList,
          "Agenda livre hoje."
        )}
      </div>
    </div>
  );
}
