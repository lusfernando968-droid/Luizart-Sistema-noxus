import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, CheckCircle2, Search, XCircle, Share, Send, ArrowRight, ClipboardList, Calendar, Bell, HeartPulse, Brush, List } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlaybookEngineProps {
  journey: any;
  onUpdatePlaybook: (journeyId: string, data: any) => Promise<void>;
  onUpdateStatus: (journeyId: string, status: string) => Promise<void>;
}

export function PlaybookEngine({ journey, onUpdatePlaybook, onUpdateStatus }: PlaybookEngineProps) {
  const data = journey?.playbook_data || {};
  const status = journey?.status;
  const clientPhone = journey?.client?.phone ? journey.client.phone.replace(/\D/g, '') : '';
  const clientName = journey?.client?.name || '';

  const [saving, setSaving] = useState(false);

  // Local state for Orcamento
  const [localLocation, setLocalLocation] = useState(data.location || '');
  const [localSize, setLocalSize] = useState(data.size || '');
  const [localStyle, setLocalStyle] = useState(data.style || '');
  const [isReturning, setIsReturning] = useState(data.isReturning || false);
  const [hasProject, setHasProject] = useState(data.hasProject || false);
  const [isLargeProject, setIsLargeProject] = useState(data.isLargeProject || false);

  const [partner, setPartner] = useState('');

  const saveOrcamento = async () => {
    setSaving(true);
    await onUpdatePlaybook(journey.id, {
      ...data,
      location: localLocation,
      size: localSize,
      style: localStyle,
      isReturning,
      hasProject,
      isLargeProject
    });
    setSaving(false);
  };

  const saveOnboarding = async (field: string, checked: boolean) => {
    setSaving(true);
    await onUpdatePlaybook(journey.id, {
      ...data,
      [field]: checked
    });
    setSaving(false);
  };

  const openWhatsApp = (text: string) => {
    if (!clientPhone) {
      toast.error("Cliente sem telefone cadastrado.");
      return;
    }
    const url = `https://wa.me/55${clientPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!journey) return <div className="p-4 text-center text-muted-foreground">Nenhuma jornada ativa.</div>;

  if (status === 'Orçamento') {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Playbook: Orçamento</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Colete as informações básicas do projeto.</p>

          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Local da Tatuagem</Label>
                <div className="flex gap-2">
                  <Input value={localLocation} onChange={e => setLocalLocation(e.target.value)} placeholder="Ex: Antebraço" className="h-10 text-sm" />
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => openWhatsApp(`Olá ${clientName}, qual seria o local do corpo para essa arte?`)}>
                    <Send className="h-4 w-4 text-foreground/70" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tamanho (cm)</Label>
                <div className="flex gap-2">
                  <Input value={localSize} onChange={e => setLocalSize(e.target.value)} placeholder="Ex: 15cm" className="h-10 text-sm" />
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => openWhatsApp(`Qual seria o tamanho aproximado em cm?`)}>
                    <Send className="h-4 w-4 text-foreground/70" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Estilo / Referência</Label>
                <div className="flex gap-2">
                  <Input value={localStyle} onChange={e => setLocalStyle(e.target.value)} placeholder="Ex: Realismo" className="h-10 text-sm" />
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => openWhatsApp(`Você tem alguma imagem de referência ou estilo em mente?`)}>
                    <Send className="h-4 w-4 text-foreground/70" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 py-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="isReturning" checked={isReturning} onCheckedChange={(c) => setIsReturning(!!c)} />
                <Label htmlFor="isReturning" className="text-sm cursor-pointer">Já é cliente?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="hasProject" checked={hasProject} onCheckedChange={(c) => setHasProject(!!c)} />
                <Label htmlFor="hasProject" className="text-sm cursor-pointer">Já tem projeto rodando?</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2 py-2 px-3 mt-2 bg-primary/10 rounded-lg border border-primary/20">
              <Checkbox id="isLargeProject" checked={isLargeProject} onCheckedChange={(c) => setIsLargeProject(!!c)} />
              <Label htmlFor="isLargeProject" className="text-sm font-bold text-primary cursor-pointer">Fechamento / Múltiplas Sessões?</Label>
            </div>

            <Button onClick={saveOrcamento} disabled={saving} className="w-full h-11">
              Salvar Respostas
            </Button>
          </div>
        </div>

        <div className="border border-border/50 rounded-xl p-4 bg-card shadow-sm space-y-4">
          <h4 className="font-semibold text-sm">Decisão Final: O cliente fechou?</h4>
          
          <div className="flex flex-col gap-2">
            <Button onClick={() => onUpdateStatus(journey.id, 'Onboarding')} variant="default" className="w-full h-11 justify-between">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Fechou Projeto</span>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </Button>
            
            <Button onClick={() => onUpdateStatus(journey.id, 'Garimpo')} variant="outline" className="w-full h-11 justify-between">
              <span className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /> Adiou / Achou caro</span>
            </Button>

            <Button onClick={() => onUpdateStatus(journey.id, 'Não Aceitou')} variant="outline" className="w-full h-11 justify-between text-muted-foreground">
              <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Não aceitou</span>
            </Button>

            <Button onClick={() => onUpdateStatus(journey.id, 'Sem Resposta')} variant="ghost" className="w-full h-11 justify-between text-muted-foreground">
              <span>Sumiu / Sem Resposta</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border/40 mt-4 space-y-3">
            <Label className="text-xs text-muted-foreground">Repassar para Aluno/Parceiro</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={partner} onValueChange={setPartner}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nicole">Nicole</SelectItem>
                  <SelectItem value="Lucas">Lucas</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  if(!partner) return toast.error("Selecione um parceiro");
                  onUpdateStatus(journey.id, 'Repassado');
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Oi ${partner}! Acabei de te indicar para um cliente meu (${clientName}). O estilo é ${localStyle || '...'}. Ele deve te chamar!`)}`, '_blank');
                }} 
                variant="secondary" 
                className="w-full h-11"
              >
                <Share className="h-4 w-4 mr-2" /> Repassar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Onboarding') {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Playbook: Onboarding</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Checklist obrigatório antes da sessão.</p>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-start space-x-3">
                <Checkbox id="obForm" checked={data.obForm || false} onCheckedChange={(c) => saveOnboarding('obForm', !!c)} className="mt-1" />
                <Label htmlFor="obForm" className="flex-1 cursor-pointer text-sm leading-snug">Ficha de Anamnese preenchida e assinada?</Label>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-9" onClick={() => {
                const link = `${window.location.origin}/anamnese/${journey.client_id}`;
                openWhatsApp(`Olá ${clientName}! Por favor, preencha nossa ficha de anamnese obrigatória antes da sua sessão acessando este link:\n\n${link}`);
              }}>
                <Send className="h-3 w-3 mr-2 text-foreground/70" /> Enviar Ficha
              </Button>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <Checkbox id="obPix" checked={data.obPix || false} onCheckedChange={(c) => saveOnboarding('obPix', !!c)} className="mt-1" />
              <Label htmlFor="obPix" className="flex-1 cursor-pointer text-sm leading-snug">Sinal Financeiro (PIX) recebido?</Label>
            </div>

            <div className="pt-5 mt-2">
              <Button 
                onClick={() => onUpdateStatus(journey.id, 'Sessão Agendada')} 
                className="w-full h-11"
                disabled={!data.obForm || !data.obPix}
              >
                Mover para "Sessão Agendada"
              </Button>
              {(!data.obForm || !data.obPix) && (
                <p className="text-[11px] text-center text-muted-foreground mt-3">Conclua o checklist acima para avançar.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Sessão Agendada') {
    const appointments = journey.client?.appointments || [];
    const upcoming = appointments
      .filter((a: any) => new Date(a.date) > new Date())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const aptDate = upcoming ? new Date(upcoming.date) : null;
    let daysLeft = null;
    if (aptDate) {
      const diffTime = Math.abs(aptDate.getTime() - new Date().getTime());
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }

    return (
      <div className="space-y-6">
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Playbook: Sessão Agendada</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Preparação e lembretes para a tatuagem.</p>

          {upcoming ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Próxima Sessão</p>
                <p className="text-sm font-bold">{aptDate?.toLocaleDateString('pt-BR')} às {aptDate?.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                  Faltam {daysLeft} dia(s)
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 border border-border/50 rounded-lg p-3 mb-4 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma sessão futura encontrada na agenda para este cliente.</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border border-border/50">
              <Label className="text-sm font-semibold">Lembrete: 1 Semana Antes</Label>
              <p className="text-xs text-muted-foreground mb-2">Confirme a presença e reforce a data.</p>
              <Button variant="outline" size="sm" className="w-full h-9" onClick={() => openWhatsApp(`Olá ${clientName}! Passando para lembrar que nossa sessão de tatuagem está chegando na próxima semana! Tudo certo?`)}>
                <Bell className="h-3 w-3 mr-2 text-foreground/70" /> Lembrete (1 Semana)
              </Button>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-start space-x-3 mb-1">
                <Checkbox id="obTips" checked={data.obTips || false} onCheckedChange={(c) => saveOnboarding('obTips', !!c)} className="mt-1" />
                <Label htmlFor="obTips" className="flex-1 cursor-pointer text-sm font-semibold leading-snug">Lembrete: 1 Dia Antes (Dicas)</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-2 ml-7">Envie as orientações finais de preparo.</p>
              <Button variant="outline" size="sm" className="w-full h-9" onClick={() => openWhatsApp(`Olá ${clientName}! Nossa sessão é amanhã! 🥳\n\nAqui estão algumas dicas importantes para você se preparar:\n1. Durma bem hoje\n2. Venha bem alimentado(a)\n3. Traga roupas confortáveis e fáceis de expor o local da tattoo\n\nAté amanhã!`)}>
                <Send className="h-3 w-3 mr-2 text-foreground/70" /> Enviar Dicas (1 Dia)
              </Button>
            </div>

            <div className="pt-5 mt-2">
              <Button 
                onClick={() => onUpdateStatus(journey.id, data.isLargeProject ? 'Projeto em Andamento' : 'Pós-Tatuagem')} 
                className="w-full h-11"
              >
                {data.isLargeProject ? 'Finalizou sessão? Mover p/ Andamento' : 'Mover para "Pós-Tatuagem"'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Projeto em Andamento') {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <List className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Playbook: Projeto em Andamento</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Projeto de múltiplas sessões (Fechamento). Cliente aguardando o próximo agendamento.</p>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm font-semibold text-primary">Agendar Próxima Sessão</Label>
              <p className="text-xs text-muted-foreground mb-2">Já combinou a data da próxima sessão com o cliente?</p>
              
              <Button onClick={() => onUpdateStatus(journey.id, 'Sessão Agendada')} className="w-full h-10" variant="default">
                <Calendar className="h-4 w-4 mr-2" />
                Agendou! Voltar para "Sessão Agendada"
              </Button>
            </div>

            <div className="pt-5 mt-2 border-t border-border/40">
              <p className="text-xs text-center text-muted-foreground mb-3">O fechamento já foi 100% terminado nesta última sessão?</p>
              <Button 
                onClick={() => onUpdateStatus(journey.id, 'Pós-Tatuagem')} 
                className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground border border-border/50"
              >
                Sim, projeto concluído! Ir p/ Pós-Tattoo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Pós-Tatuagem') {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Playbook: Pós-Tatuagem</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Acompanhe a cicatrização e garanta a satisfação.</p>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-start space-x-3 mb-1">
                <Checkbox id="followUp7Days" checked={data.followUp7Days || false} onCheckedChange={(c) => saveOnboarding('followUp7Days', !!c)} className="mt-1" />
                <Label htmlFor="followUp7Days" className="flex-1 cursor-pointer text-sm font-semibold leading-snug">Etapa 1: Acompanhamento (3 a 7 Dias)</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7 mb-1">Pergunte como está a cicatrização e tire dúvidas.</p>
              <Button variant="outline" size="sm" className="w-full h-9" onClick={() => openWhatsApp(`Fala ${clientName}, tudo bem? Passando pra saber como tá sendo a cicatrização da nossa tattoo nesses primeiros dias! Sentindo alguma dúvida?`)}>
                <Send className="h-3 w-3 mr-2 text-foreground/70" /> Enviar Mensagem (3-7 dias)
              </Button>
            </div>

            <div className="flex flex-col gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-start space-x-3 mb-1">
                <Checkbox id="followUp30Days" checked={data.followUp30Days || false} onCheckedChange={(c) => saveOnboarding('followUp30Days', !!c)} className="mt-1" />
                <Label htmlFor="followUp30Days" className="flex-1 cursor-pointer text-sm font-semibold leading-snug">Etapa 2: Conclusão (15 a 30 Dias)</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7 mb-1">Peça uma foto curada e uma avaliação no Google/Insta.</p>
              <Button variant="outline" size="sm" className="w-full h-9" onClick={() => openWhatsApp(`E aí ${clientName}, beleza? A tattoo já deve estar 100% cicatrizada agora! Consegue me mandar uma foto dela curada em um lugar com boa luz? 🤩\n\nAh, e se curtiu o trabalho, deixa uma avaliação pra mim, ajuda muito! [LINK_AQUI]`)}>
                <Send className="h-3 w-3 mr-2 text-foreground/70" /> Pedir Foto + Avaliação
              </Button>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg border border-border/50 mt-2">
              <Checkbox id="needsTouchUp" checked={data.needsTouchUp || false} onCheckedChange={(c) => saveOnboarding('needsTouchUp', !!c)} className="mt-1" />
              <Label htmlFor="needsTouchUp" className="flex-1 cursor-pointer text-sm leading-snug font-semibold text-amber-600">
                Cliente vai precisar de retoque?
              </Label>
            </div>

            <div className="pt-5 mt-2 border-t border-border/40">
              <Button 
                onClick={() => onUpdateStatus(journey.id, 'Concluído')} 
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!data.followUp7Days || !data.followUp30Days}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Projeto (Concluído)
              </Button>
              {(!data.followUp7Days || !data.followUp30Days) && (
                <p className="text-[11px] text-center text-muted-foreground mt-3">Conclua as etapas de acompanhamento acima para finalizar.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Concluído') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border/60 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <CheckCircle2 className="w-32 h-32" />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-foreground text-lg tracking-tight">Dossiê do Projeto</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Resumo visual da jornada finalizada.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Especificações da Arte */}
            <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Brush className="w-4 h-4 text-primary/70" />
                <h4 className="text-sm font-semibold">Especificações da Arte</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Local do Corpo</span>
                  <span className="text-sm font-medium">{data.location || 'Não especificado'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tamanho</span>
                  <span className="text-sm font-medium">{data.size || 'Não especificado'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Estilo / Referência</span>
                  <span className="text-sm font-medium">{data.style || 'Não especificado'}</span>
                </div>
              </div>
            </div>

            {/* Checklists do Processo */}
            <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-primary/70" />
                <h4 className="text-sm font-semibold">Checklist do Processo</h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Sinal Financeiro (PIX)</span>
                  {data.obPix ? <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> OK</span> : <span className="text-muted-foreground/50 text-xs">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ficha de Anamnese</span>
                  {data.obForm ? <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> OK</span> : <span className="text-muted-foreground/50 text-xs">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pós-Tattoo (7 a 30 dias)</span>
                  {(data.followUp7Days && data.followUp30Days) ? <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> OK</span> : <span className="text-muted-foreground/50 text-xs">Pendente</span>}
                </div>
                
                <div className="pt-2 mt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Retoque Futuro?</span>
                    {data.needsTouchUp ? (
                      <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded">Sim, pendente</span>
                    ) : (
                      <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded">Não necessita</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-4 border-t border-border/40 text-center">
             <p className="text-[11px] text-muted-foreground italic">
               Projeto tatuado e finalizado. Este histórico permanecerá salvo na ficha do cliente.
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-dashed rounded-xl text-center bg-muted/20">
      <p className="text-sm font-semibold mb-1">Status: {status}</p>
      <p className="text-xs text-muted-foreground">Sem ações no Playbook para este status.</p>
    </div>
  );
}
