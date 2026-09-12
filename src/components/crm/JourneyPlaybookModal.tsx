import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlayCircle, MapPin, Ruler, Palette, User, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

interface JourneyPlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any | null;
  onSuccess: () => void;
}

export function JourneyPlaybookModal({ open, onOpenChange, client, onSuccess }: JourneyPlaybookModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Formulário - Etapa 1: Orçamento
  const [tattooLocation, setTattooLocation] = useState("");
  const [tattooSize, setTattooSize] = useState("");
  const [tattooStyle, setTattooStyle] = useState("");
  
  // Decisão com base no Estilo
  const [decision, setDecision] = useState<"executar" | "repassar" | "recusar" | null>(null);
  const [studentName, setStudentName] = useState("");

  if (!client) return null;

  const handleNext = () => {
    if (!tattooLocation || !tattooSize || !tattooStyle) {
      toast.error("Preencha Local, Tamanho e Estilo para continuar.");
      return;
    }
    setStep(2);
  };

  const handleApplyPlaybook = async () => {
    if (!decision) {
      toast.error("Selecione uma decisão final para o Orçamento.");
      return;
    }
    if (decision === "repassar" && !studentName) {
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
        decisionText = `Repassado para Aluno/Parceiro: ${studentName}`;
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
    setStep(1);
    setTattooLocation("");
    setTattooSize("");
    setTattooStyle("");
    setDecision(null);
    setStudentName("");
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

        {step === 1 && (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl mb-4">
              <p className="text-xs font-semibold text-primary">Etapa 1: Orçamento (Triagem)</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Colete as informações básicas da tatuagem para decidir se o projeto segue no estúdio.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Local do Corpo
              </Label>
              <Input
                placeholder="Ex: Antebraço, Costela, etc."
                value={tattooLocation}
                onChange={(e) => setTattooLocation(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" /> Tamanho (Aproximado)
              </Label>
              <Input
                placeholder="Ex: 15cm, Fechamento completo, etc."
                value={tattooSize}
                onChange={(e) => setTattooSize(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" /> Estilo da Tatuagem
              </Label>
              <Select value={tattooStyle} onValueChange={setTattooStyle}>
                <SelectTrigger className="h-9 text-xs">
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

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleNext} className="gap-2 bg-primary text-primary-foreground font-bold">
                Avançar <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2 animate-in slide-in-from-right-4 duration-200">
             <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl mb-4">
              <p className="text-xs font-semibold text-primary">Tomada de Decisão do Orçamento</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Com base no estilo <strong>({tattooStyle})</strong>, qual é o destino deste projeto?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div
                onClick={() => setDecision("executar")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  decision === "executar" ? "border-emerald-500 bg-emerald-500/10 font-bold" : "hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Vou Executar no Estúdio</p>
                    <p className="text-[11px] text-muted-foreground">Estilo dentro do nosso padrão. Avançar para Onboarding.</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setDecision("repassar")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  decision === "repassar" ? "border-amber-500 bg-amber-500/10 font-bold" : "hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Repassar para Aluno/Parceiro</p>
                    <p className="text-[11px] text-muted-foreground">Não fazemos esse estilo. Transferir lead.</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setDecision("recusar")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  decision === "recusar" ? "border-rose-500 bg-rose-500/10 font-bold" : "hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Recusar Trabalho</p>
                    <p className="text-[11px] text-muted-foreground">Encerrar a jornada deste cliente aqui.</p>
                  </div>
                </div>
              </div>
            </div>

            {decision === "repassar" && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-2 mt-2 animate-in fade-in">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <User className="w-3.5 h-3.5" /> Nome do Aluno/Tatuador
                </Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="h-8 text-xs bg-card"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleApplyPlaybook} disabled={submitting || !decision} className="bg-primary text-primary-foreground font-bold">
                {submitting ? "Processando..." : "Confirmar e Mover"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
