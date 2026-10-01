import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Filter, FileSpreadsheet, DollarSign, Activity } from "lucide-react";

export function FinancialRegistry({ transactions }: any) {
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState("Todos");

  const parseBrazilianDate = (dateString: string) => {
    if (!dateString) return new Date();
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateString);
  };

  // Format month list for the filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t: any) => {
      if (t.date) {
        const dateObj = parseBrazilianDate(t.date);
        const yyyyMM = format(dateObj, 'yyyy-MM');
        months.add(yyyyMM);
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      if (typeFilter !== "Todos" && t.type !== typeFilter) return false;
      if (monthFilter !== "Todos" && t.date) {
        const dateObj = parseBrazilianDate(t.date);
        const yyyyMM = format(dateObj, 'yyyy-MM');
        if (yyyyMM !== monthFilter) return false;
      }
      return true;
    }).sort((a: any, b: any) => parseBrazilianDate(b.date).getTime() - parseBrazilianDate(a.date).getTime());
  }, [transactions, typeFilter, monthFilter]);

  const metrics = useMemo(() => {
    const totalEntradas = filteredTransactions
      .filter((t: any) => t.type === 'entrada')
      .reduce((acc: number, t: any) => acc + (Number(t.value) || 0), 0);
      
    const totalSaidas = filteredTransactions
      .filter((t: any) => t.type === 'saida')
      .reduce((acc: number, t: any) => acc + (Number(t.value) || 0), 0);

    const saldo = totalEntradas - totalSaidas;

    return {
      totalEntradas,
      totalSaidas,
      saldo,
      qtdEntradas: filteredTransactions.filter((t: any) => t.type === 'entrada').length,
      qtdSaidas: filteredTransactions.filter((t: any) => t.type === 'saida').length,
    };
  }, [filteredTransactions]);

  const chartData = [
    { name: "Entradas", valor: metrics.totalEntradas, color: "#10b981" },
    { name: "Saídas", valor: metrics.totalSaidas, color: "#ef4444" },
    { name: "Saldo", valor: Math.max(0, metrics.saldo), color: "#3b82f6" },
  ];

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
            Registros e Métricas Financeiras
          </h2>
          <p className="text-xs text-muted-foreground">Visão geral das suas movimentações e histórico completo.</p>
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

          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 border-0 shadow-none focus:ring-0 p-0 w-[130px] text-xs font-medium bg-transparent">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Entradas/Saídas</SelectItem>
                <SelectItem value="entrada">Apenas Entradas</SelectItem>
                <SelectItem value="saida">Apenas Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-3 border-border shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Balanço do Período (R$)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                    labelStyle={{ fontSize: '12px', color: '#64748b' }}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-foreground" /> Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-foreground">R$ {metrics.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{metrics.qtdEntradas} transações</div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-foreground" /> Despesa
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-foreground">R$ {metrics.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{metrics.qtdSaidas} transações</div>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-foreground" /> Lucro
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-foreground">R$ {metrics.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Neste período</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="py-4 bg-muted/30 border-b">
          <CardTitle className="text-sm font-semibold">Histórico Detalhado</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada com os filtros atuais.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs">Data</TableHead>
                  <TableHead className="font-semibold text-xs">Descrição</TableHead>
                  <TableHead className="font-semibold text-xs">Tipo</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {t.date ? format(parseBrazilianDate(t.date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      {t.type === 'entrada' ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10">Entrada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-500/20 bg-red-500/10">Saída</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-xs text-right font-bold whitespace-nowrap ${t.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
