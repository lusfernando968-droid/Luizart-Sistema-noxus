import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { List, ClipboardList, Activity, Info, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface JourneyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journey: any;
  client: any;
  anamnesis: any;
}

export function JourneyDetailsModal({ open, onOpenChange, journey, client, anamnesis }: JourneyDetailsModalProps) {
  if (!journey || !client) return null;

  const playbookData = journey.playbook_data || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              Detalhes do Projeto
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Voltar</Button>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${journey.status === 'Concluído' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {journey.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Iniciado em {new Date(journey.created_at).toLocaleDateString()}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            
            {/* Informações da Jornada */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Dados do Projeto
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Tipo de Projeto</p>
                  <p className="text-sm font-medium text-foreground">
                    {playbookData.projectType === 'unica' ? 'Sessão Única' : playbookData.projectType === 'multipla' ? 'Múltiplas Sessões' : 'Não definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Horas Estimadas</p>
                  <p className="text-sm font-medium text-foreground">
                    {playbookData.estimatedHours ? `${playbookData.estimatedHours}h` : 'Não definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Sessões</p>
                  <p className="text-sm font-medium text-foreground">
                    {playbookData.sessionCount || 'Não definido'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha de Anamnese */}
            <div className="space-y-3 pb-6">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Ficha de Anamnese
              </h4>
              
              {!anamnesis ? (
                <div className="bg-muted/10 border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Anamnese não preenchida</p>
                  <p className="text-xs">O cliente ainda não enviou a ficha.</p>
                </div>
              ) : (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-primary/5 border-b">
                    <p className="text-xs text-primary font-bold flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      Histórico Médico e Saúde
                    </p>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Data de Nascimento</p>
                      <p className="text-sm font-medium text-foreground">{anamnesis.birth_date || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Contato de Emergência</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {anamnesis.emergency_contact || 'Não informado'}
                      </p>
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 pt-2 border-t">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Condições Médicas</p>
                      <div className="flex flex-wrap gap-2">
                        {anamnesis.medical_history?.diabetes && <span className="text-[11px] px-2 py-1 bg-red-500/10 text-red-600 rounded-md font-medium border border-red-500/20">Diabetes</span>}
                        {anamnesis.medical_history?.hepatitis && <span className="text-[11px] px-2 py-1 bg-red-500/10 text-red-600 rounded-md font-medium border border-red-500/20">Hepatite</span>}
                        {anamnesis.medical_history?.pregnancy && <span className="text-[11px] px-2 py-1 bg-purple-500/10 text-purple-600 rounded-md font-medium border border-purple-500/20">Gravidez/Lactação</span>}
                        {anamnesis.medical_history?.bleeding_disorders && <span className="text-[11px] px-2 py-1 bg-orange-500/10 text-orange-600 rounded-md font-medium border border-orange-500/20">Dist. Hemorrágicos</span>}
                        {anamnesis.medical_history?.keloids && <span className="text-[11px] px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-md font-medium border border-yellow-500/20">Propensão a Queloide</span>}
                        
                        {!anamnesis.medical_history?.diabetes && !anamnesis.medical_history?.hepatitis && !anamnesis.medical_history?.pregnancy && !anamnesis.medical_history?.bleeding_disorders && !anamnesis.medical_history?.keloids && (
                          <span className="text-[11px] px-2 py-1 bg-green-500/10 text-green-600 rounded-md font-medium border border-green-500/20">Nenhuma condição reportada</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Alergias</p>
                      <p className="text-sm font-medium text-foreground p-2 bg-muted/30 rounded-lg">{anamnesis.allergies || 'Nenhuma alergia informada'}</p>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Medicamentos em Uso</p>
                      <p className="text-sm font-medium text-foreground p-2 bg-muted/30 rounded-lg">{anamnesis.medications || 'Nenhum medicamento informado'}</p>
                    </div>

                    {anamnesis.has_contract_signed && (
                      <div className="col-span-1 sm:col-span-2 mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Termo de Responsabilidade Assinado
                        </p>
                        <p className="text-[10px] text-emerald-600/80 mt-1">
                          Assinado em {new Date(anamnesis.signed_at).toLocaleString()} (IP: {anamnesis.client_ip})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
