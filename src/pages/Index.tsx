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
  MessageCircle,
  CheckCircle2,
  LinkIcon,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
import { WaitlistReallocateModal, FreedSlotInfo } from "@/components/crm/WaitlistReallocateModal";
import { supabase, supabasePublic } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LabelList,
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
  const [clientAcquisitionData, setClientAcquisitionData] = useState<any[]>([]);
  const [appointmentsStatusData, setAppointmentsStatusData] = useState<any[]>([]);
  const [pendingAnamnesisAlerts, setPendingAnamnesisAlerts] = useState<any[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<any[]>([]);
  const [tomorrowDropdownOpen, setTomorrowDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<any>(null);
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [freedSlot, setFreedSlot] = useState<FreedSlotInfo | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    status: 'Recebido',
    value: 0,
    paymentMethod: 'Pix',
    driveLink: '',
    barterDescription: ''
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const thisMonth = today.slice(0, 7);
      
      const { data: appts } = await supabase.from('appointments').select('*, client:clientes(id, name, phone, is_barter, barter_description, barter_balance, barter_history)');
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
        client_id: a.client_id || a.client?.id,
        name: a.client?.name || "Cliente",
        time: `${a.start_time || a.startTime || ""} - ${a.end_time || a.endTime || ""}`,
        status: a.status,
        value: a.value,
        deposit: a.deposit || 0,
        type: a.type || "Tatuagem",
        is_barter: Boolean(a.client?.is_barter),
        barter_description: a.client?.barter_description || "",
        barter_balance: Number(a.client?.barter_balance || 0),
        barter_history: Array.isArray(a.client?.barter_history) ? a.client.barter_history : []
      })));

      setTomorrowAppointments(tomorrowAppts.map(a => ({
        id: a.id,
        name: a.client?.name || "Cliente",
        phone: a.client?.phone || "",
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

      // Cálculo de Acúmulo de Clientes Mês a Mês + Taxa de Crescimento sobre a Base Total
      const firstApptByClient: Record<string, string> = {};
      (appts || []).forEach((a: any) => {
        const cid = a.client_id || a.client?.id;
        if (!cid || !a.date || a.status === "Cancelado") return;
        const normDate = a.date.includes("/") ? a.date.split("/").reverse().join("-") : a.date;
        if (!firstApptByClient[cid] || normDate < firstApptByClient[cid]) {
          firstApptByClient[cid] = normDate;
        }
      });

      const acqMonths = Array.from({ length: 12 }, (_, i) => ({
        name: ptBRMonths[i],
        monthIndex: i,
        novos: 0,
        acumulado: 0,
        taxa: 0,
        taxaLabel: "",
      }));

      let initialBase = 0;
      (clients || []).forEach((c: any) => {
        const rawDate = firstApptByClient[c.id] || (c.created_at ? String(c.created_at).slice(0, 10) : "");
        if (!rawDate) {
          initialBase += 1;
          return;
        }
        const d = new Date(rawDate.includes("/") ? rawDate.split("/").reverse().join("-") : rawDate);
        if (isNaN(d.getTime()) || d.getFullYear() < currentYear) {
          initialBase += 1;
        } else if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          acqMonths[m].novos += 1;
        }
      });

      let runningTotal = initialBase;
      acqMonths.forEach((item) => {
        const baseAnterior = runningTotal;
        runningTotal += item.novos;
        item.acumulado = runningTotal;

        let taxa = 0;
        if (baseAnterior > 0) {
          taxa = Math.round((item.novos / baseAnterior) * 100);
        } else if (item.novos > 0) {
          taxa = 100;
        }
        item.taxa = taxa;
        item.taxaLabel = item.novos > 0 ? `+${taxa}%` : "";
      });

      setClientAcquisitionData(acqMonths);

      const monthlyAppts = (appts || []).filter((a: any) => a.date && a.date.startsWith(thisMonth));
      
      setRevenueChartData(monthsData);
      setAppointmentsStatusData([
        { name: "Confirmados", value: monthlyAppts.filter((a: any) => a.status === 'Confirmado' || a.status === 'Agendado').length, fill: "#2563eb" },
        { name: "Concluídos", value: monthlyAppts.filter((a: any) => a.status === 'Concluído').length, fill: "#0f172a" },
        { name: "Para Remarcar", value: monthlyAppts.filter((a: any) => a.status === 'Para Remarcar').length, fill: "#64748b" },
        { name: "Cancelados", value: monthlyAppts.filter((a: any) => a.status === 'Cancelado').length, fill: "#cbd5e1" }
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
      status: appt.is_barter ? 'Permuta' : 'Recebido',
      value: Math.max(0, Number(appt.value || 0) - Number(appt.deposit || 0)),
      paymentMethod: 'Pix',
      driveLink: '',
      barterDescription: appt.barter_description || ''
    });
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedCheckout) return;
    try {
      // 1. Update appointment
      const apptStatus =
        checkoutData.status === 'Recebido' ||
        checkoutData.status === 'Permuta' ||
        checkoutData.status === 'Apenas Consulta'
          ? 'Concluído'
          : checkoutData.status === 'Para Remarcar'
          ? 'Para Remarcar'
          : 'Cancelado';
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

      // 3. Abater no saldo de permuta do cliente se for Permuta
      if (checkoutData.status === 'Permuta' && selectedCheckout.client_id) {
        const currentBalance = Number(selectedCheckout.barter_balance || 0);
        const deductAmount = Number(checkoutData.value || 0);
        const newBalance = currentBalance - deductAmount;
        const historyEntry = {
          id: String(Date.now()),
          date: new Date().toISOString().split("T")[0],
          type: "abatimento",
          amount: -deductAmount,
          balance_after: newBalance,
          note: `Baixa de sessão (${selectedCheckout.time || "Tatuagem"})`
        };
        const currentHistory = Array.isArray(selectedCheckout.barter_history) ? selectedCheckout.barter_history : [];

        const { error: barterError } = await supabase
          .from('clientes')
          .update({
            is_barter: true,
            barter_description: checkoutData.barterDescription?.trim() || selectedCheckout.barter_description || "Permuta",
            barter_balance: newBalance,
            barter_history: [historyEntry, ...currentHistory]
          })
          .eq('id', selectedCheckout.client_id);

        if (barterError) throw barterError;
      }

      toast.success(
        checkoutData.status === 'Permuta'
          ? "Sessão abatida no saldo de permuta!"
          : "Sessão baixada com sucesso!"
      );
      setCheckoutModalOpen(false);
      fetchDashboardData();

      if (apptStatus === 'Cancelado' || apptStatus === 'Para Remarcar') {
        const [sTime, eTime] = (selectedCheckout.time || "09:00 - 11:00").split(" - ");
        setFreedSlot({
          appointmentId: selectedCheckout.id,
          previousClientName: selectedCheckout.name,
          date: new Date().toISOString().split("T")[0],
          startTime: sTime?.trim() || "09:00",
          endTime: eTime?.trim() || "11:00",
          reason: apptStatus,
          value: Number(selectedCheckout.value || 0)
        });
        setReallocateModalOpen(true);
      }
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

      {/* Confirmações para Amanhã (Menu Suspenso Clean) */}
      {tomorrowAppointments.length > 0 && (
        <div className="mb-3 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setTomorrowDropdownOpen(prev => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-muted/50 transition-colors focus:outline-hidden"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                Confirmações para Amanhã
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/10 text-primary">
                {tomorrowAppointments.length}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                tomorrowDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {tomorrowDropdownOpen && (
            <div className="px-3 pb-3 pt-2 border-t border-border/60 flex flex-col gap-1.5 bg-muted/20">
              {tomorrowAppointments.map((appt, i) => (
                <div
                  key={appt.id || i}
                  className="flex items-center justify-between gap-2 text-xs sm:text-sm bg-background px-3 py-2 rounded-lg border border-border/70"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-foreground truncate">{appt.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium text-muted-foreground shrink-0">
                      {appt.time}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanPhone = (appt.phone || "").replace(/\D/g, "");
                      const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString("pt-BR");
                      const msg = `Olá ${appt.name}! Passando para confirmar seu horário amanhã, dia ${tomorrowStr}, às ${appt.time}. Podemos confirmar?`;
                      openWhatsApp(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`);
                    }}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all shrink-0 active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Confirmar</span>
                  </button>
                </div>
              ))}
            </div>
          )}
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
        {/* Client Acquisition Chart (Cumulative Line + Growth Rate vs Base) */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col justify-between gap-4">
          {(() => {
            const currentMonthIdx = new Date().getMonth();
            const currentMonthItem = clientAcquisitionData[currentMonthIdx];
            const currentTaxa = currentMonthItem?.taxa ?? 0;
            const activeMonths = clientAcquisitionData.filter((m) => m.novos > 0).slice(-4);

            return (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                    Acúmulo de Clientes ({new Date().getFullYear()})
                  </h2>
                  {currentMonthItem && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap shrink-0">
                      <ArrowUpRight className="h-3 w-3" />
                      +{currentTaxa}% em {currentMonthItem.name}
                    </span>
                  )}
                </div>

                <div className="h-[190px] lg:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={clientAcquisitionData}
                      margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                        labelStyle={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}
                        formatter={(value: number, _name: string, props: any) => {
                          const novos = props?.payload?.novos ?? 0;
                          const taxa = props?.payload?.taxa ?? 0;
                          return [
                            `${value} clientes (+${novos} novos | +${taxa}%)`,
                            "Total",
                          ];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="acumulado"
                        name="Total Acumulado"
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={{ r: 2, strokeWidth: 1.5, fill: "#ffffff", stroke: "#0f172a" }}
                        activeDot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 1.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {activeMonths.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-border/50">
                    {activeMonths.map((m) => (
                      <div
                        key={m.name}
                        className="flex-1 min-w-[95px] flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs"
                      >
                        <div className="flex items-baseline gap-1 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground">{m.name}</span>
                          <span className="font-bold text-foreground">{m.acumulado}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary shrink-0">
                          +{m.taxa}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
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
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col justify-between">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status de Agendamentos (Mês Atual)</h2>
          {(() => {
            const totalMonthlyAppts = appointmentsStatusData.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
            if (appointmentsStatusData.length === 0 || totalMonthlyAppts === 0) {
              return (
                <div className="h-[220px] lg:h-[280px] flex flex-col justify-center items-center text-muted-foreground gap-2">
                  <Calendar className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Sem dados no mês atual</p>
                </div>
              );
            }

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 my-auto">
                {/* Gráfico de Rosca com Total Centralizado */}
                <div className="relative w-full sm:w-1/2 h-[180px] sm:h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentsStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={80}
                        cornerRadius={4}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {appointmentsStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground leading-none">{totalMonthlyAppts}</span>
                    <span className="text-[11px] text-muted-foreground mt-1">No mês</span>
                  </div>
                </div>

                {/* Legenda Clean (2x2 no Mobile, Lista Lateral no Desktop) */}
                <div className="w-full sm:w-1/2 grid grid-cols-2 sm:grid-cols-1 gap-2">
                  {appointmentsStatusData.map((entry, idx) => {
                    const pct = totalMonthlyAppts > 0 ? Math.round((entry.value / totalMonthlyAppts) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="text-xs font-medium text-foreground truncate">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-foreground">{entry.value}</span>
                          <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">Cliente: {selectedCheckout?.name}</span>
                {selectedCheckout?.is_barter && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <RefreshCw className="w-2.5 h-2.5" />
                    Permuta{selectedCheckout?.barter_description ? `: ${selectedCheckout.barter_description}` : ""}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground">Horário: {selectedCheckout?.time} - {selectedCheckout?.type}</span>
            </div>

            <div className="space-y-2">
              <Label>Resultado da Sessão</Label>
              <Select
                value={checkoutData.status}
                onValueChange={(val) => setCheckoutData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Realizada / Pago</SelectItem>
                  <SelectItem value="Permuta">Realizada / Abater em Permuta</SelectItem>
                  <SelectItem value="Apenas Consulta">Apenas Consulta (Sem Custo)</SelectItem>
                  <SelectItem value="Para Remarcar">Remarcou / Reagendar</SelectItem>
                  <SelectItem value="Cancelado">Faltou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {checkoutData.status === 'Permuta' && (() => {
              const currentBalance = Number(selectedCheckout?.barter_balance || 0);
              const deductVal = Number(checkoutData.value || 0);
              const afterBalance = currentBalance - deductVal;

              return (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Saldo Atual do Cliente:</span>
                      <span className={`font-bold ${
                        currentBalance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : currentBalance < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }`}>
                        R$ {Math.abs(currentBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                        {currentBalance > 0 ? "(Disponível)" : currentBalance < 0 ? "(Pendente)" : "(Zerado)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-muted-foreground font-medium">Saldo Após Esta Sessão:</span>
                      <span className={`font-bold ${
                        afterBalance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : afterBalance < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }`}>
                        R$ {Math.abs(afterBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                        {afterBalance > 0 ? "(Disponível)" : afterBalance < 0 ? "(Pendente)" : "(Quitado)"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Serviço da Permuta</Label>
                    <Input
                      placeholder="Ex: Barbeiro, Personal, Academia..."
                      value={checkoutData.barterDescription}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, barterDescription: e.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Abatido na Permuta</Label>
                    <CurrencyInput
                      value={checkoutData.value}
                      onChange={(val) => setCheckoutData(prev => ({ ...prev, value: val }))}
                    />
                  </div>
                </div>
              );
            })()}

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

      <WaitlistReallocateModal
        open={reallocateModalOpen}
        onOpenChange={setReallocateModalOpen}
        freedSlot={freedSlot}
        onReallocated={fetchDashboardData}
      />
    </>
  );
};

export default Index;
