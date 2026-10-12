import { useState, useEffect } from "react";
import {
  Users as UsersIcon, Search, UserPlus, CheckCircle2, XCircle,
  Loader2, ShieldCheck, Phone, Trash2, Key, ArrowLeft,
  Calendar, DollarSign, TrendingUp, FileText, Target,
  Clock, ChevronRight, Activity, BarChart3, PieChart as PieChartIcon,
  Copy, LayoutGrid, List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

// =============================================
// TIPOS
// =============================================
interface TeamMember {
  id: string;
  accessCode: string;
  name: string | null;
  email?: string | null;
  whatsapp?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface MemberStats {
  clientsCreated: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  scheduledAppointments: number;
  totalDepositsCollected: number;
  totalRevenue: number;
  anamnesisCount: number;
  avgTicket: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  clientName: string;
  date: string;
  status: string;
  value: number;
  type: string;
}

interface MemberProfile {
  member: TeamMember;
  stats: MemberStats;
  recentActivity: RecentActivity[];
  monthlyData: { month: string; revenue: number; sessions: number; clientsAdded: number }[];
  statusData: { name: string; value: number }[];
  clientFunnelData: { name: string; value: number }[];
}

// =============================================
// HELPERS
// =============================================
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:      { label: "Proprietário / Admin",    color: "text-primary",    bg: "bg-primary/10 border-primary/30" },
  TATUADOR:   { label: "Tatuador(a)",             color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ASSISTENTE: { label: "Assistente",              color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  RECEPCAO:   { label: "Recepção / Atendimento",  color: "text-primary",bg: "bg-primary/10 border-primary/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  "Concluído":        { label: "Concluído",        color: "text-emerald-500" },
  "Agendado":         { label: "Agendado",         color: "text-amber-500" },
  "Confirmado":       { label: "Confirmado",       color: "text-blue-500" },
  "Cancelado":        { label: "Cancelado",        color: "text-destructive" },
  "Orçamento":        { label: "Orçamento",        color: "text-indigo-400" },
  "Sessão Agendada":  { label: "Sessão Agendada",  color: "text-amber-500" },
  "Onboarding":       { label: "Onboarding",       color: "text-purple-400" },
};

const formatDate = (d: string) => {
  if (!d) return "—";
  try {
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  } catch (e) {}
  if (d.includes("T")) d = d.split("T")[0]; // Handle timestamps
  const parts = d.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}/${m}/${y}`;
  }
  return d;
};

const formatMonth = (key: string) => {
  if (!key || !key.includes("-")) return key;
  const [y, m] = key.split("-");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[parseInt(m) - 1]}/${y.slice(2)}`;
};

const getRoleBadge = (role: string) => {
  const cfg = ROLE_CONFIG[role] || { label: role, color: "text-muted-foreground", bg: "bg-muted border-border" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.color}`}>
      {role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Perfil selecionado
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [profileData, setProfileData] = useState<MemberProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form novo membro
  const [newName, setNewName] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newRole, setNewRole] = useState("TATUADOR");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('team').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      setTeam(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar equipe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (member: TeamMember) => {
    setSelectedMember(member);
    setProfileData(null);
    setLoadingProfile(true);
    try {
      // 1. Buscar agendamentos com dados dos clientes
      const { data: rawAppts, error: apptsError } = await supabase
        .from('appointments')
        .select('*, client:clientes(id, name, phone, status)')
        .order('date', { ascending: false });
      if (apptsError) console.error("Erro ao buscar appointments:", apptsError);
      const appts = rawAppts || [];

      // 2. Buscar clientes cadastrados
      const { data: rawClients, error: clientsError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      if (clientsError) console.error("Erro ao buscar clientes:", clientsError);
      const clients = rawClients || [];

      // 3. Buscar transações financeiras (para sinais e faturamento reais)
      const { data: rawFin, error: finError } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
      if (finError) console.error("Erro ao buscar financeiro:", finError);
      const transactions = rawFin || [];

      // 4. Buscar fichas de anamnese
      const { data: rawAnamnesis, error: anamnesisError } = await supabase
        .from('anamnesis')
        .select('id, client_id, created_at');
      if (anamnesisError) console.error("Erro ao buscar anamnese:", anamnesisError);
      const anamnesis = rawAnamnesis || [];

      // Filtro por membro:
      // Para ADMIN e RECEPCAO (Atendimento), eles gerenciam a operação do estúdio.
      // Se houver registros com user_id vinculado a esse membro, usamos eles;
      // caso contrário, ou para RECEPCAO/ADMIN, utilizamos os dados operacionais do estúdio.
      const isGeneral = member.role === 'ADMIN' || member.role === 'RECEPCAO';

      const memberAppts = isGeneral
        ? appts
        : appts.filter(a => a.user_id === member.id || (member.name && (a.notes?.includes(member.name) || a.type?.includes(member.name))));

      const memberClients = isGeneral
        ? clients
        : clients.filter(c => c.user_id === member.id);

      // Métricas calculadas
      const totalAppointments = memberAppts.length;
      const completedAppointments = memberAppts.filter(a => a.status === 'Concluído').length;
      const cancelledAppointments = memberAppts.filter(a => a.status === 'Cancelado').length;
      const scheduledAppointments = memberAppts.filter(a => a.status === 'Agendado' || a.status === 'Confirmado').length;

      // Sinais Coletados:
      // Soma dos depósitos registrados nos agendamentos + transações de entrada identificadas como sinal
      const depositFromAppts = memberAppts.reduce((sum, a) => sum + Number(a.deposit || 0), 0);
      const depositFromFin = transactions
        .filter(t => t.type === 'entrada' && (t.description?.toLowerCase().includes('sinal') || t.appointment_id))
        .reduce((sum, t) => sum + Number(t.value || 0), 0);
      const totalDepositsCollected = Math.max(depositFromAppts, depositFromFin);

      // Faturamento Gerado:
      // Soma dos valores dos agendamentos concluídos + entradas registradas no financeiro
      const revenueFromAppts = memberAppts
        .filter(a => a.status === 'Concluído')
        .reduce((sum, a) => sum + Number(a.value || 0), 0);
      const revenueFromFin = transactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.value || 0), 0);
      const totalRevenue = Math.max(revenueFromFin, revenueFromAppts);

      const clientsCreated = memberClients.length;
      const anamnesisCount = isGeneral
        ? anamnesis.length
        : anamnesis.filter(an => memberClients.some(c => c.id === an.client_id)).length;

      const avgTicket = completedAppointments > 0 
        ? Math.round(totalRevenue / completedAppointments) 
        : (totalRevenue > 0 ? totalRevenue : 0);

      const completionRate = totalAppointments > 0 
        ? Math.round((completedAppointments / totalAppointments) * 100) 
        : (completedAppointments > 0 ? 100 : 0);

      const stats: MemberStats = {
        clientsCreated,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        scheduledAppointments,
        totalDepositsCollected,
        totalRevenue,
        anamnesisCount,
        avgTicket,
        completionRate
      };

      // 5. Dados mensais dos últimos 6 meses calculados dinamicamente
      const now = new Date();
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const monthKey = `${y}-${m}`;

        const monthRevenue = transactions
          .filter(t => t.type === 'entrada' && (t.date?.startsWith(monthKey) || t.created_at?.startsWith(monthKey)))
          .reduce((sum, t) => sum + Number(t.value || 0), 0) ||
          memberAppts
            .filter(a => a.status === 'Concluído' && (a.date?.startsWith(monthKey) || a.created_at?.startsWith(monthKey)))
            .reduce((sum, a) => sum + Number(a.value || 0), 0);

        const monthSessions = memberAppts.filter(a => (a.date?.startsWith(monthKey) || a.created_at?.startsWith(monthKey))).length;
        const monthClients = memberClients.filter(c => (c.created_at?.startsWith(monthKey))).length;

        monthlyData.push({
          month: monthKey,
          revenue: monthRevenue,
          sessions: monthSessions,
          clientsAdded: monthClients
        });
      }

      // 6. Status de Agendamentos e Funil de CRM
      const statusCounts: Record<string, number> = {};
      memberAppts.forEach(a => {
        const st = a.status || "Agendado";
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });

      // Funil de atendimento dos clientes
      const orcamentoCount = memberClients.filter(c => c.status === "Orçamento" || !c.status).length;
      const agendadaCount = memberClients.filter(c => c.status === "Sessão Agendada").length;
      const concluidoCount = memberClients.filter(c => c.status === "Concluído").length;

      const clientFunnelData = [
        { name: "Orçamento", value: orcamentoCount },
        { name: "Sessão Agendada", value: agendadaCount },
        { name: "Concluído", value: concluidoCount }
      ].filter(f => f.value > 0);

      let statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      if (statusData.length === 0 || member.role === 'RECEPCAO') {
        statusData = clientFunnelData.length > 0 ? clientFunnelData : [{ name: "Sem dados", value: 1 }];
      }

      // 7. Atividades Recentes
      const recentActivity: RecentActivity[] = [];

      memberAppts.forEach(a => {
        recentActivity.push({
          id: `appt-${a.id}`,
          clientName: a.client?.name || "Cliente",
          date: a.date || a.created_at || "",
          status: a.status || "Agendado",
          value: Number(a.value || a.deposit || 0),
          type: a.type || "Sessão de Tatuagem"
        });
      });

      // Se houver poucos agendamentos, lista os clientes mais recentes em atendimento
      if (recentActivity.length < 6) {
        memberClients.slice(0, 6).forEach(c => {
          if (!recentActivity.some(act => act.clientName === c.name)) {
            recentActivity.push({
              id: `cli-${c.id}`,
              clientName: c.name || "Cliente",
              date: c.created_at ? c.created_at.split('T')[0] : "Hoje",
              status: c.status || "Orçamento",
              value: 0,
              type: "Atendimento CRM"
            });
          }
        });
      }

      recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setProfileData({
        member,
        stats,
        recentActivity: recentActivity.slice(0, 10),
        monthlyData,
        statusData,
        clientFunnelData
      });
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil: " + error.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('team').insert([{
        name: newName,
        accessCode: newAccessCode,
        whatsapp: newWhatsapp,
        role: newRole,
        isActive: true
      }]).select().single();
      
      if (error) throw error;
      
      setTeam(prev => [data, ...prev]);
      toast.success("Colaborador adicionado com sucesso!");
      setIsAddOpen(false);
      setNewName(""); setNewAccessCode(""); setNewWhatsapp(""); setNewRole("TATUADOR");
    } catch (error: any) {
      toast.error("Erro ao adicionar membro: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    setUpdatingId(memberId);
    try {
      const { data, error } = await supabase.from('team').update({ isActive: !currentStatus }).eq('id', memberId).select().single();
      if (error) throw error;
      
      setTeam(prev => prev.map(m => m.id === memberId ? data : m));
      if (selectedMember?.id === memberId) setSelectedMember(data);
      toast.success(`Acesso ${!currentStatus ? "ativado" : "desativado"} com sucesso!`);
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este colaborador?")) return;
    setUpdatingId(memberId);
    try {
      const { error } = await supabase.from('team').delete().eq('id', memberId);
      if (error) throw error;
      
      setTeam(prev => prev.filter(m => m.id !== memberId));
      if (selectedMember?.id === memberId) setSelectedMember(null);
      toast.success("Colaborador removido.");
    } catch (error: any) {
      toast.error("Erro ao remover membro: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const generateRandomCode = () => {
    const prefix = newRole === "ADMIN" ? "ADMIN" : newRole === "ASSISTENTE" ? "ASSIST" : "TATTOO";
    setNewAccessCode(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado com sucesso!`);
  };

  const filteredTeam = team.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.accessCode?.toLowerCase().includes(q) ||
      (m.whatsapp && m.whatsapp.includes(q));
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && m.isActive) ||
      (statusFilter === "INACTIVE" && !m.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // =============================================
  // RENDER — PERFIL ABERTO
  // =============================================
  if (selectedMember) {
    const s = profileData?.stats;
    const activities = profileData?.recentActivity || [];
    const monthly = profileData?.monthlyData || [];
    const statusD = profileData?.statusData || [];
    const funnelD = profileData?.clientFunnelData || [];

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
    const FUNNEL_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#22c55e'];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Equipe
          </Button>
        </div>

        {/* Profile header */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-lg`}
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))" }}>
                {selectedMember.name?.charAt(0) || "?"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedMember.name || "Colaborador"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {getRoleBadge(selectedMember.role)}
                  {selectedMember.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 font-medium">
                      <XCircle className="h-3 w-3" /> Desativado
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono bg-muted px-2 py-1 rounded-lg border">
                    <Key className="h-3 w-3" /> {selectedMember.accessCode}
                  </span>
                  {selectedMember.whatsapp && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedMember.whatsapp}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Desde {formatDate(selectedMember.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedMember.role !== "ADMIN" && (
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Acesso</span>
                  {updatingId === selectedMember.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch checked={selectedMember.isActive} onCheckedChange={() => toggleMemberStatus(selectedMember.id, selectedMember.isActive)} className="data-[state=checked]:bg-primary" />
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteMember(selectedMember.id)}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Remover
                </Button>
              </div>
            )}
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex items-center justify-center p-16 gap-3 bg-card rounded-2xl border">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <p className="text-muted-foreground">Carregando métricas de {selectedMember.name}...</p>
          </div>
        ) : s ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Clientes Cadastrados", value: s.clientsCreated, icon: <UsersIcon className="h-5 w-5" />, color: "text-primary bg-primary/10" },
                { label: "Agendamentos Criados", value: s.totalAppointments, icon: <Calendar className="h-5 w-5" />, color: "text-purple-400 bg-purple-500/10" },
                { label: "Sessões Concluídas", value: s.completedAppointments, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-primary bg-primary/10" },
                { label: "Sinais Coletados", value: `R$ ${s.totalDepositsCollected.toLocaleString("pt-BR")}`, icon: <DollarSign className="h-5 w-5" />, color: "text-warning bg-warning/10" },
                { label: "Faturamento Gerado", value: `R$ ${s.totalRevenue.toLocaleString("pt-BR")}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-primary bg-primary/10" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
                    <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* GRÁFICOS PRINCIPAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico 1: Faturamento e Sessões */}
              <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" /> Faturamento e Sessões (Últimos 6 meses)
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={formatMonth}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? `R$ ${value.toLocaleString('pt-BR')}` : value,
                          name === 'revenue' ? 'Faturamento' : 'Sessões'
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="revenue" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar yAxisId="right" dataKey="sessions" name="Sessões" fill="hsl(var(--primary)/0.3)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Status dos Agendamentos / Funil de Atendimento */}
              <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5 flex flex-col">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <PieChartIcon className="h-4 w-4 text-primary" /> {selectedMember.role === "RECEPCAO" ? "Distribuição do Atendimento & Agendamentos" : "Distribuição de Agendamentos"}
                </h3>
                <div className="flex-1 min-h-[250px] w-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusD}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusD.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* GRÁFICOS SECUNDÁRIOS & MÉTRICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Gráfico 3: Clientes Adicionados */}
              <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5 lg:col-span-2">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <UsersIcon className="h-4 w-4 text-primary" /> Aquisição de Clientes
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={formatMonth}
                        formatter={(value: number) => [value, 'Novos Clientes']}
                      />
                      <Line type="monotone" dataKey="clientsAdded" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Painel Resumo */}
              <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary" /> Resumo
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Taxa de Conclusão</span>
                      <span className="font-semibold text-foreground">{s.completionRate}%</span>
                    </div>
                    <Progress value={s.completionRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/40 rounded-xl border text-center">
                      <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      <p className="font-bold text-sm mt-1">R$ {s.avgTicket.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border text-center">
                      <p className="text-xs text-muted-foreground">Fichas de Anamnese</p>
                      <p className="font-bold text-sm mt-1">{s.anamnesisCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" /> {selectedMember.role === "RECEPCAO" ? "Últimos Atendimentos & Agendamentos" : "Últimos Agendamentos Criados"}
              </h3>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {activities.map(a => {
                    const st = STATUS_CONFIG[a.status] || { label: a.status, color: "text-muted-foreground" };
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {a.clientName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{a.clientName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(a.date)} · {a.type}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-semibold ${st.color}`}>{st.label}</p>
                          {a.value > 0 && <p className="text-xs text-muted-foreground">R$ {a.value.toLocaleString("pt-BR")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-card rounded-2xl border p-10 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Não foi possível carregar as métricas deste colaborador.</p>
          </div>
        )}
      </div>
    );
  }

  // =============================================
  // RENDER — LISTA DE EQUIPE
  // =============================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Equipe & Colaboradores</h1>
          <p className="page-subtitle">Gerencie os membros do estúdio e acompanhe o desempenho de cada um.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto rounded-xl gap-2 h-11 px-4 font-semibold shadow-sm">
                <UserPlus className="h-4 w-4" /> Adicionar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Novo Colaborador</DialogTitle>
                <DialogDescription>Cadastre o colaborador e defina o Código de Acesso.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input placeholder="Ex: Carol Silva" value={newName} onChange={e => setNewName(e.target.value)} required className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Código de Acesso (PIN)</Label>
                    <button type="button" onClick={generateRandomCode} className="text-xs text-primary hover:underline font-medium">Gerar Automático</button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ex: TATTOO-1020" value={newAccessCode} onChange={e => setNewAccessCode(e.target.value.toUpperCase())} required className="pl-10 uppercase font-mono tracking-wider rounded-xl h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Função</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TATUADOR">Tatuador(a)</SelectItem>
                      <SelectItem value="ASSISTENTE">Assistente de Tatuagem</SelectItem>
                      <SelectItem value="RECEPCAO">Recepção / Atendimento</SelectItem>
                      <SelectItem value="ADMIN">Proprietário / Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (Opcional)</Label>
                  <Input placeholder="(11) 99999-9999" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} className="rounded-xl h-11" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11">Cancelar</Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl h-11 font-semibold">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Colaborador
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de Filtros e Alternador de Visualização */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou Whats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-11 rounded-xl bg-background">
                <SelectValue placeholder="Cargo / Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Cargos</SelectItem>
                <SelectItem value="ADMIN">Proprietário / Admin</SelectItem>
                <SelectItem value="TATUADOR">Tatuador(a)</SelectItem>
                <SelectItem value="ASSISTENTE">Assistente</SelectItem>
                <SelectItem value="RECEPCAO">Recepção</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 rounded-xl bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="ACTIVE">Apenas Ativos</SelectItem>
                <SelectItem value="INACTIVE">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alternador de Visualização (Tabela x Cards) */}
        <div className="flex items-center gap-1 self-end md:self-auto bg-muted/60 p-1 rounded-xl border border-border/50">
          <Button
            type="button"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={`h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 ${viewMode === "table" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-3.5 w-3.5" />
            Tabela
          </Button>
          <Button
            type="button"
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className={`h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 ${viewMode === "cards" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </Button>
        </div>
      </div>

      {/* Conteúdo: Tabela ou Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 bg-card rounded-2xl border shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Carregando equipe...</p>
        </div>
      ) : filteredTeam.length > 0 ? (
        viewMode === "table" ? (
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                    <TableHead className="font-semibold text-foreground py-3.5 pl-6 min-w-[200px]">Colaborador</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 min-w-[150px]">Código de Acesso</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 min-w-[150px]">Data de Cadastro</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 min-w-[160px]">Cargo / Função</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 min-w-[140px]">WhatsApp</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 min-w-[130px]">Acesso</TableHead>
                    <TableHead className="font-semibold text-foreground py-3.5 text-right pr-6 min-w-[140px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeam.map(member => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group border-b border-border/50"
                      onClick={() => openProfile(member)}
                    >
                      {/* Colaborador */}
                      <TableCell className="py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))" }}
                          >
                            {member.name?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {member.name || "Colaborador"}
                            </p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Código de Acesso */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted border border-border/70 text-foreground flex items-center gap-1.5 w-fit">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            {member.accessCode}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Copiar código de acesso"
                            onClick={(e) => handleCopyCode(member.accessCode, e)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Data de Cadastro */}
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          {formatDate(member.createdAt)}
                        </span>
                      </TableCell>

                      {/* Cargo / Função */}
                      <TableCell className="py-3.5">
                        {getRoleBadge(member.role)}
                      </TableCell>

                      {/* Contato (WhatsApp) */}
                      <TableCell className="py-3.5" onClick={e => e.stopPropagation()}>
                        {member.whatsapp ? (
                          <a
                            href={`https://wa.me/55${member.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium hover:underline transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                            {member.whatsapp}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      {/* Acesso (Switch) */}
                      <TableCell className="py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {updatingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Switch
                              checked={member.isActive}
                              onCheckedChange={() => toggleMemberStatus(member.id, member.isActive)}
                              className="data-[state=checked]:bg-primary"
                            />
                          )}
                          <span className={`text-xs font-medium ${member.isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {member.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="py-3.5 text-right pr-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs rounded-lg gap-1 border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                            onClick={() => openProfile(member)}
                          >
                            <BarChart3 className="h-3.5 w-3.5" /> Métricas
                          </Button>
                          {member.role !== "ADMIN" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Remover colaborador"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeam.map(member => (
              <div key={member.id} className="bg-card rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
                {/* Card clicável — abre perfil */}
                <button className="w-full text-left p-5 space-y-4" onClick={() => openProfile(member)}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow group-hover:scale-105 transition-transform"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.5))" }}>
                      {member.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{member.name || "Colaborador"}</p>
                      {getRoleBadge(member.role)}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>

                  {/* Info row */}
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 font-mono bg-muted px-2 py-1 rounded-lg border">
                        <Key className="h-3 w-3" /> {member.accessCode}
                      </span>
                      {member.whatsapp && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.whatsapp}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                      <Calendar className="h-3 w-3 text-primary/70" /> Cadastrado em {formatDate(member.createdAt)}
                    </span>
                  </div>
                </button>

                {/* Status + toggle na base */}
                <div className="px-5 pb-4 pt-1 flex items-center justify-between border-t border-border/30">
                  {member.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acesso Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                      <XCircle className="h-3.5 w-3.5" /> Desativado
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {updatingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <>
                        <Switch
                          checked={member.isActive}
                          onCheckedChange={() => toggleMemberStatus(member.id, member.isActive)}
                          className="data-[state=checked]:bg-primary"
                        />
                        {member.role !== "ADMIN" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={e => { e.stopPropagation(); handleDeleteMember(member.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border shadow-sm">
          <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Nenhum colaborador encontrado com os filtros atuais.
        </div>
      )}
    </div>
  );
}
