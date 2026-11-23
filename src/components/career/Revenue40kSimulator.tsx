import { useMemo, useState } from "react";
import { Calculator, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface SimValues {
  tattooRevenue: number;
  tattooCostPct: number;
  saasSubscribers: number;
  saasPrice: number;
  courseBuyersMonth: number;
  courseAvgTicket: number;
  mentorshipClients: number;
  mentorshipPrice: number;
  studioCommissionAndExtras: number;
  marketingBudget: number;
}

const PRESET_A: SimValues = {
  tattooRevenue: 20000,
  tattooCostPct: 22,
  saasSubscribers: 50,
  saasPrice: 100,
  courseBuyersMonth: 50,
  courseAvgTicket: 100,
  mentorshipClients: 15,
  mentorshipPrice: 400,
  studioCommissionAndExtras: 4000,
  marketingBudget: 2500,
};

const PRESET_B: SimValues = {
  tattooRevenue: 10000,
  tattooCostPct: 20,
  saasSubscribers: 80,
  saasPrice: 100,
  courseBuyersMonth: 80,
  courseAvgTicket: 100,
  mentorshipClients: 20,
  mentorshipPrice: 400,
  studioCommissionAndExtras: 7000,
  marketingBudget: 3500,
};

export function Revenue40kSimulator() {
  const [sim, setSim] = useState<SimValues>(PRESET_A);

  const updateNum = (field: keyof SimValues, val: string) => {
    const parsed = Math.max(0, Number(val) || 0);
    setSim((prev) => ({ ...prev, [field]: parsed }));
  };

  const calc = useMemo(() => {
    const saasTotal = sim.saasSubscribers * sim.saasPrice;
    const coursesTotal = sim.courseBuyersMonth * sim.courseAvgTicket;
    const mentorshipTotal = sim.mentorshipClients * sim.mentorshipPrice;
    const grossTotal =
      sim.tattooRevenue +
      saasTotal +
      coursesTotal +
      mentorshipTotal +
      sim.studioCommissionAndExtras;

    const tattooCost = Math.round(
      sim.tattooRevenue * (sim.tattooCostPct / 100)
    );
    const netTotal = grossTotal - tattooCost - sim.marketingBudget;
    const goalPct = Math.min(100, Math.round((grossTotal / 40000) * 100));
    const mentorshipHours = sim.mentorshipClients * 2;

    return {
      saasTotal,
      coursesTotal,
      mentorshipTotal,
      grossTotal,
      tattooCost,
      netTotal,
      goalPct,
      mentorshipHours,
    };
  }, [sim]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSim(PRESET_A)}
            className="h-8 text-xs font-semibold"
          >
            Cenário A · Tatuando R$ 20k
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSim(PRESET_B)}
            className="h-8 text-xs font-semibold"
          >
            Cenário B · Foco em Escala
          </Button>
        </div>

        <Badge
          variant="outline"
          className={
            calc.grossTotal >= 40000
              ? "bg-primary/10 text-primary border-primary/25 text-xs font-bold w-fit"
              : "bg-muted text-muted-foreground border-border text-xs font-semibold w-fit"
          }
        >
          Alvo: R$ 40.000/mês ({calc.goalPct}%)
        </Badge>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-accent p-2">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary">Bruto</span>
          </div>
          <div className="mt-3">
            <p className="text-lg md:text-xl font-bold text-foreground">
              R$ {calc.grossTotal.toLocaleString("pt-BR")}
            </p>
            <Progress value={calc.goalPct} className="h-1.5 mt-2" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-accent p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary">Líquido</span>
          </div>
          <div className="mt-3">
            <p className="text-lg md:text-xl font-bold text-foreground">
              R$ {calc.netTotal.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Custos: R${" "}
              {(calc.tattooCost + sim.marketingBudget).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-accent p-2">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary">Recorrência</span>
          </div>
          <div className="mt-3">
            <p className="text-lg md:text-xl font-bold text-foreground">
              R$ {(calc.saasTotal + calc.mentorshipTotal).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Software + Mentoria
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-accent p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground">Calls</span>
          </div>
          <div className="mt-3">
            <p className="text-lg md:text-xl font-bold text-foreground">
              {calc.mentorshipHours}h / mês
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sim.mentorshipClients} mentorados × 2h
            </p>
          </div>
        </div>
      </div>

      {/* Entradas por Fonte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Sessões de Tatuagem
            </h3>
            <span className="text-xs font-bold text-primary">
              R$ {sim.tattooRevenue.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Faturamento (R$)</Label>
              <Input
                type="number"
                value={sim.tattooRevenue}
                onChange={(e) => updateNum("tattooRevenue", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Custo (%)</Label>
              <Input
                type="number"
                value={sim.tattooCostPct}
                onChange={(e) => updateNum("tattooCostPct", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Software (SaaS)
            </h3>
            <span className="text-xs font-bold text-primary">
              R$ {calc.saasTotal.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Assinantes</Label>
              <Input
                type="number"
                value={sim.saasSubscribers}
                onChange={(e) => updateNum("saasSubscribers", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mensalidade (R$)</Label>
              <Input
                type="number"
                value={sim.saasPrice}
                onChange={(e) => updateNum("saasPrice", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Cursos & Upsells
            </h3>
            <span className="text-xs font-bold text-primary">
              R$ {calc.coursesTotal.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Alunos/mês</Label>
              <Input
                type="number"
                value={sim.courseBuyersMonth}
                onChange={(e) => updateNum("courseBuyersMonth", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ticket Médio (R$)</Label>
              <Input
                type="number"
                value={sim.courseAvgTicket}
                onChange={(e) => updateNum("courseAvgTicket", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Mentoria</h3>
            <span className="text-xs font-bold text-primary">
              R$ {calc.mentorshipTotal.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mentorados</Label>
              <Input
                type="number"
                value={sim.mentorshipClients}
                onChange={(e) => updateNum("mentorshipClients", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor/mês (R$)</Label>
              <Input
                type="number"
                value={sim.mentorshipPrice}
                onChange={(e) => updateNum("mentorshipPrice", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Estúdio Próprio, Consumíveis & Marketing
            </h3>
            <span className="text-xs font-bold text-primary">
              + R$ {sim.studioCommissionAndExtras.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">
                Comissões Alunos + Bebidas + Eventos (R$/mês)
              </Label>
              <Input
                type="number"
                value={sim.studioCommissionAndExtras}
                onChange={(e) =>
                  updateNum("studioCommissionAndExtras", e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Investimento em Marketing (R$/mês)</Label>
              <Input
                type="number"
                value={sim.marketingBudget}
                onChange={(e) => updateNum("marketingBudget", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
