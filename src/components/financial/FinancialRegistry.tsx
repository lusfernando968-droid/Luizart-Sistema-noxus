import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend, PieChart as RechartsPieChart, Pie } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Filter, FileSpreadsheet, DollarSign, Activity, PieChart } from "lucide-react";
import {
  PRIMARY_FINANCIAL_CATEGORIES,
  FinancialCategory,
  resolveFinancialCategory,
  getFinancialCategoryLabel,
} from "@/lib/financialCategories";

const CATEGORY_COLORS: Record<FinancialCategory, string> = {
  tatuagem: "#1e293b",
  sinal: "#2563eb",
  mentoria: "#0d9488",
  aula: "#d97706",
  produto: "#7c3aed",
  outros: "#94a3b8",
};

export function FinancialRegistry({ transactions }: any) {
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState<FinancialCategory | "Todos">("Todos");
  const currentYyyyMm = format(new Date(), "yyyy-MM");
  const [monthFilter, setMonthFilter] = useState(currentYyyyMm);

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
    months.add(currentYyyyMm); // Always include current month
    transactions.forEach((t: any) => {
      if (t.date) {
        const dateObj = parseBrazilianDate(t.date);
        const yyyyMM = format(dateObj, 'yyyy-MM');
        months.add(yyyyMM);
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions, currentYyyyMm]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      if (typeFilter !== "Todos" && typeFilter !== "lucro" && t.type !== typeFilter) return false;
      if (monthFilter !== "Todos" && t.date) {
        const dateObj = parseBrazilianDate(t.date);
        const yyyyMM = format(dateObj, 'yyyy-MM');
        if (yyyyMM !== monthFilter) return false;
      }
      return true;
    }).sort((a: any, b: any) => parseBrazilianDate(b.date).getTime() - parseBrazilianDate(a.date).getTime());
  }, [transactions, typeFilter, monthFilter]);

  const categoryBreakdown = useMemo(() => {
    const entradas = filteredTransactions.filter((t: any) => t.type === "entrada");
    const totals: Record<FinancialCategory, { value: number; count: number }> = {
      tatuagem: { value: 0, count: 0 },
      sinal: { value: 0, count: 0 },
      mentoria: { value: 0, count: 0 },
      aula: { value: 0, count: 0 },
      produto: { value: 0, count: 0 },
      outros: { value: 0, count: 0 },
    };

    entradas.forEach((t: any) => {
      const cat = resolveFinancialCategory(t);
      totals[cat].value += Number(t.value) || 0;
      totals[cat].count += 1;
    });

    const totalEntradas = entradas.reduce((acc: number, t: any) => acc + (Number(t.value) || 0), 0);

    const items = PRIMARY_FINANCIAL_CATEGORIES.map((meta) => {
      const data = totals[meta.key];
      const percent = totalEntradas > 0 ? (data.value / totalEntradas) * 100 : 0;
      return {
        ...meta,
        value: data.value,
        count: data.count,
        percent,
        color: CATEGORY_COLORS[meta.key],
      };
    });

    if (totals.outros.count > 0) {
      items.push({
        key: "outros",
        label: "Outros",
        value: totals.outros.value,
        count: totals.outros.count,
        percent: totalEntradas > 0 ? (totals.outros.value / totalEntradas) * 100 : 0,
        color: CATEGORY_COLORS.outros,
      });
    }

    return items;
  }, [filteredTransactions]);

  const pieChartData = useMemo(
    () => categoryBreakdown.filter((item) => item.value > 0),
    [categoryBreakdown]
  );

  const tableTransactions = useMemo(() => {
    if (categoryFilter === "Todos") return filteredTransactions;
    return filteredTransactions.filter(
      (t: any) => t.type === "entrada" && resolveFinancialCategory(t) === categoryFilter
    );
  }, [filteredTransactions, categoryFilter]);

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
    ...(typeFilter === "Todos" || typeFilter === "entrada" ? [{ name: "Faturamento", valor: metrics.totalEntradas, color: "#0f172a" }] : []),
    ...(typeFilter === "Todos" || typeFilter === "saida" ? [{ name: "Despesa", valor: metrics.totalSaidas, color: "#94a3b8" }] : []),
    ...(typeFilter === "Todos" || typeFilter === "lucro" ? [{ name: "Lucro", valor: metrics.saldo, color: "#475569" }] : []),
  ];

  const annualChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      name: format(new Date(currentYear, i, 1), 'MMM', { locale: ptBR }).toUpperCase(),
      Faturamento: 0,
      Despesa: 0,
      Lucro: 0,
    }));

    transactions.forEach((t: any) => {
      if (!t.date) return;
      const d = parseBrazilianDate(t.date);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        if (t.type === 'entrada') {
          monthsData[m].Faturamento += Number(t.value) || 0;
        } else if (t.type === 'saida') {
          monthsData[m].Despesa += Number(t.value) || 0;
        }
      }
    });

    monthsData.forEach(m => {
      m.Lucro = m.Faturamento - m.Despesa;
    });

    return monthsData;
  }, [transactions]);

  const formatMonthLabel = (yyyyMM: string) => {
    if (yyyyMM === "Todos") return "Todos os Meses";
    const [year, month] = yyyyMM.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
          Registros e Métricas
        </h2>

        <div className="grid grid-cols-1 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5 shadow-sm w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-7 border-0 shadow-none focus:ring-0 p-0 w-full sm:w-[160px] text-xs font-medium bg-transparent">
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

          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5 shadow-sm w-full sm:w-auto">
            <Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 border-0 shadow-none focus:ring-0 p-0 w-full sm:w-[140px] text-xs font-medium bg-transparent">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as Métricas</SelectItem>
                <SelectItem value="entrada">Apenas Faturamento</SelectItem>
                <SelectItem value="saida">Apenas Despesa</SelectItem>
                <SelectItem value="lucro">Apenas Lucro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="col-span-1 lg:col-span-3 border-border shadow-sm min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-foreground" />
              Balanço do Período (R$)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                    labelStyle={{ fontSize: '12px', color: '#64748b' }}
                    formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-foreground" /> Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg sm:text-xl font-bold text-foreground">R$ {metrics.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
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
              <div className="text-lg sm:text-xl font-bold text-foreground">R$ {metrics.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
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
              <div className="text-lg sm:text-xl font-bold text-foreground">R$ {metrics.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Neste período</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {typeFilter !== "saida" && (
        <Card className="border-border shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-foreground" />
              Repartição de Faturamento
            </CardTitle>
            {categoryFilter !== "Todos" && (
              <button
                type="button"
                onClick={() => setCategoryFilter("Todos")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpar filtro
              </button>
            )}
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 h-[220px] sm:h-[240px] w-full flex items-center justify-center">
                {pieChartData.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center">
                    Sem entradas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius="52%"
                        outerRadius="82%"
                        paddingAngle={2}
                        onClick={(entry) => {
                          if (!entry?.key) return;
                          setCategoryFilter(
                            categoryFilter === entry.key ? "Todos" : (entry.key as FinancialCategory)
                          );
                        }}
                        className="cursor-pointer focus:outline-none"
                      >
                        {pieChartData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={entry.color}
                            opacity={
                              categoryFilter === "Todos" || categoryFilter === entry.key ? 1 : 0.35
                            }
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ fontSize: "13px", fontWeight: "600" }}
                        formatter={(value: number, name: string, item: any) => [
                          `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${(item?.payload?.percent ?? 0).toFixed(1)}%)`,
                          name,
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoryBreakdown.map((item) => {
                  const isSelected = categoryFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategoryFilter(isSelected ? "Todos" : item.key)}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.count} {item.count === 1 ? "lançamento" : "lançamentos"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-foreground">
                          R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {item.percent.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-foreground" /> Visão Anual de Desempenho ({new Date().getFullYear()})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                  labelStyle={{ fontSize: '12px', color: '#64748b' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {(typeFilter === "Todos" || typeFilter === "entrada") && <Line type="monotone" dataKey="Faturamento" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                {(typeFilter === "Todos" || typeFilter === "saida") && <Line type="monotone" dataKey="Despesa" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                {(typeFilter === "Todos" || typeFilter === "lucro") && <Line type="monotone" dataKey="Lucro" stroke="#475569" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="py-4 bg-muted/30 border-b flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Histórico Detalhado</CardTitle>
          {categoryFilter !== "Todos" && (
            <Badge variant="secondary" className="text-xs font-medium">
              {getFinancialCategoryLabel(categoryFilter)}
            </Badge>
          )}
        </CardHeader>
        <div>
          {tableTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada com os filtros atuais.</div>
          ) : (
            <>
              <div className="md:hidden divide-y">
                {tableTransactions.map((t: any) => (
                  <div key={t.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground leading-snug">
                        {t.description}
                      </span>
                      <span
                        className={`text-xs font-bold whitespace-nowrap shrink-0 ${
                          t.type === "entrada" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "entrada" ? "+" : "-"} R$ {Number(t.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {t.date ? format(parseBrazilianDate(t.date), "dd/MM/yyyy") : "-"}
                      </span>
                      {t.type === "entrada" ? (
                        <>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                            Entrada
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {getFinancialCategoryLabel(resolveFinancialCategory(t))}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-red-600 border-red-500/20 bg-red-500/10">
                          Saída
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs">Data</TableHead>
                      <TableHead className="font-semibold text-xs">Descrição</TableHead>
                      <TableHead className="font-semibold text-xs">Categoria</TableHead>
                      <TableHead className="font-semibold text-xs">Tipo</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableTransactions.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-accent/30 transition-colors">
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {t.date ? format(parseBrazilianDate(t.date), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.description}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {t.type === 'entrada' ? (
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              {getFinancialCategoryLabel(resolveFinancialCategory(t))}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
