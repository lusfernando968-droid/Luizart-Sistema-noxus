import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  MessageCircle, 
  FileText, 
  Pencil, 
  User, 
  BookOpen, 
  Filter, 
  ArrowRight, 
  RefreshCw,
  Sparkles
} from "lucide-react";

interface LeanJourneyTabProps {
  clients: any[];
  journeys: any[];
  onRefresh: () => Promise<void>;
  onOpenClientProfile: (client: any) => void;
  onOpenPlaybook: (client: any, journeyId?: string) => void;
}

export function LeanJourneyTab({
  clients,
  journeys,
  onRefresh,
  onOpenClientProfile,
  onOpenPlaybook
}: LeanJourneyTabProps) {
  const [tabFilter, setTabFilter] = useState<"andamento" | "concluido" | "todos">("andamento");
  const [search, setSearch] = useState("");
  
  // Modal para iniciar nova jornada enxuta
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newJourneyStatus, setNewJourneyStatus] = useState<"Projeto em Andamento" | "Concluído">("Projeto em Andamento");
  const [newJourneySummary, setNewJourneySummary] = useState("");
  const [submittingNew, setSubmittingNew] = useState(false);

  // Modal para editar historinha / anotação rápida
  const [editingItem, setEditingItem] = useState<{ journey: any; client: any } | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Mapear jornadas que estão em modo enxuto
  // Consideramos enxuto se playbook_data.isLean === true OU se o status foi definido como lean
  const leanJourneys = journeys.filter(j => {
    const isLean = j.playbook_data?.isLean || j.playbook_data?.is_lean;
    return isLean;
  });

  // Também encontrar clientes que tenham anotações de jornada enxuta mesmo se a jornada ainda não foi formalizada
  const leanItems = leanJourneys.map(j => {
    const client = clients.find(c => c.id === j.client_id) || j.client;
    const isCompleted = j.status === "Concluído";
    const summary = j.playbook_data?.projectSummary || client?.notes || "";
    return {
      journey: j,
      client,
      isCompleted,
      summary,
      status: j.status,
      updatedAt: j.playbook_data?.updatedAt || j.created_at
    };
  });

  // Filtragem
  const filteredItems = leanItems.filter(item => {
    if (!item.client) return false;
    
    // Filtro de aba
    if (tabFilter === "andamento" && item.isCompleted) return false;
    if (tabFilter === "concluido" && !item.isCompleted) return false;

    // Filtro de busca (nome, telefone, resumo do projeto)
    const term = search.toLowerCase();
    const matchName = (item.client.name || "").toLowerCase().includes(term);
    const matchPhone = (item.client.phone || "").includes(term);
    const matchSummary = (item.summary || "").toLowerCase().includes(term);

    return matchName || matchPhone || matchSummary;
  });

  const countAndamento = leanItems.filter(i => !i.isCompleted).length;
  const countConcluido = leanItems.filter(i => i.isCompleted).length;

  // Alternar status rápido (Em Andamento <-> Concluído)
  const handleToggleStatus = async (item: typeof leanItems[0]) => {
    const targetStatus = item.isCompleted ? "Projeto em Andamento" : "Concluído";
    try {
      const updatedPlaybookData = {
        ...(item.journey.playbook_data || {}),
        isLean: true,
        status: targetStatus,
        updatedAt: new Date().toISOString()
      };

      const { error: jError } = await supabase
        .from("journeys")
        .update({
          status: targetStatus,
          playbook_data: updatedPlaybookData,
          closed_at: targetStatus === "Concluído" ? new Date().toISOString() : null
        })
        .eq("id", item.journey.id);

      if (jError) throw jError;

      if (item.client?.id) {
        await supabase
          .from("clientes")
          .update({ status: targetStatus })
          .eq("id", item.client.id);
      }

      toast.success(`Projeto movido para "${targetStatus}"!`);
      await onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status do projeto.");
    }
  };

  // Salvar edição da historinha
  const handleSaveEditSummary = async () => {
    if (!editingItem) return;
    try {
      setSubmittingEdit(true);
      const updatedPlaybookData = {
        ...(editingItem.journey.playbook_data || {}),
        isLean: true,
        projectSummary: editSummary,
        updatedAt: new Date().toISOString()
      };

      const { error: jError } = await supabase
        .from("journeys")
        .update({
          playbook_data: updatedPlaybookData
        })
        .eq("id", editingItem.journey.id);

      if (jError) throw jError;

      // Também salvar nas notas do cliente para redundância segura
      if (editingItem.client?.id) {
        const leanLog = `[Jornada Enxuta - Atualização]\n${editSummary}\n------------------------`;
        const existingNotes = editingItem.client.notes || "";
        const updatedNotes = existingNotes ? `${leanLog}\n\n${existingNotes}` : leanLog;

        await supabase
          .from("clientes")
          .update({ notes: updatedNotes })
          .eq("id", editingItem.client.id);
      }

      toast.success("História e resumo do projeto atualizados!");
      setEditingItem(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar anotação.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Iniciar nova jornada enxuta para cliente existente
  const handleCreateLeanJourney = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente.");
      return;
    }

    try {
      setSubmittingNew(true);
      const targetClient = clients.find(c => c.id === selectedClientId);

      const playbookData = {
        isLean: true,
        projectSummary: newJourneySummary,
        status: newJourneyStatus,
        updatedAt: new Date().toISOString()
      };

      const { data: newJourney, error: jError } = await supabase
        .from("journeys")
        .insert([{
          client_id: selectedClientId,
          status: newJourneyStatus,
          playbook_data: playbookData,
          closed_at: newJourneyStatus === "Concluído" ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (jError) throw jError;

      // Atualiza status do cliente
      const leanLog = newJourneySummary ? `[Jornada Enxuta - ${newJourneyStatus}]\n${newJourneySummary}\n------------------------` : "";
      const updatedNotes = leanLog ? (targetClient?.notes ? `${leanLog}\n\n${targetClient.notes}` : leanLog) : targetClient?.notes;

      await supabase
        .from("clientes")
        .update({
          status: newJourneyStatus,
          notes: updatedNotes
        })
        .eq("id", selectedClientId);

      toast.success("Cliente adicionado à Jornada Enxuta com sucesso!");
      setIsAddModalOpen(false);
      setSelectedClientId("");
      setNewJourneySummary("");
      setNewJourneyStatus("Projeto em Andamento");
      await onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar jornada enxuta.");
    } finally {
      setSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Explicativo & Métricas Rápidas */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                <Zap className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-foreground">Jornada Enxuta (Bypass de Playbook)</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Ideal para clientes antigos ou atendimentos do dia a dia onde você só precisa registrar a 
              <strong> história do projeto</strong> e acompanhar o status, sem a burocracia de preencher todas as etapas longas.
            </p>
          </div>

          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            + Adicionar à Jornada Enxuta
          </Button>
        </div>

        {/* Mini Cards de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-amber-500/15">
          <div 
            onClick={() => setTabFilter("andamento")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              tabFilter === "andamento" 
                ? "bg-amber-500/15 border-amber-500/40 shadow-sm" 
                : "bg-card/60 hover:bg-card border-border/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Em Andamento
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {countAndamento}
              </span>
            </div>
            <p className="text-xl font-black mt-1 text-foreground">{countAndamento}</p>
          </div>

          <div 
            onClick={() => setTabFilter("concluido")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              tabFilter === "concluido" 
                ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm" 
                : "bg-card/60 hover:bg-card border-border/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Concluídos
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {countConcluido}
              </span>
            </div>
            <p className="text-xl font-black mt-1 text-foreground">{countConcluido}</p>
          </div>

          <div 
            onClick={() => setTabFilter("todos")}
            className={`col-span-2 sm:col-span-1 p-3 rounded-xl border cursor-pointer transition-all ${
              tabFilter === "todos" 
                ? "bg-primary/15 border-primary/40 shadow-sm" 
                : "bg-card/60 hover:bg-card border-border/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Total Enxuto
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {leanItems.length}
              </span>
            </div>
            <p className="text-xl font-black mt-1 text-foreground">{leanItems.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, telefone ou descrição do projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-accent/20 h-11"
          />
        </div>

        {/* Seletor de Abas Interno */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setTabFilter("andamento")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tabFilter === "andamento"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Em Andamento ({countAndamento})
          </button>
          <button
            onClick={() => setTabFilter("concluido")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tabFilter === "concluido"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Concluídos ({countConcluido})
          </button>
          <button
            onClick={() => setTabFilter("todos")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tabFilter === "todos"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({leanItems.length})
          </button>
        </div>
      </div>

      {/* Grid de Cards de Clientes Enxutos */}
      {filteredItems.length === 0 ? (
        <div className="bg-card rounded-2xl border p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">
            {leanItems.length === 0 
              ? "Nenhum cliente na Jornada Enxuta ainda" 
              : "Nenhum projeto encontrado para esta busca"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {leanItems.length === 0
              ? "Cadastre clientes antigos ou projetos em execução para acompanhar o status e o histórico sem precisar responder às perguntas do playbook."
              : "Tente mudar os filtros de busca ou alternar entre 'Em Andamento' e 'Concluídos'."}
          </p>
          {leanItems.length === 0 && (
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-primary-foreground font-bold mt-2"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar Primeiro Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const rawPhone = (item.client.phone || "").replace(/\D/g, "");
            return (
              <div 
                key={item.journey.id}
                className="bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
              >
                {/* Cabeçalho do Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-base">
                        {item.client.avatar_url ? (
                          <img src={item.client.avatar_url} alt={item.client.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          item.client.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-foreground truncate">{item.client.name}</h3>
                          {item.client.is_student && <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" title="Aluno" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.client.phone}</p>
                      </div>
                    </div>

                    {/* Badge de Status */}
                    <div className="shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                        item.isCompleted 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}>
                        {item.isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.isCompleted ? "Concluído" : "Em Andamento"}
                      </span>
                    </div>
                  </div>

                  {/* Caixa da Historinha / Resumo do Projeto */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-500" />
                        Histórico / Contexto do Projeto
                      </span>
                      <button
                        onClick={() => {
                          setEditingItem({ journey: item.journey, client: item.client });
                          setEditSummary(item.summary);
                        }}
                        className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <Pencil className="w-2.5 h-2.5" /> Editar
                      </button>
                    </div>

                    {item.summary ? (
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {item.summary}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma historinha ou resumo anotado. Clique em "Editar" para contextualizar este projeto.
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card com Ações */}
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {rawPhone && (
                      <a
                        href={`https://wa.me/55${rawPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => onOpenClientProfile(item.client)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Perfil</span>
                    </button>
                  </div>

                  {/* Botão de Alternar Status */}
                  <Button
                    size="sm"
                    variant={item.isCompleted ? "outline" : "default"}
                    onClick={() => handleToggleStatus(item)}
                    className={`h-8 text-xs font-bold gap-1.5 ${
                      item.isCompleted 
                        ? "border-muted-foreground/30 text-muted-foreground hover:text-foreground" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    }`}
                  >
                    {item.isCompleted ? (
                      <>
                        <RefreshCw className="w-3 h-3" /> Reabrir (Em Andamento)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Marcar Concluído
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Editar a Historinha do Projeto */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="w-4 h-4 text-primary" />
              Editar História do Projeto — {editingItem?.client?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">
              Resumo & Contexto do Projeto (A "Historinha")
            </Label>
            <Textarea
              rows={5}
              placeholder="Descreva como funciona o projeto deste cliente, quais partes já foram feitas e o que ainda falta..."
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className="text-xs leading-relaxed resize-none rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground leading-normal">
              Esse resumo ajuda o assistente e você a lembrarem rapidamente do que se trata sem precisar de um playbook longo.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            <Button 
              onClick={handleSaveEditSummary} 
              disabled={submittingEdit}
              className="bg-primary text-primary-foreground font-bold"
            >
              {submittingEdit ? "Salvando..." : "Salvar Descrição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Cliente à Jornada Enxuta */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-amber-500" />
              Adicionar à Jornada Enxuta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Selecione o Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="h-11 text-xs">
                  <SelectValue placeholder="Escolha um cliente da sua carteira..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone && c.phone !== "Não informado" ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Status do Projeto</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewJourneyStatus("Projeto em Andamento")}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    newJourneyStatus === "Projeto em Andamento"
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold">Em Andamento</span>
                  </div>
                  <span className="text-[10px] opacity-80">Trabalho sendo executado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewJourneyStatus("Concluído")}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    newJourneyStatus === "Concluído"
                      ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Concluído</span>
                  </div>
                  <span className="text-[10px] opacity-80">Trabalho já finalizado</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  História & Resumo do Projeto
                </Label>
                <span className="text-[10px] text-muted-foreground">Opcional</span>
              </div>
              <Textarea
                rows={4}
                placeholder="Ex: Fechamento de perna tradicional. Cliente antigo, faltam apenas os detalhes da panturrilha..."
                value={newJourneySummary}
                onChange={(e) => setNewJourneySummary(e.target.value)}
                className="text-xs leading-relaxed resize-none rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateLeanJourney} 
              disabled={submittingNew || !selectedClientId}
              className="bg-primary text-primary-foreground font-bold shadow-md"
            >
              {submittingNew ? "Adicionando..." : "Confirmar e Ativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
