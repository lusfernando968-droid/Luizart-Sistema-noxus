import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Phone, Wallet, Briefcase, CalendarCheck, CheckSquare, MessageSquare, AlertCircle, HeartPulse, Send, CheckCircle2 } from 'lucide-react';

export default function PlaybookAccordion() {
  return (
    <div className="bg-card rounded-2xl border p-4 lg:p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Playbook de Atendimento
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Guia completo com pastas e roteiros para cada etapa do atendimento.</p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* PASTA 1: OR�AMENTO E NEGOCIA��O */}
        <AccordionItem value="item-1" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <span className="font-bold text-base">1. Primeiro Contato & Or�amento</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> O cliente sabe exatamente o que quer? (SIM)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Elogie a ideia e confirme o local do corpo.</li>
                  <li>Pergunte o tamanho aproximado em cent�metros.</li>
                  <li>Envie o or�amento base e explique o que est� incluso (qualidade do material, biosseguran�a, retoque se necess�rio).</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> O cliente est� confuso ou n�o sabe? (N�O)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>N�o passe pre�o direto! Primeiro fa�a perguntas para entender o estilo que ele gosta.</li>
                  <li>Envie um painel de refer�ncias (fotos do Instagram do Luiz).</li>
                  <li>Ofere�a ajuda para criar um projeto exclusivo (Gatilho de Exclusividade).</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" /> Obje��o de Pre�o (Achou caro)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>O que fazer:</strong> Nunca pe�a desculpas pelo pre�o.</li>
                  <li>Ressalte que tatuagem � para a vida toda e o barato sai caro.</li>
                  <li>Ofere�a facilitar o pagamento (Parcelamento no cart�o).</li>
                  <li>Se ainda assim n�o fechar, agrade�a e deixe as portas abertas.</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Send className="h-4 w-4 text-slate-500" /> Follow-up (Cliente parou de responder)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>24 horas:</strong> "Oi! Conseguiu pensar no or�amento que te passei?"</li>
                  <li><strong>72 horas:</strong> "Oi! A agenda desse m�s est� fechando, quer garantir a sua vaga?"</li>
                  <li>Se n�o responder mais, altere o status para <strong>Perdido</strong> no Funil.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PASTA 2: FECHAMENTO E ONBOARDING */}
        <AccordionItem value="item-2" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-amber-500" />
              </div>
              <span className="font-bold text-base">2. Fechamento & Onboarding</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Recebimento do Sinal
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>A data <strong>s� � reservada</strong> ap�s o pagamento do sinal (geralmente PIX).</li>
                  <li>Ao receber, mande o comprovante para a pasta financeira e celebre com o cliente.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Ficha e Agendamento
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Agende a sess�o no sistema Noxus.</li>
                  <li>Envie o Link da <strong>Ficha de Anamnese</strong> no WhatsApp e pe�a para preencher.</li>
                  <li>Acompanhe se a ficha foi preenchida antes da sess�o.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PASTA 3: DIA DA SESS�O */}
        <AccordionItem value="item-3" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <HeartPulse className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-base">3. Dia da Sess�o</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Decalque e Confirma��o
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Revise a Ficha de Anamnese com o cliente para ter certeza que n�o h� alergias ou problemas.</li>
                  <li>Aplique o decalque e <strong>pe�a a confirma��o do cliente olhando no espelho</strong> antes de come�ar.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Produ��o de Conte�do
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Grave v�deos "Before/After" (Antes do decalque e depois de pronta).</li>
                  <li>Tire boas fotos do resultado final com ilumina��o (Softbox).</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PASTA 4: P�S E FEEDBACK */}
        <AccordionItem value="item-4" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
              </div>
              <span className="font-bold text-base">4. P�s-venda e Fideliza��o</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Acompanhamento de Cicatriza��o
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>24 horas:</strong> Mande mensagem perguntando: "Tudo bem por a�? Conseguiu limpar direitinho?"</li>
                  <li><strong>15 dias:</strong> Pe�a uma foto de como a tatuagem cicatrizou. Analise se precisa de retoque.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Feedback e Pr�ximos Passos
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Envie o link do Google Meu Neg�cio e pe�a uma avalia��o 5 estrelas.</li>
                  <li>Ofere�a um b�nus/desconto para a pr�xima tatuagem se ele trouxer uma indica��o.</li>
                  <li>No CRM, mova para <strong>Conclu�do</strong>.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
