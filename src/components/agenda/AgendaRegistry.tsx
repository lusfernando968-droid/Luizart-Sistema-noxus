import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, CheckCircle2, XCircle, RefreshCw, Filter, FileSpreadsheet } from "lucide-react";

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
    { name: "Concluído", valor: metrics.concluidos },
    { name: "Agendado", valor: metrics.agendados },
    { name: "Remarcar", valor: metrics.remarcados },
    { name: "Cancelado", valor: metrics.cancelados },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluído": return <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10">Concluído</Badge>;
      case "Cancelado": return <Badge variant="outline" className="text-red-600 border-red-500/20 bg-red-500/10">Cancelado</Badge>;
      case "Para Remarcar": return <Badge variant="outline" className="text-orange-600 border-orange-500/20 bg-orange-500/10">Para Remarcar</Badge>;
      case "Agendado": return <Badge variant="outline" className="text-blue-600 border-blue-500/20 bg-blue-500/10">Agendado</Badge>;
      case "Confirmado": return <Badge variant="outline" className="text-purple-600 border-purple-500/20 bg-purple-500/10">Confirmado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Registros e Métricas
          </h2>
          <p className="text-xs text-muted-foreground">Visão geral do desempenho da sua agenda e histórico completo.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-7 border-0 shadow-none focus:ring-0 p-0 w-[160px] text-xs font-medium bg-transparent">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Total no Período</p>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">{metrics.total}</h3>
            <p className="text-[10px] text-muted-foreground">agendamentos registrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Taxa de Conclusão</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{metrics.taxaConclusao}%</h3>
            <p className="text-[10px] text-muted-foreground">({metrics.concluidos} sessões finalizadas)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Taxa de Remarcação</p>
              <RefreshCw className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{metrics.taxaRemarcacao}%</h3>
            <p className="text-[10px] text-muted-foreground">({metrics.remarcados} clientes para remarcar)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Taxa de Cancelamento</p>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{metrics.taxaCancelamento}%</h3>
            <p className="text-[10px] text-muted-foreground">({metrics.cancelados} sessões perdidas)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm flex flex-col border">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-bold text-foreground">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center min-h-[250px] pt-6">
             <ResponsiveContainer width="100%" height={200}>
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis fontSize={10} tickLine={false} axisLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                 <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={40} fill="hsl(var(--primary))" />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm overflow-hidden flex flex-col border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 bg-muted/10 border-b">
            <CardTitle className="text-sm font-bold text-foreground">Tabela de Registros</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                <SelectValue placeholder="Filtrar Status" />
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
          </CardHeader>
          <div className="overflow-auto max-h-[350px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="text-xs py-2">Data</TableHead>
                  <TableHead className="text-xs py-2">Cliente</TableHead>
                  <TableHead className="text-xs py-2">Horário</TableHead>
                  <TableHead className="text-xs py-2">Status</TableHead>
                  <TableHead className="text-xs py-2 text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                      <div className="border-2 border-dashed rounded-xl p-8 max-w-sm mx-auto">
                        Nenhum registro encontrado com estes filtros.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appt: any) => (
                    <TableRow key={appt.id} className="hover:bg-muted/10">
                      <TableCell className="text-xs whitespace-nowrap">
                        {appt.date ? format(parseISO(appt.date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{appt.client_name || "Desconhecido"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{appt.startTime} - {appt.endTime}</TableCell>
                      <TableCell className="text-xs">{getStatusBadge(appt.status)}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appt.value || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
