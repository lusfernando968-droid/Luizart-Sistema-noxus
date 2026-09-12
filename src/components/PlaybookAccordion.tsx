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
        {/* PASTA 1: ORÇAMENTO E NEGOCIAÇÃO */}
        <AccordionItem value="item-1" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <span className="font-bold text-base">1. Primeiro Contato & Orçamento</span>
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
                  <li>Pergunte o tamanho aproximado em centímetros.</li>
                  <li>Envie o orçamento base e explique o que está incluso (qualidade do material, biossegurança, retoque se necessário).</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> O cliente está confuso ou não sabe? (NÃO)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Não passe preço direto! Primeiro faça perguntas para entender o estilo que ele gosta.</li>
                  <li>Envie um painel de referências (fotos do Instagram do Luiz).</li>
                  <li>Ofereça ajuda para criar um projeto exclusivo (Gatilho de Exclusividade).</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-500" /> Objeção de Preço (Achou caro)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>O que fazer:</strong> Nunca peça desculpas pelo preço.</li>
                  <li>Ressalte que tatuagem é para a vida toda e o barato sai caro.</li>
                  <li>Ofereça facilitar o pagamento (Parcelamento no cartão).</li>
                  <li>Se ainda assim não fechar, agradeça e deixe as portas abertas.</li>
                </ul>
              </div>

              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Send className="h-4 w-4 text-slate-500" /> Follow-up (Cliente parou de responder)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>24 horas:</strong> "Oi! Conseguiu pensar no orçamento que te passei?"</li>
                  <li><strong>72 horas:</strong> "Oi! A agenda desse mês está fechando, quer garantir a sua vaga?"</li>
                  <li>Se não responder mais, altere o status para <strong>Perdido</strong> no Funil.</li>
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
                  <li>A data <strong>só é reservada</strong> após o pagamento do sinal (geralmente PIX).</li>
                  <li>Ao receber, mande o comprovante para a pasta financeira e celebre com o cliente.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Ficha e Agendamento
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Agende a sessão no sistema Noxus.</li>
                  <li>Envie o Link da <strong>Ficha de Anamnese</strong> no WhatsApp e peça para preencher.</li>
                  <li>Acompanhe se a ficha foi preenchida antes da sessão.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PASTA 3: DIA DA SESSÃO */}
        <AccordionItem value="item-3" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <HeartPulse className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="font-bold text-base">3. Dia da Sessão</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Decalque e Confirmação
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Revise a Ficha de Anamnese com o cliente para ter certeza que não há alergias ou problemas.</li>
                  <li>Aplique o decalque e <strong>peça a confirmação do cliente olhando no espelho</strong> antes de começar.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Produção de Conteúdo
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Grave vídeos "Before/After" (Antes do decalque e depois de pronta).</li>
                  <li>Tire boas fotos do resultado final com iluminação (Softbox).</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PASTA 4: PÓS E FEEDBACK */}
        <AccordionItem value="item-4" className="border rounded-xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
              </div>
              <span className="font-bold text-base">4. Pós-venda e Fidelização</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-5">
            <div className="space-y-4 pl-12 pr-4">
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Acompanhamento de Cicatrização
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li><strong>24 horas:</strong> Mande mensagem perguntando: "Tudo bem por aí? Conseguiu limpar direitinho?"</li>
                  <li><strong>15 dias:</strong> Peça uma foto de como a tatuagem cicatrizou. Analise se precisa de retoque.</li>
                </ul>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Feedback e Próximos Passos
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>Envie o link do Google Meu Negócio e peça uma avaliação 5 estrelas.</li>
                  <li>Ofereça um bônus/desconto para a próxima tatuagem se ele trouxer uma indicação.</li>
                  <li>No CRM, mova para <strong>Concluído</strong>.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
