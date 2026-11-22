import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, CheckCircle2, XCircle, RefreshCw, Filter, FileSpreadsheet, BookOpen } from "lucide-react";

export function AgendaRegistry({ appointments, clients }: any) {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState("Todos");

  // Format month list for the filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    appointments.forEach((a: any) => {
      if (a.date) {
        months.add(a.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
      if (monthFilter !== "Todos" && a.date && !a.date.startsWith(monthFilter)) return false;
      return true;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, statusFilter, monthFilter]);

  const metrics = useMemo(() => {
    const total = filteredAppointments.length;
    const concluidos = filteredAppointments.filter((a: any) => a.status === 'Concluído').length;
    const cancelados = filteredAppointments.filter((a: any) => a.status === 'Cancelado').length;
    const remarcados = filteredAppointments.filter((a: any) => a.status === 'Para Remarcar').length;
    const agendados = filteredAppointments.filter((a: any) => a.status === 'Agendado' || a.status === 'Confirmado').length;

    return {
      total,
      concluidos,
      cancelados,
      remarcados,
      agendados,
      taxaConclusao: total ? ((concluidos / total) * 100).toFixed(1) : "0",
      taxaCancelamento: total ? ((cancelados / total) * 100).toFixed(1) : "0",
      taxaRemarcacao: total ? ((remarcados / total) * 100).toFixed(1) : "0"
    };
  }, [filteredAppointments]);

  const chartData = [
    { name: "Agendado", valor: metrics.agendados, color: "#2563eb" },
    { name: "Concluído", valor: metrics.concluidos, color: "#0f172a" },
    { name: "Remarcar", valor: metrics.remarcados, color: "#64748b" },
    { name: "Cancelado", valor: metrics.cancelados, color: "#cbd5e1" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluído":
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900">
            Concluído
          </Badge>
        );
      case "Agendado":
      case "Confirmado":
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-primary border-primary/25 bg-primary/10">
            {status}
          </Badge>
        );
      case "Para Remarcar":
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-muted-foreground border-border bg-muted/60">
            Remarcar
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium text-muted-foreground/70 border-border/60 bg-muted/30">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[10px] px-2 py-0">{status}</Badge>;
    }
  };

  const formatMonthLabel = (yyyyMM: string) => {
    if (yyyyMM === "Todos") return "Todos os Meses";
    const [year, month] = yyyyMM.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Compacta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-10 shadow-2xs flex-1 sm:flex-initial">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 border-0 shadow-none focus:ring-0 p-0 w-full sm:w-[160px] text-xs font-semibold bg-transparent">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Meses</SelectItem>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
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

      {/* Grade 2x2 no Mobile / 4 Colunas no Desktop (Paleta Noxus) */}
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
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">{metrics.taxaConclusao}%</h3>
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
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">{metrics.taxaRemarcacao}%</h3>
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
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-none">{metrics.taxaCancelamento}%</h3>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.cancelados} canceladas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Distribuição Compacto */}
        <Card className="lg:col-span-1 shadow-2xs flex flex-col border-border rounded-xl">
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="valor" name="Sessões" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista / Tabela de Registros Responsiva */}
        <Card className="lg:col-span-2 shadow-2xs overflow-hidden flex flex-col border-border rounded-xl">
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
                return (
                  <div key={appt.id} className="px-4 py-2.5 flex flex-col gap-1 hover:bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                        {isMentoria && <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <span className="truncate">{appt.client_name || "Cliente"}</span>
                      </span>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(appt.value || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {appt.date ? format(parseISO(appt.date), "dd/MM/yyyy") : "-"} • {appt.startTime} - {appt.endTime}
                      </span>
                      {getStatusBadge(appt.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Visão Desktop: Tabela Completa */}
          <div className="hidden sm:block overflow-auto max-h-[360px]">
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
                    return (
                      <TableRow key={appt.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs whitespace-nowrap">
                          {appt.date ? format(parseISO(appt.date), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {isMentoria && (
                              <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" title="Sessão de Mentoria" />
                            )}
                            <span>{appt.client_name || "Cliente"}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {appt.startTime} - {appt.endTime}
                        </TableCell>
                        <TableCell className="text-xs">{getStatusBadge(appt.status)}</TableCell>
                        <TableCell className="text-xs font-semibold text-right whitespace-nowrap">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(appt.value || 0)}
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
    </div>
  );
}
