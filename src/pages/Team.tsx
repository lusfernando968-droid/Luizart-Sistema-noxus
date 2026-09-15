import { useState, useEffect } from "react";
import {
  Users as UsersIcon, Search, UserPlus, CheckCircle2, XCircle,
  Loader2, ShieldCheck, Phone, Trash2, Key, ArrowLeft,
  Calendar, DollarSign, TrendingUp, FileText, Target,
  Clock, ChevronRight, Activity, BarChart3, PieChart as PieChartIcon
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
  RECEPCAO:   { label: "Recepção / Atendimento",  color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  "Concluído":  { label: "Concluído",  color: "text-success" },
  "Agendado":   { label: "Agendado",   color: "text-warning" },
  "Confirmado": { label: "Confirmado", color: "text-primary" },
  "Cancelado":  { label: "Cancelado",  color: "text-destructive" },
};

const formatDate = (d: string) => {
  if (!d) return "—";
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
      // Mocked stats since we don't have a backend endpoint to aggregate them easily yet
      const s = {
        clientsCreated: 12,
        totalAppointments: 24,
        completedAppointments: 18,
        cancelledAppointments: 2,
        scheduledAppointments: 4,
        totalDepositsCollected: 1250,
        totalRevenue: 8500,
        anamnesisCount: 10,
        avgTicket: 354,
        completionRate: 75
      };
      const monthlyData = [
        { month: "2026-04", revenue: 4000, sessions: 10, clientsAdded: 3 },
        { month: "2026-05", revenue: 5500, sessions: 12, clientsAdded: 5 },
        { month: "2026-06", revenue: 8500, sessions: 18, clientsAdded: 12 }
      ];
      setProfileData({
        member,
        stats: s,
        recentActivity: [],
        monthlyData,
        statusData: [{ name: "Concluído", value: 18 }, { name: "Agendado", value: 4 }, { name: "Cancelado", value: 2 }],
        clientFunnelData: []
      });
    } catch (error: any) {
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

  const filteredTeam = team.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.accessCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30 font-medium">
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
                    <Switch checked={selectedMember.isActive} onCheckedChange={() => toggleMemberStatus(selectedMember.id, selectedMember.isActive)} className="data-[state=checked]:bg-emerald-500" />
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
                { label: "Sessões Concluídas", value: s.completedAppointments, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-success bg-success/10" },
                { label: "Sinais Coletados", value: `R$ ${s.totalDepositsCollected.toLocaleString("pt-BR")}`, icon: <DollarSign className="h-5 w-5" />, color: "text-warning bg-warning/10" },
                { label: "Faturamento Gerado", value: `R$ ${s.totalRevenue.toLocaleString("pt-BR")}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-success bg-success/10" },
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

              {/* Gráfico 2: Status dos Agendamentos */}
              <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5 flex flex-col">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Distribuição de Agendamentos
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
                <BarChart3 className="h-4 w-4 text-primary" /> Últimos Agendamentos Criados
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

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou código..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl w-full" />
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto rounded-xl gap-2">
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
                  <Input placeholder="Ex: Carol Silva" value={newName} onChange={e => setNewName(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Código de Acesso (PIN)</Label>
                    <button type="button" onClick={generateRandomCode} className="text-xs text-primary hover:underline font-medium">Gerar Automático</button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ex: TATTOO-1020" value={newAccessCode} onChange={e => setNewAccessCode(e.target.value.toUpperCase())} required className="pl-10 uppercase font-mono tracking-wider rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Função</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
                  <Input placeholder="(11) 99999-9999" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} className="rounded-xl" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancelar</Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Colaborador
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 bg-card rounded-2xl border">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Carregando equipe...</p>
        </div>
      ) : filteredTeam.length > 0 ? (
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
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono bg-muted px-2 py-1 rounded-lg border">
                    <Key className="h-3 w-3" /> {member.accessCode}
                  </span>
                  {member.whatsapp && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.whatsapp}</span>
                  )}
                </div>
              </button>

              {/* Status + toggle na base */}
              <div className="px-5 pb-4 pt-1 flex items-center justify-between border-t border-border/30">
                {member.isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
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
                        className="data-[state=checked]:bg-emerald-500"
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
      ) : (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border">
          <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Nenhum colaborador encontrado.
        </div>
      )}
    </div>
  );
}
