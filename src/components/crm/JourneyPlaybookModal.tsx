import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlayCircle, MapPin, Ruler, Palette, User, ArrowRight, CheckCircle2, XCircle, Clock, CalendarClock, MessageCircle, Copy, Link as LinkIcon, Send } from "lucide-react";

interface JourneyPlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any | null;
  onSuccess: () => void;
}

export function JourneyPlaybookModal({ open, onOpenChange, client, onSuccess }: JourneyPlaybookModalProps) {
  const [submitting, setSubmitting] = useState(false);
  // Formulário - Etapa 1: Orçamento
  const [tattooLocation, setTattooLocation] = useState("");
  const [tattooSize, setTattooSize] = useState("");
  const [tattooStyle, setTattooStyle] = useState("");
  
  // Decisão com base no Estilo
  const [decision, setDecision] = useState<"executar" | "repassar" | "recusar" | null>(null);
  const [studentName, setStudentName] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");

  const [estimatedHours, setEstimatedHours] = useState("");
  const [sessionCount, setSessionCount] = useState("");

  if (!client) return null;
  
  const handleSendWhatsApp = (textToCopy: string) => {
    if (!client.phone) {
      toast.error("Cliente não tem número de WhatsApp cadastrado.");
      return;
    }
    const phone = client.phone.replace(/\D/g, "");
    const prefix = phone.length <= 11 ? "55" : "";
    const url = `https://wa.me/${prefix}${phone}?text=${encodeURIComponent(textToCopy)}`;
    window.open(url, "_blank");
  };

  const handleApplyPlaybook = async () => {
    
    if (client.status === "Onboarding") {
      const playbookLog = `[Playbook CRM - Onboarding]\nHoras Estimadas: ${estimatedHours || "Não definido"}h\nSessões: ${sessionCount || "Não definido"}\nMétodo de Trabalho Enviado.\nFicha de Anamnese Enviada.\nData: ${new Date().toLocaleDateString()}\n------------------------`;
      
      const updatedNotes = client.notes ? `${playbookLog}\n\n${client.notes}` : playbookLog;
      const { error } = await supabase
        .from("clientes")
        .update({ status: "Sessão Agendada", notes: updatedNotes })
        .eq("id", client.id);

      if (error) {
        console.error(error);
        toast.error("Erro ao aplicar playbook.");
      } else {
        toast.success("Onboarding concluído!");
        onSuccess();
        onOpenChange(false);
      }
      setSubmitting(false);
      return;
    }

      if (!decision) {
      toast.error("Selecione uma decisão final para o Orçamento.");
      return;
    }
    if (decision === "repassar" && !studentName) {
      toast.error("Informe o nome do aluno/tatuador parceiro.");
      return;
    }
    if (decision === "repassar" && studentName === "Outro Parceiro/Aluno (Digitar)" && !customStudentName) {
      toast.error("Informe o nome do aluno/tatuador parceiro.");
      return;
    }

    try {
      setSubmitting(true);

      let targetStatus = client.status;
      let decisionText = "";

      if (decision === "executar") {
        targetStatus = "Onboarding";
        decisionText = "Estúdio vai executar o projeto.";
      } else if (decision === "repassar") {
        targetStatus = "Concluído";
        decisionText = `Repassado para Aluno/Parceiro: ${studentName === "Outro Parceiro/Aluno (Digitar)" ? customStudentName : studentName}`;
      } else if (decision === "recusar") {
        targetStatus = "Concluído";
        decisionText = "Trabalho Recusado.";
      }

      const playbookLog = `[Playbook CRM - Orçamento]\nLocal: ${tattooLocation}\nTamanho: ${tattooSize}\nEstilo: ${tattooStyle}\nDecisão: ${decisionText}\nData: ${new Date().toLocaleDateString()}\n------------------------`;

      const updatedNotes = client.notes ? `${playbookLog}\n\n${client.notes}` : playbookLog;

      // 1. Atualizar o cliente
      const { error: clientError } = await supabase
        .from("clientes")
        .update({
          status: targetStatus,
          notes: updatedNotes,
        })
        .eq("id", client.id);

      if (clientError) throw clientError;

      // 2. Atualizar a jornada do cliente
      const { error: journeyError } = await supabase
        .from("journeys")
        .update({ status: targetStatus })
        .eq("client_id", client.id);

      if (journeyError) console.log("Aviso ao atualizar jornada:", journeyError);

      toast.success(`Etapa concluída! Cliente movido para ${targetStatus}.`);
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar playbook.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
        setTattooLocation("");
    setTattooSize("");
    setTattooStyle("");
    setDecision(null);
    setStudentName("");
    setCustomStudentName("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetState();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <PlayCircle className="w-5 h-5 text-primary" />
            Playbook CRM — {client.name}
          </DialogTitle>
        </DialogHeader>

        
          {client.status === "Orçamento" && (
<div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-muted/30 border-transparent p-3 rounded-xl mb-4">
              <p className="text-sm font-semibold text-foreground">Etapa 1: Orçamento (Triagem)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Colete as informações básicas da tatuagem para decidir se o projeto segue no estúdio.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Local do Corpo
              </Label>
              <Select value={tattooLocation} onValueChange={setTattooLocation}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o local principal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antebraço">Antebraço</SelectItem>
                  <SelectItem value="Braço (Inteiro)">Braço (Inteiro)</SelectItem>
                  <SelectItem value="Braço (Parte Externa/Interna)">Braço (Parte Externa/Interna)</SelectItem>
                  <SelectItem value="Ombro">Ombro</SelectItem>
                  <SelectItem value="Costela">Costela</SelectItem>
                  <SelectItem value="Costas (Inteira)">Costas (Inteira)</SelectItem>
                  <SelectItem value="Costas (Superior/Avulsa)">Costas (Superior/Avulsa)</SelectItem>
                  <SelectItem value="Peito">Peito</SelectItem>
                  <SelectItem value="Barriga">Barriga</SelectItem>
                  <SelectItem value="Perna (Inteira)">Perna (Inteira)</SelectItem>
                  <SelectItem value="Panturrilha">Panturrilha</SelectItem>
                  <SelectItem value="Coxa">Coxa</SelectItem>
                  <SelectItem value="Mão">Mão</SelectItem>
                  <SelectItem value="Pescoço">Pescoço</SelectItem>
                  <SelectItem value="Vários Locais">Vários Locais</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" /> Tamanho (Aproximado)
              </Label>
              <Select value={tattooSize} onValueChange={setTattooSize}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o tamanho..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Micro/Minimalista (Até 5cm)">Micro/Minimalista (Até 5cm)</SelectItem>
                  <SelectItem value="Pequena (5 a 10cm)">Pequena (5 a 10cm)</SelectItem>
                  <SelectItem value="Média (10 a 20cm)">Média (10 a 20cm)</SelectItem>
                  <SelectItem value="Grande (20 a 30cm)">Grande (20 a 30cm)</SelectItem>
                  <SelectItem value="Fechamento Parcial (Ex: Meio Braço)">Fechamento Parcial (Ex: Meio Braço)</SelectItem>
                  <SelectItem value="Fechamento Completo">Fechamento Completo</SelectItem>
                  <SelectItem value="Projeto Especial/Múltiplos">Projeto Especial/Múltiplos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" /> Estilo da Tatuagem
              </Label>
              <Select value={tattooStyle} onValueChange={setTattooStyle}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o estilo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Realismo">Realismo</SelectItem>
                  <SelectItem value="Blackwork">Blackwork</SelectItem>
                  <SelectItem value="Fineline">Fineline</SelectItem>
                  <SelectItem value="Old School / Tradicional">Old School / Tradicional</SelectItem>
                  <SelectItem value="Oriental">Oriental</SelectItem>
                  <SelectItem value="Aquarela">Aquarela</SelectItem>
                  <SelectItem value="Outro (Não é o foco)">Outro Estilo (Especial/Diferente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

<div className="mt-4 pt-4 border-t space-y-4">
          <div className="space-y-4 py-2 animate-in slide-in-from-right-4 duration-200">
             <div className="bg-muted/30 border-transparent p-3 rounded-xl mb-4">
              <p className="text-sm font-semibold text-foreground">Tomada de Decisão do Orçamento</p>
              <p className="text-xs text-muted-foreground mt-1">
                Com base no estilo <strong>({tattooStyle})</strong>, qual é o destino deste projeto?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div
                onClick={() => setDecision("executar")}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                  decision === "executar" ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "bg-card hover:bg-accent/40 border-border"
                }`}
              >
                <div className="text-primary/70"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">Vou Executar no Estúdio</p>
                  <p className="text-xs text-muted-foreground leading-tight">Estilo dentro do nosso padrão.</p>
                </div>
              </div>

              <div
                onClick={() => setDecision("repassar")}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                  decision === "repassar" ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "bg-card hover:bg-accent/40 border-border"
                }`}
              >
                <div className="text-primary/70"><User className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">Repassar para Aluno/Parceiro</p>
                  <p className="text-xs text-muted-foreground leading-tight">Não é nosso foco. Transferir lead.</p>
                </div>
              </div>

              <div
                onClick={() => setDecision("recusar")}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                  decision === "recusar" ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "bg-card hover:bg-accent/40 border-border"
                }`}
              >
                <div className="text-primary/70"><XCircle className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">Recusar Trabalho</p>
                  <p className="text-xs text-muted-foreground leading-tight">Encerrar a jornada deste cliente aqui.</p>
                </div>
              </div>
            </div>

            {decision === "repassar" && (
              <div className="bg-card border border-border p-3 rounded-lg space-y-3 mt-2 shadow-sm animate-in fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    👤 Indicar para qual Parceiro/Aluno?
                  </Label>
                  <Select value={studentName} onValueChange={setStudentName}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Selecione o tatuador parceiro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: No futuro, puxar essa lista do banco de dados (Tabela Parceiros) */}
                      <SelectItem value="Carlos Eduardo (Realismo)">Carlos Eduardo (Realismo)</SelectItem>
                      <SelectItem value="Ana Beatriz (Fineline)">Ana Beatriz (Fineline)</SelectItem>
                      <SelectItem value="Rafael Souza (Old School)">Rafael Souza (Old School)</SelectItem>
                      <SelectItem value="Juliana Costa (Aquarela)">Juliana Costa (Aquarela)</SelectItem>
                      <SelectItem value="Outro Parceiro/Aluno (Digitar)">Outro Parceiro/Aluno (Digitar...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {studentName === "Outro Parceiro/Aluno (Digitar)" && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <Label className="text-xs font-semibold text-foreground">Nome do Novo Parceiro</Label>
                    <Input
                      placeholder="Digite o nome do parceiro..."
                      className="h-10 text-sm bg-background"
                      value={customStudentName}
                      onChange={(e) => setCustomStudentName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleApplyPlaybook} disabled={submitting || !decision} className="bg-primary text-primary-foreground font-bold">
                {submitting ? "Processando..." : "Confirmar e Mover"}
              </Button>
            </DialogFooter>
          </div>
          </div>
          </div>
        )}

      {/* ONBOARDING RENDER */}
      {client.status === "Onboarding" && (
        <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-muted/30 border-transparent p-3 rounded-xl mb-4">
            <p className="text-sm font-semibold text-foreground">Etapa 2: Onboarding</p>
            <p className="text-xs text-muted-foreground mt-1">
              Apresente o método de trabalho, alinhe as sessões e envie a ficha de anamnese.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Horas Estimadas
              </Label>
              <Input
                type="number"
                placeholder="Ex: 10"
                value={estimatedHours}
                onChange={(e) => {
                  const val = e.target.value;
                  setEstimatedHours(val);
                  if (val && !isNaN(Number(val))) {
                    const hours = parseFloat(val);
                    const calculatedSessions = Math.ceil(hours / 2.5);
                    setSessionCount(calculatedSessions.toString());
                  } else {
                    setSessionCount("");
                  }
                }}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" /> Qtd. de Sessões
              </Label>
              <Input
                type="number"
                placeholder="Ex: 2"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-3">
            <p className="text-sm font-semibold text-foreground">Mensagens Prontas (WhatsApp)</p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between h-auto p-3 bg-card hover:bg-accent/40 border-border text-left"
                onClick={() => handleSendWhatsApp(`Olá! Que legal que vamos fazer esse projeto juntos.\n\nNosso método de trabalho funciona por sessões focadas para garantir o melhor resultado na sua pele e uma boa cicatrização.\nCada sessão tem um tempo de duração e precisamos respeitar os intervalos.`)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> 1. Método de Trabalho</span>
                  <span className="text-xs text-muted-foreground font-normal whitespace-normal line-clamp-1">Explicação básica sobre sessões e intervalos...</span>
                </div>
                <Send className="w-4 h-4 text-primary shrink-0" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-auto p-3 bg-card hover:bg-accent/40 border-border text-left"
                onClick={() => handleSendWhatsApp(estimatedHours && sessionCount ? `Para o seu projeto, estimo aproximadamente ${estimatedHours} horas de trabalho no total.\n\nPodemos dividir isso em ${sessionCount} sessões. O intervalo ideal entre elas é de 15 dias para a pele respirar.\nVamos agendar a primeira?` : `Para o seu projeto, vamos alinhando a quantidade de sessões e horas de trabalho com calma.\n\nO intervalo ideal entre sessões é de 15 dias para a pele respirar.\nVamos agendar a primeira?`)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> 2. Tempo e Sessões</span>
                  <span className="text-xs text-muted-foreground font-normal whitespace-normal line-clamp-1">Estimativa de horas e divisão (usa os dados acima)...</span>
                </div>
                <Send className="w-4 h-4 text-primary shrink-0" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-auto p-3 bg-card hover:bg-accent/40 border-border text-left"
                onClick={() => {
                  const link = `${window.location.origin}/anamnese/${client.id}`;
                  handleSendWhatsApp(`Antes da nossa sessão, preciso que você preencha rapidinho essa ficha de anamnese. É super importante para a segurança do procedimento:\n\n${link}`);
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary" /> 3. Ficha de Anamnese</span>
                  <span className="text-xs text-muted-foreground font-normal whitespace-normal line-clamp-1">Link para cadastro de saúde do cliente...</span>
                </div>
                <Send className="w-4 h-4 text-primary shrink-0" />
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleApplyPlaybook} disabled={submitting} className="bg-primary text-primary-foreground font-bold">
              {submitting ? "Processando..." : "Concluir Onboarding"}
            </Button>
          </DialogFooter>
        </div>
      )}

      </DialogContent>
    </Dialog>
  );
}










