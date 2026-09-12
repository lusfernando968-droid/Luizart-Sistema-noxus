import { useState } from "react";
import { ShieldCheck, AlertTriangle, TrendingUp, Info, FileSpreadsheet, Building2, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FiscalShieldCardProps {
  annualRevenue: number;
  meiLimit?: number;
  userRegime: "MEI" | "CPF" | "SIMPLES";
  onOpenTaxReport: () => void;
  onOpenRegimeModal: () => void;
}

export function FiscalShieldCard({
  annualRevenue,
  meiLimit = 81000,
  userRegime = "MEI",
  onOpenTaxReport,
  onOpenRegimeModal,
}: FiscalShieldCardProps) {
  const currentYear = new Date().getFullYear();
  const percentageUsed = Math.min(Math.round((annualRevenue / meiLimit) * 100), 100);

  // Cálculos de Estimativa Fiscal
  // CPF: Tabela progressiva simplificada (aprox 15% a 27.5% sobre o excedente da isenção R$33.888)
  const isentoPessoaFisica = 33888;
  const tributavelCPF = Math.max(0, annualRevenue - isentoPessoaFisica);
  const impostoEstimadoCPF = tributavelCPF * 0.20; // Média estimada com livro caixa
  const impostoEstimadoMEI = 78 * 12; // R$ 78/mês DAS MEI
  const economiaEstimada = Math.max(0, impostoEstimadoCPF - impostoEstimadoMEI);

  // Define cor e status baseado na porcentagem do MEI
  let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  let statusText = "Seguro (Dentro do Teto)";
  let alertMessage = "Seu faturamento está dentro do limite anual do MEI. Você está pagando o menor imposto possível!";

  if (percentageUsed >= 80 && percentageUsed < 100) {
    statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    statusText = "Alerta Amarelo (80% Atingido)";
    alertMessage = `Você já atingiu ${percentageUsed}% do teto anual do MEI (R$ ${annualRevenue.toLocaleString("pt-BR")} de R$ ${meiLimit.toLocaleString("pt-BR")}). Fale com seu contador para planejar a migração para ME no Simples Nacional.`;
  } else if (percentageUsed >= 100) {
    statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    statusText = "Teto Excedido (Migração Necessária)";
    alertMessage = `Seu faturamento acumulado (R$ ${annualRevenue.toLocaleString("pt-BR")}) ultrapassou o teto do MEI! É necessário realizar o desenquadramento para ME (Simples Nacional) para evitar multas retroativas.`;
  }

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base">Blindagem & Inteligência Fiscal</h3>
              <Badge variant="outline" className="text-xs font-semibold">
                {userRegime === "MEI" ? "Regime MEI" : userRegime === "CPF" ? "Pessoa Física (CPF)" : "Simples Nacional"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Monitoramento em tempo real do Imposto de Renda e Teto Fiscal {currentYear}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenRegimeModal} className="h-8 text-xs gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Configurar Regime
          </Button>
          <Button size="sm" onClick={onOpenTaxReport} className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Relatório IRPF / Contador
          </Button>
        </div>
      </div>

      {/* Termômetro do MEI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Barra de Progresso do Teto */}
        <div className="md:col-span-2 space-y-2 bg-accent/30 p-4 rounded-xl border">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              Faturamento Acumulado no Ano ({currentYear})
            </span>
            <span className="font-bold text-foreground">
              R$ {annualRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {meiLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="relative pt-1">
            <Progress value={percentageUsed} className="h-3 rounded-full" />
          </div>

          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
            <span>0% (R$ 0)</span>
            <span className="font-medium text-foreground">{percentageUsed}% do limite utilizado</span>
            <span>100% (R$ {meiLimit.toLocaleString("pt-BR")})</span>
          </div>

          {/* Banner de Status */}
          <div className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2 mt-2 ${statusColor}`}>
            {percentageUsed >= 80 ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">{statusText}</span>
              <span className="text-[11px] leading-relaxed opacity-90">{alertMessage}</span>
            </div>
          </div>
        </div>

        {/* Card de Economia de Impostos */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Economia Estimada no MEI
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Comparação aproximada entre o que você pagaria no CPF via Carnê-Leão (alíquota progressiva) versus a taxa fixa mensal do DAS MEI (R$ 78/mês).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              R$ {economiaEstimada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Economizados no ano em comparação com a Pessoa Física sem MEI.
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-500/10 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <span>DAS MEI Fixos: R$ 78,00/mês</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
