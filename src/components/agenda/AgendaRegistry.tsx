import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, CheckCircle2, XCircle, RefreshCw, Filter, BookOpen, User, Building2 } from "lucide-react";
import {
  CancelledBy,
  computeCancellationAnalytics,
  formatCancellationSummary,
} from "@/lib/cancellations";
import { formatCheckoutProductsWithTotal } from "@/lib/checkoutProducts";

export function AgendaRegistry({ appointments, clients }: any) {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState("Todos");
  const [cancelActorFilter, setCancelActorFilter] = useState<"todos" | CancelledBy>("todos");

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    appointments.forEach((a: any) => {
      if (a.date) {
        months.add(a.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [appointments]);

  const monthAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (monthFilter !== "Todos" && a.date && !a.date.startsWith(monthFilter)) return false;
      return true;
    });
  }, [appointments, monthFilter]);

  const filteredAppointments = useMemo(() => {
    return monthAppointments
      .filter((a: any) => {
        if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
        if (
          statusFilter === "Cancelado" &&
          cancelActorFilter !== "todos" &&
          a.cancelled_by !== cancelActorFilter
        ) {
          return false;
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthAppointments, statusFilter, cancelActorFilter]);

  const metrics = useMemo(() => {
    const total = filteredAppointments.length;
    const concluidos = filteredAppointments.filter((a: any) => a.status === "Concluído").length;
    const cancelados = filteredAppointments.filter((a: any) => a.status === "Cancelado").length;
    const remarcados = filteredAppointments.filter((a: any) => a.status === "Para Remarcar").length;
    const agendados = filteredAppointments.filter(
      (a: any) => a.status === "Agendado" || a.status === "Confirmado"
    ).length;

    return {
      total,
      concluidos,
      cancelados,
      remarcados,
      agendados,
      taxaConclusao: total ? ((concluidos / total) * 100).toFixed(1) : "0",
      taxaCancelamento: total ? ((cancelados / total) * 100).toFixed(1) : "0",
      taxaRemarcacao: total ? ((remarcados / total) * 100).toFixed(1) : "0",
    };
  }, [filteredAppointments]);

  const cancelAnalytics = useMemo(
    () => computeCancellationAnalytics(monthAppointments, cancelActorFilter),
    [monthAppointments, cancelActorFilter]
  );

  const chartData = [
    { name: "Agendado", valor: metrics.agendados, color: "#2563eb" },
    { name: "Concluído", valor: metrics.concluidos, color: "#0f172a" },
    { name: "Remarcar", valor: metrics.remarcados, color: "#64748b" },
    { name: "Cancelado", valor: metrics.cancelados, color: "#cbd5e1" },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluído":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 font-semibold bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900"
          >
            Concluído
          </Badge>
        );
      case "Agendado":
      case "Confirmado":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 font-semibold text-primary border-primary/25 bg-primary/10"
          >
            {status}
          </Badge>
        );
      case "Para Remarcar":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 font-semibold text-muted-foreground border-border bg-muted/60"
          >
            Remarcar
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 font-medium text-muted-foreground/80 border-border/70 bg-muted/40"
          >
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {status}
          </Badge>
        );
    }
  };

  const formatMonthLabel = (yyyyMM: string) => {
    if (yyyyMM === "Todos") return "Todos os Meses";
    const [year, month] = yyyyMM.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const maxReasonCount =
    cancelAnalytics.byReason.length > 0
      ? Math.max(...cancelAnalytics.byReason.map((r) => r.count))
      : 1;

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Compacta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-10 shadow-2xs flex-1 sm:flex-initial">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 border-0 shadow-none focus:ring-0 p-0 w-full sm:w-[160px] text-xs font-semibold bg-transparent">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Meses</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[145px] sm:w-[160px] h-10 rounded-xl text-xs font-semibold bg-card border-border shadow-2xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Agendado">Agendado</SelectItem>
            <SelectItem value="Confirmado">Confirmado</SelectItem>
            <SelectItem value="Para Remarcar">Para Remarcar</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grade 2x2 no Mobile / 4 Colunas no Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total</span>
            <div className="rounded-lg bg-accent p-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">{metrics.total}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">sessões no período</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Conclusão</span>
            <div className="rounded-lg bg-accent p-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {metrics.taxaConclusao}%
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.concluidos} finalizadas</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Remarcação</span>
            <div className="rounded-lg bg-muted p-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {metrics.taxaRemarcacao}%
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.remarcados} para remarcar</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cancelamento</span>
            <div className="rounded-lg bg-muted p-1.5">
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {metrics.taxaCancelamento}%
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.cancelados} canceladas
              {metrics.cancelados > 0 && cancelAnalytics.byClient + cancelAnalytics.byStudio > 0
                ? ` • ${cancelAnalytics.byClient} cli / ${cancelAnalytics.byStudio} est`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Linha de Métricas: Status + Mapeamento de Cancelamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 shadow-2xs flex flex-col border-border rounded-xl">
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-between p-4 gap-3">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter((d) => d.valor > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    cornerRadius={3}
                    paddingAngle={3}
                    dataKey="valor"
                    stroke="none"
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                    label={({ cx, cy, midAngle, outerRadius, valor }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 16;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-[11px] font-bold"
                        >
                          {`${valor}`}
                        </text>
                      );
                    }}
                  >
                    {chartData
                      .filter((d) => d.valor > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                    formatter={(value: number, name: string) => [`${value} sessões`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full grid grid-cols-2 gap-1.5 pt-2 border-t border-border/50">
              {chartData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[11px] font-medium text-foreground truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0">{entry.valor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mapeamento de Motivos de Cancelamento */}
        <Card className="lg:col-span-2 shadow-2xs flex flex-col border-border rounded-xl">
          <CardHeader className="py-3 px-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground">
              Motivos de Cancelamento
            </CardTitle>

            <div className="inline-flex items-center bg-muted p-0.5 rounded-lg self-start sm:self-auto">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "cliente", label: "Cliente" },
                  { id: "estudio", label: "Estúdio" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCancelActorFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    cancelActorFilter === tab.id
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col gap-4">
            {cancelAnalytics.totalCancelled === 0 ? (
              <div className="flex-1 min-h-[180px] flex items-center justify-center text-xs text-muted-foreground">
                Nenhum cancelamento registrado no período.
              </div>
            ) : (
              <>
                {/* Placar Cliente vs Estúdio */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-border/70 bg-muted/25 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Pelo Cliente</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-bold text-foreground leading-none">
                          {cancelAnalytics.byClient}
                        </span>
                        <span className="text-[11px] font-semibold text-primary">
                          ({cancelAnalytics.clientPct}%)
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                      {formatCurrency(cancelAnalytics.clientLostValue)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/25 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Pelo Estúdio</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-bold text-foreground leading-none">
                          {cancelAnalytics.byStudio}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          ({cancelAnalytics.studioPct}%)
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                      {formatCurrency(cancelAnalytics.studioLostValue)}
                    </span>
                  </div>
                </div>

                {/* Ranking dos Motivos */}
                {cancelAnalytics.byReason.length === 0 ? (
                  <div className="flex-1 min-h-[100px] flex items-center justify-center text-xs text-muted-foreground">
                    Nenhum cancelamento para este filtro.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                    {cancelAnalytics.byReason.map((item) => {
                      const barWidth = Math.max(8, Math.round((item.count / maxReasonCount) * 100));
                      return (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-foreground truncate">
                                {item.reason}
                              </span>
                              {item.actor !== "nao_informado" && (
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0 rounded border shrink-0 ${
                                    item.actor === "cliente"
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  {item.actorLabel}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[11px]">
                              {item.lostValue > 0 && (
                                <span className="text-muted-foreground hidden sm:inline">
                                  {formatCurrency(item.lostValue)}
                                </span>
                              )}
                              <span className="font-bold text-foreground">
                                {item.count}x
                              </span>
                              <span className="text-muted-foreground w-8 text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.actor === "cliente" ? "bg-primary" : "bg-slate-500"
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista / Tabela de Registros Responsiva (Largura Completa) */}
      <Card className="shadow-2xs overflow-hidden flex flex-col border-border rounded-xl">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b border-border/60">
          <CardTitle className="text-sm font-semibold text-foreground">
            Histórico de Registros ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>

        {/* Visão Mobile: Lista Compacta sem rolagem lateral */}
        <div className="sm:hidden divide-y divide-border/60 max-h-[380px] overflow-y-auto">
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhum registro encontrado.
            </div>
          ) : (
            filteredAppointments.map((appt: any) => {
              const isMentoria = appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1";
              const cancelInfo =
                appt.status === "Cancelado" ? formatCancellationSummary(appt) : null;
              const productsSummary = formatCheckoutProductsWithTotal(appt.additional_products);
              return (
                <div key={appt.id} className="px-4 py-2.5 flex flex-col gap-1 hover:bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                      {isMentoria && <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className="truncate">{appt.client_name || "Cliente"}</span>
                    </span>
                    <span className="text-xs font-bold text-foreground shrink-0">
                      {formatCurrency(appt.value || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {appt.date ? format(parseISO(appt.date), "dd/MM/yyyy") : "-"} • {appt.startTime} -{" "}
                      {appt.endTime}
                    </span>
                    {getStatusBadge(appt.status)}
                  </div>
                  {cancelInfo && cancelInfo.hasClassification && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {cancelInfo.summary}
                    </span>
                  )}
                  {productsSummary && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      Produtos: {productsSummary}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Visão Desktop: Tabela Completa */}
        <div className="hidden sm:block overflow-auto max-h-[380px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-2xs">
              <TableRow>
                <TableHead className="text-xs py-2.5">Data</TableHead>
                <TableHead className="text-xs py-2.5">Cliente</TableHead>
                <TableHead className="text-xs py-2.5">Horário</TableHead>
                <TableHead className="text-xs py-2.5">Status</TableHead>
                <TableHead className="text-xs py-2.5 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appt: any) => {
                  const isMentoria = appt.type === "Mentoria" || appt.type === "Mentoria 1 a 1";
                  const cancelInfo =
                    appt.status === "Cancelado" ? formatCancellationSummary(appt) : null;
                  const productsSummary = formatCheckoutProductsWithTotal(appt.additional_products);
                  return (
                    <TableRow key={appt.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs whitespace-nowrap">
                        {appt.date ? format(parseISO(appt.date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {isMentoria && (
                            <BookOpen
                              className="w-3.5 h-3.5 text-primary shrink-0"
                              title="Sessão de Mentoria"
                            />
                          )}
                          <span>{appt.client_name || "Cliente"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {appt.startTime} - {appt.endTime}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col items-start gap-0.5">
                          {getStatusBadge(appt.status)}
                          {cancelInfo && cancelInfo.hasClassification && (
                            <span className="text-[11px] text-muted-foreground">
                              {cancelInfo.summary}
                            </span>
                          )}
                          {productsSummary && (
                            <span className="text-[11px] text-muted-foreground">
                              Produtos: {productsSummary}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-right whitespace-nowrap">
                        {formatCurrency(appt.value || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
