import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Phone, Instagram, ChevronRight, Camera, User, CheckCircle2, AlertCircle, Pencil, Trash2, MessageCircle, Clock, ExternalLink, Filter, Calendar, MessageSquare, ClipboardList, HeartPulse, CheckCircle, List, LayoutDashboard, FileText, Users, History, Target, Ghost } from "lucide-react";
import { toast } from "sonner";
import { JourneyPlaybookModal } from "@/components/crm/JourneyPlaybookModal";
import { JourneyDetailsModal } from "@/components/crm/JourneyDetailsModal";
import PlaybookAccordion from "@/components/PlaybookAccordion";
import { supabase } from "@/lib/supabase";
import html2pdf from "html2pdf.js";

interface Client {
  id: string;
  name: string;
  phone: string;
  instagram: string;
  birthDate?: string;
  status: string;
  avatar_url?: string;
  referrer_name?: string;
  referred_by_id?: string;
  notes?: string;
  sessions?: number;
  lastVisit?: string;
}

const JOURNEY_STAGES = [
  { id: "Orçamento", title: "Orçamento", icon: <MessageSquare className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Primeiro contato, troca de ideias e orçamentos." },
  { id: "Onboarding", title: "Onboarding", icon: <ClipboardList className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Ficha de anamnese e orientações." },
  { id: "Sessão Agendada", title: "Sessão Agendada", icon: <Calendar className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Aguardando o dia da sessão. Lembretes e dicas pré-tattoo." },
  { id: "Projeto em Andamento", title: "Múltiplas Sessões", icon: <List className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Projeto de múltiplas sessões em execução." },
  { id: "Pós-Tatuagem", title: "Pós-Tatuagem", icon: <HeartPulse className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Acompanhamento da cicatrização (7-15 dias)." },
  { id: "Concluído", title: "Concluído", icon: <CheckCircle className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Processo finalizado com sucesso." }
];

const Clients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<string>("lista");
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // States do Modal de Decisão do Cliente
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionClient, setDecisionClient] = useState<any | null>(null);

  // States for sessions, referrals & anamnesis
  const [clientSessions, setClientSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [referredClients, setReferredClients] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [clientAnamnesis, setClientAnamnesis] = useState<any>(null);
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false);
  const [playbookClient, setPlaybookClient] = useState<any | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJourneyDetails, setSelectedJourneyDetails] = useState<any | null>(null);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  // New Client & Edit States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    phone: "",
    instagram: "",
    birthDate: "",
    status: "Orçamento",
    notes: "",
    avatar_url: "",
    referred_by_id: ""
  });

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState({
    id: "",
    name: "",
    phone: "",
    instagram: "",
    birthDate: "",
    status: "Orçamento",
    avatar_url: "",
    referred_by_id: ""
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error: clientsError } = await supabase.from('clientes').select('*, appointments(id, date), referrer:clientes!referred_by_id(name)');
      if (clientsError) throw clientsError;

      const { data: journeysData, error: journeysError } = await supabase.from('journeys').select('*, client:clientes(name, avatar_url, phone, appointments(date))');
      if (journeysError) console.log("Aviso journeys:", journeysError);

      const formatted = (clientsData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "Não informado",
        instagram: c.instagram || "@",
        birthDate: c.birth_date || "",
        sessions: c.appointments ? c.appointments.length : 0,
        lastVisit: c.appointments && c.appointments.length > 0
          ? new Date(c.appointments[c.appointments.length - 1].date).toLocaleDateString("pt-BR")
          : "Sem visitas",
        status: c.status || "Orçamento",
        notes: c.notes || "",
        avatar_url: c.avatar_url,
        referred_by_id: c.referred_by_id,
        referrer_name: c.referrer?.name
      }));

      setClients(formatted);
      setJourneys(journeysData || []);

      if (selectedClient) {
        const updated = formatted.find((c: any) => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error("Erro ao carregar dados do CRM");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (targetId && clients.length > 0 && !selectedClient) {
      const target = clients.find(c => c.id === targetId);
      if (target) setSelectedClient(target);
    }
  }, [targetId, clients, selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientSessions(selectedClient.id);
      fetchReferredClients(selectedClient.id);
      fetchClientAnamnesis(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClientAnamnesis = async (clientId: string) => {
    try {
      setLoadingAnamnesis(true);
      const { data, error } = await supabase.from('anamnesis').select('*').eq('client_id', clientId).single();
      
      if (data && !error) {
        const answers = data.answers || {};
        setClientAnamnesis({
          medical_history: {
            diabetes: answers.diabetes,
            hepatitis: answers.hepatitis,
            pregnancy: answers.pregnancy,
            bleeding_disorders: answers.bleeding_disorders,
            keloids: answers.keloids,
          },
          birth_date: answers.birth_date,
          discovery_source: data.discovery_source,
          allergies: answers.allergies,
          medications: answers.medications,
          emergency_contact: answers.emergency_contact,
          has_contract_signed: true,
          signed_at: data.created_at,
          client_ip: answers.client_ip
        });
      } else {
        setClientAnamnesis(null);
      }
    } catch (error) {
      console.error('Error fetching anamnesis:', error);
    } finally {
      setLoadingAnamnesis(false);
    }
  };

  const fetchClientSessions = async (clientId: string) => {
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase.from('appointments').select('*').eq('client_id', clientId);
      if (error) throw error;
      setClientSessions(data || []);
    } catch (error) {
      console.error('Error fetching client sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchReferredClients = async (clientId: string) => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase.from('clientes').select('*').eq('referred_by_id', clientId);
      if (error) throw error;
      setReferredClients(data || []);
    } catch (error) {
      console.error('Error fetching referred clients:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleUpdateJourneyStatus = async (journeyId: string, newStatus: string) => {
    try {
      const { error: journeyError } = await supabase.from('journeys').update({ status: newStatus }).eq('id', journeyId);
      if (journeyError) throw journeyError;

      const journey = journeys.find(j => j.id === journeyId);
      if (journey && journey.client_id) {
        await supabase.from('clientes').update({ status: newStatus }).eq('id', journey.client_id);
      }

      toast.success(`Estágio atualizado para "${newStatus}"!`);
      await fetchClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar estágio da jornada.");
    }
  };

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name) {
        toast.error("O nome é obrigatório.");
        return;
      }
      
      const { data: newClient, error } = await supabase.from('clientes').insert([{
        name: newClientData.name,
        phone: newClientData.phone,
        instagram: newClientData.instagram,
        birth_date: newClientData.birthDate || null,
        status: newClientData.status || "Orçamento",
        notes: newClientData.notes || "",
        avatar_url: newClientData.avatar_url,
        referred_by_id: newClientData.referred_by_id === "none" ? null : (newClientData.referred_by_id || null)
      }]).select().single();

      if (error) throw error;

      // Criar a primeira jornada no Kanban
      await supabase.from('journeys').insert([{
        client_id: newClient.id,
        status: newClientData.status || 'Orçamento'
      }]);

      toast.success("Cliente e Jornada criados com sucesso!");
      await fetchClients();
      setIsAddingClient(false);
      setNewClientData({ name: "", phone: "", instagram: "", birthDate: "", status: "Orçamento", notes: "", avatar_url: "", referred_by_id: "" });
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erro ao criar cliente.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      const { error } = await supabase.from('clientes').update({ notes: tempNotes }).eq('id', selectedClient.id);
      if (error) throw error;
      
      setSelectedClient(prev => prev ? { ...prev, notes: tempNotes } : null);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, notes: tempNotes } : c));
      setIsEditingNotes(false);
      toast.success("Anotações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar anotações.");
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    setEditClientData({
      id: selectedClient.id,
      name: selectedClient.name,
      phone: selectedClient.phone === "Não informado" ? "" : selectedClient.phone,
      instagram: selectedClient.instagram === "@" ? "" : selectedClient.instagram,
      birthDate: selectedClient.birthDate || "",
      status: selectedClient.status || "Orçamento",
      avatar_url: selectedClient.avatar_url || "",
      referred_by_id: selectedClient.referred_by_id || "none"
    });
    setIsEditingClient(true);
  };

  const handleUpdateClient = async () => {
    try {
      if (!editClientData.name) {
        toast.error("O nome é obrigatório.");
        return;
      }
      setUploading(true);
      
      const { error } = await supabase.from('clientes').update({
        name: editClientData.name,
        phone: editClientData.phone,
        instagram: editClientData.instagram,
        birth_date: editClientData.birthDate || null,
        status: editClientData.status,
        referred_by_id: editClientData.referred_by_id === "none" ? null : (editClientData.referred_by_id || null)
      }).eq('id', editClientData.id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
      await fetchClients();
      setIsEditingClient(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${selectedClient.name}? Esta ação não pode ser desfeita.`)) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('clientes').delete().eq('id', selectedClient.id);
      if (error) throw error;

      toast.success("Cliente excluído com sucesso!");
      setSelectedClient(null);
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Header do CRM com as Abas Superiores */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Clientes & Funil CRM</h1>
            <p className="page-subtitle">Gerencie sua carteira de clientes, funil de vendas e jornada de garimpo</p>
          </div>

          <div className="flex w-full overflow-x-auto no-scrollbar items-center gap-3">
            <TabsList className="bg-accent/40 p-1 rounded-xl border flex w-max h-auto">
              <TabsTrigger value="lista" className="gap-1.5 text-xs font-semibold whitespace-nowrap">
                <Users className="w-3.5 h-3.5" /> Lista de Clientes
              </TabsTrigger>
              <TabsTrigger value="jornada" className="gap-1.5 text-xs font-semibold whitespace-nowrap">
                <LayoutDashboard className="w-3.5 h-3.5" /> Jornada CRM (Kanban)
              </TabsTrigger>
              <TabsTrigger value="funil" className="gap-1.5 text-xs font-semibold whitespace-nowrap">
                <Filter className="w-3.5 h-3.5" /> Funil
              </TabsTrigger>
              <TabsTrigger value="processo" className="gap-1.5 text-xs font-semibold whitespace-nowrap">
                <FileText className="w-3.5 h-3.5" /> Processo Comercial
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setIsAddingClient(true)} className="gap-2 bg-primary text-primary-foreground font-bold shadow-md">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* ABA 1: LISTA DE CLIENTES */}
        <TabsContent value="lista" className="m-0 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm text-foreground">
            <div className="p-4 border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-accent/20 h-11"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Estágio CRM</TableHead>
                    <TableHead className="text-center">Sessões</TableHead>
                    <TableHead>Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando clientes...</TableCell>
                    </TableRow>
                  ) : filtered.length > 0 ? (
                    filtered.map((client) => (
                      <TableRow 
                        key={client.id} 
                        onClick={() => setSelectedClient(client)}
                        className="cursor-pointer hover:bg-accent/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                              {client.avatar_url ? (
                                <img src={client.avatar_url} alt={client.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                client.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                        <TableCell>
                           <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-accent border text-foreground">
                             {client.status}
                           </span>
                        </TableCell>
                        <TableCell className="font-medium text-center">{client.sessions}</TableCell>
                        <TableCell className="text-muted-foreground">{client.lastVisit}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 border-0 gap-0 bg-transparent shadow-none">
            <div className="bg-background rounded-xl">
              {selectedClient && (
                <div className="space-y-6 p-4 sm:p-6">
                  <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
                          {selectedClient.avatar_url ? (
                            <img src={selectedClient.avatar_url} alt={selectedClient.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            selectedClient.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                          <p className="text-xs text-muted-foreground">{selectedClient.phone} • {selectedClient.instagram}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setPlaybookClient(selectedClient);
                            setPlaybookModalOpen(true);
                          }}
                          className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md"
                        >
                          ▶ Iniciar Jornada (Playbook)
                        </Button>
                        <Button variant="outline" size="sm" onClick={openEditModal} className="h-9 text-xs">
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteClient} className="h-9 text-xs">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>

                    {/* Resumo de Sessões */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-accent/20 p-3 rounded-xl border text-center">
                        <span className="text-xs text-muted-foreground font-semibold block uppercase">Sessões</span>
                        <span className="text-lg font-bold text-foreground">{selectedClient.sessions}</span>
                      </div>
                      <div className="bg-accent/20 p-3 rounded-xl border text-center">
                        <span className="text-xs text-muted-foreground font-semibold block uppercase">Última Visita</span>
                        <span className="text-lg font-bold text-foreground">{selectedClient.lastVisit}</span>
                      </div>
                      <div className="bg-accent/20 p-3 rounded-xl border text-center">
                        <span className="text-xs text-muted-foreground font-semibold block uppercase">Estágio CRM</span>
                        <span className="text-sm font-bold text-primary">{selectedClient.status}</span>
                      </div>
                    </div>
                  </div>

                  
                    {/* Aba de Jornadas / Projetos do Cliente */}
                    <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <List className="h-4 w-4 text-primary" />
                          Jornadas & Projetos
                        </h3>
                        <span className="text-xs text-muted-foreground font-medium">
                          {journeys.filter(j => j.client_id === selectedClient.id).length} registros
                        </span>
                      </div>

                      <div className="space-y-3">
                        {journeys.filter(j => j.client_id === selectedClient.id).length > 0 ? (
                          journeys.filter(j => j.client_id === selectedClient.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(journey => (
                            <div 
                              key={journey.id} 
                              className="p-3.5 border rounded-xl bg-accent/10 hover:bg-accent/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer group"
                              onClick={() => {
                                setSelectedJourneyDetails(journey);
                                setDetailsModalOpen(true);
                              }}
                            >
                              <div>
                                <p className="font-bold text-sm text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                                  {journey.status === 'Concluído' ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <List className="w-3.5 h-3.5 text-primary" />}
                                  {journey.status === 'Concluído' ? 'Projeto Concluído (Antigo)' : 'Projeto em Andamento (Atual)'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Iniciado em: {new Date(journey.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${journey.status === 'Concluído' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                  {journey.status}
                                </span>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] bg-background/50 hover:bg-background border" onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJourneyDetails(journey);
                                  setDetailsModalOpen(true);
                                }}>
                                  Ver Detalhes
                                </Button>
                                {journey.status !== 'Concluído' && (
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => {
                                    e.stopPropagation();
                                    setPlaybookClient(selectedClient);
                                    setPlaybookModalOpen(true);
                                  }}>
                                    Abrir Playbook
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-center p-6 text-muted-foreground border-2 border-dashed rounded-xl">
                            Nenhuma jornada registrada para este cliente.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aba de Histórico e Comprovantes do Cliente */}
                  <div className="bg-card rounded-xl border shadow-sm p-6 text-foreground space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                        <History className="h-4 w-4 text-primary" />
                        Histórico de Agendamentos & Comprovantes no Drive
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {clientSessions.length} registros
                      </span>
                    </div>

                    {loadingSessions ? (
                      <p className="text-xs text-center p-4 text-muted-foreground">Carregando histórico financeiro...</p>
                    ) : clientSessions.length > 0 ? (
                      <div className="space-y-3">
                        {clientSessions.map((session) => {
                          const depositVal = Number(session.deposit || 0);
                          const totalVal = Number(session.value || 0);
                          const restanteVal = Math.max(0, totalVal - depositVal);
                          const depositLink = session.deposit_link || session.deposit_drive_link;
                          const sessionLink = session.drive_link || session.final_drive_link;

                          return (
                            <div key={session.id} className="p-3.5 border rounded-xl bg-accent/10 hover:bg-accent/30 transition-colors space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold flex items-center gap-2 text-foreground">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    {session.date ? session.date.split("-").reverse().join("/") : "Sem data"} às {session.startTime || "09:00"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-card border px-2.5 py-1 rounded-md text-foreground">
                                    Total: R$ {totalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                    session.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                    session.status === 'Confirmado' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                    session.status === 'Cancelado' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                    'bg-primary/10 text-primary border border-primary/20'
                                  }`}>
                                    {session.status}
                                  </span>
                                </div>
                              </div>

                              {/* Detalhamento do Sinal e Saldo com Links do Drive */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                                <div className="bg-card/70 p-2 rounded-lg border flex items-center justify-between">
                                  <div>
                                    <span className="text-muted-foreground text-[10px] uppercase block font-semibold">Sinal de Agendamento</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      R$ {depositVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>

                                  {depositLink ? (
                                    <a
                                      href={depositLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline bg-primary/10 px-2 py-1 rounded"
                                    >
                                      <span>Drive Sinal</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">Sem comprovante</span>
                                  )}
                                </div>

                                <div className="bg-card/70 p-2 rounded-lg border flex items-center justify-between">
                                  <div>
                                    <span className="text-muted-foreground text-[10px] uppercase block font-semibold">Saldo Restante</span>
                                    <span className="font-bold text-foreground">
                                      R$ {restanteVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>

                                  {sessionLink ? (
                                    <a
                                      href={sessionLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline bg-primary/10 px-2 py-1 rounded"
                                    >
                                      <span>Drive Sessão</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">Sem comprovante</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-center p-6 text-muted-foreground border-2 border-dashed rounded-xl">
                        Nenhum agendamento ou recebimento registrado para este cliente.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="jornada" className="m-0">
          {/* Indicador de Swipe para Mobile */}
          <div className="md:hidden flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3 animate-pulse">
            <span className="font-medium">Deslize para os lados para ver as etapas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-3 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none] -mx-4 px-4 md:mx-0 md:px-0">
            {JOURNEY_STAGES.map((stage) => {
              const stageJourneys = journeys.filter(j => 
                j.status === stage.id && 
                (search === "" || (j.client?.name || "").toLowerCase().includes(search.toLowerCase()) || (j.client?.phone || "").includes(search))
              );

              return (
                <div 
                  key={stage.id} 
                  className={`w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-start rounded-2xl p-3 flex flex-col h-[calc(100dvh-18rem)] min-h-[500px] transition-all border-2 ${draggedOverStage === stage.id ? 'bg-primary/5 border-primary/50 border-dashed scale-[1.02]' : 'bg-muted/20 border-transparent'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedOverStage !== stage.id) setDraggedOverStage(stage.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggedOverStage(null);
                    const journeyId = e.dataTransfer.getData("journeyId");
                    if (journeyId && journeyId !== "") {
                      handleUpdateJourneyStatus(journeyId, stage.id);
                    }
                  }}
                >
                  {/* Cabeçalho da Coluna do Kanban */}
                  <div className={`flex items-center justify-between mb-3 p-2 rounded-xl border ${stage.headerBg}`}>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div className="bg-card p-1.5 rounded-md shadow-sm shrink-0">
                        {stage.icon}
                      </div>
                      <h3 className="font-bold text-xs text-foreground truncate">{stage.title}</h3>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${stage.badgeBg}`}>
                      {stageJourneys.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [&::-webkit-scrollbar]:hidden">
                    {stageJourneys.length > 0 ? (
                      stageJourneys.map((journey) => (
                        <div
                          key={journey.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("journeyId", journey.id);
                          }}
                          onDragEnd={() => setDraggedOverStage(null)}
                          onClick={() => {
                            const foundClient = clients.find(c => c.id === journey.client_id) || { id: journey.client_id, name: journey.client?.name || "Cliente", phone: journey.client?.phone || "" };
                            setPlaybookClient(foundClient);
                            setPlaybookModalOpen(true);
                          }}
                          className="bg-card border shadow-sm hover:shadow-md transition-all rounded-xl p-3 cursor-grab active:cursor-grabbing group hover:border-primary/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {journey.client?.avatar_url ? (
                                  <img src={journey.client.avatar_url} alt={journey.client.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  journey.client?.name?.charAt(0) || '?'
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">{journey.client?.name || 'Cliente'}</h4>
                                <p className="text-[10px] text-muted-foreground">{journey.client?.phone || ""}</p>
                              </div>
                            </div>
                          </div>

                          {/* Botões Rápidos no Card do Kanban */}
                          <div className="flex items-center justify-between pt-2 border-t text-[11px] gap-1">
                            {journey.client?.phone && journey.client.phone !== "Não informado" && (
                              <a
                                href={
                                  stage.id === "Garimpo"
                                    ? `https://wa.me/55${journey.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${journey.client.name}! Tudo bem? Passando para saber como ficou a sua ideia de tatuagem. Conseguimos abrir uma condição especial na agenda este mês! Vamos dar andamento no projeto?`)}`
                                    : stage.id === "Sem Resposta"
                                    ? `https://wa.me/55${journey.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${journey.client.name}! Vi que não conseguimos nos falar depois da ideia do projeto de tatuagem. Ficou alguma dúvida sobre o orçamento que eu possa te ajudar?`)}`
                                    : `https://wa.me/55${journey.client.phone.replace(/\D/g, '')}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-colors text-[10px] ${
                                  stage.id === "Garimpo" || stage.id === "Sem Resposta"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                    : "text-muted-foreground hover:text-green-600"
                                }`}
                              >
                                {stage.id === "Garimpo" || stage.id === "Sem Resposta" ? "📲 Resgatar" : "Whats"}
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
                        <p className="text-[11px] text-muted-foreground font-medium">Vazio</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ABA 3: FUNIL DE CONVERSÃO */}
        <TabsContent value="funil" className="m-0">
          <div className="bg-card rounded-2xl border p-6 lg:p-10 shadow-sm overflow-hidden flex flex-col items-center min-h-[450px]">
            <div className="text-center mb-8 max-w-xl">
              <h2 className="text-xl font-bold mb-2">Funil de Conversão CRM</h2>
              <p className="text-sm text-muted-foreground">
                Análise de conversão acumulada do estúdio. Acompanhe a progressão de orçamentos até o fechamento.
              </p>
            </div>
            
            <div className="w-full max-w-2xl flex flex-col items-center gap-2">
              {JOURNEY_STAGES.map((stage, index) => {
                const count = filtered.filter(c => c.status === stage.id).length;
                const widthPercent = Math.max(35, 100 - index * 8);

                return (
                  <div key={stage.id} style={{ width: `${widthPercent}%` }} className="bg-accent/40 border p-3 rounded-xl flex justify-between items-center transition-all hover:border-primary">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-card border">
                        {stage.icon}
                      </div>
                      <span className="font-bold text-xs text-foreground">{stage.title}</span>
                    </div>
                    <span className="font-black text-sm text-primary">{count} clientes</span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ABA 4: PROCESSO COMERCIAL */}
        <TabsContent value="processo" className="m-0">
          <PlaybookAccordion />
        </TabsContent>
      </Tabs>

      {/* Modal Add Client */}
      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente (Cadastro Rápido)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome Completo *</Label>
              <Input
                placeholder="Ex: Lucas Silva"
                value={newClientData.name}
                onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instagram</Label>
                <Input
                  placeholder="@usuario"
                  value={newClientData.instagram}
                  onChange={(e) => setNewClientData({ ...newClientData, instagram: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Estágio Inicial</Label>
              <Select
                value={newClientData.status}
                onValueChange={(val) => setNewClientData({ ...newClientData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOURNEY_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
            <Button onClick={handleCreateClient}>Salvar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Client */}
      <Dialog open={isEditingClient} onOpenChange={setIsEditingClient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome Completo *</Label>
              <Input
                value={editClientData.name}
                onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp</Label>
                <Input
                  value={editClientData.phone}
                  onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instagram</Label>
                <Input
                  value={editClientData.instagram}
                  onChange={(e) => setEditClientData({ ...editClientData, instagram: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingClient(false)}>Cancelar</Button>
            <Button onClick={handleUpdateClient}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Playbook CRM */}
      <JourneyPlaybookModal
        open={playbookModalOpen}
        onOpenChange={setPlaybookModalOpen}
        client={playbookClient}
        onSuccess={fetchClients}
      />

      {/* Modal Detalhes da Jornada */}
      <JourneyDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        journey={selectedJourneyDetails}
        client={selectedClient}
        anamnesis={clientAnamnesis}
      />
    </>
  );
};

export default Clients;
