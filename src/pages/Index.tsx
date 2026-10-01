import { useState, useEffect } from "react";

import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  FileText,
  Phone,
  CheckCircle2,
  LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase, supabasePublic } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardStats {
  sessionsToday: string;
  monthlyRevenue: string;
  monthlyExpense?: string;
  monthlyProfit?: string;
  activeClients: string;
  avgTime: string;
  totalTime: string;
  totalAppointments: string;
  pendingReceivables: string;
  anamnesisCompleted: string;
  topDiscoverySource: string;
}

const Index = () => {
  const [statsData, setStatsData] = useState<DashboardStats>({
    sessionsToday: "0",
    monthlyRevenue: "R$ 0",
    monthlyExpense: "R$ 0",
    monthlyProfit: "R$ 0",
    activeClients: "0",
    avgTime: "0h",
    totalTime: "0h",
    totalAppointments: "0",
    pendingReceivables: "R$ 0",
    anamnesisCompleted: "0",
    topDiscoverySource: "-",
  });
  const [todayClients, setTodayClients] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [appointmentsStatusData, setAppointmentsStatusData] = useState<any[]>([]);
  const [pendingAnamnesisAlerts, setPendingAnamnesisAlerts] = useState<any[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const thisMonth = today.slice(0, 7);
      
      const { data: appts } = await supabase.from('appointments').select('*, client:clientes(name, phone)');
      const { data: fins } = await supabase.from('financial_transactions').select('*');
      const { data: clients } = await supabase.from('clientes').select('*');
      const { data: anamnesis } = await supabase.from('anamnesis').select('*');

      const todayAppts = (appts || []).filter(a => a.date === today);
      const tomorrowAppts = (appts || []).filter(a => a.date === tomorrow);
      const pendingAppts = (appts || []).filter(a => a.status === 'Agendado' || a.status === 'Confirmado');

      const monthlyFins = (fins || []).filter(f => f.date?.startsWith(thisMonth));
      
      const revenue = monthlyFins.filter(f => f.type === 'entrada').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
      const expense = monthlyFins.filter(f => f.type === 'saida').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
      const pending = pendingAppts.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

      let totalMinutes = 0;
      let countWithTime = 0;
      
      // Calculate based on all schedule blocks (excluding cancelled)
      const scheduledBlocks = (appts || []).filter(a => a.status !== 'Cancelado');
      
      scheduledBlocks.forEach(a => {
        const sTime = a.start_time || a.startTime;
        const eTime = a.end_time || a.endTime;
        if (sTime && eTime) {
          const [startH, startM] = sTime.split(':').map(Number);
          const [endH, endM] = eTime.split(':').map(Number);
          if (!isNaN(startH) && !isNaN(endH)) {
             let duration = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
             if (duration < 0) duration += 24 * 60;
             totalMinutes += duration;
             countWithTime++;
          }
        }
      });
      
      const avgTotalMinutes = countWithTime > 0 ? Math.round(totalMinutes / countWithTime) : 0;
      
      const formatTime = (mins: number) => {
        if (mins === 0) return "0h";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
      };

      setStatsData({
        sessionsToday: todayAppts.length.toString(),
        monthlyRevenue: `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        monthlyExpense: `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        monthlyProfit: `R$ ${(revenue - expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        activeClients: (clients || []).length.toString(),
        avgTime: formatTime(avgTotalMinutes),
        totalTime: formatTime(totalMinutes),
        totalAppointments: scheduledBlocks.length.toString(),
        pendingReceivables: `R$ ${pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        anamnesisCompleted: (anamnesis || []).length.toString(),
        topDiscoverySource: "Instagram",
      });

      setTodayClients(todayAppts.map(a => ({
        id: a.id,
        name: a.client?.name || "Cliente",
        time: `${a.start_time || a.startTime || ""} - ${a.end_time || a.endTime || ""}`,
        status: a.status,
        value: a.value
      })));

      setTomorrowAppointments(tomorrowAppts.map(a => ({
        id: a.id,
        name: a.client?.name || "Cliente",
        time: `${a.start_time || a.startTime || ""} - ${a.end_time || a.endTime || ""}`,
      })));

      setRecentPayments((fins || [])
        .filter(f => f.type === 'entrada')
        .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
        .slice(0, 5)
        .map(f => ({
          id: f.id,
          name: f.description,
          amount: `R$ ${Number(f.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          date: f.date,
          status: f.status
        }))
      );

      const currentYear = new Date().getFullYear();
      const ptBRMonths = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      const monthsData = Array.from({ length: 12 }, (_, i) => ({
        name: ptBRMonths[i],
        Faturamento: 0,
        Despesa: 0,
        Lucro: 0,
      }));

      (fins || []).forEach((f: any) => {
        if (!f.date) return;
        const d = new Date(f.date.includes('/') ? f.date.split('/').reverse().join('-') : f.date);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (f.type === 'entrada') {
            monthsData[m].Faturamento += Number(f.value) || 0;
          } else if (f.type === 'saida') {
            monthsData[m].Despesa += Number(f.value) || 0;
          }
        }
      });

      monthsData.forEach(m => {
        m.Lucro = m.Faturamento - m.Despesa;
      });


      const monthlyAppts = (appts || []).filter((a: any) => a.date && a.date.startsWith(thisMonth));
      
      setRevenueChartData(monthsData);
      setAppointmentsStatusData([
        { name: "Confirmados", value: monthlyAppts.filter((a: any) => a.status === 'Confirmado' || a.status === 'Agendado').length, fill: "#9333ea" },
        { name: "Concluídos", value: monthlyAppts.filter((a: any) => a.status === 'Concluído').length, fill: "#10b981" },
        { name: "Para Remarcar", value: monthlyAppts.filter((a: any) => a.status === 'Para Remarcar').length, fill: "#f97316" },
        { name: "Cancelados", value: monthlyAppts.filter((a: any) => a.status === 'Cancelado').length, fill: "#ef4444" } // tailwind red-500
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openCheckout = (appt: any) => {
    setSelectedCheckout(appt);
    setCheckoutData({
      status: 'Recebido',
      value: appt.value || 0,
      paymentMethod: 'Pix',
      driveLink: ''
    });
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedCheckout) return;
    try {
      // 1. Update appointment
      const apptStatus = checkoutData.status === 'Recebido' || checkoutData.status === 'Apenas Consulta' ? 'Concluído' : 'Cancelado';
      const { error: apptError } = await supabase.from('appointments').update({ status: apptStatus }).eq('id', selectedCheckout.id);
      if (apptError) throw apptError;

      // 2. Insert into financial if Recebido
      if (checkoutData.status === 'Recebido') {
        const { error: finError } = await supabase.from('financial_transactions').insert([{
          description: `Sessão de Tattoo - ${selectedCheckout.name}`,
          type: "entrada",
          value: checkoutData.value,
          date: new Date().toISOString().split("T")[0],
          status: "Pago",
          drive_link: checkoutData.driveLink,
          appointment_id: selectedCheckout.id
        }]);
        if (finError) console.error("Error inserting financial transaction:", finError);
      }

      toast.success("Sessão baixada com sucesso!");
      setCheckoutModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa na sessão.");
    }
  };

  const stats = [
    {
      label: "Faturamento do Mês",
      value: statsData.monthlyRevenue,
      icon: DollarSign,
      change: "Entradas",
      trend: "up" as const,
    },
    {
      label: "Despesas do Mês",
      value: statsData.monthlyExpense || "R$ 0",
      icon: ArrowDownRight,
      change: "Saídas",
      trend: "down" as const,
    },
    {
      label: "Lucro Líquido",
      value: statsData.monthlyProfit || "R$ 0",
      icon: TrendingUp,
      change: "Saldo",
      trend: "up" as const,
    },
    {
      label: "A Receber (Agenda)",
      value: statsData.pendingReceivables,
      icon: DollarSign,
      change: "Agendado",
      trend: "up" as const,
    },
    {
      label: "Tempo Médio por Sessão",
      value: statsData.avgTime,
      icon: Clock,
      change: "Hoje",
      trend: "up" as const,
    },
    {
      label: "Tempo Total Já Tatuado",
      value: statsData.totalTime,
      icon: Clock,
      change: "Total",
      trend: "up" as const,
    },
    {
      label: "Clientes Ativos",
      value: statsData.activeClients,
      icon: Users,
      change: "Total",
      trend: "up" as const,
    },
    {
      label: "Qtd de Agendamentos",
      value: statsData.totalAppointments,
      icon: Calendar,
      change: "Total",
      trend: "up" as const,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bem-vindo de volta! Aqui está o resumo do seu dia.
          </p>
        </div>
      </div>

      {/* Pending Anamnesis Alert */}
      {pendingAnamnesisAlerts.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-warning/20 bg-warning/5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Anamneses Pendentes ({pendingAnamnesisAlerts.length})</h3>
              <p className="text-sm text-muted-foreground">Clientes com sessão nos próximos 7 dias sem ficha preenchida.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {pendingAnamnesisAlerts.slice(0, 2).map((alert, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm bg-background p-2 rounded-lg border shadow-sm">
                <div className="min-w-0">
                  <span className="font-medium text-foreground truncate block">{alert.name}</span>
                  <span className="text-xs text-muted-foreground">Dia {alert.date}</span>
                </div>
                <Link to={`/clientes?id=${alert.client_id}`} className="text-xs text-primary font-medium hover:underline shrink-0">
                  Ver Perfil
                </Link>
              </div>
            ))}
            {pendingAnamnesisAlerts.length > 2 && (
              <Link to="/clientes" className="text-xs text-center text-muted-foreground hover:text-foreground">
                + {pendingAnamnesisAlerts.length - 2} outros
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Tomorrow Confirmation Alert */}
      {tomorrowAppointments.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Confirmações para Amanhã ({tomorrowAppointments.length})</h3>
              <p className="text-sm text-muted-foreground">Envie mensagem rápida para confirmar presença dos clientes de amanhã.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {tomorrowAppointments.slice(0, 2).map((appt, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm bg-background p-3 rounded-lg border shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{appt.name}</span>
                  <span className="text-xs text-muted-foreground">Amanhã às {appt.time}</span>
                </div>
                <a
                  href={`https://wa.me/55${(appt.phone || "").replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${appt.name}! Passando para confirmar seu horário amanhã, dia ${new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('pt-BR')}, às ${appt.time}. Podemos confirmar?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-md text-xs font-bold transition-colors shrink-0"
                >
                  <Phone className="h-3 w-3" /> Confirmar
                </a>
              </div>
            ))}
            {tomorrowAppointments.length > 2 && (
              <p className="text-xs text-center text-muted-foreground">
                + {tomorrowAppointments.length - 2} outros agendamentos para amanhã
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid — 2 colunas no mobile, 3-4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-accent p-2 md:p-2.5">
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${stat.trend === "up"
                  ? "text-primary"
                  : "text-muted-foreground"
                  }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-2 md:mt-4">
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {loading ? "..." : stat.value}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Clients */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Próximos Clientes Hoje
            </h2>
          </div>
          <div className="divide-y min-h-[200px]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Carregando...</div>
            ) : todayClients.length > 0 ? (
              todayClients.map((client, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 px-6 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">
                      {client.time}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${client.status === "Confirmado" || client.status === "Concluído"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                        }`}
                    >
                      {client.status}
                    </span>
                    {client.status === 'Concluído' ? (
                      <span className="text-xs text-muted-foreground flex items-center ml-2">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" /> Baixa Concluída
                      </span>
                    ) : client.status !== 'Cancelado' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 rounded-full border-primary/20 text-primary hover:bg-primary/10 ml-2"
                        onClick={() => openCheckout(client)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Pendente (Dar Baixa)
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">Nenhum agendamento para hoje.</div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Pagamentos Recentes
            </h2>
          </div>
          <div className="divide-y min-h-[200px]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Carregando...</div>
            ) : recentPayments.length > 0 ? (
              recentPayments.map((payment, i) => (
                <div key={i} className="p-4 px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {payment.name}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {payment.amount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {payment.date}
                    </p>
                    <span className="text-xs font-medium text-primary">
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">Nenhum pagamento recente.</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
           <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Visão Anual de Desempenho ({new Date().getFullYear()})</h2>
          <div className="h-[220px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                  labelStyle={{ fontSize: '12px', color: '#64748b' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Faturamento" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Despesa" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Lucro" stroke="#475569" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments Status Chart */}
        <div className="bg-card rounded-xl border shadow-sm p-6 relative">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status de Agendamentos (Mês Atual)</h2>
          <div className="h-[220px] lg:h-[280px] flex justify-center items-center">
            {appointmentsStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {appointmentsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <Calendar className="h-8 w-8 opacity-20" />
                <p>Sem dados no mês atual</p>
              </div>
            )}

            {/* Custom Legend */}
            {appointmentsStatusData.length > 0 && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {appointmentsStatusData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium leading-tight">{entry.name}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{entry.value} agendamentos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Sessão (Dar Baixa)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted p-3 rounded-md flex flex-col gap-1 text-sm">
              <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.name}</span>
              <span className="text-muted-foreground">Horário: {selectedCheckout?.time} - {selectedCheckout?.type}</span>
            </div>

            <div className="space-y-2">
              <Label>Resultado da Sessão</Label>
              <Select
                value={checkoutData.status}
                onValueChange={(val) => setCheckoutData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Realizada / Pago</SelectItem>
                  <SelectItem value="Apenas Consulta">Apenas Consulta (Sem Custo)</SelectItem>
                  <SelectItem value="Cancelado">Faltou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {checkoutData.status === 'Recebido' && (
              <>
                <div className="space-y-2">
                  <Label>Valor Recebido</Label>
                  <CurrencyInput
                    value={checkoutData.value}
                    onChange={(val) => setCheckoutData(prev => ({ ...prev, value: val }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={checkoutData.paymentMethod}
                    onValueChange={(val) => setCheckoutData(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Link do Comprovante Final (Google Drive)
                  </Label>
                  <Input
                    placeholder="https://drive.google.com/file/d/..."
                    value={checkoutData.driveLink}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, driveLink: e.target.value }))}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckout}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
